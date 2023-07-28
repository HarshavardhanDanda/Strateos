import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import PostAttachments from 'main/conversation/PostAttachments';
import PostTimeStamp from 'main/conversation/PostTimeStamp';

// This is how a User views a post made by an Admin
class OperatorPost extends React.Component {
  render() {
    let attachments;
    const { post } = this.props;

    if (post && post.getIn) {
      attachments = post.getIn(['attachments', 'attachments']);
    }

    return (
      <div className="post event operator">
        <div className="author">
          <span>
            <Choose>
              <When condition={Transcriptic.current_user.system_admin}>
                {
                  `Transcriptic Operator (${post.getIn(['author', 'name'])})`
                }
              </When>
              <Otherwise>
                Transcriptic Operator
              </Otherwise>
            </Choose>
          </span>
          {' '}
          <PostTimeStamp timestamp={post.get('created_at')} />
        </div>
        <div className="text">
          {post.get('text')}
        </div>
        <If condition={attachments != undefined && attachments.size > 0}>
          <PostAttachments attachments={attachments} />
        </If>
      </div>
    );
  }
}

OperatorPost.propTypes = {
  post: PropTypes.instanceOf(Immutable.Map).isRequired
};

export default OperatorPost;
