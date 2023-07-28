require 'net/http'
require 'uri'

class VendorCatalogService
  def initialize(base_url)
    @base_url = base_url
  end

  def compounds(logged_in_user, organization, params)
    path = '/api/v1/compounds'
    get(path, logged_in_user, organization, params)
  end

  private

  def get(path, logged_in_user, organization, params)
    uri = URI(@base_url + path)
    uri.query = URI.encode_www_form(params)
    request = Net::HTTP::Get.new(uri)
    send_request(uri, request, logged_in_user, organization)
  end

  def send_request(uri, request, user, organization)
    request['X-User-Id'] = user.id
    request['X-User-Email'] = user.email
    request['X-Organization-Id'] = organization['id'] || organization.id
    request['X-Organization-Subdomain'] = organization['subdomain'] || organization.subdomain

    http = Net::HTTP.new(uri.host, uri.port)
    if uri.port == Net::HTTP.https_default_port
      http.use_ssl = true
    end
    http.request(request)
  end
end

class MockVendorCatalogService < VendorCatalogService

end
