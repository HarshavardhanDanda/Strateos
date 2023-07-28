import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Spinner } from '@transcriptic/amino';

import RunCard from 'main/components/RunCard';

import './RunList.scss';

class RunList extends React.Component {
  render() {
    return (
      <div className="run-list">
        <Choose>
          <When condition={this.props.relatedRuns}>
            {this.props.relatedRuns}
          </When>
          <When
            condition={this.props.runs.isEmpty() && !this.props.loadingRuns}
          >
            <p className="caption tx-type--heavy tx-type--secondary">No runs</p>
          </When>
          <Otherwise>
            <div>
              {this.props.runs.map((run) => {
                return (
                  <div className="run-list__item" key={run.get('id')}>
                    <RunCard
                      isTestAccount={this.props.isTestAccount}
                      className="run-list__card-container"
                      run={run}
                      onShowFeedback={this.props.onShowFeedback}
                      projectId={this.props.projectId}
                    />
                  </div>
                );
              })}
              <If condition={this.props.loadingRuns}>
                <Spinner size="small" />
              </If>
            </div>
          </Otherwise>
        </Choose>
      </div>
    );
  }
}

RunList.displayName = 'RunList';

RunList.propTypes = {
  runs: PropTypes.instanceOf(Immutable.Iterable),
  relatedRuns: PropTypes.node,
  loadingRuns: PropTypes.bool.isRequired,
  onShowFeedback: PropTypes.func,
  isTestAccount: PropTypes.bool
};

export default RunList;
