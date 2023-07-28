require 'net/http'
require 'uri'
require 'json/jwt'
require 'set'

# For now, we'll use these these global scopes.
# In the future, we can create granular, resource-based scopes (e.g. `projects:read`)

REQUIRED_SCOPES = [ "web/get", "web/post" ].to_set

module OAuthService
  module_function

  def verify(token)
    jwk_set = JSON::JWK::Set.new(
      JSON.parse(
        Net::HTTP.get(URI(COGNITO_JWKS_URL_INTERNAL_USERS))
      )
    )

    begin
      id_token = JSON::JWT.decode token, jwk_set
    rescue
      raise 'Token Extraction Failed!'
    end

    unless is_valid(id_token)
    raise 'Token Verification Failed!'
    end
  end

  def is_valid(id_token)
    has_subject(id_token) &&
    has_valid_scope(id_token) &&
    !is_expired(id_token)
  end

  def has_subject(id_token)
    id_token[:sub].present?
  end

  def is_expired(id_token)
    get_expiration_time(id_token) < Time.now
  end

  def has_valid_scope(id_token)
    get_scopes(id_token) == REQUIRED_SCOPES
  end

  def get_scopes(id_token)
    id_token[:scope].split(' ').to_set
  end

  def get_expiration_time(id_token)
    Time.at(id_token[:exp])
  end

end
