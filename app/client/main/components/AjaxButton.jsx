import PropTypes from 'prop-types';
import React     from 'react';
import _ from 'lodash';

import AjaxHOC from 'main/containers/AjaxHOC';
import NotificationActions from 'main/actions/NotificationActions';
import { safeFail } from 'main/util/ajax';

import { Button } from '@transcriptic/amino';

// A button that shows a spinner while requests are in flight.
// It can optionally prompt the user to confirm before firing it's
// action.
class AjaxButton extends React.Component {
  render() {

    const buttonProps = _.omit(
      this.props,
      'hasLoaded',
      'xhr',
      'error',
      'action',
      'confirmMessage',
      'shouldConfirm',
      'onAction',
      'loading',
      'icon',
      'disabled',
      'children'
    );

    return (
      <Button
        icon={this.props.loading ? 'fa fa-spinner fa-spin' : this.props.icon}
        {...buttonProps}
        onClick={(e) => {
          e.preventDefault();

          const shouldConfirmRes = this.props.shouldConfirm === undefined || this.props.shouldConfirm();
          const confirmed = this.props.confirmMessage == undefined ||
            !shouldConfirmRes ||
            confirm(this.props.confirmMessage);

          if (confirmed && this.props.onAction) {
            const promise = this.props.onAction(this.props.action, e);
            if (promise && !this.props.disableNotification && (promise.fail || promise.catch)) {
              safeFail(promise, (...args) => {
                NotificationActions.handleError(...args);
              });
            }
          }
        }}
        disabled={this.props.loading || this.props.disabled}
      >
        {this.props.children}
      </Button>
    );
  }
}

AjaxButton.defaultProps = {
  disabled: false,
  disableNotification: false
};

AjaxButton.propTypes = {
  action: PropTypes.func.isRequired,
  confirmMessage: PropTypes.string,
  shouldConfirm: PropTypes.func,
  disabled: PropTypes.bool,
  icon: PropTypes.string,
  // Note the below are passed by the AjaxHOC
  onAction: PropTypes.func,
  loading: PropTypes.bool.isRequired,
  children: PropTypes.node,
  disableNotification: PropTypes.bool
};

export default AjaxHOC(AjaxButton);
