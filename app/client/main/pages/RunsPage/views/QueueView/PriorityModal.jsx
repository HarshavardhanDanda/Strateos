import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SinglePaneModal } from 'main/components/Modal';
import { LabeledInput, Select } from '@transcriptic/amino';
import './PriorityModal.scss';

export class PriorityModal extends Component {
  static get propTypes() {
    return {
      onPriority: PropTypes.func.isRequired,
      selectedRuns: PropTypes.number.isRequired,
    };
  }

  static get MODAL_ID() {
    return 'RUN_PRIORITY_MODAL';
  }

  state = {
    priority: '',
  };

  onPrioritySelect = (priority) => {
    this.setState({ priority });
  };

  resetPriority = () => {
    this.setState({ priority: '' });
  };

  handleAccept = () => {
    this.props.onPriority(this.state.priority);
  };

  render() {
    const { selectedRuns } = this.props;
    const { priority } = this.state;
    const modalTitle = `Runs Selected(${selectedRuns})`;

    return (
      <SinglePaneModal
        title={modalTitle}
        acceptText="Submit"
        modalSize="medium"
        modalId={PriorityModal.MODAL_ID}
        onAccept={this.handleAccept}
        postDismiss={this.resetPriority}
        acceptBtnDisabled={!priority}
        type={'action'}
        size={'small'}
      >
        <div className="priority-modal__run-priority-dropdown">
          <LabeledInput label="Priority">
            <Select
              value={priority}
              onChange={e => this.onPrioritySelect(e.target.value)}
              placeholder={'Select Priority'}
              options={[
                {
                  name: 'High',
                  value: 'High'
                },
                {
                  name: 'Medium',
                  value: 'Medium'
                },
                {
                  name: 'Low',
                  value: 'Low'
                }
              ]}
            />
          </LabeledInput>
        </div>
      </SinglePaneModal>
    );
  }
}

export default PriorityModal;
