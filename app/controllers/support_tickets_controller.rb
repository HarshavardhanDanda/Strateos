class SupportTicketsController < UserBaseController
  before_action :support_tickets_params
  before_action :get_run_context

  def index
    render json: { results: @run.support_tickets }
  end

  def create
    ticket      = SupportTicket.new(@params.to_unsafe_h)
    ticket.run  = @run
    ticket.user = current_user
    ticket.save

    if ticket.errors.empty?
      InternalMailer.support_ticket_created(ticket).deliver_later
      UserMailer.support_ticket_acknowledge(ticket).deliver_later
      render json: ticket
    else
      render json: ticket.errors, status: :unprocessable_entity
    end
  end

  def support_tickets_params
    @params = params.permit(:message)
  end

  def get_run_context
    @run = Run.find(params[:id])
  end

end
