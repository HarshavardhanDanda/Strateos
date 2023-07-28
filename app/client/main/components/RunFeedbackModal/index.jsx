import PropTypes from 'prop-types';
import React     from 'react';

import { SinglePaneModal } from 'main/components/Modal';
import RunActions from 'main/actions/RunActions';

import { Button } from '@transcriptic/amino';
import RunStore   from 'main/stores/RunStore';
import _ from 'lodash';
import RunFeedback from './RunFeedback';

class RunFeedbackModal extends React.Component {

  static get propTypes() {
    return {
      success: PropTypes.bool,
      successNotes: PropTypes.string,
      projectId: PropTypes.string,
      runId: PropTypes.string
    };
  }

  static get defaultProps() {
    return {
      success: true
    };
  }

  static generateState(props) {
    return {
      initialValues: {
        success: props.success,
        successNotes: props.successNotes,
        runId: props.runId
      },
      success: props.success,
      successNotes: props.successNotes,
      editable: ((props.success === undefined) || !props.successNotes)
    };
  }

  static getDerivedStateFromProps(props, state) {
    const newState = RunFeedbackModal.generateState(props);
    if (!_.isEqual(newState.initialValues, state.initialValues)) {
      return newState;
    }
    return null;
  }

  constructor(props) {
    super(props);
    this.state = RunFeedbackModal.generateState(props);
    this.editClicked = this.editClicked.bind(this);
  }

  editClicked() {
    this.setState({ editable: true });
  }

  render() {
    const run = RunStore.getById(this.props.runId);
    const runStatus = run && run.get('status');
    return (
      <SinglePaneModal
        modalId="RunFeedbackModal"
        title={this.state.editable ? 'Provide Run Feedback' : 'View Run Feedback'}
        acceptText="Save"
        acceptBtnDisabled={(this.state.success === undefined) || (this.state.successNotes === undefined)}
        renderFooter={this.state.editable}
        onAccept={() => {
          return RunActions.updateRunFeedback(
            this.props.runId,
            this.state.success,
            this.state.successNotes
          );
        }
        }
      >
        <div>
          <RunFeedback
            onFieldChange={(state) => {
              this.setState({ success: !!(state.result === 'success'), successNotes: state.outcome });
            }}
            success={this.state.success}
            successNotes={this.state.successNotes}
            editable={this.state.editable}
            runStatus={runStatus}
          />
          {
            !this.state.editable &&
              <Button type="primary" link size="small" onClick={this.editClicked}>Edit Feedback</Button>
          }
        </div>
      </SinglePaneModal>
    );
  }
}

export default RunFeedbackModal;
