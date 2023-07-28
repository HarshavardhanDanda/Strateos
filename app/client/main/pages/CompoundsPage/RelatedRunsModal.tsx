import Immutable from 'immutable';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { Column, Table, Spinner, StatusPill, TextBody } from '@transcriptic/amino';
import { SinglePaneModal } from 'main/components/Modal';
import Urls from 'main/util/urls';
import ModalStore from 'main/stores/ModalStore';
import UserStore from 'main/stores/UserStore';
import SessionStore from 'main/stores/SessionStore';
import UserProfile from 'main/components/UserProfile';
import BatchRunsActions from 'main/pages/CompoundsPage/BatchRunsActions';

import './RelatedRunsModal.scss';

function RelatedRunsModal(props) {

  const [dataLoading, setDataLoading] = useState(false);
  const [recordCount, setRecordCount] = useState(0);
  const [relatedRunsTableData, setRelatedRunsTableData] = useState([]);
  const [sortKey, setSortKey] = useState('completed_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [initialDataLoading, setInitialDataLoading] = useState(true);

  const { modalId, batchId } = props;

  useEffect(() => {
    const modalObject = ModalStore.getById(props.modalId);
    modalObject && modalObject.get('open') && fetch();
  }, [sortKey, sortDirection]);

  const fetch = (isFirstCall = true) => {
    const limit = 12;
    const offset = isFirstCall ? 0 : relatedRunsTableData.length;

    BatchRunsActions.fetchBatchRelatedRuns(batchId, sortKey, sortDirection, limit, offset)
      .done((response) => {
        const data = response && response.data.map((run) => ({ id: run.id, ...run.attributes }));
        if (isFirstCall) {
          setRelatedRunsTableData(data);
          setRecordCount(response.meta.record_count);
          setInitialDataLoading(false);
        } else {
          setRelatedRunsTableData(prevState => prevState.concat(data));
          setDataLoading(false);
        }
      }).fail(() => {
        setInitialDataLoading(false);
        setDataLoading(false);
      });
  };

  const getUrl = (run, path) => {
    const projectId = run.get('project_id');
    const runId = run.get('id');
    let url = '';
    if (SessionStore.getOrg() && (SessionStore.getOrg().get('id') === run.get('organization_id'))) {
      url = path === 'instructions' ? Urls.run_instructions(projectId, runId) : Urls.run_data(projectId, runId);
    } else {
      const runStatus = run.get('status');
      const runView = (runStatus === 'pending' || runStatus === 'rejected') ? 'approvals' : 'queue';
      url = path === 'instructions' ? Urls.runspage_instructions(runId, runView, runStatus) : Urls.runspage_data(runId, runView, runStatus);
    }
    return url;
  };

  const renderName = (run) => {
    const url = getUrl(run, 'instructions');
    let runName = run.get('title');
    if (_.isNull(runName)) {
      runName = run.get('id');
    }
    return <a href={url}>{runName}</a>;
  };

  const renderResults = (run) => {
    const url = getUrl(run, 'data');
    return (
      <a href={url}>
        View Results
      </a>
    );
  };

  const renderRunComments = (run) => {
    return run.get('success_notes') ? run.get('success_notes') : '-';
  };

  const renderCreator = (run) => {
    const user = UserStore.getById(run.get('owner_id'));
    return (user ?  <UserProfile user={user}  /> : '-');
  };

  const renderStatusPill = (runStatus) => {
    const statusText = {
      accepted: 'Accepted',
      in_progress: 'In Progress',
      aborted: 'Aborted',
      complete: 'Completed',
      canceled: 'Canceled',
      pending: 'Pending',
      rejected: 'Rejected',
      awaiting: 'Awaiting'
    };

    const statusType = {
      accepted: 'action',
      in_progress: 'action',
      aborted: 'danger',
      complete: 'success',
      canceled: 'danger',
      rejected: 'danger',
      pending: 'warning',
      awaiting: 'warning',
    };

    const renderStatus = (
      <StatusPill
        type={statusType[runStatus] || 'light'}
        shape="tag"
        text={statusText[runStatus] || 'Unknown'}
      />
    );
    return renderStatus;
  };

  const renderStatus = (run) => {
    const status = run.get('status');
    return status ? renderStatusPill(status) : '-';
  };

  const fetchDataOnScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    return scrollTop + clientHeight >= scrollHeight;
  };

  const onScroll = (event) => {
    if (!dataLoading && recordCount !== relatedRunsTableData.length) {
      const fetchData = fetchDataOnScroll(event);
      if (fetchData) {
        setDataLoading(true);
        !initialDataLoading && fetch(false);
      }
    }
  };

  const onSortChange = (sortKey, sortDirection) => {
    setSortKey(sortKey);
    setSortDirection(sortDirection);
  };

  return (
    <SinglePaneModal
      modalId={modalId}
      modalSize="large"
      title="Related Runs"
      onOpen={() => fetch()}
    >
      <TextBody color="secondary" formatText>
        Displaying Runs related to batch {batchId}
      </TextBody>
      <div className="related-runs-modal__table" onScroll={onScroll}>
        <Table
          popoverOnHeader
          loaded={!initialDataLoading}
          disabledSelection
          id="related-runs"
          data={Immutable.fromJS(relatedRunsTableData)}
        >
          <Column
            renderCellContent={renderName}
            header="Run Name"
            id="run-name-column"
          />
          <Column
            renderCellContent={(run) => run.get('id')}
            header="Run ID"
            id="id-column"
            disableFormatHeader
          />
          <Column
            renderCellContent={renderStatus}
            header="Status"
            id="status-column"
          />
          <Column
            renderCellContent={(run) => (run.get('completed_at') ? run.get('completed_at') : '-')}
            header="Completed"
            id="completed_at"
            sortable
            onSortChange={onSortChange}
          />
          <Column
            renderCellContent={renderResults}
            header="Results"
            id="results-column"
          />
          <Column
            renderCellContent={renderRunComments}
            header="Run Comments"
            id="comments-column"
            popOver
          />
          <Column
            renderCellContent={renderCreator}
            header="Creator"
            id="creator-column"
          />
        </Table>
        { dataLoading && <Spinner /> }
      </div>
    </SinglePaneModal>
  );
}

export default RelatedRunsModal;
