import Immutable from 'immutable';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Spinner, ZeroState } from '@transcriptic/amino';

import ModalActions from 'main/actions/ModalActions';
import RunList from 'main/components/RunList';
import SessionStore from 'main/stores/SessionStore';
import RunListSection from 'main/pages/ProjectPage/RunListSection';
import RunActions from 'main/actions/RunActions';
import RunCard from 'main/components/RunCard';
import { TabLayout } from 'main/components/TabLayout';

import './RelatedRunsView.scss';

const PIXEL_INDENT_CHILD_RUN = 60;
const RUN_CARD_HEIGHT = 146;
const RUN_CARD_MARGIN = 20;

class RelatedRunsView extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      showCanceled: false,
      loadingRuns: true,
      selected: [],
      showSelect: false,
      statusCode: undefined,
      currentFeedbackRunId: undefined,
      relatedRuns: Immutable.fromJS([])
    };
  }

  componentWillMount() {
    const { runId, projectId } = this.props.match.params;
    const options = {
      filters: {
        project_id: projectId
      },
      fields: {
        runs: [
          'created_at', 'accepted_at', 'started_at', 'completed_at', 'test_mode', 'status', 'friendly_status',
          'progress', 'title', 'project_id', 'internal_run', 'owner_id', 'pending_shipment_ids', 'billing_valid?',
          'protocol_id', 'success', 'success_notes', 'reject_reason', 'reject_description', 'successors_deep'
        ]
      },
      limit: 30,
      includes: ['owner']
    };
    const runFetch = RunActions.loadRelatedRuns(runId, options);

    runFetch
      .done(relatedRuns => {
        this.setState({
          loadingRuns: false,
          relatedRuns: Immutable.fromJS([relatedRuns])
        });
      })
      .fail(() =>
        this.setState({
          statusCode: 400
        })
      );
  }

  updateGapCounter(gapCounter, indent) {
    /* Adds count for current run */
    gapCounter[indent] += 1;
    /* Adds count for current run's children */
    if (gapCounter[indent + 1]) {
      gapCounter[indent] += gapCounter[indent + 1];
      delete gapCounter[indent + 1];
    }
  }

  traverseRelatedRunsTree(relatedRuns, selectedRunId) {
    const renderedRelatedRuns = [];
    const gapCounter = {};
    let size = 0;

    const traverseRelatedRunsTreeHelper = (relatedRuns, indent = 0) => {
      gapCounter[indent] = 0;
      for (const relatedRun of relatedRuns) {
        size += 1;
        renderedRelatedRuns.push(
          this.renderRunItem(relatedRun, selectedRunId, indent, gapCounter[indent])
        );
        if (relatedRun.getIn(['data', 'attributes', 'successors_deep'], []).size > 0) {
          traverseRelatedRunsTreeHelper(relatedRun.getIn(['data', 'attributes', 'successors_deep']), indent + 1);
        }
        this.updateGapCounter(gapCounter, indent);
      }
    };

    traverseRelatedRunsTreeHelper(relatedRuns, 0);
    return { renderedRelatedRuns, size };
  }

  renderRelatedRuns(relatedRuns, selectedRunId) {
    return this.traverseRelatedRunsTree(relatedRuns, selectedRunId);
  }

  renderRunItem(run, selectedRunId, indent, gaps) {
    const { runStatus, runView } = this.props.match.params;
    return (
      <div
        className="related-runs-view__item"
        key={run.getIn(['data', 'id'])}
        style={{
          height: RUN_CARD_HEIGHT,
          marginBottom: RUN_CARD_MARGIN,
          marginLeft: indent * PIXEL_INDENT_CHILD_RUN,
          position: 'relative'
        }}
      >
        {this.renderConnector(indent, gaps)}
        <RunCard
          runStatus={runStatus}
          runView={runView}
          isTestAccount={this.props.isTestAccount}
          className={classNames({ 'run-list__card-container': true, 'run-list__highlighted': run.getIn(['data', 'id']) === selectedRunId })}
          run={run.getIn(['data', 'attributes']).setIn(['id'], run.getIn(['data', 'id']))}
          onShowFeedback={this.props.onShowFeedback}
          owner={run.getIn(['included', 0, 'attributes'])}
          isHighlighted={run.getIn(['data', 'id']) === selectedRunId}
          projectId={this.props.match.params.projectId}
        />
      </div>
    );
  }

  renderConnector(indent, gaps) {
    if (indent === 0) return;

    const width = PIXEL_INDENT_CHILD_RUN / 2;
    const height = RUN_CARD_HEIGHT + RUN_CARD_MARGIN;
    const radius = 10;
    const border = 2;

    return (
      <div
        className="related-runs-view__connector"
        style={{
          position: 'absolute',
          bottom: '50%',
          left: -width,
          width: width,
          height: (gaps + 1) * height + radius,
          backgroundColor: 'transparent',
          borderStyle: 'solid',
          borderWidth: `0 0 ${border}px ${border}px`, /* bottom-left */
          borderRadius: `0 0 0 ${radius}px`, /* bottom-left */
          zIndex: -1
        }}
      />
    );
  }

  renderTitle(numberOfRuns) {
    return (
      <span>Related Runs ({ numberOfRuns })</span>
    );
  }

  render() {
    const { projectId, runId } = this.props.match.params;
    const { renderedRelatedRuns, size } = this.renderRelatedRuns(this.state.relatedRuns, runId);

    if (this.state.loadingRuns && this.state.relatedRuns.isEmpty()) {
      return <Spinner />;
    }

    return (
      <TabLayout>
        <div id="related-runs-view" className="related-runs-view">
          { size === 1 ?
            (
              <ZeroState
                zeroStateSvg="/images/projects-illustration.svg"
                subTitle="There are no runs related to this run"
              />
            ) : (
              <RunListSection
                titleNode={this.renderTitle(size)}
                runListNode={(
                  <RunList
                    isTestAccount={SessionStore.isTestAccount()}
                    projectId={projectId}
                    loadingRuns={this.state.loadingRuns}
                    selected={this.state.showSelect && this.state.selected}
                    onToggleRun={this.onToggleRun}
                    onShowFeedback={runId => {
                      this.setState({ currentFeedbackRunId: runId }, () => {
                        ModalActions.open('RunFeedbackModal');
                      });
                    }}
                    relatedRuns={renderedRelatedRuns}
                  />
                )}
              />
            )}
        </div>
      </TabLayout>
    );
  }
}

RelatedRunsView.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.string,
      runId: PropTypes.string,
      viewId: PropTypes.oneOf(['instructions', 'related_runs', 'graph', 'refs', 'data', 'quote', 'support', 'admin']),
      runView: PropTypes.oneOf(['approvals', 'queue']),
      runStatus: PropTypes.oneOf(['all_runs', 'aborted', 'accepted', 'complete', 'in_progress'])
    })
  })
};

export default RelatedRunsView;
