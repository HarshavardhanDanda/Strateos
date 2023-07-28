class Virus < Resource
  audit_trail only: [ :name, :kind , :storage_condition, :sensitivities ]

  # classification
  # serotype
  # BSL

  def policy_class
    ResourcePolicy
  end
end
