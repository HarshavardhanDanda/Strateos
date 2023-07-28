import React from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { inflect } from 'inflection';
import { Label } from '@transcriptic/amino';
import { statusPopoverItems } from './StatusItems';
import RunTimingInfo from './RunTimingInfo';

// Renders a human friendly Status message for a run.
function RunStatusLabel(props) {
  const status = props.isTestMode ? 'test_mode' : props.run.get('status');

  const labelMap = {
    pending: 'default',
    accepted: 'primary',
    in_progress: 'info',
    complete: 'success',
    billed: 'success',
    aborted: 'danger',
    rejected: 'danger',
    canceled: 'danger',
    declined: 'danger',
    test_mode: 'warning',
    awaiting: 'warning',
    billing_invalid: 'danger',
    shipment_pending: 'warning'
  };

  const textMap = {
    pending: 'Request Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    in_progress: 'In Progress',
    shipment_pending: 'Shipment Pending',
    billing_invalid: 'Billing Invalid',
    complete: 'Completed',
    billed: 'Billed',
    aborted: 'Aborted',
    canceled: 'Canceled',
    declined: 'Declined',
    test_mode: 'Test Mode',
    awaiting: `Awaiting ${
      props.run.get('unmet_requirements')
    } Generated ${inflect('Container', props.run.get('unmet_requirements'))}`
  };

  const getLabelType = () => {
    return labelMap[status];
  };

  const getLabelText = () => {
    return textMap[status];
  };

  const hasTimingInfo = ['accepted', 'in_progress', 'complete', 'aborted', 'canceled', 'pending', 'rejected'].includes(status);

  const renderTimingContent = () => {
    if (hasTimingInfo) {
      return (
        <RunTimingInfo
          items={_.compact(statusPopoverItems(props.run, status))}
        />
      );
    }
    return undefined;
  };

  return (
    <Label
      type={getLabelType()}
      title={getLabelText()}
      popoverContent={renderTimingContent()}
      popoverTitle="Timing Information"
    />
  );

}

RunStatusLabel.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map),
  isTestMode: PropTypes.bool,
};

export default RunStatusLabel;
