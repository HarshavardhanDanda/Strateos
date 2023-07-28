class ContainersTransferService
  include Callable

  def initialize(container_ids, org_id, source = nil)
    @container_ids = container_ids
    @org_id = org_id
    @source = source
  end

  def call
    transfer_containers(@container_ids, @org_id, @source)
  end

  private

  def transfer_containers(container_ids, org_id, source)
    if org_id.nil?
      raise JSONAPI::Error.new(code: JSONAPI::PARAM_MISSING,
                               status: :bad_request,
                               title: 'Bad Request',
                               detail: "param organization_id is missing",
                               source: source)
    end

    result_success = []
    result_errors = []
    container_ids.each_with_index do |container_id, idx|
      begin
        container = Container.with_deleted.find(container_id)
        is_any_run_started = container.runs.any? { |run| Container::TRANSFER_BAD_RUN_STATUS.include?(run.status) }
        is_container_status_invalid = Container::TRANSFER_BAD_STATUS.include? container.status
        if org_id && org_id != container.organization_id
          org = Organization.find_by_id(org_id)
          if org.nil?
            container.errors.add(:organization_id, :not_found, id: org_id)
          elsif OrgCollaboration.where(src_org_id: container.organization_id, dest_org_id: org_id).blank?
            container.errors.add(:base, :org_collaboration_not_found,
                                 src_org_id: container.organization_id, dest_org_id: org_id)
          elsif is_container_status_invalid
            container.errors.add :status, :invalid_transfer, status: container.status
          elsif is_any_run_started
            container.errors.add :runs, :invalid_transfer_status, run_status: 'in_progress, accepted or pending'
          else
            public_and_private_compound_link_ids = AliquotCompoundLink.joins(aliquot: :container)
                                                                      .where(containers: { id: container.id })
                                                                      .pluck(:compound_link_id)
                                                                      .uniq
            compound_links = []
            common_external_system_ids = []
            unless public_and_private_compound_link_ids.empty?
              filter_params = {
                organization_id: container.organization_id,
                compound_link_ids: public_and_private_compound_link_ids
              }
              compound_links = CompoundServiceFacade::GetCompounds.call(filter_params,
                                                                        CompoundServiceFacade::Scope::ALL)
              compound_link_ids = compound_links.pluck(:id)
              impl_org_compound_link_external_system_ids =
                CompoundLinkExternalSystemId.where(compound_link_id: compound_link_ids,
                                                   organization_id: container.organization_id)
                                            .pluck(:external_system_id)
              common_external_system_ids =
                CompoundLinkExternalSystemId.where(organization_id: org_id,
                                                   external_system_id: impl_org_compound_link_external_system_ids)
            end
            src_org_id = container.organization_id
            target_lab = LabConsumer.where(organization_id: org_id).first.lab
            if common_external_system_ids.empty?
              begin
                ActiveRecord::Base.transaction do
                  container.transfer(org, target_lab)
                  transfer_compoundlink(compound_links, org_id, container_id)
                  transfer_resources(container, src_org_id, org_id)
                  container.contextual_custom_properties.destroy_all
                  container.aliquot_contextual_custom_properties.each(&:destroy!)
                end
              rescue StandardError => e
                container.errors[:base] << e.message
              end
            else
              container.errors.add(:base, :external_system_id,
                                   value: common_external_system_ids.first.external_system_id)
            end
          end
        end
      rescue ActiveRecord::RecordNotFound => e
        jsonapi_error = JSONAPI::Error.new(code: JSONAPI::RECORD_NOT_FOUND,
                                           status: :not_found,
                                           title: 'Record invalid',
                                           detail: e.message,
                                           source: "/#{idx}")
      end
      formatted_response = BulkRequest.format_result(container || container_id, "#{source}/#{idx}", jsonapi_error)
      if formatted_response[:errors].present?
        result_errors << formatted_response
      else
        result_success << formatted_response
      end
    end
    return { result_success: result_success, result_errors: result_errors }
  end

  def transfer_compoundlink(compound_links, org_id, container_id)
    compound_links_external_system_ids = CompoundLinkExternalSystemId
                                         .where(compound_link_id: compound_links)
    aliquots_compound_links = AliquotCompoundLink.joins(aliquot: :container)
                                                 .where(aliquot: { container_id: container_id })
                                                 .where(compound_link: compound_links)
    compound_links.each do |compound_link|
      external_system_ids = compound_links_external_system_ids.filter { |x| x.compound_link_id == compound_link.id }

      next if compound_link.is_public?

      aliquot_compound_links = aliquots_compound_links.filter { |acl| acl.compound_link_id == compound_link.id }

      filter_params = { compound_id: compound_link.compound_id, organization_id: org_id }
      parent_org_compound_link = CompoundServiceFacade::GetCompounds
                                 .call(filter_params, CompoundServiceFacade::Scope::ALL)
      if parent_org_compound_link.any?
        aliquot_compound_links.each do |acl|
          acl.update!(compound_link_id: parent_org_compound_link[0].id)
        end
      else
        # duplicate the current compound_link without id and timestamps
        compound_link_duplicate = compound_link.dup
        # update the organization_id in the new compound_link and save
        compound_link_duplicate.update!(organization_id: org_id)

        transfer_compound_link_external_system_id(external_system_ids, compound_link_duplicate,
                                                  org_id)
        aliquot_compound_links.each do |acl|
          acl.update!(compound_link_id: compound_link_duplicate.id)
        end
      end
    end
  end

  def transfer_compound_link_external_system_id(compound_link_external_system_ids, compound_link, org_id)
    compound_link_external_system_ids.each do |compound_link_external_system_id|
      # duplicate the current compound_link_external_system_id without id and timestamps
      compound_link_external_system_id_duplicate = compound_link_external_system_id.dup
      compound_link_external_system_id_duplicate.update!(organization_id: org_id,
                                                         compound_link_id: compound_link.id)
    end
  end

  def transfer_resources(container, src_org_id, dest_org_id)
    resource_ids = Aliquot.where(container_id: container.id).distinct.pluck(:resource_id)

    resources = Resource.where("id IN (?)", resource_ids).where(organization_id: src_org_id)
    resources.find_each do |resource|
      aliquot = Aliquot.where(resource_id: resource.id, container_id: container.id)
      aliquot_resource_links = AliquotResourceLink.where(resource: resource, aliquot_id: aliquot)
      resource_duplicate = resource.dup
      resource_duplicate.update!(organization_id: dest_org_id)
      aliquot_resource_links.update(resource_id: resource_duplicate.id)
      aliquot.update(resource_id: resource_duplicate.id)
    end
  end
end
