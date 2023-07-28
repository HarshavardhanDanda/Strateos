/* eslint-disable camelcase */
import Dispatcher from 'main/dispatcher';
import ajax       from 'main/util/ajax';
import Urls       from 'main/util/urls';
import IntakeKitsAPI       from 'main/api/IntakeKitsAPI';
import NotificationActions from 'main/actions/NotificationActions';

const IntakeKitActions = {
  urlBase: '/api/intake_kits',
  load(id) {
    return ajax.get(`${this.urlBase}/${id}`)
      .done((intakeKit) => {
        Dispatcher.dispatch({ type: 'INTAKE_KIT_DATA', intakeKit: intakeKit });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  loadAll() {
    return ajax.get(Urls.intake_kits())
      .done(intakeKits => Dispatcher.dispatch({ type: 'INTAKE_KIT_LIST', intakeKits }));
  },

  create(intake_kit) {
    return IntakeKitsAPI.create({ attributes: intake_kit })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  update(intake_kit, adminProcessedAt = false) {
    const params = adminProcessedAt ? { admin_processed_at: Date.now(), intake_kit } : intake_kit;
    return ajax.put(`${this.urlBase}/${intake_kit.id}`, params)
      .done((intakeKit) => {
        Dispatcher.dispatch({ type: 'INTAKE_KIT_DATA', intakeKit: intakeKit });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  adminProcessKits(ids) {
    const kits = ids.map(id => this.adminProcessKit(id));
    return ajax.when(...kits);
  },

  adminProcessKit(id) {
    return ajax.put(Urls.ship(id), { admin_processed_at: Date.now() })
      .done(intakeKit => {
        Dispatcher.dispatch({
          type: 'INTAKE_KIT_REMOVED',
          intakeKit: intakeKit });
      });
  }
};

export default IntakeKitActions;
