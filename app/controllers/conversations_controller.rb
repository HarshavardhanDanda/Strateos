class ConversationsController < UserBaseController
  respond_to :json

  def show
    conversation = Conversation.find(params.require(:id))
    render json: conversation.as_json(Conversation.mini_json), status: :ok
  end

  def add_post
    conversation = Conversation.find(params.require(:id))
    authorize(conversation, :update?)

    safe_params = params.require(:post).permit(
      :text,
      :viewable_by_users,
      {
        # We do this nesting {attachments: attachments: []} because previous versions of rails
        # didn't allow for the array to be top level. See github.com/rails/rails/issues/11169
        # Rails now supports this, but we need to migrate all of our existing Posts to
        # the new un-nested format at the same time that we change this code.
        attachments: { attachments: [ :upload_id, :name, :size ] }
      }
    )

    # use upload_ids to get the s3 key
    if safe_params[:attachments] && safe_params[:attachments][:attachments]
      safe_params[:attachments][:attachments].each do |a|
        upload = Upload.find(a[:upload_id])
        authorize(upload, :show?)
        a[:key] = upload.key
        a.delete(:upload_id)
      end
    end

    safe_params.require(:text)

    post = conversation.posts.build(safe_params)

    if user_signed_in?
      post.assign_author current_user
    elsif admin_signed_in?
      post.assign_author current_admin
    end

    if post.save
      render json: post.as_json(Post.full_json), status: :created
    else
      render json: { errors: post.errors }, status: :unprocessable_entity
    end
  end

  def posts
    conversation = Conversation.find(params[:id])

    posts = conversation.posts.includes(:author).select do |post|
      if admin_signed_in?
        true
      else
        post.viewable_by_users
      end
    end

    filtered_posts = posts.map { |post| post.as_json(Post.full_json) }

    render json: filtered_posts.sort_by { |post| post[:created_at] }.reverse
  end

end
