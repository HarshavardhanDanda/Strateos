import Immutable from 'immutable';
import String    from 'main/util/String';
import PropTypes from 'prop-types';
import React     from 'react';

// Renders attachments of a post
class PostAttachments extends React.Component {

  static get propTypes() {
    return {
      attachments: PropTypes.instanceOf(Immutable.List).isRequired
    };
  }

  render() {
    return (
      <div className="attachments">
        {this.props.attachments.map((attachment, i) => {
          const size = String.humanFileSize(attachment.get('size'));

          return (
            <div className="attachment" key={i}>
              <a target="_blank" rel="noreferrer" href={`/upload/url_for?key=${attachment.get('key')}`}>
                {attachment.get('name')}
              </a>
              <div className="size">{`(${size})`}</div>
            </div>
          );
        })}
      </div>
    );
  }
}

export default PostAttachments;
