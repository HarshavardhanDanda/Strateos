class Concentration
  attr_accessor :quantity, :unit, :raw_value

  def initialize(value)
    @raw_value = value.to_s
    concentration = sanitize_value(@raw_value)
    @quantity = concentration[0].blank? ? nil : concentration[0].to_f
    @unit = normalize_unit(concentration[1])
  end

  def to_s
    "#{format('%g', quantity)}:#{unit}" if quantity && unit
  end

  class ConcentrationType < ActiveRecord::Type::Value
    def type
      :string
    end

    def cast(value)
      Concentration.new(value) unless value.blank?
    end

    def deserialize(value)
      Concentration.new(value) unless value.blank?
    end

    def serialize(value)
      return nil if value.blank?
      value.to_s
    end

    def changed_in_place?(raw_old_value, new_value)
      raw_old_value != serialize(new_value)
    end

  end

  private

  def sanitize_value(value)
    return [] if value.blank?

    value.split(':')
  end

  def normalize_unit(unit)
    return if unit.blank?
    # replaces u/latin micro followed by m/M/g/G/l/L to greek micro followed by m/M/g/G/l/L
    # anything else that does not match regex returns same
    unit.gsub(/^([u#{ConcentrationValidator::LATIN_MICRO}])([mgl])/i,
                       "#{ConcentrationValidator::GREEK_MICRO}\\2")
  end

end

class ConcentrationValidator < ActiveModel::EachValidator
  GREEK_MICRO = 'μ' # ASCII 956
  LATIN_MICRO = 'µ' # ASCII 181
  ACCEPTABLE_UNITS = [
    'g/mol', '%', 'x',
    'nm', 'mm', 'm', 'um', "#{GREEK_MICRO}m", "#{LATIN_MICRO}m",        #  molarity
    'ng', 'mg', 'g', 'ug', "#{GREEK_MICRO}g", "#{LATIN_MICRO}g",        #  mass
    'nl', 'ml', 'l', 'ul', "#{GREEK_MICRO}l", "#{LATIN_MICRO}l"         #  volume
  ]

  def validate_each(record, attribute, value)
    return if value.nil?

    record.errors.add attribute, :quantity_required if value.quantity.blank?
    record.errors.add attribute, :unit_required if value.unit.blank?
    record.errors.add attribute, :quantity_greater_than_zero if value.quantity && value.quantity <= 0
    if value.unit && !ACCEPTABLE_UNITS.include?(value.unit.downcase)
      record.errors.add attribute, :accepted_units, accepted_units: ACCEPTABLE_UNITS.join(', ')
    end
  end
end
