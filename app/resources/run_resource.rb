require 'base_resource'

module Api
  module V1
    class RunResource < Api::BaseResource
      include JSONAPI::Authorization::PunditScopedResource

      add_attribute :aborted_at
      add_attribute :aborted_reason
      add_attribute :accepted_at
      add_attribute :accepted_by_id
      add_attribute :attachments
      add_attribute :bsl
      add_attribute :canceled_at
      add_attribute :canceled_reason
      add_attribute :committed_at
      add_attribute :completed_at
      add_attribute :conversation_id
      add_attribute :created_at
      add_attribute :draft_quote
      add_attribute :estimated_run_time, default: false
      add_attribute :estimated_run_time_cache
      add_attribute :execution
      add_attribute :flagged
      add_attribute :friendly_status
      add_attribute :internal_run
      add_attribute :launch_request_id
      add_attribute :out_section
      add_attribute :owner_id
      add_attribute :owner_type
      add_attribute :progress
      add_attribute :project_id
      add_attribute :properties
      add_attribute :protocol_id
      add_attribute :quote
      add_attribute :request
      add_attribute :request_type
      add_attribute :results
      add_attribute :scheduled_to_start_at
      add_attribute :scheduled_workcell
      add_attribute :sent_to_workcell_by_id
      add_attribute :sent_to_workcell_by_user_id
      add_attribute :started_at
      add_attribute :status
      add_attribute :success
      add_attribute :success_notes
      add_attribute :test_mode
      add_attribute :title
      add_attribute :total_cost, default: false
      add_attribute :updated_at
      add_attribute :priority
      add_attribute :requested_at
      add_attribute :reject_reason
      add_attribute :reject_description
      add_attribute :lab_id
      add_attribute :successors_deep
      add_attribute :protocol_name
      add_attribute :contextual_custom_properties

      # methods that should be removed
      add_attribute :billing_valid?
      add_attribute :pending_shipment_ids
      add_attribute :unrealized_input_containers_count
      add_attribute :organization_name
      add_attribute :organization_id

      def fetchable_fields
        if context[:action] == "get_tree"
          super
        else
          super - [ :successors_deep ]
        end
      end

      def successors_deep
        all_successors = []
        for child in successors do
          all_successors << serialize_run(child, context[:includes], context[:fields])
        end

        all_successors
      end

      def serialize_run(run, includes, fields)
        JSONAPI::ResourceSerializer.new(RunResource, include: includes, fields: fields).serialize_to_hash(run)
      end

      def unrealized_input_containers_count
        @model.unrealized_input_containers.size
      end

      def self.default_sort
        [ { field: 'created_at', direction: :desc } ]
      end

      def organization_name
        @model.organization.name
      end

      def organization_id
        @model.organization.id
      end

      filter       :status
      filter       :test_mode
      filter       :project_id

      filter :protocol_id

      # YEAR IN REVIEW
      filter :organization, apply: lambda { |records, organization_id, _options|

        return records.where(:project_id => Project.where(:organization_id => organization_id))
      }

      filter :container, apply: lambda { |records, container_id, _options|
        container = Container.with_deleted.find_by(id: container_id)

        return Run.none if container.nil?

        if container.organization_id.nil?
          # SUPER HACK
          # When organization_id is nil, this container is a provision source, so we use the aliquot effects
          # to figure out the instructions.
          inst_ids = AliquotEffect.where(affected_container_id: container_id, effect_type: 'liquid_transfer_out')
                                  .map(&:generating_instruction_id)
                                  .compact

          records.joins(:instructions)
                 .where(instructions: { id: inst_ids })
        else
          # do join in SQL to bypass paranoid.
          ref_linked = records.joins("INNER JOIN refs ON refs.run_id = runs.id "\
                                     "INNER JOIN containers ON containers.id = refs.container_id")
                              .where(containers: { id: container_id })
          generated_container_linked = records.joins("INNER JOIN instructions ON instructions.run_id = runs.id "\
                                                     "INNER JOIN generated_container_links "\
                                                     "ON generated_container_links.instruction_id = instructions.id")
                                              .where(generated_container_links: { container_id: container_id })
          # NOTE - If a container is both a ref and also a generated-container, duplicate run will be returned
          Run.from("(#{ref_linked.to_sql} UNION ALL #{generated_container_linked.to_sql}) AS runs")
        end
      }

      filter :completed_after, apply: lambda { |records, timestamp_values, _options|
        timestamp = timestamp_values.first.to_i

        records.where('completed_at > ?', Time.at(timestamp))
      }

      filter :aborted_after, apply: lambda { |records, timestamp_values, _options|
        timestamp = timestamp_values.first.to_i

        records.where('aborted_at > ?', Time.at(timestamp))
      }

      filter :title_like, apply: lambda { |records, search, _options|
        records.where("runs.title ~* ?", search.join('|'))
      }

      has_one :batch
      has_one :launch_request
      has_one :owner, class_name: 'User', relation_name: 'owner'
      has_one :project
      has_one :protocol

      has_many :containers
      has_many :execution_support_artifacts
      has_many :instructions
      has_many :successors, class_name: "Run", foreign_key: "predecessor_id"
      # has_many :datasets
      # has_many :refs
      # has_many :schedule_requests
      # has_many :successors
      # has_one  :accepted_by
      # has_one  :conversation
      # has_one  :predecessor
      # has_one  :sent_to_workcell_by
    end
  end
end
