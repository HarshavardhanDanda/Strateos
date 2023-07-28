/* eslint-disable camelcase */
import AdminUrls           from 'main/admin/urls';
import Dispatcher          from 'main/dispatcher';
import HTTPUtil            from 'main/util/HTTPUtil';
import ajax                from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';

const AdminActions = {
  // Admin actions that are callable when logged in as an admin
  // while looking at non-admin pages, ie an organization's edit
  // page, which embed admin views.
  //
  // In the future I would prefer if admin pages were completely separated.
  // from User views.  This exposes too much even though it isn't callable
  // by normal users.

  // Loads all admins with minimal data
  loadAll(options) {
    return HTTPUtil.get('/admin/admins', { options })
      .done(admins => Dispatcher.dispatch({ type: 'ADMIN_LIST', admins }));
  },

  loadAllSubscribers(subdomain, options) {
    return HTTPUtil.get(`/admin/organizations/${subdomain}/subscribers`, { options })
      .done(admins => Dispatcher.dispatch({ type: 'ADMIN_SUBSCRIBER_LIST', subdomain, admins }));
  },

  createSubscriber(subdomain, adminId) {
    return ajax.post(`/admin/organizations/${subdomain}/subscribers`, { subscriber_id: adminId })
      .done(() => Dispatcher.dispatch({ type: 'ADMIN_SUBSCRIBER_DATA', subdomain, adminId }));
  },

  destroySubscriber(subdomain, adminId) {
    return ajax.delete(`/admin/organizations/${subdomain}/subscribers/${adminId}`)
      .done(() => Dispatcher.dispatch({ type: 'ADMIN_SUBSCRIBER_DESTROYED', subdomain, adminId }));
  },

  createCredit(organization_id, name, amount, credit_type, expires_at) {
    const data = {
      credit: { organization_id, name, amount, credit_type, expires_at }
    };

    return ajax.post('/admin/billing/credits', data)
      .done((credit) => {
        NotificationActions.createNotification({
          text: 'Credit created successfully!',
          isError: false
        });
        Dispatcher.dispatch({ type: 'CREDIT_DATA', credit });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  createCharge(invoice_id, payment_method_id, name, description, quantity, charge,
    run_credit_applicable, netsuite_item_id, autocredit) {
    return ajax.post('/admin/billing/make_charge',
      {
        charge: {
          invoice_id,
          payment_method_id,
          name,
          description,
          quantity,
          charge,
          run_credit_applicable,
          netsuite_item_id,
          autocredit
        }
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  signOut() {
    return ajax.delete(AdminUrls.sign_out())
      .then(() => { window.location = '/admins/sign_in'; })
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default AdminActions;
