import _         from 'lodash';
import Moment    from 'moment';
import PropTypes from 'prop-types';
import React     from 'react';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import RunList      from 'main/components/RunList';
import RunStore     from 'main/stores/RunStore';
import SessionStore from 'main/stores/SessionStore';

class RelatedRuns extends React.Component {

  static get propTypes() {
    return {
      loadingRuns: PropTypes.bool,
      runs: PropTypes.object
    };
  }

  render() {
    return (
      <RunList
        runs={this.props.runs}
        loadingRuns={this.props.loadingRuns}
        isTestAccount={SessionStore.isTestAccount()}
      />
    );
  }
}

const getStateFromStores = ({ protocolId }) => {
  let runs = RunStore.getAll().filter((r) => {
    return r.get('protocol_id') == protocolId;
  });

  runs = runs.sortBy(run => -Moment(run.get('created_at')));
  return { runs };
};

const Connected = ConnectToStores(RelatedRuns, getStateFromStores);

Connected.propTypes = {
  protocolId: PropTypes.string
};

export default Connected;
