import PropTypes from 'prop-types';
import React     from 'react';

import AjaxHOC             from 'main/containers/AjaxHOC';
import { Spinner }         from '@transcriptic/amino';
import NotificationActions from 'main/actions/NotificationActions';

class AjaxContainer extends React.Component {
  static get propTypes() {
    return {
      action:           PropTypes.func.isRequired, // () -> Promise
      spinnerSize:      PropTypes.oneOf(['small', 'large']),
      showErrorMessage: PropTypes.bool,
      children:         PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node
      ]),
      // Note the below are passed by the AjaxHOC
      hasLoaded:        PropTypes.bool,
      loading:          PropTypes.bool,
      error:            PropTypes.object,
      onAction:         PropTypes.func
    };
  }

  static get defaultProps() {
    return {
      spinnerSize:     'large',
      showErrorMessage: true
    };
  }

  componentDidMount() {
    const promise = this.props.onAction(this.props.action);
    if (this.props.showErrorMessage) {
      promise.fail((...args) => NotificationActions.handleError(...args));
    }
  }

  render() {
    if (!this.props.hasLoaded || this.props.loading) {
      return <Spinner size={this.props.spinnerSize} />;
    } else if (this.props.error && this.props.showErrorMessage) {
      return <span>An Error Occurred</span>;
    }

    return this.props.children;
  }
}

export default AjaxHOC(AjaxContainer);
