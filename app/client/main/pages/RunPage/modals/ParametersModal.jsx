import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';
import _ from 'lodash';

import ajax from 'main/util/ajax';
import Urls from 'main/util/urls';

import { SinglePaneModal } from 'main/components/Modal';
import LaunchRunInputsReadOnly from 'main/project/launchRun/LaunchRunInputsReadOnly';
import SessionStore from 'main/stores/SessionStore';
import { Spinner, DatePicker } from '@transcriptic/amino';

import './ExecutionModal.scss';

class ParametersModal extends React.Component {

  constructor(props) {
    super(props);

    this.onOpen = this.onOpen.bind(this);

    this.state = { isLoading: true };
  }

  onOpen() {
    const { run } = this.props;
    const launchRequestId = run.get('launch_request_id');
    const protocolId = run.get('protocol_id');
    return ajax
      .get(Urls.launch_request(protocolId, launchRequestId))
      .then((data) => {
        const { inputs, protocol, input_file_attributes, organization_id } = data;

        const inputParams = _.merge({}, inputs.parameters, input_file_attributes);
        const paramOptions = protocol.inputs;
        this.setState({
          isLoading: false,
          inputParams,
          paramOptions,
          organizationId: organization_id
        });
      });
  }

  renderOptions(requestDate) {
    return (
      <div className="section tx-stack">
        <h2 className="tx-stack__block tx-stack__block--sm tx-inline tx-type--secondary">
          Options
        </h2>
        <div className="options__wrapper">
          <div className="launch-run option__label">
            Requested Date
          </div>
          <div className="launch-run">
            {this.renderRequestDate(requestDate)}
            {this.renderRequestTime(requestDate)}
          </div>
        </div>
      </div>
    );
  }

  renderRequestDate(requestDate) {
    return (
      <div className="request-date-picker">
        <h4 className="tx-type--heavy tx-inline tx-inline--xxxs">
          Request Date
        </h4>
        <DatePicker
          date={new Date(requestDate)}
          disabled
          popperPlacement="top"
        />
      </div>
    );
  }

  renderRequestTime(requestDate) {
    return (
      <div className="request-time-picker">
        <h4 className="tx-type--heavy tx-inline tx-inline--xxxs">
          Request Time
        </h4>
        <DatePicker
          isTimeSelector
          date={new Date(requestDate)}
          disabled
          popperPlacement="top"
        />
      </div>
    );
  }

  render() {
    const { isLoading, paramOptions, inputParams, organizationId } = this.state;
    const requested_at = this.props.run.get('requested_at');
    const isCCSOrg = SessionStore.hasFeature('ccs_org');
    return (
      <SinglePaneModal
        modalId="PARAMETERS_MODAL"
        modalSize="large"
        onOpen={this.onOpen}
        title="Launch Parameters"
        modalBodyClass="execution-modal"
      >
        {isLoading ?
          <Spinner /> : (
            <LaunchRunInputsReadOnly
              inputTypes={paramOptions}
              inputs={inputParams}
              organizationId={organizationId}
              isRoot
            />
          )}
        {isCCSOrg && requested_at && (
          <div className="launch-run">
            {this.renderOptions(requested_at)}
          </div>
        )}
      </SinglePaneModal>
    );
  }
}

ParametersModal.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map)
};

export default ParametersModal;
