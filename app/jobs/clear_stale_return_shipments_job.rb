class ClearStaleReturnShipmentsJob
  include Sidekiq::Worker

  def perform
    stales = ReturnShipment.where(status: "created", created_at: Date.new...3.days.ago)
    stales.map(&:destroy)
  end
end
