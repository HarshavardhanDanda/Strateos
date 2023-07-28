require 'cgi'
require 'json'
require 'uri'
require 'net/http'
require 'openssl'

# Communicates with the dropcam API to control our nest cameras in the lab
module VideoClipService
  # rubocop:disable ModuleFunction
  extend self

  # These three variables refer to cookies that are nest specific, hence their
  # cryptic names
  @session_token = nil
  @cztoken = nil
  @website_2 = nil

  @cameras = nil

  def username
    VideoClipConfig[:username]
  end

  def password
    VideoClipConfig[:password]
  end

  def logged_in?
    !@session_token.nil?
  end

  def ensure_logged_in
    if !self.username || !self.password
      raise "Cannot log in to Nest without a username and password. "\
            "Please see config/initializers/nest.rb"
    end

    if !self.logged_in?
      log_in
    end
  end

  def ensure_cameras_loaded
    ensure_logged_in
    load_cameras if @cameras.nil?
  end

  ###
  # Returns the list of cameras that are available. The format is a hash whose
  # keys are the workcell, and the value is an array, each element being a hash
  # with keys 'title' and 'id'
  #
  # Example:
  #   {
  #     wc1: [
  #       {
  #         title: "Birds Eye"
  #         id: "abc123"
  #       },
  #       {
  #         title: "Bravo 1"
  #         id: "321cba"
  #       }
  #
  #     ]
  #   }
  ###
  def cameras
    ensure_cameras_loaded
    return @cameras
  end

  ###
  # Creates a video clip using the unofficial nest API. Returns a URL suitable
  # for embedding
  #
  # Params
  #   device_id: The ID of the camera from which you'd like a clip
  #   start_time: The starting time of the clip, specified as seconds since epoch
  #   stop_time: The end time of the clip, specified as seconds since epoch
  #   title: The title of the video clip
  ###
  def render_video_clip(device_id, start_time, stop_time, title = "Auto Generated Clip")
    ensure_cameras_loaded

    uri = URI.parse("https://home.nest.com")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_PEER
    request = Net::HTTP::Post.new("/dropcam/api/clips/request")
    request.add_field('Referer', "https://home.nest.com/camera/#{device_id}")
    request.add_field('Cookie', "website_2=#{@session_token}; cztoken=#{@cztoken}")
    request.add_field('Content-Type', 'application/x-www-form-urlencoded')

    # Emulate a real browser, since we are using Nest internal APIs
    request.add_field('User-Agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) '\
                                    'Chrome/49.0.2623.75 Safari/537.36')

    clip_duration = (stop_time - start_time).to_i

    # Defines the default parameters of the clip creation.
    query_params = {
      'uuid' => device_id,
      'start_date' => start_time,
      'length' => clip_duration,
      'is_time_lapse' => false,
      'donate_video' => false,
      'target_length' => clip_duration,
      'title' => title
    }

    if clip_duration > 15.minutes
      query_params['is_time_lapse'] = true
      # Since the dropcam API is undocumented, we systematically found that 299 was the
      # maximum target_length that a timelapsed clip can achieve. Setting the target_length
      # to a value higher than 299 will return an error.
      query_params['target_length'] = 299
    end

    request.body = query_params.to_query

    response = http.request(request)

    return nil unless check_response(response, "render video clip")
    return JSON.parse(response.body)[0]
  end

  ###
  # Deletes a video clip
  ###
  def delete_video_clip(id)
    ensure_logged_in

    request = Net::HTTP::Delete.new("/dropcam/api/clips/#{id}")
    request.add_field('Cookie', "website_2=#{@session_token}; cztoken=#{@cztoken}")
    response = perform_nest_request(request)

    return check_response(response, "delete video clip #{id}")
  end

  ###
  # Describes an existing clip. One key property here is `is_generated`, which
  # determines whether or not the clip is ready
  ###
  def get_clip(id)

    request = Net::HTTP::Get.new("/dropcam/api/clips/#{id}")
    request.add_field('Cookie', "website_2=#{@session_token}; cztoken=#{@cztoken}")
    response = perform_nest_request(request)

    return nil unless check_response(response, "fetch video clip #{id}")
    return JSON.parse(response.body)[0]
  end

  private

  def log_error(msg)
    Rails.logger.error("[VideoClipService] #{msg}")
  end

  def check_response(response, fail_message)
    unless response.kind_of? Net::HTTPSuccess
      log_error("Failed to #{fail_message} - #{response}")
      return false
    end
    return true
  end

  def log_in
    get_website_2_cookie && create_session && do_log_in
  end

  def load_cameras
    @cameras = {}
    3.times do
      if set_cameras_from_dropcam
        break
      end
      sleep 3
    end
  end

  def set_cameras_from_dropcam
    request = Net::HTTP::Get.new("/dropcam/api/cameras")
    request.add_field('Cookie', "website_2=#{@session_token}; cztoken=#{@cztoken}")
    response = perform_nest_request(request)

    succeeded = check_response(response, "load cameras")
    if succeeded
      @cameras = {}
      JSON.parse(response.body).each do |camera|
        where = camera['where'].gsub(/\s+/, '').downcase

        @cameras[where] ||= []
        @cameras[where] << { title: camera['title'], id: camera['uuid'] }
      end
    end
    return succeeded
  end

  # Create a new session using username, password, and the website_2 cookie
  def create_session
    request = Net::HTTP::Post.new("/session")
    request.add_field('Content-Type', 'application/json')
    request.add_field('Cookie', "website_2=#{@website_2}")

    request.body = { 'email' => self.username, 'password' => self.password }.to_json
    response = perform_nest_request(request)

    return false unless check_response(response, "create a session")

    session_data = JSON.parse(response.body)
    @cztoken = session_data["access_token"]
    return true
  end

  # Extracts cookie 'website_2' which is required to create a session
  def get_website_2_cookie
    request = Net::HTTP::Get.new("/dropcam/api/logout")
    response = perform_nest_request(request)

    return false unless check_response(response, "get website_2 cookie")

    cookies = CGI::Cookie.parse(response['set-cookie'])
    @website_2 = cookies["website_2"].value[0]
    return true
  end

  # Log in and get a session_token
  def do_log_in
    request = Net::HTTP::Post.new("/dropcam/api/login")
    request.add_field('Content-Type', 'application/x-www-form-urlencoded')
    request.add_field('Cookie', "website_2=#{@website_2}; cztoken=#{@cztoken}")

    # Emulate a browser
    request.body = URI.encode_www_form({ 'access_token' => @cztoken })

    response = perform_nest_request(request)
    return false unless check_response(response, "log in to nest")

    data = JSON.parse(response.body)
    @session_token = data[0]["session_token"]
    return true
  end

  def perform_nest_request(request)
    uri = URI.parse("https://home.nest.com")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_PEER

    request.add_field('Referer', 'https://home.nest.com/')
    request.add_field('Origin', 'https://home.nest.com')
    request.add_field('X-Requested-With', 'XMLHttpRequest')
    request.add_field('User-Agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) '\
                                    'Chrome/49.0.2623.75 Safari/537.36')

    return http.request(request)
  end
end
