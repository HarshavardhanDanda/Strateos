import Immutable   from 'immutable';
import { inflect } from 'inflection';
import _ from 'lodash';
import PropTypes   from 'prop-types';
import React       from 'react';

import PostActions     from 'main/actions/PostActions';
import AdminPost       from 'main/conversation/AdminPost';
import OperatorPost    from 'main/conversation/OperatorPost';
import UserPost        from 'main/conversation/UserPost';

// A list of Posts
class PostFeed extends React.Component {

  static get propTypes() {
    return {
      posts: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      conversationId: PropTypes.string.isRequired,
      numToShow: PropTypes.number.isRequired,
      showAll: PropTypes.func.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.deletePostAndShowAll = this.deletePostAndShowAll.bind(this);
  }

  deletePostAndShowAll(id) {
    PostActions.deletePost(this.props.conversationId, id).done(() => this.props.showAll());
  }

  render() {
    const numHidden = this.props.posts.size - this.props.numToShow;

    return (
      <div className="post-feed">
        {this.props.posts.slice(0, this.props.numToShow).map((post) => {
          return (
            <PostContainer
              key={post.get('id')}
              post={post}
              deletePost={this.deletePostAndShowAll}
            />
          );
        })}
        <If condition={numHidden > 0}>
          <div className="older event">
            (
            <a onClick={this.props.showAll}>
              {`Show ${numHidden} more ${inflect('post', numHidden)}.`}
            </a>
            )
          </div>
        </If>
      </div>
    );
  }
}

// Decides which type of post to render based on author type
class PostContainer extends React.Component {

  static get propTypes() {
    return {
      post: PropTypes.instanceOf(Immutable.Map).isRequired,
      deletePost: PropTypes.func.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      mouseInside: false
    };
  }

  showDeleteIcon() {
    return (
      this.state.mouseInside &&
      Transcriptic.current_user.id === this.props.post.getIn(['author', 'id'])
    );
  }

  render() {
    const { post } = this.props;

    let PostClass;
    if (post.get('author_type') === 'Admin') {
      if (post.get('viewable_by_users')) {
        PostClass = OperatorPost;
      } else {
        PostClass = AdminPost;
      }
    } else {
      PostClass = UserPost;
    }

    return (
      <div
        className="post-container"
        onMouseEnter={() => this.setState({ mouseInside: true })}
        onMouseLeave={() => this.setState({ mouseInside: false })}
      >
        <PostClass post={post} />
        <If condition={this.showDeleteIcon()}>
          <div
            className="delete-icon"
            onClick={() => this.props.deletePost(post.get('id'))}
          >
            <i className="fa fa-trash" />
          </div>
        </If>
      </div>
    );
  }
}

export default PostFeed;
