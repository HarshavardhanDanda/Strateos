/* eslint-disable camelcase */
import Dispatcher          from 'main/dispatcher';
import HTTPUtil            from 'main/util/HTTPUtil';
import NotificationActions from 'main/actions/NotificationActions';
import Urls           from 'main/util/urls';
import ajax from 'main/util/ajax';

const ProvisionSpecActions = {
  loadAll(run_id, options) {
    return HTTPUtil.get(Urls.provision_specs(run_id), { options })
      .done((provisionSpecs) => {
        Dispatcher.dispatch({ type: 'PROVISION_SPEC_LIST', provisionSpecs });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  loadAllForResource(resource_id, options) {
    const data = { resource_id };
    return HTTPUtil.get('/api/runs/provision_specs_for_resource', { options, data })
      .done((provisionSpecs) => {
        Dispatcher.dispatch({ type: 'PROVISION_SPEC_LIST', provisionSpecs });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  autoProvision(runId, instructionId, mode) {
    return ajax.post(Urls.auto_create(runId), { instruction_id: instructionId, mode })
      .done((provisionSpec) => {
        Dispatcher.dispatch({ type: 'PROVISION_SPEC_DATA', provisionSpec });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  create(runId, instructionId, transfers) {
    // transfers is an array of
    // {from: containerId, to: containerId, from_well_idx: 0, to_well_idx: 0, volume: 100}

    return ajax.post(Urls.provision_specs(runId),
      {
        instruction_id: instructionId,
        transfers: transfers
      })
      .done((provisionSpec) => {
        Dispatcher.dispatch({ type: 'PROVISION_SPEC_DATA', provisionSpec });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default ProvisionSpecActions;
