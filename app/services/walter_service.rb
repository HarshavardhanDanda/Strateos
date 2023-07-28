# Service that communicates with Walter the chemistry API
class WalterService

  def initialize(base_url)
    @base_url = base_url
  end

  # Creates a compound summary.
  #
  # @param compound [Hash] An array of { 'smiles': '..', 'inchi': '...', 'sdf': '...' } etc.
  #
  # @return [Compound]
  #
  # @raise [WalterServiceError] if there is a an issue with the walter request.
  def summarize_compound(summarize_request)
    data = {
      compounds: summarize_request
    }

    url  = @base_url + '/compounds/summarize'
    data = data.to_json

    resp = Excon.post(url, {
      body: data,
      headers: { 'Accept' => 'application/json', 'Content-Type' => 'application/json' },
      connect_timeout: 5,
      write_timeout: 60,
      read_timeout: 30
    })

    status    = resp.data[:status]
    resp_json = JSON.parse(resp.body)

    # throw exception on non 200 response
    if status < 200 || status >= 300
      # TODO: pass the status of the request here
      # like this raise WalterServiceError.new("#{resp_json["message"]}/#{resp.data[:status]}")
      raise WalterServiceError.new(resp_json)
    end

    resp_json
  end

  # Ping Walter
  #
  # @return Hash{String => Boolean}
  def ping
    get('/health/ping')
  end

  private

  def get(path)
    resp = Excon.get(@base_url + path)

    [ resp.data[:status], JSON.parse(resp.body) ]
  end
end

# Wrapper on service errors
class WalterServiceError < StandardError
end

# Mock service for testing
class MockWalterService < WalterService
  def initialize
  end

  def get(_path)
    [ 200, {} ]
  end

  def summarize_compound(summarize_request)
    data = {
      compounds: summarize_request
    }

    resp = []

    data[:compounds].each do |c|
      compound = FactoryBot.build(:compound)
      compound.smiles = c[:smiles] || compound.smiles
      compound.inchi  = c[:inchi] || compound.inchi
      compound.sdf    = c[:sdf] || compound.sdf

      resp << compound.attributes
    end
    resp
  end
end
