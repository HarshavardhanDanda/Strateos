import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import PostAttachments from 'main/conversation/PostAttachments';
import PostTimeStamp from 'main/conversation/PostTimeStamp';

// This is how a User views a post made by an Admin
class AdminPost extends React.Component {
  renderPostAttachments() {
    const { post } = this.props;
    let attachments;

    if (Immutable.Map.isMap(post)) {
      attachments = post.getIn(['attachments', 'attachments']);
    }

    if (attachments && attachments.size) {
      return <PostAttachments attachments={attachments} />;
    }
    return undefined;
  }

  render() {
    const { post } = this.props;

    return (
      <div className="post event admin">
        <div className="author">
          <span>{post.getIn(['author', 'name'])}</span>
          <PostTimeStamp timestamp={post.get('created_at')} />
        </div>

        <div className="text">{post.get('text')}</div>

        {this.renderPostAttachments()}
      </div>
    );
  }
}

AdminPost.propTypes = {
  post: PropTypes.instanceOf(Immutable.Map).isRequired
};

export default AdminPost;
