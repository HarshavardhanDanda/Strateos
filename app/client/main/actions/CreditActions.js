import Dispatcher          from 'main/dispatcher';
import HTTPUtil            from 'main/util/HTTPUtil';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';
import CreditAPI           from 'main/api/CreditAPI';

const CreditActions = {
  loadAll(options) {
    return HTTPUtil.get(Urls.credits(), { options })
      .done((credits) => {
        Dispatcher.dispatch({ type: 'CREDIT_LIST', credits });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  loadByOrg(subdomain, orgId, options = {}) {
    return HTTPUtil.get(Urls.get_credits(subdomain, orgId), { options })
      .done((credits) => {
        Dispatcher.dispatch({ type: 'CREDIT_LIST', credits });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  createCredit(organization_id, name, amount, credit_type, expires_at) {
    const attributes = {
      organization_id, name, amount, credit_type, expires_at
    };

    return CreditAPI.create({ attributes }, { version: 'v1' })
      .done(() => {
        NotificationActions.createNotification({
          text: 'Credit created successfully!',
          isError: false
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default CreditActions;
