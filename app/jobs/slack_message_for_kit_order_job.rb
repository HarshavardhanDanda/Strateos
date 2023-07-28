class SlackMessageForKitOrderJob
  include Sidekiq::Worker
  include Rails.application.routes.url_helpers

  CHANNEL  = '#orders'
  USERNAME = 'KitOrderBot'

  def message(kit_order)
    url = kit_order.orderable_material.material.url ? "<#{kit_order.orderable_material.material.url}>" : '-'
    {
      fallback: "New kit order #{kit_order.id} has been placed",
      pretext:  "New kit order #{kit_order.id} has been placed. View kit orders"\
                " <#{kit_order.orderable_material.material.organization.subdomain}/vendor/kitorders|here>.",
      fields: [
        { title: "Count",    value: kit_order.count.to_s,    short: true },
        { title: "Kit Name", value: kit_order.orderable_material.material.name.to_s, short: true },
        { title: "URL",      value: url.to_s,                short: false }
      ]
    }
  end

  def perform(kit_order_id)
    kit_order = KitOrder.find(kit_order_id)
    message   = message(kit_order)

    SLACK_CLIENT.ping({
      channel: CHANNEL,
      username: USERNAME,
      attachments: [ message ]
    })
  end
end
