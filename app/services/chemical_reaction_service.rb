require 'net/http'
require 'uri'

class ChemicalReactionService
  def initialize(base_url)
    @base_url = base_url
  end

  def create_reaction(logged_in_user, organization, data)
    path = '/api/v1/reactions'
    post(path, logged_in_user, organization, data)
  end

  def get_reaction(logged_in_user, organization, id)
    path = '/api/v1/reactions/' + id
    get(path, logged_in_user, organization)
  end

  def get_reactions(logged_in_user, organization, id)
    path = '/api/v1/reactions?run_id=' + id
    get(path, logged_in_user, organization)
  end

  def get_reactions_by_ids(logged_in_user, organization, ids)
    path = '/api/v1/reactions?ids=' + ids
    get(path, logged_in_user, organization)
  end

  def submit_reaction(logged_in_user, organization, id)
    path = '/api/v1/reactions/' + id + '/submit'
    post(path, logged_in_user, organization, nil)
  end

  def update_reaction(logged_in_user, organization, id, data)
    Rails.logger.info " update_reaction data::#{data}"
    path = '/api/v1/reactions/' + id
    patch(path, logged_in_user, organization, data)
  end

  def update_reactant(logged_in_user, organization, reaction_id, reactant_id, data)
    Rails.logger.info " update_reactant data::#{data}"
    path = '/api/v1/reactions/' + reaction_id + '/reactants/' + reactant_id
    patch(path, logged_in_user, organization, data)
  end

  private

  def patch(path, user, organization, data)
    uri = URI(@base_url + path)
    request = Net::HTTP::Patch.new(uri.path,{ 'Content-Type' => 'application/json' })
    if data.present?
      request.body=data
    end
    send_request(uri, request, user, organization)
  end

  def post(path, user, organization, data)
    uri = URI(@base_url + path)
    request = Net::HTTP::Post.new(uri.path,{ 'Content-Type' => 'application/json' })
    if data.present?
      request.body=data
    end
    send_request(uri, request, user, organization)
  end

  def get(path, user, organization)
    uri = URI(@base_url + path)
    request = Net::HTTP::Get.new(uri)
    send_request(uri, request, user, organization)
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

class MockChemicalReactionService < ChemicalReactionService

end
