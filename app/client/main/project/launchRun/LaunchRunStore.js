import Immutable from 'immutable';
import _         from 'lodash';
import Moment    from 'moment';

import Dispatcher     from 'main/dispatcher';
import rootNode       from 'main/state/rootNode';
import ContainerStore from 'main/stores/ContainerStore';
import Manifest       from 'main/util/Manifest';
import Urls           from 'main/util/urls';

const dataNode = rootNode.sub('launch_run_store');

const LaunchRunStore = {
  error:          dataNode.sub('error', undefined),
  protocolInputs: dataNode.sub('protocolInputs', Immutable.Map()),
  runUrl:         dataNode.sub('runUrl', undefined), // url of the successfully submitted run
  submitted:      dataNode.sub('submitted', false),
  submitting:     dataNode.sub('submitting', false),
  contextualCustomInputs: dataNode.sub('contextualCustomInputs', Immutable.Map()),
  csvUploads: dataNode.sub('csvUploads', Immutable.Map()),
  fromRunSubtab: dataNode.sub('fromRunSubtab', undefined),
  // Shipping page
  // Inputs are stored as {value, errors, edited} format
  shippingMethod: dataNode.sub('shippingMethod', 'shipping'),

  shipment: dataNode.sub('shipment'),
  navigationIndex: dataNode.sub('navigation_index'),

  reset() {
    this.navigationIndex.set(0);
    this.error.set(undefined);
    this.protocolInputs.set(Immutable.Map());
    this.runUrl.set(undefined);
    this.submitted.set(false);
    this.submitting.set(false);
    this.shippingMethod.set('shipping');
    this.shipment.set(undefined);
    this.contextualCustomInputs.set(Immutable.Map());
    this.fromRunSubtab.set(undefined);
  },

  act(action) {
    switch (action.type) {
      case 'SEQUENTIAL_STEP_NEXT_BUTTON_CLICKED':
        dataNode.set(action.index);
        break;
      case 'LAUNCH_RUN_CLICKED_TAB_INDEX':
        this.navigationIndex.set(action.index);
        break;
      case 'LAUNCH_RUN_ERROR':
        this.error.set(action.text);
        break;
      case 'LAUNCH_RUN_PROTOCOL_INPUTS':
        this.protocolInputs.set(Immutable.fromJS(action.inputs));
        break;
      case 'LAUNCH_RUN_CONTEXTUAL_CUSTOM_INPUTS':
        this.contextualCustomInputs.set(Immutable.fromJS(action.inputs));
        break;
      case 'LAUNCH_RUN_CSV_UPLOAD':
        this.csvUploads.set(Immutable.fromJS(action.inputs));
        break;
      case 'LAUNCH_RUN_SHIPPING_METHOD_CHANGE':
        this.shippingMethod.set(action.shippingMethod);
        break;
      case 'LAUNCH_RUN_SHIPMENT_DATA':
        this.shipment.set(Immutable.fromJS(action.shipment));
        break;
      case 'LAUNCH_RUN_SUBMITTING_RUN':
        this.submitting.set(true);
        break;
      case 'RUN_SUCCESSFULLY_SUBMITTED': {
        const url = this.fromRunSubtab.get() ? Urls.runspage_details(action.data.id, this.fromRunSubtab.get(), action.data.status) : Urls.run(action.data.project.id, action.data.id);
        this.runUrl.set(url);
        this.submitted.set(true);
        this.submitting.set(false);
        break;
      }
      case 'RUN_SUBMISSION_FAILED':
        this.submitting.set(false);
        break;
      default:
        break;
    }
  },

  setFromRunSubtab(fromRunSubtab) {
    this.fromRunSubtab.set(fromRunSubtab);
  },

  // we want to re calculate the plate layout whenever theres a change in input data
  // call this instead of directly setting protocolInputs
  setNewJSInputs(inputs) {
    return this.protocolInputs.set(Immutable.fromJS(inputs));
  },

  setNewCustomInputs(inputs) {
    return this.contextualCustomInputs.set(Immutable.fromJS(inputs));
  },

  setCsvUploads(inputs) {
    return this.csvUploads.set(Immutable.fromJS(inputs));
  },

  initialInputs() {
    return {};
  },

  getProtocolInputs() {
    return this.protocolInputs.get().toJS();
  },

  getCustomInputs() {
    return this.contextualCustomInputs.get().toJS();
  },

  getCustomProperties() {
    const customInputs = this.getCustomInputs();
    const customProperties = [];
    for (const [key, value] of Object.entries(customInputs)) {
      const customPropertyObj = {};
      customPropertyObj.key = key;
      customPropertyObj.value = value;
      customProperties.push(customPropertyObj);
    }
    return customProperties;
  },

  getCsvUploads() {
    return this.csvUploads.get().toJS();
  },

  getContainerIds(manifest) {
    const inputs = this.getProtocolInputs();

    return Manifest.internalIdsForManifest(manifest, inputs).filter(
      (id) => id != undefined
    );
  },

  getContainers(manifest) {
    return ContainerStore.getByIds(this.getContainerIds(manifest));
  },

  getShippableContainers(manifest) {
    const shipmentId = this.shipment.get('id', undefined);

    return this.getContainers(manifest).filter((c) => {
      const containerShipmentId = c.get('shipment_id');
      if (c.get('test_mode')) {
        return false;
      }

      return (
        c.get('status') === 'inbound' &&
        (containerShipmentId == undefined || containerShipmentId === shipmentId)
      );
    });
  },

  hasShippableContainers(manifest) {
    return !this.getShippableContainers(manifest).isEmpty();
  },

  containerRequirements() {
    return undefined;
  },

  shipmentJSON() {
    const shipment = {
      name: `Shipment for run on ${Moment().format('MMM D, YYYY')}`,
      shipment_type: 'sample',
      editable: false
    };

    return shipment;
  }
};

Dispatcher.register(LaunchRunStore.act.bind(LaunchRunStore));

export default LaunchRunStore;
