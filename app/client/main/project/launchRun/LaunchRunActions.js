import Moment from 'moment';

import Urls from 'main/util/urls';
import Dispatcher from 'main/dispatcher';
import ajax from 'main/util/ajax';
import LaunchRunStore from './LaunchRunStore';

const LaunchRunActions = {
  clickedTabIndex(index) {
    return Dispatcher.dispatch({
      type: 'LAUNCH_RUN_CLICKED_TAB_INDEX',
      index
    });
  },

  protocolInputsChanged(inputs) {
    return Dispatcher.dispatch({
      type: 'LAUNCH_RUN_PROTOCOL_INPUTS',
      inputs
    });
  },

  csvUploadChanged(inputs) {
    return Dispatcher.dispatch({
      type: 'LAUNCH_RUN_CSV_UPLOAD',
      inputs
    });
  },

  customPropertiesChanged(inputs) {
    return Dispatcher.dispatch({
      type: 'LAUNCH_RUN_CONTEXTUAL_CUSTOM_INPUTS',
      inputs
    });
  },

  createShipment(shipment, containers) {
    return ajax
      .post(`${Urls.shipments()}`, {
        shipment,
        container_ids: containers.map(c => c.get('id'))
      })
      .done((res) => {
        return Dispatcher.dispatch({
          type: 'LAUNCH_RUN_SHIPMENT_DATA',
          shipment: res
        });
      });
  },

  changeShippingMethod(shippingMethod) {
    return Dispatcher.dispatch({
      type: 'LAUNCH_RUN_SHIPPING_METHOD_CHANGE',
      shippingMethod
    });
  },

  runSubmissionFailed() {
    return Dispatcher.dispatch({
      type: 'RUN_SUBMISSION_FAILED'
    });
  },

  launch({ manifest, project, launch_request_id, test_mode, payment_method_id, lab_id, request_date, predecessor_id }) {
    Dispatcher.dispatch({
      type: 'LAUNCH_RUN_SUBMITTING_RUN'
    });

    const protocolName = manifest.display_name;
    const custom_properties = LaunchRunStore.getCustomProperties();
    return ajax
      .post(Urls.runs(project.get('id')), {
        title: `${protocolName} on ${Moment().format('YYYY-MM-DD')}`,
        protocol_id: manifest.id,
        launch_request_id,
        test_mode,
        payment_method_id,
        lab_id,
        request_date,
        predecessor_id,
        custom_properties
      })
      .done((data) => {
        return Dispatcher.dispatch({
          type: 'RUN_SUCCESSFULLY_SUBMITTED',
          data
        });
      });
  }
};

export default LaunchRunActions;
