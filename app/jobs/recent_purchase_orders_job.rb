class RecentPurchaseOrdersJob
  include Sidekiq::Worker

  def perform
    start = (Time.now - 1.month).at_beginning_of_month
    stop  = (Time.now - 1.month).at_end_of_month

    pos = PurchaseOrder.joins(:organization)
                       .where(organizations: { test_account: false })
                       .where("created_at >= ? AND created_at <= ?", start, stop)

    InternalMailer.recent_purchase_orders(pos)
  end
end
