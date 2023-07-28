import _ from 'lodash';
import ajax from 'main/util/ajax';
import BatchAPI from 'main/api/BatchAPI';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';
import NotificationActions from 'main/actions/NotificationActions';

const BatchRunsActions = {
  fetchBatchRelatedRuns(batchId, sortKey, sortDirection, limit, offset) {
    const sortBy = sortDirection === 'desc' ? [`-${sortKey}`] : [sortKey];
    const options = {
      limit: limit,
      offset: offset,
      sortBy,
      version: 'v1',
      includes: ['owner'],
      fields: { runs: ['status,completed_at,title,project_id,success_notes,owner_id,organization_id'] }
    };
    const url = BatchAPI.createUrl(`/${batchId}/runs`, options);
    return ajax.get(url)
      .done(runs => JsonAPIIngestor.ingest(runs))
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default BatchRunsActions;
