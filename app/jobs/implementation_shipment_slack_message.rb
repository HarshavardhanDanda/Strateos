# Sends a slack message for failed or successful picks by the location picking algo
class ImplementationShipmentSlackMessage
  include Sidekiq::Worker

  SLACK_CHANNEL = '#applications'

  def perform(shipment_id)
    shipment = Shipment.find(shipment_id)
    items    = ImplementationItem.where(shipment_id: shipment_id).where.not(checked_in_at: nil)
    payload = create_payload(shipment, items)
    SLACK_CLIENT.ping(payload)
  end

  def create_payload(shipment, items)
    created_by = Admin.find(shipment.created_by)
    checked_in_by = Admin.find_by id: shipment.checked_in_by
    {
      username: 'Implementation Items Checked In',
      icon_emoji: ":package:",
      channel: SLACK_CHANNEL,
      attachments: [
        {
          fields: [
            { title: 'Shipment Title', value: shipment.name },
            { title: 'Created By', value: created_by.name },
            { title: 'Checked In By', value: checked_in_by.name },
            { title: 'Number of Items', value: items.length },
            { title: 'Packing Slip', value: shipment.packing_url },
            { title: 'View Shipments', value: 'https://secure.transcriptic.com/admin/shipments/implementation' }
          ],
          fallback: "Items for Implementation Shipment (#{shipment.name}) "\
                    "created by #{created_by.name} "\
                    "have been checked in by #{checked_in_by.name}."\
                    " https://secure.transcriptic.com/admin/shipments/implementation"
        }
      ]
    }
  end
end
