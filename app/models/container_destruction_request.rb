class ContainerDestructionRequest < ApplicationRecord
  belongs_to :user
  belongs_to :admin
  belongs_to :container, -> { with_deleted }

  validates_presence_of :container

  searchkick batch_size: 200, word_start: [ :container_id, :barcode ], callbacks: :async
  scope :search_import, -> { joins(:container).includes(container: :location) }

  after_commit lambda {
    self.reindex
  }
  def search_data
    searchkick_as_json.merge(
      barcode: container.barcode,
      container_type_id: container.container_type_id,
      status: container.status,
      human_path: container.location&.human_path,
      organization_subdomain: container.organization&.subdomain,
      lab_id: container.lab_id
    )
  end
end
