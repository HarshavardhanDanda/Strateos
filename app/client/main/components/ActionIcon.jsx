import React from 'react';
import PropTypes from 'prop-types';

// TODO Move this to amino, or maybe merge this into NamedIcon somehow.
export default class ActionIcon extends React.Component {
  static get propTypes() {
    return {
      name: PropTypes.string.isRequired,
      iconClass: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired
    };
  }

  render() {
    return (
      <span onClick={this.props.onClick} className="action-icon">
        <span className="tx-type--disabled">{this.props.name}</span>
        <div>
          <i className={this.props.iconClass} />
        </div>
      </span>
    );
  }
}
