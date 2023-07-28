import React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { ButtonSelect, Card, Spinner } from '@transcriptic/amino';
import { TabLayout, TabLayoutTopbar }  from 'main/components/TabLayout';
import CommonRunListView from 'main/pages/RunsPage/views/CommonRunListView';
import RunFilter from 'main/pages/RunsPage/views/RunFilter/RunFilter';
import CalenderViewModal from 'main/pages/RunsPage/views/CalenderView/CalenderViewModal';
import './QueueView.scss';
import FeatureConstants from '@strateos/features';
import AcsControls from 'main/util/AcsControls';
import ModalActions from 'main/actions/ModalActions';
import OrganizationStore from 'main/stores/OrganizationStore';
import RunSubmitModal from 'main/pages/RunsPage/views/QueueView/RunSubmitModal';
import StoresContext from 'main/stores/mobx/StoresContext';
import { RunsViewType } from 'main/stores/mobx/RunManagementStore';
import { makeQueueColumns } from 'main/pages/RunsPage/views/TableColumns';
import PriorityModal from './PriorityModal';
import AssignModal from './AssignModal';

class QueueView extends React.Component {

  componentDidMount() {
    const { runManagementStore } = this.context;
    const { runStatus } = this.props.match.params;

    runManagementStore.init(RunsViewType.Queue, runStatus);
  }

  componentDidUpdate() {
    const { userId } = this.props;
    this.context.runFilterStore.saveCopyOfUserId(userId);
  }

  showAssign(runStatus) {
    switch (runStatus) {
      case 'all_runs':
      case 'accepted':
      case 'in_progress':
        return true;
      default:
        return false;
    }
  }

  openSubmit = () => {
    this.context.runManagementStore.openModal();
  };

  openPriority() {
    ModalActions.open(PriorityModal.MODAL_ID);
  }

  openAssign() {
    ModalActions.open(AssignModal.MODAL_ID);
  }

  makeActions = (runStatus, assignDisabled, bulkSubmitDisabled, runManagementStore, currentOrg) => {
    const actions = [];
    // TODO: Not super happy with all of this random feature combination implementation living in components
    //  should be eventually moved into a feature store
    const canViewRunSubmit = (
      Feature.bulk_run_submit &&
      AcsControls.isFeatureEnabled(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE) &&
      OrganizationStore.isStrateosAccount(currentOrg) &&
      this.showAssign(runStatus)
    );

    if (canViewRunSubmit) {
      actions.push({
        title: 'Submit',
        disabled: bulkSubmitDisabled,
        action: this.openSubmit
      });
    }
    if (AcsControls.isFeatureEnabled(FeatureConstants.RUN_STATE_MGMT) && this.showAssign(runStatus)) {
      actions.push({
        title: 'Assign',
        disabled: assignDisabled,
        action: this.openAssign
      }, {
        title: 'Priority',
        disabled: assignDisabled,
        action: this.openPriority
      });
    }
    if (AcsControls.isFeatureEnabled(FeatureConstants.CLAIM_RUN) && this.showAssign(runStatus)) {
      actions.push({
        title: 'Assign to me',
        disabled: assignDisabled,
        action: runManagementStore.claimSelectedRuns
      });
    }
    return actions;
  };

  render() {
    const { runStatus } = this.props.match.params;
    const { org, orgId, userId } = this.props;
    const { runManagementStore, labStore, runFilterStore } = this.context;
    const { aminoSelectedObject, numberRunsSelected, allSelectedAcceptedOrInProgress, bulkSubmitDisabled } = runManagementStore;
    const { labs, labIds } = labStore;
    const { currentUserIsLabManager } = runFilterStore;
    // For the various render functions that aren't components so we can't set them to observe mobx
    const labLookup = (id) => labs.get(id);

    const showOrgFilter = labStore.hasAccessToOtherOrgs(orgId);

    const listActions = this.makeActions(runStatus, !allSelectedAcceptedOrInProgress, bulkSubmitDisabled, runManagementStore, org);
    const isLoading = _.isUndefined(showOrgFilter) || _.isUndefined(currentUserIsLabManager);

    return (
      <TabLayout className="runs-page">
        {isLoading ? (
          <Spinner />
        ) : [
          <TabLayoutTopbar key="queue-view-tab-layout-topbar">
            <RunFilter
              showOperators
              showOrgFilter={showOrgFilter}
            />
          </TabLayoutTopbar>,
          <div key="queue-view">
            <Card allowOverflow>
              <ButtonSelect
                activeSelect={runStatus}
                options={[{
                  id: 'accepted',
                  label: 'ACCEPTED'
                }, {
                  id: 'in_progress',
                  label: 'IN PROGRESS'
                }, {
                  id: 'complete',
                  label: 'COMPLETED'
                }, {
                  id: 'aborted',
                  label: 'ABORTED'
                }, {
                  id: 'canceled',
                  label: 'CANCELED'
                }, {
                  id: 'all_runs',
                  label: 'ALL RUNS'
                }]}
                onSelect={id => this.props.history.push(`${id}`)}
              />
              <CommonRunListView
                id="sortable list"
                statusForRuns={runStatus}
                selectedRuns={aminoSelectedObject}
                actionsArray={listActions}
                onSelectRows={runManagementStore.setSelectedRuns}
              >
                {makeQueueColumns(this.props.match.params.runStatus, showOrgFilter, labLookup, currentUserIsLabManager)}
              </CommonRunListView>
            </Card>
            <PriorityModal
              selectedRuns={numberRunsSelected}
              onPriority={runManagementStore.setRunsPriority}
            />
            <AssignModal
              currentUserId={userId}
              allLabIds={labIds}
              selectedRuns={numberRunsSelected}
              onAssign={runManagementStore.assignSelectedRunsToUser}
            />
            <RunSubmitModal />
            <CalenderViewModal
              history={this.props.history}
            />
          </div>
        ]}
      </TabLayout>
    );
  }
}
QueueView.contextType = StoresContext;

export default observer(QueueView);
