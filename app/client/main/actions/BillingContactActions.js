/* eslint-disable camelcase */
import Dispatcher          from 'main/dispatcher';
import HTTPUtil            from 'main/util/HTTPUtil';
import ajax                from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';

const BillingContactActions = {
  loadAll(options = {}) {
    return HTTPUtil.get(Urls.billing_contacts(), { options })
      .done((billing_contacts) => {
        Dispatcher.dispatch({ type: 'BILLING_CONTACT_LIST', billing_contacts });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  loadByOrganizationId(organizationId, subdomain, options = {}) {
    const url = subdomain ? Urls.customer_billing_contacts(subdomain, organizationId) : Urls.billing_contacts();
    return HTTPUtil.get(url, { options })
      .done((billing_contacts) => {
        Dispatcher.dispatch({ type: 'BILLING_CONTACT_LIST', billing_contacts });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  createBillingContact(contact, subdomain, orgId) {
    const url = orgId ? Urls.customer_billing_contacts(subdomain, orgId) : Urls.billing_contacts();
    return ajax.post(url, { billing_contact: contact })
      .done((billing_contact) => {
        Dispatcher.dispatch({ type: 'BILLING_CONTACT_DATA', billing_contact });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  updateBillingContact(id, contact, subdomain, orgId) {
    const url = orgId ? Urls.customer_billing_contact(id, subdomain, orgId) : Urls.billing_contact(id);
    return ajax.put(url, { billing_contact: contact })
      .done((billing_contact) => {
        Dispatcher.dispatch({ type: 'BILLING_CONTACT_DATA', billing_contact });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  destroy(contactId, subdomain, orgId) {
    const url = orgId ? Urls.customer_billing_contact(contactId, subdomain, orgId) : Urls.billing_contact(contactId);
    return ajax.delete(url)
      .done(() => {
        Dispatcher.dispatch({ type: 'BILLING_CONTACT_DESTROYED', contactId });
      })
      .fail((xhr, status, text) => {
        NotificationActions.handleError(xhr, status, text);
      });
  }
};

export default BillingContactActions;
