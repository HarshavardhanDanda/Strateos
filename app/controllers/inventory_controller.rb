class InventoryController < UserBaseController

  def index_without_org
    # Redirect to inventory without specifying the org.
    # Try to choose intelligently when there are multiple orgs.

    org = (current_user || current_admin).find_main_org

    if org.nil?
      return redirect_to(organizations_url)
    end

    url = organization_url(id: org.subdomain) + request.path
    redirect_to url
  end

end
