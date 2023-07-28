class NucleicAcid < Resource
  audit_trail only: [ :name, :kind , :storage_condition, :sensitivities ]

  def metadata
    {
      split_ids: maybe("split_ids", []),
      sequence_length: sequence_length
    }
  end

  def splits
    ids = maybe('splits', [])
    NucleicAcid.find(ids)
  end

  def sequence
    splits.reduce((self.design['sequence'] or "")) { |acc, seq| acc + seq.sequence }
  end

  def sequence_length
    sequence.length
  end

  def policy_class
    ResourcePolicy
  end

end
