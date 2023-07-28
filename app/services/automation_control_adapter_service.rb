require 'net/http'
require 'uri'

class AutomationControlAdapterService
  def initialize(base_url)
    @base_url = base_url
  end

  def generate_artifacts(user, organization, target_system, data)
    path = '/api/v1/artifacts/' + target_system
    post(path, user, organization, data)
  end

  def post(path, user, organization, data)
    uri = URI(@base_url + path)
    headers = create_headers(user, organization)
    request = Net::HTTP::Post.new(uri.path, headers)
    request.body = data.to_json
    send_request(uri, request, user, organization)
  end


  def send_request(uri, request, user, organization)
    http = Net::HTTP.new(uri.host, uri.port)
    if uri.port == Net::HTTP.https_default_port
      http.use_ssl = true
    end

    resp = http.request(request)

    status = resp.code.to_i

    # throw exception on non 200 response
    if status < 200 || status >= 300
      raise AutomationControlAdapterServiceError.new(resp.body)
    end
    resp
  end

  def create_headers(user, organization)
    {
      'Accept' => 'application/octet-stream',
      'Content-Type' => 'application/json',
      'X-User-Id' => user.id,
      'X-User-Email' => user.email,
      'X-Organization-Id' => organization['id'] || organization.id,
      'X-Organization-Subdomain' => organization['subdomain'] || organization.subdomain
    }
  end

end

# Wrapper on service errors
class AutomationControlAdapterServiceError < StandardError
end

class MockAutomationControlAdapterService < AutomationControlAdapterService
end
