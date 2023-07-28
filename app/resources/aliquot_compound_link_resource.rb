require 'base_resource'

module Api
  module V1
    class AliquotCompoundLinkResource < Api::BaseResource
      add_attribute :aliquot_id
      add_attribute :compound_link_id
      add_attribute :m_moles
      add_attribute :concentration
      add_attribute :solubility_flag

    end
  end
end
