class KitItemPolicy < KitPolicy
  def index?
    @record.kit.can_be_seen_by?(@user)
  end

  def show?
    @record.kit.can_be_seen_by?(@user)
  end
end
