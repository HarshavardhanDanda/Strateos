class DatasetsController < UserBaseController
  # allow fetching the dataset by id directly without specifying the organization.
  # which means `project` won't be in the params.
  before_action :find_project_context, except: [ :show, :colony_canvas_page, :destroy ]

  respond_to :json

  def index
    render json: @project.datasets.as_json(Dataset.short_json)
  end

  def show
    id = params.require(:id)

    dataset = Dataset.find_by_id(id) ||
              Dataset.find_by_warp_id(id) ||
              Dataset.find_by_instruction_id(id) ||
              Dataset.with_deleted.find_by_id(id)

    raise ActiveRecord::RecordNotFound if dataset.nil?

    authorize(dataset, :show?)

    if params[:organization_id]
      # Now that we can hit this route from both
      # /dataset/:id and /:org/:project/datasets/:id we need to
      # fetch the context when we are able to.  Otherwise our page will fail to load.
      find_context()
    end

    respond_to do |format|
      format.embed do
        render file: Rails.public_path.join('dist', 'main_index.html'), layout: false
      end
      format.json do
        if params[:key] and params[:key] == "*"
          render json: dataset.data.to_json
        elsif params[:key]
          render json: dataset.data[params[:key]].as_json
        elsif params[:json_type] == 'short'
          render json: dataset.as_json(Dataset.short_json)
        elsif params[:json_type] == 'short_with_parent_ids'
          render json: dataset.as_json(Dataset.short_with_parent_ids_json)
        else
          render json: dataset.as_json
        end
      end
      format.csv do
        if not dataset.supported_formats.include?('csv')
          return render text: "Data type '#{dataset.data_type}' does not support CSV rendering"
        end

        filename =
          if dataset.instruction and (dr = dataset.instruction.operation['dataref'])
            "#{dataset.id}-#{dr}.csv"
          else
            "#{dataset.id}.csv"
          end

        response.headers['Content-Disposition'] = 'attachment; filename=' + filename.inspect
        render text: dataset.to_csv
      end
      format.zip do
        response.headers['Content-Disposition'] = 'attachment; filename=' + dataset.id + '.zip'
        self.response_body = Enumerator.new do |y|
          S3Helper.instance.client.get_object(
            bucket: dataset.attachments[0]['bucket'], key: dataset.attachments[0]['key']
          ) do |chunk|
            y << chunk
          end
        end
      end
      format.all do
        if params[:format] == 'raw'
          bucket = nil
          key = nil

          unless dataset.supported_formats.include?('raw')
            return render text: "Data type '#{dataset.data_type}' does not support raw rendering"
          end

          if [ 'image_plate', 'autopick', 'gel' ].include? dataset.data_type
            # chrome will only display the image inline if a valid mime type is included.
            # if the image is of another type the browser will still display correctly.
            response.headers['Content-Type'] = 'image/png'
          end

          if [ 'image_plate', 'autopick' ].include? dataset.data_type
            loc =
              if params[:sub] == 'scaled_normalized'
                dataset.data['image_scaled_loc']
              elsif params[:sub] == 'normalized'
                dataset.data['image_normalized_loc']
              else
                dataset.data
              end

            loc ||= dataset.data # Some old images don't have scaled/normalized versions
            bucket = loc['bucket']
            key = loc['key']
          else
            bucket = dataset.attachments[0]['bucket']
            key = dataset.attachments[0]['key']
          end

          self.response_body = Enumerator.new do |y|
            S3Helper.instance.client.get_object(bucket: bucket, key: key) do |chunk|
              y << chunk
            end
          end
        else
          escaped_format = ERB::Util.html_escape(params[:format])
          render text: "Data type '#{dataset.data_type}' does not support #{escaped_format} rendering"
        end
      end
    end
  end

  def create
    @dataset = Dataset.new(dataset_params)
    @dataset.project_id = @project.id

    if @dataset.save
      render json: @dataset, status: :created
    else
      render json: @dataset.errors, status: :unprocessable_entity
    end
  end

  def update
    @dataset = @project.datasets.find(params.require(:id))

    authorize(@dataset, :update?)

    if @dataset.update(dataset_params)
      render json: @dataset.as_json(Dataset.full_json), status: :ok
    else
      render json: @dataset.errors, status: :unprocessable_entity
    end
  end

  def destroy
    dataset = Dataset.find(params.require(:id))
    comment = params[:comment]
    authorize(dataset, :destroy?)

    is_measurement = !dataset.is_analysis
    if is_measurement
      instruction = dataset.instruction
      program_executions = instruction&.program_executions&.where(completed_at: nil)
      if program_executions.present?
        raise(ActionController::BadRequest, "Instuction #{instruction.id} is involved in post instruction programs")
      end
    end

    dataset.audit_comment = comment
    dataset.destroy!

    render json: dataset.as_json(Dataset.short_json)
  end

  private

  def dataset_params
    params.require(:dataset).permit(:title, :data_type)
  end

end
