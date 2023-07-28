class ProtocolImplementation
  attr_accessor :assay, :details, :user, :organization

  def initialize(opts)
    @assay        = opts[:assay]
    @details      = opts[:details]
    @user         = opts[:user]
    @organization = opts[:organization]
  end
end
