import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import Moment from 'moment';
import * as TimeUtil from 'main/util/TimeUtil';

import PaymentMethodSelector from 'main/components/PaymentMethodSelector';
import RunInstructions from 'main/components/RunInstructions';
import { Section, FormGroup } from '@transcriptic/amino';
import OrderSummary from 'main/project/launchRun/OrderSummary';
import SessionStore from 'main/stores/SessionStore';
import * as ContainerUtil from 'main/util/ContainerUtil';
import FeatureConstants from '@strateos/features';
import AcsControls from 'main/util/AcsControls';
import RunCustomProperties from 'main/pages/RunPage/components/RunCustomProperties';
import { MultiStepModalPane } from 'main/components/Modal';

class RunPreview extends React.Component {

  static get propTypes() {
    return {
      submitRun: PropTypes.func.isRequired,
      onBack: PropTypes.func.isRequired,
      validator: PropTypes.object.isRequired,
      submitting: PropTypes.bool,
      test_mode: PropTypes.bool,
      bsl: PropTypes.number.isRequired,
      paymentMethodId: PropTypes.string,
      onPaymentSelected: PropTypes.func,
      requestDate: PropTypes.instanceOf(Moment),
      organizationId: PropTypes.string,
      isImplementationRun: PropTypes.bool.isRequired
    };
  }

  labelForTotal() {
    if (this.props.bsl === 2) {
      return `Total (${ContainerUtil.formatBSLString(this.props.bsl)})`;
    } else {
      return 'Total';
    }
  }

  nextBtnName() {
    if (this.props.submitting) {
      return 'Submitting';
    } else if (this.props.test_mode) {
      return 'Submit Test Run';
    } else {
      return 'Submit';
    }
  }

  isNextBtnDisabled() {
    return this.props.submitting || (!this.props.paymentMethodId && !this.props.isImplementationRun && !this.props.test_mode && !SessionStore.isTestAccount());
  }

  getRunPreview() {
    const { estimatedRunTime } = this.props.validator.preview;
    if (estimatedRunTime) {
      const timeString = TimeUtil
        .humanizeDuration((estimatedRunTime) * 1000);
      return `Preview - Estimated run time : ${timeString}`;
    } else {
      return 'Preview';
    }
  }

  renderRunOptions() {
    return (
      <Section title="Options">
        <div className="request-date-review">
          <div><h4 className="tx-type--heavy">Request Date</h4></div>
          <div><h4>{Moment(this.props.requestDate).format('MMMM Do YYYY, h:mm a')}</h4></div>
        </div>
      </Section>
    );
  }

  render() {
    const quote = _.extend({}, this.props.validator.preview.quote);
    if (!AcsControls.isFeatureEnabled(FeatureConstants.VIEW_PRICE_BREAKDOWN)) {
      delete quote.breakdown;
    }

    return (
      <div className="run-preview">
        <div id="launch" className="modal-body">
          <div className="row">
            <div className="col-md-8">
              <Section title={this.getRunPreview()}>
                <RunInstructions run={this.props.validator.previewRun} />
              </Section>
            </div>
            <div className="col-md-4 tx-stack tx-stack--md">
              <OrderSummary quote={quote} totalLabel={this.labelForTotal()} />
              <div className="run-payment-method">
                { !this.props.isImplementationRun && (
                <FormGroup label="Payment Method">
                  <PaymentMethodSelector
                    onPaymentMethodSelected={this.props.onPaymentSelected}
                    paymentMethodId={this.props.paymentMethodId}
                    organizationId={this.props.organizationId}
                    hideAddOption={this.props.organizationId !== SessionStore.getOrg().get('id')}
                  />
                </FormGroup>
                )}
              </div>
              {this.props.requestDate && this.renderRunOptions()}
              {this.props.customInputsConfig && (
                <RunCustomProperties
                  customProperties={this.props.customInputs}
                  customInputsConfig={this.props.customInputsConfig}
                  customPropertiesClass="run-custom-prop"
                />
              )}
            </div>
          </div>
        </div>
        <MultiStepModalPane
          onNavigateNext={this.props.submitRun}
          nextBtnDisabled={this.isNextBtnDisabled()}
          waitingOnResponse={this.props.submitting}
          onNavigateBack={this.props.onBack}
          nextBtnName={this.nextBtnName()}
          backBtnName="Back to Configure"
          btnClass="btn-medium"
        />
      </div>
    );
  }
}

export default RunPreview;
