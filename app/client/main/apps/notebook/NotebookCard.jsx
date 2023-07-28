import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import NotebookActions from 'main/actions/NotebookActions';
import { DateTime } from '@transcriptic/amino';

class NotebookCard extends React.Component {
  static get propTypes() {
    return {
      project:      PropTypes.instanceOf(Immutable.Map),
      notebook:     PropTypes.instanceOf(Immutable.Map),
      onClick:      PropTypes.func,
      onViewStatic: PropTypes.func
    };
  }

  constructor(props, context) {
    super(props, context);

    this.destroy = this.destroy.bind(this);
  }

  destroy() {
    if (confirm('Are you sure? This will permanently destroy this notebook and cannot be undone.')) {
      NotebookActions.destroy(
        this.props.project.get('id'),
        this.props.notebook.get('id')
      );
    }
  }

  /* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
  render() {
    return (
      <div className="notebook-card">
        <p onClick={() => this.props.onClick(this.props.notebook)}>
          {this.props.notebook.get('name')}
        </p>
        <p className="details">
          <a onClick={this.destroy}>Delete Notebook</a>
          {' — '}
          <a onClick={this.props.onViewStatic}>View Read Only</a>
          {' — Created on '}
          <DateTime
            timestamp={this.props.notebook.get('created')}
            format="absolute-format"
          />
          {' — Last modified on '}
          <DateTime
            timestamp={this.props.notebook.get('last_modified')}
            format="absolute-format"
          />
        </p>
      </div>
    );
  }
}

export default NotebookCard;
