class DevicesController < UserBaseController
  respond_to :json
  before_action :authenticate_admin!, only: [ :index, :create, :update, :destroy ]

  def index
    render json: Device.all.as_json(Device.full_json)
  end

  def create
    @device     = Device.new(device_params)
    @device.id  = device_params[:id]

    if @device.save
      render json: @device.as_json(Device.full_json), status: :created
    else
      render json: @device.errors, status: :unprocessable_entity
    end
  end

  def show
    @device = Device.find(params[:id])
    render json: @device.as_json(Device.full_json)
  end

  def update
    device = Device.find(params[:id])

    if device.update(device_params)
      render json: device.as_json(Device.full_json)
    else
      render json: device.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @device = Device.find(params[:id])
    @device.destroy
    head :ok
  end

  private

  def device_params
    params.require(:device).permit(
      :model,
      :manufacturer,
      :id,
      :name,
      :purchased_at,
      :manufactured_at,
      :serial_number
    )
  end
end
