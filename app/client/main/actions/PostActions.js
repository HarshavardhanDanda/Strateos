import Dispatcher          from 'main/dispatcher';
import HTTPUtil            from 'main/util/HTTPUtil';
import ajax                from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';

const PostActions = {
  loadPosts(conversationId, options) {
    return HTTPUtil.get(Urls.posts(conversationId), { options })
      .done(posts => Dispatcher.dispatch({ type: 'POST_LIST', posts }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  submitPost(conversationId, post) {
    return ajax.post(Urls.posts(conversationId), { post })
      .done((data) => {
        Dispatcher.dispatch({
          type: 'POST_INFO',
          post: data
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  deletePost(conversationId, id) {
    return ajax.delete(Urls.post(conversationId, id))
      .done(() => {
        Dispatcher.dispatch({
          type: 'POST_DESTROYED',
          id
        });
      })
      .fail(() => {
        return this.loadPosts(conversationId);
      }
      );
  }
};

export default PostActions;
