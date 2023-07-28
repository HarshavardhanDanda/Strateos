class Cell < Resource
  audit_trail only: [ :name, :kind , :storage_condition, :sensitivities ]

  def metadata
    {
      organism: maybe("organism"),
      genotype: maybe("genotype"),
      sequence_ids: maybe("sequence_ids", [])
    }
  end

  def policy_class
    ResourcePolicy
  end
end
