require 'net/http'
require 'uri'

class AccessControlService
  def initialize(base_url)
    @base_url = base_url
  end

  def user_acl(user, organization)
    return {} if !organization or !user

    acl = permissions_from_redis(user, organization)

    if !acl
      acl = permissions_from_acs(user, organization)
    end
    JSON.parse(acl)
  end

  def feature_groups(user, organization)
    path = '/api/v1/organizations/feature-groups'
    get(path, user, organization)
  end

  def create_permission(logged_in_user, organization, data)
    path = '/api/v1/permissions/users'
    post(path, logged_in_user, organization, data)

    # Evicting stale user permissions from cache
    user = User.find(data[:userId])
    remove_permission_from_redis(user, organization)
  end

  def remove_permission(logged_in_user, organization, data)
    permission_id = data[:permissionId]
    path = "/api/v1/permissions/users/#{permission_id}"
    delete(path, logged_in_user, organization)

    # Evicting stale user permissions from cache
    user = User.find(data[:userId])
    remove_permission_from_redis(user, organization)
  end

  def remove_organization_permissions(user, organization, acs_payload, user_id)
    path = "/api/v1/users/#{user_id}/organizations"
    delete(path, user, organization, acs_payload)

    # Evicting stale user permissions from cache
    user = User.find(user_id)
    remove_permission_from_redis(user, organization)
  end

  def delete_organization(logged_in_user, organization, data)
    organization_id = data[:organizationId]
    path = "/api/v1/organizations/#{organization_id}"
    delete(path, logged_in_user, organization)
  end

  def permission_summary(user, organization, data)
    path = '/api/v1/permissions/users/search'
    post(path, user, organization, data)
  end

  def initialize_org(user, organization, data)
    path = '/api/v1/organizations/initialize'
    post(path, user, organization, data)
  end

  private

  def redis_key(user, organization)
    organization.id + '__' + user.id if organization
  end

  def permissions_from_redis(user, organization)
    key = redis_key(user, organization)
    return REDIS_CLIENT.get(key)
  end

  def remove_permission_from_redis(user, organization)
    key = redis_key(user, organization)
    REDIS_CLIENT.del(key) if key
  end

  def permissions_from_acs(user, organization)
    path = '/api/v1/permissions/users/me'
    response = get(path, user, organization)

    # save to redis
    key = redis_key(user, organization)
    REDIS_CLIENT.set(key, response, ex: ACCESS_CONTROL_EXPIRY)
    response
  end

  def get(path, user, organization)
    uri = URI(@base_url + path)
    request = Net::HTTP::Get.new(uri)
    send_request(uri, request, user, organization)
  end

  def post(path, user, organization, data)
    uri = URI(@base_url + path)
    request = Net::HTTP::Post.new(uri.path, { 'Content-Type' => 'application/json' })
    request.body = data.to_json

    send_request(uri, request, user, organization)
  end

  def delete(path, user, organization, data = {})
    uri = URI(@base_url + path)
    request = Net::HTTP::Delete.new(uri.path, { 'Content-Type' => 'application/json' })
    request.body = data.to_json
    send_request(uri, request, user, organization)
  end

  def parse_json(string)
    JSON.parse(string)
    rescue JSON::ParserError => e
      return false
  end

  def send_request(uri, request, user, organization)
    request['X-User-Id'] = user.id
    request['X-Organization-Id'] = organization['id'] || organization.id
    http = Net::HTTP.new(uri.host, uri.port)
    if uri.port == Net::HTTP.https_default_port
      http.use_ssl = true
    end
    resp = http.request(request)

    status = resp.code.to_i
    resp_body_json = resp.body.present? ? parse_json(resp.body) : nil
    # throw exception on non 200 response
    if status < 200 || status >= 300
      description = resp_body_json.present? ? resp_body_json["description"] : nil
      message = resp_body_json.present? ? resp_body_json["message"] :  nil
      raise AccessControlServiceError.new(resp.code, description, message)
    end

    resp.body
  end
end
# Wrapper on service errors
class AccessControlServiceError < StandardError
  attr_reader :description, :code

  def initialize(code="500", description=nil, message=nil)
    super(message)
    @description = description
    @code = code
  end
end

# Mock service for testing
class MockAccessControlService < AccessControlService
  def get(path, _user, organization)
    if organization.subdomain != 'acs-test'
      return File.read("test/data/acs_response/feature_groups.json") if path == '/api/v1/organizations/feature-groups'

      return "{}"
    end

    super
  end

  def post(_path, _user, organization, _data)
    return { :code => "201", :body => "{}" } if organization.subdomain != 'acs-test'

    super
  end

  def delete(_path, _user, organization, data = {})
    return { :code => "200", :body => "{}" } if organization.subdomain != 'acs-test'

    super
  end
end
