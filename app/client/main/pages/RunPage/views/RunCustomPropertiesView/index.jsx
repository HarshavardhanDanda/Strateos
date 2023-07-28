import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import RunStore from 'main/stores/RunStore';
import { PageLoading } from '@transcriptic/amino';
import { TabLayout }       from 'main/components/TabLayout';
import RunCustomProperties from 'main/pages/RunPage/components/RunCustomProperties';

const matchPropTypes = PropTypes.shape({
  params: PropTypes.shape({
    runId: PropTypes.string.isRequired,
    projectId: PropTypes.string.isRequired
  }).isRequired
}).isRequired;

class RunCustomPropertiesView extends React.PureComponent {
  static get propTypes() {
    return {
      match: matchPropTypes,
      projectId: PropTypes.string.isRequired,
      run: PropTypes.instanceOf(Immutable.Map),
      customInputsConfig: PropTypes.object,
      customProperties: PropTypes.object
    };
  }

  render() {
    const { run, customInputsConfig, runId, customProperties } = this.props;
    const customPropertiesToMap = customProperties && customProperties.reduce((map, customProperty) => {
      map[customProperty.key] = customProperty.value;
      return map;
    }, {});

    return (
      run ?
        (
          <TabLayout>
            <div className="tx-timeline">
              <RunCustomProperties
                runId={runId}
                customProperties={customPropertiesToMap}
                editable
                customInputsConfig={customInputsConfig}
              />
            </div>
          </TabLayout>
        )
        : <PageLoading />
    );
  }
}

const getStateFromStores = (props) => {
  const runId = props.match.params.runId;
  const run = RunStore.getById(runId);
  const projectId = props.match.params.projectId || (run && run.get('project_id'));
  const customProperties = run && run.get('contextual_custom_properties').toJS();

  return {
    run,
    projectId,
    runId,
    customProperties
  };
};

const ConnectedRunCustomPropertiesView = ConnectToStores(RunCustomPropertiesView, getStateFromStores);

ConnectedRunCustomPropertiesView.propTypes = { match: matchPropTypes };

export default ConnectedRunCustomPropertiesView;
