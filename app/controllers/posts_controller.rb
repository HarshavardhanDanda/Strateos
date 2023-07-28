class PostsController < UserBaseController

  def destroy
    post = Post.find(params.require(:id))
    authorize(post, :destroy?)
    post.destroy!
    head :ok
  end

end
