import PropTypes from 'prop-types';
import React     from 'react';

import PostCompose from 'main/conversation/PostCompose';

class ComposeAdminPost extends React.Component {

  static get propTypes() {
    return {
      onSubmit: PropTypes.func.isRequired
    };
  }

  render() {
    return (
      <div className="compose-admin-post">
        <h2>Internal Note</h2>
        <PostCompose
          onSubmit={({ text, attachments }) => {
            return this.props.onSubmit({ text, attachments, viewable_by_users: false });
          }}
        />
      </div>
    );
  }
}

export default ComposeAdminPost;
