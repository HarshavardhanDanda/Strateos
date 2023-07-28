import ajax                from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls       from 'main/util/urls';

const OrderableMaterialComponentActions = {

  loadOmcGlobalStats(omcId) {
    const url = Urls.omc_global_stats(omcId);

    return ajax.get(url)
      .done((orderableMaterialComponent) => {
        return orderableMaterialComponent;
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

};

export default OrderableMaterialComponentActions;
