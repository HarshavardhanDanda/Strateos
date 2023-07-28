class ChemicalStructure < Resource
  audit_trail only: [ :name, :kind , :storage_condition, :sensitivities, :purity, :compound_id ]

  def metadata
    {
      smiles: maybe("smiles"),
      molecular_weight: maybe("molecular_weight")
    }
  end

  def policy_class
    ResourcePolicy
  end

end
