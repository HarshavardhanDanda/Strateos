import React from 'react';
import PropTypes from 'prop-types';
import { LabeledInput } from '@transcriptic/amino';
import _          from 'lodash';
import './AssignModal.scss';
import OperatorsFilter from 'main/pages/RunsPage/views/OperatorsFilter';
import { SinglePaneModal } from 'main/components/Modal';

export class AssignModal extends React.Component {
  static get propTypes() {
    return {
      selectedRuns: PropTypes.number.isRequired,
      allLabIds: PropTypes.arrayOf(PropTypes.string).isRequired,
      currentUserId: PropTypes.string.isRequired,
      onAssign: PropTypes.func.isRequired,
    };
  }

  static get MODAL_ID() {
    return 'RUN_ASSIGN_MODAL';
  }

  state = {
    operatorId: ''
  };

  onAssignSelect = (operator) => {
    this.setState({ operatorId: operator });
  };

  resetSelect = () => {
    this.setState({ operatorId: '' });
  };

  handleAssign = () => {
    const { onAssign } = this.props;
    const { operatorId } = this.state;
    // Operator filter passes array regardless of if single select mode
    onAssign(_.isEmpty(operatorId) ? '' : operatorId);
  };

  render() {
    const {
      allLabIds,
      currentUserId,
      selectedRuns,
    } = this.props;
    const { operatorId } = this.state;
    const modalTitle = `Runs Selected(${selectedRuns})`;

    return (
      <SinglePaneModal
        title={modalTitle}
        acceptText="Assign"
        modalSize="medium"
        modalId={AssignModal.MODAL_ID}
        onAccept={this.handleAssign}
        postDismiss={this.resetSelect}
        acceptBtnDisabled={operatorId === ''}
        type={'action'}
        size={'small'}
      >
        <div className="assign-modal__run-assign-dropdown">
          <LabeledInput label="Operator">
            <OperatorsFilter
              currentUserId={currentUserId}
              labIds={allLabIds}
              singleSelectId={operatorId}
              onSingleChange={this.onAssignSelect}
              isSingleSelect
              isProfile
            />
          </LabeledInput>
        </div>
      </SinglePaneModal>
    );
  }
}

export default AssignModal;
