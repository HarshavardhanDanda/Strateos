import React     from 'react';
import _         from 'lodash';
import Immutable from 'immutable';
import ModalActions from 'main/actions/ModalActions';
import RunActions from 'main/actions/RunActions';
import ProjectActions from 'main/actions/ProjectActions';
import { MultiStepModalPane, clonedPropNames } from 'main/components/Modal';
import { Table, Column } from '@transcriptic/amino';
import ProjectSelector from 'main/pages/ReactionPage/ProjectSelector.jsx';
import './RunTransferPane.scss';
import { observer } from 'mobx-react';
import StoresContext from 'main/stores/mobx/StoresContext';
import RunTransferModal from '../RunTransferModal';

interface Props {
  sourceProjectId?: string;
  subdomain?: string;
}

interface State {
  selectedProjectId: string;
}

class RunTransferPane extends React.Component<Props, State> {
  state = {
    selectedProjectId: undefined,
  };

  transferRuns() {
    const { runManagementStore, runFilterStore } = this.context;
    const { selectedProjectId } = this.state;

    RunActions.multiTransfer(
      runManagementStore.selectedRunIdsArray,
      selectedProjectId
    ).then(() => {
      ProjectActions.load(selectedProjectId);
      ProjectActions.load(this.props.sourceProjectId);
      ProjectActions.search(this.props.subdomain, { per_page: 50 });
      runFilterStore.resetRunTransferModalFilters();
      runManagementStore.clearSelectedRuns();
      ModalActions.close(RunTransferModal.MODAL_ID);
    });
  }

  renderRunsToTransferList() {
    const { runManagementStore } = this.context;

    return (
      <Table
        data={Immutable.fromJS(runManagementStore.selectedRuns)}
        loaded
        disabledSelection
        id="runs-to-transfer-table"
      >
        <Column
          renderCellContent={(run) => run.get('title') || run.get('id')}
          header="Name"
          id="name"
        />
        <Column
          renderCellContent={(run) => run.get('protocol_name') || '—'}
          header="Protocol"
          id="protocol"
        />
      </Table>
    );
  }

  renderTransferPane() {
    return (
      <React.Fragment>
        <h3>Runs being transferred</h3>
        <div className="run-transfer-pane__runs-list">
          {this.renderRunsToTransferList()}
        </div>
        <div className="run-transfer-pane__project">
          <h3 className="run-transfer-pane__project-title">
            Transfer to project
          </h3>
          <h4 className="run-transfer-pane__project-subtitle">Project</h4>
          <ProjectSelector
            sourceProjectId={this.props.sourceProjectId}
            updateProjectId={(projectId) =>
              this.setState({ selectedProjectId: projectId })
            }
            suggestionLimit={5}
            placeholder="Select destination project"
          />
        </div>
      </React.Fragment>
    );
  }

  render() {
    return (
      <MultiStepModalPane
        key={'RunTransferModalTransfer'}
        nextBtnName={'Transfer'}
        cancelBtnClass="btn-info btn-heavy btn-standard btn-link btn-tall spacing"
        nextBtnClass="btn-heavy btn-tall btn-small"
        backBtnClass="btn-secondary btn-heavy btn-tall btn-small spacing"
        nextBtnDisabled={!this.state.selectedProjectId}
        showBackButton
        showCancel
        beforeNavigateNext={() => this.transferRuns()}
        isMultiProgressModal
        {..._.pick(this.props, clonedPropNames)}
      >
        {this.renderTransferPane()}
      </MultiStepModalPane>
    );
  }
}

RunTransferPane.contextType = StoresContext;

export default observer(RunTransferPane);
