import React from 'react';
import PropTypes from 'prop-types';
import chrono from 'chrono-node';
import Moment from 'moment';

import RunActions from 'main/actions/RunActions';
import { DropDown } from '@transcriptic/amino';

class RunEstStart extends React.Component {
  static get propTypes() {
    return {
      runId: PropTypes.string.isRequired,
      onSuccess: PropTypes.func.isRequired,
      estimate: PropTypes.string
    };
  }

  constructor(props, context) {
    super(props, context);
    this.keyDown = this.keyDown.bind(this);
    this.state = {
      editing: false,
      editedValue: undefined
    };
  }

  parse(value) {
    return chrono.parseDate(value);
  }

  submit() {
    const date = chrono.parseDate(this.state.editedValue);
    if (!date) {
      return;
    }

    RunActions.updateRun(this.props.runId, {
      scheduled_to_start_at: date
    }).then(() => {
      this.props.onSuccess(date);
      this.setState({ editing: false, editedValue: undefined });
    });
  }

  cancel() {
    this.setState({ editing: false });
  }

  keyDown(e) {
    switch (e.which) {
      case 13:
        this.submit();
        break;

      case 27:
        this.cancel();
        break;

      default:
        break;
    }
  }

  render() {
    const timeDisplay = this.props.estimate ?
      Moment(this.props.estimate).format('D MMM HH:mm')
      :
      undefined;

    const label = `Est. Start: ${timeDisplay || 'None'}`;

    return (
      <span
        ref={(node) => { this.node = node; }}
        style={{ position: 'relative' }}
      >
        <a onClick={() => this.setState({ editing: true })}>
          <span>
            {label}
            <span>{' '}</span>
            <i className="fa fa-edit" />
          </span>
        </a>
        <DropDown
          isOpen={this.state.editing}
          hideDismissable={() => this.setState({ editing: false })}
          excludedParentNode={this.node}
        >
          <input
            value={this.state.editedValue}
            onChange={e => this.setState({ editedValue: e.target.value })}
            onKeyDown={this.keyDown}
            placeholder="e.g. &quot;next tuesday&quot;"
          />
        </DropDown>
      </span>
    );
  }
}

export default RunEstStart;
