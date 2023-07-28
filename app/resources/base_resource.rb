module Api
  class BaseResource < JSONAPI::Resource
    class << self
      attr_accessor :_attribute_hash

      def inherited(subclass)
        super

        # keeps track of default state for each attribute
        subclass._attribute_hash = {}
      end
    end

    # Wrapper method to create an attribute and also store
    # extra data to help with authorization and serialization.
    def self.add_attribute(name, default: true)
      self._attribute_hash[name] = { default: default }

      # use super attribute method to create an attribute.
      self.attribute(name)
    end

    def self.default_attributes
      self._attribute_hash.select { |_k, v| v[:default] }.keys
    end

    def self.serializer(include_nondefault: false)
      fields = self._attribute_hash.select { |_k, v|
        v[:default] || (include_nondefault && !v[:default])
      }.keys

      JSONAPI::ResourceSerializer.new(self, fields: { self._type => fields })
    end

    def fetchable_fields
      attribute_keys = self.class._attribute_hash.keys

      # currently no default logic for relationship keys.
      relationship_fields = self.class._relationships.keys

      # hardcode ID as well.
      [ :id ] + relationship_fields + attribute_keys
    end

    # For jsonapi-swagger
    def self.extra_parameters
      [
        { name: "X-User-Email", in: :header, type: :string, required: true },
        { name: "X-User-Token", in: :header, type: :string, required: true }
      ]
    end

  end
end
