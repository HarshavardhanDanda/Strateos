class Solvent < Resource
  audit_trail only: [ :name, :kind , :storage_condition, :sensitivities ]

  def policy_class
    ResourcePolicy
  end
end
