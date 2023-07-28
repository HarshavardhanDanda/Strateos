class Current < ActiveSupport::CurrentAttributes
  attribute :user
  attribute :organization
  attribute :permissions

  # Attributes for API and API trigger Job Audit Trail context
  attribute :user_id
  attribute :user_email
  attribute :organization_id

  # Attributes for Rabbit Audit Trail context
  attribute :lab
  attribute :lab_id

  def self.user=(user)
    super
    self.user_id = user&.id
    self.user_email = user&.email
  end

  def self.organization=(organization)
    super
    self.organization_id = organization&.id
  end

  def self.lab=(lab)
    super
    self.lab_id = lab&.id
  end
end
