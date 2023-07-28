import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SinglePaneModal } from 'main/components/Modal';
import { RadioGroup, Radio, TextArea } from '@transcriptic/amino';
import { inflect } from 'inflection';
import './RejectModal.scss';

export class RejectModal extends Component {
  static get propTypes() {
    return {
      onReject: PropTypes.func.isRequired,
      selectedRuns: PropTypes.number
    };
  }

  static get MODAL_ID() {
    return 'REJECT_MODAL';
  }

  state = {
    rejectReason: '',
    rejectDescription: ''
  };

  render() {
    const { rejectReason, rejectDescription } = this.state;
    const { selectedRuns } = this.props;

    const modalTitle = `Reject ${selectedRuns} ${inflect('run', selectedRuns)}`;

    return (
      <SinglePaneModal
        title={modalTitle}
        acceptText="Reject"
        modalSize="large"
        modalId={RejectModal.MODAL_ID}
        onAccept={() => this.props.onReject(rejectReason, rejectDescription)}
        postDismiss={() => {
          this.setState({
            rejectReason: '',
            rejectDescription: ''
          });
        }}
        acceptBtnDisabled={!rejectReason}
        type={'danger'}
        size={'small'}
      >
        <p>Select a reason for rejecting this submitted run.
          Rejected runs must be resubmitted for review.
        </p>
        <h4 className="tx-type--heavy">Reason</h4>
        <div className="reject-modal">
          <RadioGroup
            name="reject-reason"
            value={rejectReason}
            onChange={(e) => {
              e.stopPropagation();
              this.setState({ rejectReason: e.target.value });
            }}
          >
            <Radio id="radio-input-1" value="Budget" label="Budget" />
            <Radio id="radio-input-2" value="Resource availability" label="Resource availability" />
            <Radio id="radio-input-3" value="Platform Under Maintenance" label="Platform Under Maintenance" />
            <Radio id="radio-input-4" value="Other" label="Other" />
          </RadioGroup>
          <h4 className="tx-type--heavy">Description</h4>
          <TextArea
            placeholder="Enter a rejection message"
            name="rejet-description"
            value={rejectDescription}
            onChange={(e) => {
              e.stopPropagation();
              this.setState({ rejectDescription: e.target.value });
            }}
          />
        </div>
      </SinglePaneModal>
    );
  }
}

export default RejectModal;
