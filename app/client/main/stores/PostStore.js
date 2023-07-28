/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const PostStore = _.extend({}, CRUDStore('post'), {
  act(action) {
    switch (action.type) {
      case 'POST_LIST':
        return this._receiveData(action.posts);

      case 'POST_INFO':
        return this._receiveData([action.post]);

      case 'POST_DESTROYED':
        return this._remove(action.id);

      default:

    }
  },

  getByConversation(conversationId) {
    return this.getAll()
      .valueSeq()
      .filter(post => post.get('conversation_id') === conversationId)
      .sortBy(post => post.get('created_at'))
      .reverse();
  }
});

PostStore._register(Dispatcher);

export default PostStore;
