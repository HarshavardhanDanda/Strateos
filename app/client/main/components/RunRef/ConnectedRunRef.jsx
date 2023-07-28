import Immutable from 'immutable';
import PropTypes from 'prop-types';

import connectToStores from 'main/containers/ConnectToStoresHOC';
import ContainerStore from 'main/stores/ContainerStore';
import AliquotStore from 'main/stores/AliquotStore';
import { ShipmentStore } from 'main/stores/ShipmentStore';

import RunRef from './RunRef';

const getStateFromStores = ({ runRef }) => {
  const container = ContainerStore.getById(runRef.get('container_id'));
  const containerType = runRef.get('container_type');
  const aliquots = AliquotStore.getByContainer(
    container != undefined ? container.get('id') : undefined
  );
  const shipment = ShipmentStore.getById(
    container != undefined ? container.get('shipment_id') : undefined
  );
  const resource = runRef.getIn(['orderable_material_component', 'resource']);

  return {
    container,
    containerType,
    aliquots,
    shipment,
    resource
  };
};

const ConnectedRunRef = connectToStores(RunRef, getStateFromStores);

ConnectedRunRef.propTypes = {
  runRef: PropTypes.instanceOf(Immutable.Map),
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  showAppearsIn: PropTypes.bool,
  fetchingContainer: PropTypes.bool
};

export default ConnectedRunRef;
