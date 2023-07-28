import Immutable from 'immutable';
import _         from 'lodash';
import Moment    from 'moment';
import PropTypes from 'prop-types';
import React     from 'react';

import RunList      from 'main/components/RunList';
import RunAPI       from 'main/api/RunAPI';
import ProjectStore from 'main/stores/ProjectStore';
import RunStore     from 'main/stores/RunStore';
import UserStore    from 'main/stores/UserStore';
import SessionStore from 'main/stores/SessionStore';

class RelatedRuns extends React.Component {

  static get propTypes() {
    return {
      containerId: PropTypes.string.isRequired
    };
  }

  constructor() {
    super();

    this.state = {
      relatedRunIds: Immutable.List(),
      loadingRuns: true
    };
  }

  componentWillMount() {
    return this.fetchRuns();
  }

  fetchRuns() {
    const request = {
      filters: {
        container: this.props.containerId
      },
      includes: ['owner', 'project'],
      fields: {
        runs: [
          'created_at', 'status', 'progress', 'pending_shipment_ids',
          'billing_valid?', 'title', 'project_id', 'owner_id'
        ],
        projects: ['name'],
        users: ['name']
      }
    };

    RunAPI.index(request)
      .done((payload) => {
        const ids = payload.data.map(entity => entity.id);

        this.setState({
          relatedRunIds: Immutable.fromJS(ids),
          loadingRuns: false
        });
      });
  }

  runs() {
    // Denormalize fetched data into the format the RunList expects
    // TODO: how can we handle this generically?  Should be denormalize?
    let runs = RunStore.getByIds(this.state.relatedRunIds);

    runs = runs.map((run) => {
      const project = ProjectStore.getById(run.get('project_id'));
      const owner   = UserStore.getById(run.get('owner_id'));

      return run.set('project', project)
        .set('owner', owner);
    });

    return runs.sortBy(run => -Moment(run.get('created_at')));
  }

  render() {
    return (
      <RunList
        runs={this.runs()}
        loadingRuns={this.state.loadingRuns}
        isTestAccount={SessionStore.isTestAccount()}
      />
    );
  }
}

export default RelatedRuns;
