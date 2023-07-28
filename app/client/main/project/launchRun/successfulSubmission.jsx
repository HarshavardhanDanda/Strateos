// Components showing a successful state after launching a run
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import Urls                   from 'main/util/urls';
import ShipmentCreatedSuccess from 'main/components/ShipmentCreatedSuccess/ShipmentCreatedSuccess';

import { Button } from '@transcriptic/amino';

class SuccessfulSubmission extends React.Component {

  static get propTypes() {
    return {
      runUrl: PropTypes.string
    };
  }

  render() {
    return (
      <div id="launch" className="modal-body">
        <div className="successful-submission-confirmation">
          <img alt="" src="/images/icons/inventory_browser_icons/success-check.svg" />
          <h2 className="master">Thanks for scheduling a run!</h2>
          <div className="run-button-container">
            <Button
              size="large"
              type="primary"
              to={this.props.runUrl}
            >
              View Run
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

class SuccessfulSubmissionWithShipping extends React.Component {

  static get propTypes() {
    return {
      containers: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      onOkClicked: PropTypes.func,
      runUrl: PropTypes.string,
      shipment: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  render() {
    return (
      <div className="successful-submission-confirmation">
        <ShipmentCreatedSuccess
          shipment={this.props.shipment}
          containers={this.props.containers}
          headerMessage="Thanks for scheduling a run! Before the run begins, please ship your samples to us."
          onContainerClicked={(id) => {
            window.location.href = Urls.container(id);
          }}
          onOkClicked={this.props.onOkClicked}
        />
        <hr />
        <div className="run-button-container">
          <Button type="primary" size="large" to={this.props.runUrl}>
            View Run
          </Button>
        </div>
      </div>
    );
  }
}

export { SuccessfulSubmission, SuccessfulSubmissionWithShipping };
