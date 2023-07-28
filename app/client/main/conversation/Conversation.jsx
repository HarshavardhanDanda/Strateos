import PropTypes from 'prop-types';
import React     from 'react';

import PostActions      from 'main/actions/PostActions';
import ConnectToStores  from 'main/containers/ConnectToStoresHOC';
import ComposeAdminPost from 'main/conversation/ComposeAdminPost';
import PostFeed         from 'main/conversation/PostFeed';
import PostStore        from 'main/stores/PostStore';
import ACSControls      from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';

class Conversation extends React.Component {
  static get propTypes() {
    return {
      conversation_id: PropTypes.string.isRequired,
      onPostSubmitted: PropTypes.func
    };
  }

  constructor(props, context) {
    super(props, context);

    this.onSubmitPost = this.onSubmitPost.bind(this);

    this.state = {
      composeError: undefined,
      numPostsToShow: 0
    };
  }

  componentDidMount() {
    if (this.props.conversation_id) {
      this.fetchPosts();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.conversation_id !== prevProps.conversation_id) {
      this.fetchPosts(this.props.conversation_id);
    }
  }

  fetchPosts(conversation_id = this.props.conversation_id) {
    return PostActions.loadPosts(conversation_id)
      .done((posts) => this.setState({ numPostsToShow: Math.min(5, posts.length) }));
  }

  onSubmitPost(postInfo) {
    return this.submitPost(postInfo);
  }

  submitPost({ text, attachments }) {
    const id = this.props.conversation_id;

    return PostActions.submitPost(id, {
      text,
      viewable_by_users: true,
      attachments: {
        attachments
      }
    })
      .fail((d, status, errText) => {
        return this.setState({
          composeError: `Error posting message: ${errText}`
        });
      })
      .done(post => (this.props.onPostSubmitted ? this.props.onPostSubmitted(post) : undefined))
      .always(() => {
        this.setState({ composeError: undefined });
      });
  }

  render() {
    const posts = PostStore.getByConversation(this.props.conversation_id);

    return (
      <div className="conversation">
        <If condition={ACSControls.isFeatureEnabled(FeatureConstants.VIEW_RUNS_IN_LABS)}>
          <ComposeAdminPost onSubmit={this.onSubmitPost} />
        </If>
        <If condition={this.state.composeError}>
          <label htmlFor="composeError">
            {this.state.composeError}
          </label>
        </If>
        <If condition={posts.count()}>
          <PostFeed
            posts={posts}
            conversationId={this.props.conversation_id}
            numToShow={this.state.numPostsToShow}
            showAll={() => this.setState({ numPostsToShow: posts.size })}
          />
        </If>
      </div>
    );
  }
}

export default ConnectToStores(Conversation, () => {});
