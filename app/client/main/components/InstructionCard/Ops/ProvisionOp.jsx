import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import ResourceActions from 'main/actions/ResourceActions';
import { WellTag }     from 'main/components/InstructionTags/index';
import Unit            from 'main/components/unit';
import ResourceStore   from 'main/stores/ResourceStore';
import { countDecimals } from 'main/util/Numbers';
import { toScalar } from 'main/util/unit';

import { Param } from '@transcriptic/amino';

class ProvisionOp extends React.PureComponent {

  static get propTypes() {
    return {
      run:         PropTypes.instanceOf(Immutable.Map).isRequired,
      instruction: PropTypes.object.isRequired
    };
  }

  componentWillMount() {
    const resource = ResourceStore.getById(this.resourceId());

    if (!resource) {
      // call forceUpdate instead of using ConnectToStores as we can have LOTS of insts.
      ResourceActions
        .loadMany([this.resourceId()])
        .done(() => this.forceUpdate());
    }
  }

  resourceId() {
    return this.props.instruction.operation.resource_id;
  }

  resourceName() {
    const resource = ResourceStore.getById(this.resourceId());
    if (resource) {
      return resource.get('name');
    } else {
      return this.resourceId();
    }
  }

  render() {
    const op = this.props.instruction.operation;
    return (
      <ul className="params">
        <Param label="Resource" value={this.resourceName()} />
        <Param
          label="To"
          value={(
            <ul className="params">
              {op.to.map((t, i) => {
                function measurementWithUnit() {
                  function volumeWithUnit() {
                    // if the milliliter measurement has 0 decimals use it, otherwise use microliters
                    const volume_ml = toScalar(t.volume, 'milliliter');
                    return (countDecimals(volume_ml) === 0) ?
                      `${volume_ml}:milliliter` :
                      `${toScalar(t.volume, 'microliter')}:microliter`;
                  }
                  function massWithUnit() {
                    const mass_gram = toScalar(t.mass, 'gram');
                    return (countDecimals(mass_gram) === 0) ?
                      `${mass_gram}:gram` :
                      `${toScalar(t.mass, 'milligram')}:milligram`;
                  }
                  switch (op.measurement_mode) {
                    case 'mass':
                      return massWithUnit();
                    case 'volume':
                      return volumeWithUnit();
                    case undefined:
                      // for backwards compatibility, i.e. if `measurement_mode` not specified, try to render volume
                      return volumeWithUnit();
                    default:
                      // give up explicitly
                      return 'Unsupported Measurement Mode';
                  }
                }
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <li key={i}>
                    <WellTag refName={t.well} run={this.props.run} />
                    <span className="measurement-label">
                      <Unit value={measurementWithUnit()} />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        />
      </ul>
    );
  }
}

export default ProvisionOp;
