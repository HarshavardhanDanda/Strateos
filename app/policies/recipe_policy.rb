class RecipePolicy < MixturePolicy

  class Scope < Scope
    def resolve
      if has_feature_in_org(VIEW_MIXTURES)
        scope.joins(:mixture).where(mixtures: { organization: @organization })
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end
end
