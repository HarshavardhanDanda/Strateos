class InstructionsController < UserBaseController

  def show
    respond_to do |format|
      format.embed do
        render file: Rails.public_path.join('dist', 'main_index.html'), layout: false
      end
    end
  end
end
