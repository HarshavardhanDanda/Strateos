# This class implements a generic reverse proxy pattern by utilizing the `rails-reverse-proxy` gem.
# By default, all requests to `v1/:service/*path` will be routed through this controller.
# For example, if we have a service `foo`, requests to `v1/foo` will be proxied to the URL specified in the
# `FOO_SERVICE_URL` environment variable.
# Note that for the proxied server, we may need to explicitly enable CORS for the relevant domains and content-types
# in order to handle these requests.
class ReverseProxyController < UserBaseController
  include ReverseProxy::Controller

  # Validate CSRF token if current session is empty.
  # If session is empty, this means a user token or bearer token was used to sign in (`sign_in(user, store:false)`).
  # If session is not empty, this means a user has logged in through the browser with a session cookie, and if
  # the CSRF token is not valid, clear the session (with: :null_session).
  protect_from_forgery with: :null_session, unless: -> { user_session.empty? }

  # Generic entrypoint for all proxied routes. All matched requests for a proxied service will be passed through
  # this function. Finer-grained authorization and route matching can be defined here.
  def proxy
    organization = Organization.find_by_id(request.headers["X-Organization-Id"])
    if organization.nil?
      err = JSONAPI::Error.new(code: '400', status: :bad_request,
                               title: 'Required headers are missing', detail: nil)
      return render json: err, status: :bad_request

    end
    authorize_request(organization)

    reverse_proxy service_url, path: "/#{params[:path]}?#{request.query_string}",
                  headers: generate_proxy_headers(organization)
  end

  private

  # For finer authorization control, override this method in the subclass
  def authorize_request(organization)
    authorize(organization, :member?)
  end

  # When we access this endpoint from within the browser (e.g. child app), we typically only have the rack session
  # cookie in scope. Let's always explicitly get and forward the headers.
  def generate_proxy_headers(organization)
    # In case of CSRF tokens not being forwarded by client, a null session is used and user is not within scope
    user_headers =
      if current_user.nil?
        {}
      else
        {
          'X-User-Id' => current_user.id,
          'X-User-Email' => current_user.email
        }
      end
    # We cannot use `@organization` which is set in scope by UserBaseController.find_context in this reverse_proxy.
    # We must always read get organization by reading the orgId from request headers header
    org_headers = {
      'X-Organization-Id' => organization.id,
      'X-Organization-Subdomain' => organization.subdomain
    }
    user_org_headers = user_headers.merge(org_headers)
    if Rails.env.production? || Rails.env.staging?
      # SNI support, see https://github.com/axsuul/rails-reverse-proxy/issues/25#issuecomment-408225824
      host_headers = {
        'Host' => URI.parse(service_url).host
      }
      user_org_headers.merge(host_headers)
    else
      user_org_headers
    end
  end

  def service_name
    params[:service].upcase
  end

  # This controls the URL which the matching requests will be proxied to
  def service_url
    ENV["#{service_name}_SERVICE_URL"]
  end
end
