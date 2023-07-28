import React from 'react';
import { observer } from 'mobx-react';
import { List } from '@transcriptic/amino';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import StoresContext from 'main/stores/mobx/StoresContext';
import { RunsViewType } from 'main/stores/mobx/RunManagementStore';
import { RunStatuses } from 'main/stores/mobx/RunFilterStore';
import { Column } from 'main/pages/RunsPage/views/TableColumns';
import { PAGE_SIZE_OPTIONS } from 'main/util/List';

class CommonRunListView extends React.Component {

  componentDidUpdate(prevProps) {
    const { statusForRuns } = this.props;
    if (statusForRuns !== prevProps.statusForRuns) {
      this.updateRoute(statusForRuns);
    }
  }

  updateRoute = (runStatusRoute) => {
    this.context.runFilterStore.updateRunStatus(runStatusRoute);
  };

  getDefaultColumnKeys = (runStatus, viewType) => {
    const DEFAULT_COLUMNS = [Column.Name, Column.Protocol, Column.Id, Column.Status, Column.Org, Column.Operator];

    if (viewType === RunsViewType.RunTransferModal) {
      return [...DEFAULT_COLUMNS, Column.Submitted, Column.Submitter];
    }

    switch (runStatus) {
      case RunStatuses.AllRuns:
        return [...DEFAULT_COLUMNS, Column.Submitted];
      case RunStatuses.Accepted:
        return [...DEFAULT_COLUMNS, Column.ScheduledStart, Column.AcceptedAt];
      case RunStatuses.InProgress:
        return [...DEFAULT_COLUMNS, Column.Started];
      case RunStatuses.Complete:
        return [...DEFAULT_COLUMNS, Column.Completed];
      case RunStatuses.Aborted:
        return [...DEFAULT_COLUMNS, Column.Aborted];
      case RunStatuses.Pending:
        return [Column.Name, Column.Id, Column.Status, Column.Org, Column.Submitted, Column.RequestedDate];
      case RunStatuses.Rejected:
        return [Column.Name, Column.Id, Column.Org, Column.Rejected, Column.Submitted, Column.Reason];
      case RunStatuses.Canceled:
        return [Column.Name, Column.Protocol, Column.Id, Column.Status, Column.Org, Column.Canceled, Column.CanceledReason];
      default:
        return [...DEFAULT_COLUMNS];
    }
  };

  render() {
    const {
      actionsArray,
      selectedRuns,
      children,
      noColumnFilter,
      statusForRuns
    } = this.props;
    const { runFilterStore, runManagementStore } = this.context;
    const {
      loadingRuns,
      maxPage,
      runs,
      currentViewType,
    } = runManagementStore;
    const {
      page,
      pageSize,
    } = runFilterStore;
    const isRunTransferModalView = (currentViewType !== RunsViewType.RunTransferModal);
    const immutableRuns = Immutable.fromJS(runs);
    const id = `${KeyRegistry.COMMON_RUNS_TABLE}_${(isRunTransferModalView) ? statusForRuns : 'run-transfer'}`;
    const persistKeyInfo = UserPreference.packInfo(id);

    return (
      <List
        id={id}
        loaded={!loadingRuns}
        data={immutableRuns}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        pageSize={pageSize || 0}
        onPageChange={runFilterStore.updatePageSettings}
        maxPage={maxPage}
        currentPage={page}
        onSelectRow={(a, b, selectedIdsObject) => runManagementStore.setSelectedRuns(selectedIdsObject)}
        onSelectAll={runManagementStore.setSelectedRuns}
        selected={selectedRuns}
        currentPageData={runs}
        actions={actionsArray}
        visibleColumns={this.getDefaultColumnKeys(statusForRuns, currentViewType)}
        persistKeyInfo={persistKeyInfo}
        showPagination
        popoverOnHeader
        disableCard
        disabledSelection={this.props.statusForRuns === 'rejected'}
        showColumnFilter={!noColumnFilter}
      >
        {React.Children.map(children, (child) => {
          return child.props.sortable ?
            React.cloneElement(child, {
              onSortChange: runFilterStore.updateSort
            })
            : child;
        })}
      </List>
    );
  }
}
CommonRunListView.contextType = StoresContext;

CommonRunListView.propTypes = {
  initialState: PropTypes.instanceOf(Object),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  id: PropTypes.string,
  actionsArray: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string,
    text: PropTypes.string,
    icon: PropTypes.string,
    type: PropTypes.string,
    action: PropTypes.func.isRequired
  })),
  statusForRuns: PropTypes.string,
  selectedRuns: PropTypes.object,
  noColumnFilter: PropTypes.bool
};

export default observer(CommonRunListView);
