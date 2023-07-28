import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

class AttachedFiles extends React.Component {

  static get propTypes() {
    return {
      instruction: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      attachments: props.instruction.getIn(['dataset', 'attachments']) || []
    };
  }

  render() {
    return (
      <div>
        <strong>Attached files:</strong>
        <ul className="attachments">
          {this.state.attachments.map((attachment) => {
            return (
              <li key={attachment.get('key')}>
                <a
                  href={`/upload/url_for?key=${attachment.get('key')}`}
                  onClick={(e) => {
                    return e.stopPropagation();
                  }}
                >
                  {attachment.get('name')}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

export default AttachedFiles;
