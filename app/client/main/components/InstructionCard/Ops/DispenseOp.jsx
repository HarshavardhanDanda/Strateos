import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import ResourceActions           from 'main/actions/ResourceActions';
import { ContainerTag, WellTag } from 'main/components/InstructionTags/index';
import Unit                      from 'main/components/unit';
import ContainerType             from 'main/helpers/ContainerType';
import ResourceStore             from 'main/stores/ResourceStore';
import { containerForRef }       from 'main/util/RefUtil';
import * as UnitUtil             from 'main/util/unit';

import {
  Param
} from '@transcriptic/amino';

class DispenseOp extends React.PureComponent {

  static get propTypes() {
    return {
      run: PropTypes.instanceOf(Immutable.Map).isRequired,
      instruction: PropTypes.object.isRequired
    };
  }

  componentWillMount() {
    if (this.resourceId()) {
      const resource = ResourceStore.getById(this.resourceId());

      if (!resource) {
        ResourceActions
          .loadMany([this.resourceId()])
          .done(() => this.forceUpdate());
      }
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
    const op            = this.props.instruction.operation;
    const container     = containerForRef(op.object, this.props.run);
    const containerType = new ContainerType(container.container_type);
    const cols          = containerType.col_count;
    const rows          = containerType.well_count / cols;
    let wellMap         = Immutable.Map();
    const { sequence_no } = this.props.instruction;

    op.columns.forEach((columnInfo) => {
      const col       = parseInt(columnInfo.column, 10);
      const volume    = UnitUtil.toScalar(columnInfo.volume, 'microliter');
      const volumeStr = `${volume}`;

      _.range(rows).forEach((row) => {
        const wellIndex   = containerType.robotFromCoordinates({ x: col, y: row });
        const wellOptions = { hasVolume: true, volume: volumeStr };

        wellMap = wellMap.set(wellIndex, Immutable.fromJS(wellOptions));
      });
    });

    return (
      <div>
        <ul className="params">
          <Param
            label="Object"
            value={(
              <ContainerTag
                refName={op.object}
                run={this.props.run}
                instructionSequenceNo={sequence_no}
                showTimeConstraint
                showTimeConstraintDetail
              />
            )}
          />
          <Choose>
            <When condition={op.resource_id != undefined}>
              <Param
                label="Resource"
                value={<code>{this.resourceName()}</code>}
              />
            </When>
            <When condition={op.reagent != undefined}>
              <Param label="Reagent" value={<code>{op.reagent}</code>} />
            </When>
            <When condition={op.reagent_source != undefined}>
              <Param label="Reagent Source" value={<WellTag refName={op.reagent_source} run={this.props.run} />} />
            </When>
          </Choose>
          <Param
            label="Step Size"
            value={
              <Unit value={op.step_size || '5:microliter'} />
            }
          />
          <If condition={op.x_priming_volume != undefined}>
            <Param
              label="Priming Volume"
              value={
                <Unit value={op.x_priming_volume || '-'} />
              }
            />
          </If>
          <If condition={op.dispense_speed != undefined}>
            <Param
              label="Dispense Speed"
              value={
                <Unit value={op.dispense_speed} />
              }
            />
          </If>
          <If condition={op.nozzle_position != undefined}>
            <Param
              label="Nozzle Position X"
              value={
                <Unit value={op.nozzle_position.position_x || '-'} />
              }
            />
            <Param
              label="Nozzle Position Y"
              value={
                <Unit value={op.nozzle_position.position_y || '-'} />
              }
            />
            <Param
              label="Nozzle Position Z"
              value={
                <Unit value={op.nozzle_position.position_z || '-'} />
              }
            />
          </If>
          <If condition={op.pre_dispense != undefined}>
            <Param
              label="Pre Dispense"
              value={
                <Unit value={op.pre_dispense} />
              }
            />
          </If>
          <Param
            label="Columns"
            value={(
              <ul>
                {_.sortBy(op.columns, c => c.column).map(({ column, volume }) => {
                  return (
                    <li key={column}>
                      <strong>{`${containerType.humanWell(column)}`}</strong>
                      {' ← '}
                      <Unit value={volume} />
                    </li>
                  );
                })}
              </ul>
            )}
          />
        </ul>
      </div>
    );
  }
}

export default DispenseOp;
