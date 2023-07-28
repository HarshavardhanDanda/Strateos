class ParseReleaseJob
  include Sidekiq::Worker

  def self.validate_manifest(manifest, organization_id = nil)
    errors = []
    if manifest['format'].nil?
      errors << {
        code: "MISSING_FORMAT",
        message: "No format specified, must be one of: python"
      }
    end

    if manifest['license'].nil?
      errors << {
        code: "MISSING_LICENSE",
        message: "No license specified, must be one of: MIT, Proprietary"
      }
    elsif not [ 'MIT', 'Proprietary' ].member?(manifest['license'])
      errors << {
        code: "BAD_LICENSE",
        message: "No license specified, must be one of: MIT, Proprietary"
      }
    end

    if not manifest['protocols'].kind_of? Array
      errors << {
        code: "BAD_PROTOCOLS",
        message: '"protocols" must be an array.'
      }
    else
      manifest["protocols"].each do |p|
        if p['name'].nil?
          errors << {
            code: "NO_NAME",
            message: "A protocol listed in the manifest fails to specify a 'name' attribute, which is mandatory."
          }
          next
        elsif (p['name'] =~ /\A\p{Alnum}+\z/).nil?
          errors << {
            code: "ILLEGAL_CHARS_IN_NAME",
            message: "The protocol name '#{p['name']}' contains illegal characters. "\
                     "Protocol names must only include letters and numbers "\
                     "with no punctuation, spaces, or special characters."
          }
        end

        version =
          begin
            Semantic::Version.new(p['version'])
          rescue StandardError
            nil
          end

        if not version
          errors << {
            code: "BAD_PROTOCOL_VERSION",
            message: "Version must be a semver string of the form MAJOR.MINOR.PATCH,"\
                     " was '#{p['version']}' for protocol #{p['name']}"
          }
        end

        if p['command_string'].nil?
          errors << {
            code: "NO_COMMAND_STRING",
            message: "The protocol '#{p['name']}' fails to specify a command string, which is mandatory."
          }
        end
        # Input not required, but if present, we need to validate them
        if p['inputs'].present?
          # manifest input validation
          inputs_errors = ManifestUtil.validate_manifest_inputs(p['inputs'])

          if !inputs_errors.empty?
            errors << {
              code: 'BAD_MANFEST_INPUTS',
              message: self.format_error_list(inputs_errors)
            }
          end
        end

        if p['outputs'].present?
          # optional manifest outputs validation
          outputs_errors = ManifestUtil.validate_manifest_inputs(p['outputs'])

          if !outputs_errors.empty?
            errors << {
              code: 'BAD_MANFEST_OUTPUTS',
              message: self.format_error_list(outputs_errors)
            }
          end
        end

        if p.include? 'categories'
          if not p['categories'].kind_of? Array
            errors << {
              code: 'BAD_CATEGORIES',
              message: "The protocol #{p['name']} specified invalid categories: must be an array"
            }
          else
            p['categories'].each do |cat|
              next if Protocol::VALID_CATEGORIES.include? cat

              errors << {
                code: 'BAD_CATEGORIES',
                message: "The protocol #{p['name']} specified invalid category '#{cat}':"\
                         "must be one of #{Protocol::VALID_CATEGORIES.inspect}"
              }
            end
          end
        end

        if p.include? 'image_url' && !(p['image_url'].kind_of? String)
          errors << {
            code: 'BAD_IMAGE_URL',
            message: "The protocol #{p['name']} specified invalid image_url '#{p['image_url']}':"\
                     "must be a URL like \"https://s3.amazonaws.com/mybucket/myimage.png\""
          }
        end

        if p.include? 'validation_url' && !(p['validation_url'].kind_of? String)
          errors << {
            code: 'BAD_VALIDATION_URL',
            message: "The protocol #{p['name']} specified invalid validation_url '#{p['validation_url']}':"\
                     "must be a URL like \"https://s3.amazonaws.com/mybucket/validation.pdf\""
          }
        end

        # rubocop:disable Style/Next
        if p.include? 'logo_url' && !(p['logo_url'].kind_of? String)
          errors << {
            code: 'BAD_LOGO_URL',
            message: "The protocol #{p['name']} specified invalid logo_url '#{p['logo_url']}':"\
                     "must be a URL like \"https://s3.amazonaws.com/mybucket/mylogo.png\""
          }
        end

        # Validate programs
        program_id = p['program_id']
        per_inst_program = p['per_inst_program']
        [ program_id, per_inst_program ].compact.each do |prg_id|
          if !prg_id.kind_of? String
            errors << {
              code: 'BAD_PROGRAM_ID',
              message: "The protocol #{p['name']} specified an invalid program_id '#{prg_id}':"\
                       "must be a string."
            }
          end

          program = Program.find_by_id(prg_id)
          if !program or program.organization.id != organization_id
            errors << {
              code: 'BAD_PROGRAM_ID',
              message: 'The program specified does not exist.'
            }
          end
        end
        # rubocop:enable Style/Next

      end
    end

    errors
  end

  def perform(release_id)
    release = Release.find release_id
    release.validation_progress = 5
    release.save

    s3_stream = S3Helper.instance.read(release.bucket, release.binary_attachment_url)

    release.validation_progress = 10
    release.save

    manifest_entry = nil
    begin
      Zip::Archive.open_buffer(s3_stream) do |ar|
        ar.each do |e|
          next if e.name != 'manifest.json'

          ar.fopen(e.name) do |f|
            manifest_entry = f.read
          end
          break
        end
      end
    rescue Zip::Error
      release.validation_errors << {
        code: "BAD_ARCHIVE",
        message: "Unable to read the archive.  Ensure that the archive is in the ZIP format."
      }
      release.update!(validation_progress: 100)
      return
    end

    if not manifest_entry
      release.validation_errors << {
        code: "NO_MANIFEST",
        message: "No manifest found.  Ensure the manifest.json file is in the root of the archive."
      }
      release.update!(validation_progress: 100)
      return
    end

    begin
      manifest = JSON.parse manifest_entry
    rescue JSON::ParserError => e
      release.validation_errors << {
        code: "MALFORMED_MANIFEST",
        message: "Manifest is not valid JSON: #{e.message}"
      }
      release.update!(validation_progress: 100)
      return
    end

    release.update(validation_progress: 20)

    errors = ParseReleaseJob.validate_manifest(manifest, release.package.organization.id)
    release.validation_errors += errors

    if !release.validation_errors.empty?
      release.update!(validation_progress: 100)
      return
    end

    release.update!(validation_progress: 30, manifest: manifest, format: manifest['format'])

    previews = {}

    unless Rails.env.test?
      release.update!(validation_progress: 40)

      url = S3Helper.instance.url_for(release.bucket, release.binary_attachment_url, expires_in: 10.minutes.to_i)
      release.update!(validation_progress: 60)

      progress_step = ((90 - release.validation_progress) / manifest["protocols"].length).to_i

      manifest["protocols"].each do |p|
        release.increment!(:validation_progress, (progress_step / 3).to_i)

        # Ignore duplicate protocols
        if Protocol.find_by(package_id: release.package_id, version: p['version'], name: p['name'])
          Rails.logger.warn "Ignoring duplicate protocol for name #{p['name']} and version #{p['version']}"
          next
        end

        begin
          igor_resp = IgorService.execute_protocol(p["command_string"], url.to_s, p['preview'])
        rescue StandardError => e
          incident_id = "ex1#{SNOWFLAKE.next.to_base31}"
          Rails.logger.error "Error posting to runner: #{e}"
          Bugsnag.notify(
            e,
            incident_id: incident_id,
            user: {
              id: release.package.owner_id
            },
            severity: 'error'
          )
          release.validation_errors << {
            code: "RUNNER_ERROR",
            message: "There was an error connecting to the protocol runner service.  "\
                     "This is an internal error, not an error with your package.  "\
                     "The incident ID is #{incident_id}."
          }
          release.save
          break
        end

        if not igor_resp[:success]
          release.validation_errors << {
            code: "BAD_PREVIEW_GENERATION",
            message: "The protocol '#{p['name']}' was unable to generate a preview.  "\
                     "The command returned: '#{igor_resp[:raw_response]}'"
          }
          release.save
          next
        end

        previews["#{p['package']}/#{p['name']}"] = igor_resp[:autoprotocol]

        release.increment!(:validation_progress, (progress_step / 3).to_i)

        run = Run.new
        project = Project.new
        project.organization = release.package.organization
        run.project = project
        run.owner = release.package.owner

        ## TODO Below line need to be revisited. We must have lab association to launch_request as well.
        # Use `lab` from launch_request instead of `organization.labs.first`
        run.lab = release.package.organization.labs.first

        run.protocol = previews["#{p['package']}/#{p['name']}"]
        unless run.errors[:protocol].empty?
          release.validation_errors << {
            code: "BAD_PREVIEW_PROTOCOL",
            message: "The protocol '#{p['name']}' generated malformed autoprotocol: "\
                     "#{run.errors[:protocol].map { |er| er[:message].to_s }.join(', ')}"
          }
          release.save
          next
        end

        begin
          refs = previews["#{p['package']}/#{p['name']}"]['refs']
          previews["#{p['package']}/#{p['name']}"]['refs'] = refs.map { |name, r|
            ct =
              if r['new']
                ContainerType.find(r['new'])
              elsif r['reserve']
                OrderableMaterialComponent.find(r['reserve']).container_type
              end

            r['container_type'] = ct.as_json(ContainerType::SHORT_JSON)
            [ name, r ]
          }.to_h
        rescue StandardError
          release.validation_errors << {
            code: "BAD_PREVIEW_PROTOCOL",
            message: "The preview for '#{p['name']}' requires non-existent container types."
          }
          release.save
          next
        end

        release.increment!(:validation_progress, (progress_step / 3).to_i)
      end
    end

    if !release.validation_errors.empty?
      release.update!(validation_progress: 100)
      return
    end

    manifest["protocols"].each do |p|
      #
      # Don't overwrite an existing protocol that already has the same version. This makes it easier
      # for people to update a selected number of protocols in the case where they have a single
      # manifest for many protocols.  We probably don't want to support this feature indefinitely
      # because we would rather that people have a single manifest for each protocol.
      #
      if Protocol.find_by(package_id: release.package_id, version: p['version'], name: p['name'])
        next
      end

      Protocol.create(
        categories: p['categories'],
        command_string: p["command_string"],
        description: p["description"],
        display_name: p["display_name"],
        image_url: p['image_url'],
        logo_url: p['logo_url'],
        inputs: p["inputs"],
        license: manifest['license'],
        name: p["name"],
        outputs: p["outputs"],
        package: release.package,
        package_name: release.package.name,
        preview: (previews["#{p['package']}/#{p['name']}"] or {}),
        release: release,
        validation_url: p['validation_url'],
        version: p['version'],
        per_inst_program_id: p['per_inst_program'],
        program_id: p['program_id']
      )
    end
    release.update!(validation_progress: 100)
  end

  def self.format_error_list(errors)
    errors.join("\n\n")
  end

end
