import PropTypes from 'prop-types';
import React     from 'react';

import { DateTime } from '@transcriptic/amino';

// Renders a relative timestamp for a Post
class PostTimeStamp extends React.Component {

  static get propTypes() {
    return {
      timestamp: PropTypes.string.isRequired
    };
  }

  render() {
    return (
      <span className="timestamp">
        <DateTime timestamp={this.props.timestamp} format="relative" />
      </span>
    );
  }
}

export default PostTimeStamp;
