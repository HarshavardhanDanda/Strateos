import React from 'react';
import classNames from 'classnames';
import Immutable from 'immutable';
import _ from 'lodash';
import { RunsViewType } from 'main/stores/mobx/types';
import { observer } from 'mobx-react';
import StoresContext from 'main/stores/mobx/StoresContext';
import { MultiStepModalWrapper }   from 'main/components/Modal';
import { RunStatuses } from 'main/stores/mobx/RunFilterStore';
import { RunSelectionPane, RunTransferPane } from './panes';

interface Props {
  userId?: string;
  projectId?: string;
  subdomain?: string;
}

interface State {
  navIndex: number;
}
class RunTransferModal extends React.Component<Props, State> {

  static get MODAL_ID() {
    return 'RUN_TRANSFER_MODAL';
  }

  state = {
    /** Modal pane index
       * @member {number} */
    navIndex: 0
  };

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate(prevProps, _) {
    if (prevProps.projectId !== this.props.projectId) {
      this.loadData();
    }
  }

  loadData() {
    const { runFilterStore, runManagementStore } = this.context;
    runFilterStore.resetRunTransferModalFilters();
    runManagementStore.init(RunsViewType.RunTransferModal);
    runFilterStore.updateRunStatus(RunStatuses.AllWithRejectedAndCancelled);
    runFilterStore.updateProjectId(this.props.projectId);
  }

  setCustomPaneTitleIcons(index: number, completed: boolean) {
    return (
      <i
        className={classNames(Immutable.List(['fas fa-hand-point-up', 'far fa-truck']).get(index), 'fa-lg', {
          'sequential-progress-tracker__custom-icon-color': completed
        })}
      />
    );
  }

  beforeDismiss = () => {
    this.context.runManagementStore.clearSelectedRuns();
    this.context.runFilterStore.resetRunTransferModalFilters();
  };

  render() {
    const { userId, projectId, subdomain } = this.props;
    return (
      <MultiStepModalWrapper
        currPaneIndex={this.state.navIndex}
        paneTitles={Immutable.List(['Select run', 'Destination'])}
        title="Transfer Run"
        modalId={RunTransferModal.MODAL_ID}
        modalSize="xlg"
        multiProgressTracker
        renderCustomIcons={this.setCustomPaneTitleIcons}
        beforeDismiss={this.beforeDismiss}
        modalClass="run-transfer-modal"
      >
        <RunSelectionPane
          userId={userId}
          projectId={projectId}
        />
        <RunTransferPane sourceProjectId={projectId} subdomain={subdomain} />
      </MultiStepModalWrapper>
    );
  }
}

RunTransferModal.contextType = StoresContext;

export default observer(RunTransferModal);
