import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import PostAttachments from 'main/conversation/PostAttachments';
import PostTimeStamp from 'main/conversation/PostTimeStamp';
import UserStore from 'main/stores/UserStore';
import UserProfile from 'main/components/UserProfile/UserProfile';

// This is how Users and Admins see a post made by a User
class UserPost extends React.Component {
  static get propTypes() {
    return {
      post: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  render() {
    let attachments;
    const { post } = this.props;
    const user = UserStore.getById(post.getIn(['author', 'id']));
    if (
      post &&
      post.getIn(['attachments', 'attachments']) &&
      post.getIn(['attachments', 'attachments']).size
    ) {
      attachments = post.getIn(['attachments', 'attachments']);
    }

    return (
      <div className="post event user">
        <div className="container">
          {user && <UserProfile user={user} />}
          <span className="header">{post.getIn(['author', 'name'])}</span>
          <span className="header"><PostTimeStamp timestamp={post.get('created_at')} /></span>
        </div>
        <div className="text">{post.get('text')}</div>
        <If condition={attachments}>
          <PostAttachments attachments={attachments} />
        </If>
      </div>
    );
  }
}

export default UserPost;
