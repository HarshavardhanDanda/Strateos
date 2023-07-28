class TisoReservationPolicy < ApplicationPolicy

  def index?
    has_feature_in_any_lab(MANAGE_TISOS)
  end

  def occupants?
    is_authorized?
  end

  def is_authorized?
    has_feature_in_lab(MANAGE_TISOS)
  end

  def retrieve_many?
    is_authorized?
  end

  def manual_remove_many?
    is_authorized?
  end

  def discard_many?
    is_authorized?
  end

  def manual_remove?
    is_authorized?
  end

  def discard?
    is_authorized?
  end

  class Scope < Scope
    def resolve
      if has_feature_in_any_lab(MANAGE_TISOS)
         lab_ids = lab_ids_by_feature(MANAGE_TISOS)
         scope.where(lab_id: lab_ids)
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
