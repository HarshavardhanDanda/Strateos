import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { Card, CollapsiblePanel, Column, Icon, Table } from '@transcriptic/amino';
import ConnectToStoresHOC   from 'main/containers/ConnectToStoresHOC';
import AliquotStore         from 'main/stores/AliquotStore';
import ProvisionSpecStore   from 'main/stores/ProvisionSpecStore';
import ResourceStore        from 'main/stores/ResourceStore';
import { getScalarInDefaultUnits, appendDefaultShortUnits } from 'main/util/MeasurementUtil';

import './ProvisionPanel.scss';

class ProvisionPanel extends React.Component {
  static get propTypes() {
    return {
      provisionInstructions: PropTypes.instanceOf(Immutable.List).isRequired,
      resources: PropTypes.instanceOf(Immutable.List).isRequired,
      initiallyCollapsed: PropTypes.bool
    };
  }

  getMeasurementMode(inst) {
    return inst.getIn(['operation', 'measurement_mode'], 'volume');
  }

  // {resourceId: { totalQuantity, remainingQuantity }}
  calculateQuantityData() {
    const data = {};

    this.props.provisionInstructions.forEach((inst) => {
      const resourceId = inst.getIn(['operation', 'resource_id']);
      const datum      = data[resourceId] || { totalQuantity: 0, remainingQuantity: 0 };

      const instQuantity = inst.getIn(['operation', 'to']).reduce((sum, t) => {
        return sum + getScalarInDefaultUnits(t, this.getMeasurementMode(inst));
      }, 0);

      datum.totalQuantity += instQuantity;
      datum.measurementMode = this.getMeasurementMode(inst);

      if (!inst.get('completed_at')) {
        datum.remainingQuantity += instQuantity;
      }

      data[resourceId] = datum;
    });

    return data;
  }

  // {resourceId: [LotA, LotB]}
  calculateLotNumbersUsed() {
    const data = {};

    this.props.provisionInstructions.forEach((inst) => {
      const provisionSpec = ProvisionSpecStore.findByInstruction(inst.get('id'));

      if (!provisionSpec) {
        return;
      }

      const resourceId = inst.getIn(['operation', 'resource_id']);

      provisionSpec.get('transfers').forEach((t) => {
        const containerId = t.get('from');
        const wellIndex   = t.get('from_well_idx');
        const aliquot     = AliquotStore.getByContainerAndWellIdx(containerId, wellIndex);

        if (aliquot && aliquot.get('lot_no')) {
          const lotNumbers = data[resourceId] || [];
          lotNumbers.push(aliquot.get('lot_no'));
          data[resourceId] = lotNumbers;
        }
      });
    });

    // unique lot numbers
    return _.mapValues(data, lotNumbers => _.uniq(lotNumbers));
  }

  calculateTableData() {
    const quantityData   = this.calculateQuantityData();
    const lotNumbersData = this.calculateLotNumbersUsed();

    return this.props.resources.map((resource) => {
      const resourceId   = resource.get('id');
      const resourceName = resource ? resource.get('name') : resourceId;

      return Immutable.fromJS({
        id: resourceId,
        resourceName,
        totalQuantity: quantityData[resourceId] ? quantityData[resourceId].totalQuantity : 0,
        remainingQuantity: quantityData[resourceId] ? quantityData[resourceId].remainingQuantity : 0,
        lotNumbers: lotNumbersData[resourceId] ? lotNumbersData[resourceId] : [],
        measurementMode: quantityData[resourceId] ? quantityData[resourceId].measurementMode : 'volume'
      });
    });
  }

  render() {
    return (
      <Card className="provision-panel">
        <CollapsiblePanel title="Provision" initiallyCollapsed={this.props.initiallyCollapsed} hasUppercaseHeading>
          <Table
            id="provision-panel-table"
            data={this.calculateTableData()}
            loaded
            disableBorder
            disabledSelection
          >
            <Column
              id="name"
              key="name"
              header="Resource Name"
              renderCellContent={(datum) => {
                const noRemainingQuantity = datum.get('remainingQuantity') === 0;
                return (
                  <div className="provision-panel__name">
                    <Icon
                      icon={noRemainingQuantity ? 'fa fa-fw fa-check' : 'fa fa-fw'}
                      type={noRemainingQuantity ? 'success' : 'light'}
                    />
                    {datum.get('resourceName')}
                  </div>
                );
              }}
            />
            <Column
              id="id"
              key="id"
              header="Resource Id"
              renderCellContent={(datum) => datum.get('id')}
            />
            <Column
              id="total"
              key="total"
              header="Total Quantity"
              renderCellContent={(datum) => {
                const totalQuantity = datum.get('totalQuantity');
                const measurementMode = datum.get('measurementMode');
                return appendDefaultShortUnits(totalQuantity, measurementMode);
              }}
            />
            <Column
              id="remaining"
              key="remaining"
              header="Remaining Quantity"
              renderCellContent={(datum) => {
                const remainingQuantity = datum.get('remainingQuantity');
                const measurementMode = datum.get('measurementMode');
                return appendDefaultShortUnits(remainingQuantity, measurementMode);
              }}
            />
            <Column
              id="lot-numbers-used"
              key="lot-numbers-used"
              header="Lot Numbers Used"
              renderCellContent={(datum) => (
                datum.get('lotNumbers').size ? datum.get('lotNumbers').join(', ') : '-'
              )}
            />
          </Table>
        </CollapsiblePanel>
      </Card>
    );
  }
}

const getStateFromStores = (props) => {
  const resourceIds = props.provisionInstructions.map(inst => inst.getIn(['operation', 'resource_id'])).toJS();

  return {
    resources: Immutable.List(ResourceStore.getByIds(_.uniq(resourceIds)))
  };
};

const ConnectedProvisionPanel = ConnectToStoresHOC(ProvisionPanel, getStateFromStores);

ConnectedProvisionPanel.propTypes = {
  provisionInstructions: PropTypes.instanceOf(Immutable.List).isRequired,
  initiallyCollapsed: PropTypes.bool
};

export default ConnectedProvisionPanel;
