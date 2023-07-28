import * as Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';
import { Section, Table, Column, Card } from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';

import ShipmentAPI from 'main/api/ShipmentAPI';
import ImplementationShipmentCreator from 'main/pages/ShipsPage/ImplementationShipmentCreator';
import ModalActions from 'main/actions/ModalActions';
import { ShipmentStore } from 'main/stores/ShipmentStore';
import ShipmentCheckinStore from 'main/stores/ShipmentCheckinStore';
import ImplementationCheckinModal from 'main/models/ImplementationCheckinModal/ImplementationCheckinModal';
import ConnectToStoresHOC from 'main/containers/ConnectToStoresHOC';
import BaseTableTypes from 'main/components/BaseTableTypes';
import SessionStore from 'main/stores/SessionStore';
import LabAPI from 'main/api/LabAPI';
import LabStore from 'main/stores/LabStore';
import ShipmentCheckinActions from 'main/actions/ShipmentCheckinActions';
import FeatureStore from 'main/stores/FeatureStore';

// A table of implementation shipments, used in this view to show all created shipments
function ImplementationShipmentsTable(props) {
  const shipments = props.shipments
    .map(s => ({
      id: s.id(),
      label: s.label(),
      name: s.name(),
      createdAt: s.createdAt(),
      note: s.note && s.note(),
      checkedInAt: s.checkedInAt(),
      labId: s.labId()
    }))
    .toJS();

  const renderLabel = (shipment) => {
    return shipment.get('label');
  };

  const renderName = (shipment) => {
    return shipment.get('name');
  };

  const renderCreatedAt = (shipment) => {
    return <BaseTableTypes.Time data={shipment.get('createdAt')} />;
  };

  const renderNote = (shipment) => {
    return shipment.get('note') || '-';
  };

  const renderCheckedInAt = (shipment) => {
    return <BaseTableTypes.Time data={shipment.get('checkedInAt')} />;
  };

  const renderShipmentLab = (shipment) => {
    const labId = shipment.get('labId');
    const labName = labId && LabStore.getById(labId) ? LabStore.getById(labId).get('name') : '-';
    return labName;
  };

  const onRowClick = (shipment) => {
    return props.onRowClick(shipment.get('id'));
  };

  return (
    <Card>
      <Table
        loaded
        disabledSelection
        data={Immutable.fromJS(shipments)}
        onRowClick={onRowClick}
        id="ImplementationShipmentsTable"
      >
        <Column renderCellContent={renderLabel} header="label" id="1" />
        <Column renderCellContent={renderName} header="name" id="2" />
        <Column renderCellContent={renderCreatedAt} header="created at" id="3" />
        <Column renderCellContent={renderNote} header="note" id="4" />
        <Column renderCellContent={renderCheckedInAt} header="checked in at" id="5" />
        <Column renderCellContent={renderShipmentLab} header="Lab" id="6" />
      </Table>
    </Card>
  );
}

ImplementationShipmentsTable.propTypes = {
  shipments: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  onRowClick: PropTypes.func.isRequired
};

class ImplementationShipmentsPane extends React.Component {
  static get propTypes() {
    return {
      shipments: PropTypes.instanceOf(Immutable.Iterable)
    };
  }

  // INPUT: the shipment for the table row that was selected
  // RESULT: Shipment is marked as selected in the ShipmentCheckin Store,
  // shipment is set as selectedShipment in state,
  // Modal for checking in selected shipment is popped open
  static onRowClick(shipmentId) {
    ShipmentCheckinActions.selectShipment(shipmentId);
    ModalActions.open('ImplementationCheckinModal');
  }

  static getDefaultState() {
    return {
      package: {
        title:  '',
        note:  '',
        receiving_note:  '',
        ps_attachment_url: undefined,
        psFile: undefined,
        force_validate: false,
        lab_id: undefined
      }
    };
  }

  constructor(props) {
    super(props);

    _.bindAll(
      this,
      'updatePackage',
      'onSave'
    );

    this.state = ImplementationShipmentsPane.getDefaultState();
  }

  componentDidMount() {
    LabAPI.index({
      filters: {
        operated_by_id: SessionStore.getOrg().get('id')
      }
    });
    ShipmentStore._empty();
    return ShipmentAPI.loadImplementation().then(response => {
      if (response.data.length > 0) {
        return this.setState({
          loading: false
        });
      }
    });
  }

  updatePackage(key, value) {
    this.setState((state) => { return { package: _.set(state.package, key, value) }; });
  }

  onSave() {
    this.setState(ImplementationShipmentsPane.getDefaultState());
  }

  // Render the shipments table, or if no shipments are loaded, text indicating there are none
  // TO DO - this should become Scott's ZeroState component
  renderShipments() {
    return !this.props.shipments.size
      ? <div>No Shipments</div>
      : (
        <ImplementationShipmentsTable
          shipments={this.props.shipments}
          onRowClick={ImplementationShipmentsPane.onRowClick}
        />
      );
  }

  render() {
    return (
      <div>
        <div className="col-sm-12 col-md-10 col-md-offset-1">
          <ImplementationShipmentCreator
            labs={this.props.labs}
            onSave={this.onSave}
            package={this.state.package}
            updatePackage={this.updatePackage}
          />
        </div>
        <div className="col-sm-12">
          <Section title="Implementation Shipments">
            {this.renderShipments()}
          </Section>
          <ImplementationCheckinModal
            labs={this.props.labs}
            modalId={'ImplementationCheckinModal'}
            shipment={ShipmentCheckinStore.selectedShipment()}
            checkingIn={false}
            modalTitle={'Implementation Shipment Details'}
          />
        </div>
      </div>
    );
  }
}

const getStateFromStores = () => {
  const implementationShipmentLabs = FeatureStore.getLabIdsWithFeatures(
    FeatureConstants.MANAGE_IMPLEMENTATION_SHIPMENTS
  ).toJS();

  const labs = LabStore.getByIds(implementationShipmentLabs).map((lab) => {
    return {
      name: lab.get('name'),
      value: lab.get('id')
    };
  });

  return {
    labs,
    shipments: ShipmentStore.implementationShipments()
  };
};

export default ConnectToStoresHOC(
  ImplementationShipmentsPane,
  getStateFromStores
);
