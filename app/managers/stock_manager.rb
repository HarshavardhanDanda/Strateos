module StockManager
  module_function

  def reserve(orderable_material, quantity, organization, user, run_id, test_mode: false)
    kit_request = create_kit_request(orderable_material, quantity, organization, user, run_id)
    if test_mode
      kit_request.containers.each do |c|
        c.update(status: 'inbound', test_mode: true)
      end
      kit_request.fulfilled_at = Time.now
      kit_request.test_mode = true
      kit_request.save
    end

    kit_request
  end

  def create_kit_request(orderable_material, quantity, organization, user, run_id)
    ActiveRecord::Base.transaction do
      kit_request = KitRequest.create!(orderable_material: orderable_material,
                                       quantity: quantity,
                                       organization: organization,
                                       user: user,
                                       run_id: run_id)

      create_inbound_containers(kit_request, organization)
      kit_request
    end
  end

  def create_inbound_containers(kit_request, organization)
    orderable_material_components =
      kit_request.orderable_material.orderable_material_components.to_a * kit_request.quantity

    orderable_material_components.map do |omc|
      create_inbound_container(omc, kit_request, organization)
    end
  end

  def create_inbound_container(omc, kit_request, organization)
    create_container(omc, kit_request, organization)
  end

  def create_container(omc, kit_request, organization, status: "inbound")
    container_attrs = {
      status:         status,
      organization:   organization,
      label:          omc.resource.name,
      container_type: omc.container_type,
      kit_request:    kit_request,
      orderable_material_component: omc,
      lab_id:            organization&.labs&.first&.id
    }

    well_count = omc.container_type.well_count
    aliquots_attrs = (0...well_count).map { |well_idx|
      aliquot = {
        name: "#{omc.resource.name} - #{well_idx}",
        volume_ul: omc.volume_per_container / well_count,
        resource_id: omc.resource.id,
        well_idx: well_idx
      }
      [ well_idx, aliquot ]
    }.to_h

    Container.create_with_wells_unsafe(container_attrs, aliquots_attrs, organization)
  end

  def stockify_containers(containers)
    # destroys all inbound containers and
    # removes the org and kit_request and kit_order info.
    (inbounds, non_inbounds) = containers.partition { |c| c.status == "inbound" }

    ActiveRecord::Base.transaction do
      inbounds.each(&:destroy)
      non_inbounds.each do |c|
        if !c.refs.empty?
          raise "Cannot stockify container #{c.id}.
                 Already used in run #{c.refs.first.run.id}"
        end

        c.organization = nil
        c.kit_request = nil
        c.kit_order = nil
        c.save!
      end
    end
  end

  def reanimate_kit_requests(kit_requests)
    kit_requests.map { |kr| reanimate_kit_request(kr) }
  end

  def reanimate_kit_request_with_replacement(kit_request, replacement, inbound_id = nil)
    return if kit_request.fulfilled_at.present?

    inbound_containers = kit_request.inbound_containers
    if inbound_containers.empty?
      return fulfill_kit_request(kit_request)
    else
      inbound_container =
        if inbound_id
          inbound_containers.select { |c| c.id == inbound_id }.first
        else
          inbound_containers.first
        end

      reanimate_inbound_container_with_replacement(inbound_container, replacement)
    end

    if kit_request.inbound_containers.empty?
      fulfill_kit_request(kit_request)
    end
  end

  def reanimate_kit_request(kit_request)
    return if kit_request.fulfilled_at.present?

    reanimation_status = reanimate_inbound_containers(kit_request.inbound_containers)
    did_reanimate_all = reanimation_status.all?

    if did_reanimate_all
      kit_request.fulfilled_at = Time.now
      kit_request.save!
    end

    did_reanimate_all
  end

  def reanimate_inbound_containers(containers)
    containers.map { |c| reanimate_inbound_container(c) }
  end

  def reanimate_inbound_container(inbound)
    replacement = find_inbound_container_replacements(inbound).first
    return false if replacement.nil?

    reanimate_inbound_container_with_replacement(inbound, replacement)
  end

  def reanimate_inbound_container_with_replacement(inbound, replacement)
    inbound.status       = "available"
    inbound.barcode      = replacement.barcode
    inbound.kit_order_id = replacement.kit_order_id
    inbound.location     = replacement.location
    inbound.slot         = replacement.slot

    ActiveRecord::Base.transaction do
      replacement.destroy!
      inbound.save!
    end
    true
  end

  def find_inbound_container_replacements(container)
    Container.where(organization: nil,
                    test_mode: false,
                    orderable_material_component_id: container.orderable_material_component_id)
             .order(created_at: :ASC)
  end

  def fulfill_kit_request(kit_request)
    kit_request.fulfilled_at = Time.now
    kit_request.save!
  end
end
