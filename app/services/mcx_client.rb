require 'net/http'
require 'uri'

class McxClient

  def rpc(url, nodeType, nodeId, fnName, request)
    if url.start_with?('http')
      path = url + "/rpc"
    else
      path = "http://" + url + "/rpc"
    end
    data = {
        type: nodeType,
        id: nodeId,
        fn: fnName,
        body: request
    }
    post(path, data)
  end

  def submit_run(url, nodeId, request)
    rpc(url, 'mcx', nodeId, 'queueRun', request)
  end

  def post(path, data)
    uri = URI(path)
    request = Net::HTTP::Post.new(uri.path, { 'Content-Type' => 'application/json' })
    request.body = data.to_json
    send_request(uri, request)
  end

  def send_request(uri, request)
    http = Net::HTTP.new(uri.host, uri.port)
    if uri.port == Net::HTTP.https_default_port
      http.use_ssl = true
    end
    resp = http.request(request)

    status = resp.code.to_i

    # throw exception on non 200 response
    if status < 200 || status >= 300
      raise McxClientError.new(resp.body)
    end

    resp.body
  end
end

# Wrapper on service errors
class McxClientError < StandardError
end
