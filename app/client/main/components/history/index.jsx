import PropTypes from 'prop-types';
import React     from 'react';

import { AnyChildrenShape } from 'main/proptypes';

import './history.scss';

class History extends React.Component {
  render() {
    return (
      <div className="history">
        <div className="timeline" />{this.props.children}
      </div>
    );
  }
}

History.propTypes = {
  children: AnyChildrenShape
};

class HistoryEvent extends React.Component {
  render() {
    return (
      <div className="event">
        <div className="icon">{this.props.icon}</div>
        <div className="body">{this.props.children}</div>
      </div>
    );
  }
}

HistoryEvent.propTypes = {
  icon: PropTypes.node,
  children: AnyChildrenShape
};

export { History, HistoryEvent };
