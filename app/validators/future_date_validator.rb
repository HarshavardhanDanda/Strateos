class FutureDateValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    if Date.parse(value.to_s) < Date.today
      record.errors[attribute] << (options[:message] || "has already passed")
    end
  end
end
