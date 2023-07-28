import PropTypes from 'prop-types';
import React     from 'react';

import { ExpandingArea, Button } from '@transcriptic/amino';

import './ConfirmActionDropdown.scss';

// Allows a user to confirm an action with a 'Confirm' button.  For example, after a user clicks
// an actino button, you can render this inside of a Dropdown to require them to confirm that action.
class ConfirmActionDropdown extends React.Component {
  render() {
    return (
      <div className="confirm-action-dropdown">
        <div className="vertical-spaced-list">
          <div>{this.props.warnText}</div>
          <If condition={this.props.requireInput}>
            <ExpandingArea
              value={this.props.inputValue}
              onChange={this.props.onChangeInput}
              shouldFocus
              border
              placeholder={this.props.inputPlaceHolder}
            />
          </If>
          <Button
            type="primary"
            onClick={this.props.onConfirm}
            disabled={this.props.buttonDisabled}
          >
            {this.props.buttonText}
          </Button>
        </div>
      </div>
    );
  }
}

ConfirmActionDropdown.defaultProps = {
  buttonText: 'Confirm',
  buttonDisabled: false,
  warnText: 'Please confirm.',
  requireInput: false,
  inputPlaceHolder: 'Start Typing...'
};

ConfirmActionDropdown.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  buttonText: PropTypes.string,
  buttonDisabled: PropTypes.bool,
  warnText: PropTypes.string,
  requireInput: PropTypes.bool,
  inputValue: PropTypes.string,
  onChangeInput: PropTypes.func,
  inputPlaceHolder: PropTypes.string
};

export default ConfirmActionDropdown;
