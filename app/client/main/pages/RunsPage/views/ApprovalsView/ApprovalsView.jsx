import React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import CommonRunListView from 'main/pages/RunsPage/views/CommonRunListView';
import { ButtonSelect, Card, Spinner } from '@transcriptic/amino';
import { TabLayout, TabLayoutTopbar }  from 'main/components/TabLayout';
import RunFilter from 'main/pages/RunsPage/views/RunFilter/RunFilter';
import CalenderViewModal from 'main/pages/RunsPage/views/CalenderView/CalenderViewModal';
import FeatureConstants from '@strateos/features';
import ModalActions from 'main/actions/ModalActions';
import AcsControls from 'main/util/AcsControls';
import StoresContext from 'main/stores/mobx/StoresContext';
import { RunsViewType } from 'main/stores/mobx/RunManagementStore';
import { makeApprovalsColumns } from 'main/pages/RunsPage/views/TableColumns';
import { RunStatuses } from 'main/stores/mobx/RunFilterStore';
import RejectModal from './RejectModal';
import ApprovalModal from './ApprovalModal';

class ApprovalsView extends React.Component {

  componentDidMount() {
    const { runManagementStore } = this.context;
    const { runStatus } = this.props.match.params;

    runManagementStore.init(RunsViewType.Approvals, runStatus);
  }

  handleReject() {
    ModalActions.open(RejectModal.MODAL_ID);
  }

  listActions = () => {
    const { runStatus } = this.props.match.params;
    const { numberRunsSelected } = this.context.runManagementStore;
    return AcsControls.isFeatureEnabled(FeatureConstants.RUN_STATE_MGMT) && runStatus === RunStatuses.Pending ?
      [{
        title: 'Reject',
        action: this.handleReject
      }, {
        title: 'Approve',
        action: this.handleApprove,
        disabled: numberRunsSelected > 1
      }] : [];
  };

  handleApprove() {
    ModalActions.open(ApprovalModal.MODAL_ID);
  }

  render() {
    const { runStatus } = this.props.match.params;
    const { orgId, labIds, userId } = this.props;
    const { runManagementStore, labStore } = this.context;
    const { aminoSelectedObject, numberRunsSelected, selectedRunsArray } = runManagementStore;
    const { labs } = labStore;
    const showOrgFilter = labStore.hasAccessToOtherOrgs(orgId);
    const labLookup = (id) => labs.get(id);

    // TODO: Refactor ApprovalModal
    const runForApproval = selectedRunsArray.length ? selectedRunsArray[0] : null;
    const isLoading = _.isUndefined(showOrgFilter);

    return (
      <TabLayout className="runs-page">
        {isLoading ? (
          <Spinner />
        ) : [
          <TabLayoutTopbar key="runs-tab-layout-topbar">
            <RunFilter showOrgFilter={showOrgFilter} />
          </TabLayoutTopbar>,
          <div key="approval-view">
            <Card allowOverflow>
              <ButtonSelect
                activeSelect={runStatus}
                options={[{
                  id: 'pending',
                  label: 'PENDING APPROVAL',
                  icon: 'fa fa-clock'
                }, {
                  id: 'rejected',
                  label: 'REJECTED',
                  icon: 'fa fa-ban'
                }]}
                onSelect={id => this.props.history.push(`${id}`)}
              />

              <CommonRunListView
                id="sortable list"
                statusForRuns={runStatus}
                actionsArray={this.listActions()}
                selectedRuns={aminoSelectedObject}
                onSelectRows={runManagementStore.setSelectedRuns}
                disabledSelection={runStatus === RunStatuses.Rejected}
              >
                {makeApprovalsColumns(this.props.match.params.runStatus, showOrgFilter, labLookup)}
              </CommonRunListView>

            </Card>
            <RejectModal
              onReject={runManagementStore.rejectSelectedRun}
              selectedRuns={numberRunsSelected}
            />
            <ApprovalModal
              run={runForApproval}
              history={this.props.history}
              runApprove={runManagementStore.approveSelectedRuns}
              userId={userId}
              labIds={labIds}
            />
            <CalenderViewModal
              history={this.props.history}
            />
          </div>
        ]}
      </TabLayout>
    );
  }
}
ApprovalsView.contextType = StoresContext;

export default observer(ApprovalsView);
