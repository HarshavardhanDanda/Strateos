require 'net/http'
require 'uri'
require 'ams_client'

class AssetManagementService
  def initialize(base_url)
    AMSClient.configure do |config|
      # Since AMS URL is hardcoded to localhost:8082 in AMS Client, configuring AMS ApiClient to use scheme and host
      # https://github.com/strateos/assetmanagement-service-clients/blob/main/ruby/lib/ams_client/configuration.rb#L141-L142
      config.host = base_url
      config.scheme = base_url.sub(/:\/\/.*/, '')
      config.server_index = nil
    end

    @services = AMSClient::ServicesApi.new
    @devices = AMSClient::DevicesApi.new
    @workcells = AMSClient::WorkcellsApi.new
  end

  def devices(user, organization, device_name)
    devices_from_ams(user, organization, device_name)
  end

  def workcells(user, organization, name, lab_id)
    workcells_from_ams(user, organization, name, lab_id)
  end

  def submittable_services(user, organization, lab_id)
    submittable_services_from_ams(user, organization, lab_id)
  end

  private

  def make_payload(params, user, organization)
    params[:header_params] = {
      'X-Organization-Id': organization['id'] || organization.id,
      'X-User-Id': user.id
    }
    params
  end

  def devices_from_ams(user, organization, device_name)
    payload = make_payload({
                             page_size: 10_000,
                             filter_name: device_name
                           }, user, organization)
    @devices.read_all_devices(payload)
  end

  def workcells_from_ams(user, organization, name, lab_id)
    payload = make_payload({
                             page_size: 10_000,
                             filter_lab_id: lab_id,
                             filter_name: name
                           }, user, organization)
    @workcells.read_all_workcells(payload)
  end

  def submittable_services_from_ams(user, organization, lab_id)
    payload = make_payload({
                             filter_lab_id: lab_id
                           }, user, organization)
    @services.get_submittable_services(payload)
  end
end

# Wrapper on service errors
class AssetManagementServiceError < StandardError
end

class MockAssetManagementService < AssetManagementService
  def devices(_user, _organization, device_name)
    if device_name != 'sample_device'
      return AMSClient::PageDevice.new({
        total_pages: 1,
        total_elements: 0,
        size: 10,
        number: 0,
        content: []
      })
    end

    super
  end

  def submittable_services(user, organization, lab_id)
    if organization.name == 'organization test'
      return [
        AMSClient::ReadSubmittableService.new(
          id: 'id1',
          name: 'wc5',
          url: 'http://url',
          state: AMSClient::ServiceState::NOT_DEPLOYED,
          node_id: 'wc5-asdfdsfha'
        ),
        AMSClient::ReadSubmittableService.new(
          id: 'id2',
          name: 'wc6',
          url: 'http://url',
          state: AMSClient::ServiceState::DEPLOYED,
          node_id: 'wc6-fdslkjfsalkfd'
        )
      ]
    end

    super
  end
end
