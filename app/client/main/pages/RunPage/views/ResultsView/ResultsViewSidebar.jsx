import Immutable from 'immutable';
import _         from 'lodash';
import Moment    from 'moment';
import PropTypes from 'prop-types';
import React     from 'react';
import shortid from 'shortid';
import { CollapsiblePanel, Styles, Button, Divider } from '@transcriptic/amino';

import Urls from 'main/util/urls';

import SidebarListItem from 'main/components/SidebarList/SidebarListItem';

import './ResultsViewSidebar.scss';

/*
 * Displays sortable list of datasets for a given run.
 */
class ResultsViewSidebar extends React.Component {

  static get propTypes() {
    return {
      runId: PropTypes.string.isRequired,
      projectId: PropTypes.string.isRequired,
      datasets: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      datasetsByRefname: PropTypes.object.isRequired,
      changeSelectedPanel: PropTypes.func,
      analyses: PropTypes.instanceOf(Immutable.List)
    };
  }

  convertDatasetsByRefnameToList(datasetsByRefname) {
    let datasetsList = Immutable.List([]);
    const refNames = Object.keys(datasetsByRefname);
    refNames.forEach(refName => {
      if (datasetsByRefname[refName]) {
        datasetsList = datasetsList.push(datasetsByRefname[refName].set('refname', refName));
      } else {
        datasetsList = datasetsList.push(Immutable.fromJS({ refname: refName, pending: true }));
      }
    });
    return datasetsList;
  }

  /**
   * Sort results by time (DESC) then by alpha-numeric
   * Alpha-numeric default until time generated
   */
  getSortedResultList(results, sortByTime = 'created_at') {
    if (!results || !results.size) {
      return Immutable.List([]);
    }
    return results.sort((resultA, resultB) => {

      if (!resultA.get(sortByTime) || !resultB.get(sortByTime)) {
        if (resultA.get(sortByTime)) {
          return -1;
        } else if (resultB.get(sortByTime)) {
          return 1;
        } else {
          if (resultA.get('refname') > resultB.get('refname')) {
            return 1;
          }
          if (resultA.get('refname') < resultB.get('refname')) {
            return -1;
          }
          if (resultA.get('refname') === resultB.get('refname')) {
            return 0;
          }
        }
      }

      return Moment(resultB.get(sortByTime)).valueOf() - Moment(resultA.get(sortByTime)).valueOf();
    });
  }

  render() {
    const {
      runId,
      projectId,
      datasetsByRefname,
      runView,
      runStatus,
      changeSelectedPanel,
      analyses,
    } = this.props;

    const zipUrl = `/api/runs/${runId}/zip_data`;
    const datasetsList = this.convertDatasetsByRefnameToList(datasetsByRefname);
    const sortedDatasetsList = this.getSortedResultList(datasetsList, 'created_at');
    const sortedAnalysesList = this.getSortedResultList(analyses, 'created_at');

    return (
      <div className="result-view-sidebar">
        <div className="result-view-sidebar__download-button">
          <Button
            to={zipUrl}
            icon="fa fa-download"
            newTab
            tagLink
            link
            type="secondary"
          />
        </div>
        <CollapsiblePanel
          title="Measurements"
          iconColor={Styles.Colors.carbon40}
          className="result-view-sidebar__collapsible-panel"
          wide
          onCollapseChange={collapsed => changeSelectedPanel(collapsed ? '' : 'measurements')}
        >
          {sortedDatasetsList && sortedDatasetsList.map(dataset => {
            const id = (dataset && dataset.get('id')) || shortid.generate();
            return (
              <div key={id} onClick={() => changeSelectedPanel('')}>
                <SidebarListItem
                  url={runView ? Urls.runspage_datum(runId, dataset.get('refname'), runView, runStatus) :
                    Urls.run_datum(projectId, runId, dataset.get('refname'))}
                  name={dataset && dataset.get('refname')}
                  date={dataset && dataset.get('created_at')}
                  id={dataset && dataset.get('id')}
                  isPending={dataset && dataset.get('pending')}
                  key={id}
                />
              </div>
            );
          })}
        </CollapsiblePanel>
        <Divider />
        <CollapsiblePanel
          title="Analyses"
          iconColor={Styles.Colors.carbon40}
          className="result-view-sidebar__collapsible-panel"
          wide
          onCollapseChange={collapsed => changeSelectedPanel(collapsed ? '' : 'analyses')}
        >
          {sortedAnalysesList && sortedAnalysesList.map((datum) => {
            const datumId = datum.get('id');
            return (
              <div key={datumId} onClick={() => changeSelectedPanel('')}>
                <SidebarListItem
                  url={runView ? Urls.runspage_analysis_datum(runId, datumId, runView, runStatus) :
                    Urls.run_analysis_datum(projectId, runId, datumId)}
                  name={datum.get('title') || datumId}
                  date={datum.get('created_at')}
                  id={datumId}
                  key={datumId || shortid.generate()}
                />
              </div>
            );
          })}
        </CollapsiblePanel>
        <Divider />
      </div>
    );
  }
}

export default ResultsViewSidebar;
