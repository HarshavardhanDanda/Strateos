/* eslint-disable camelcase */
import _ from 'lodash';

import Dispatcher                  from 'main/dispatcher';
import { sentencesFromRailsError } from 'main/util/errors';
import HTTPUtil                    from 'main/util/HTTPUtil';
import ajax                        from 'main/util/ajax';
import NotificationActions         from 'main/actions/NotificationActions';
import Urls                        from 'main/util/urls';

const PaymentMethodActions = {
  loadAll(options) {
    return HTTPUtil.get(Urls.payment_methods(), { options })
      .done((data) => {
        Dispatcher.dispatch({ type: 'PAYMENT_METHOD_LIST', payment_methods: data });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  loadByOrg(orgId, subdomain = undefined, options = {}) {
    const data = { payment_method: { organization_id: orgId } };
    const url = subdomain ? Urls.get_payment_methods(subdomain) : Urls.payment_methods();
    return HTTPUtil.get(url, { data, options })
      .done((data) => {
        Dispatcher.dispatch({ type: 'PAYMENT_METHOD_LIST', payment_methods: data });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  addCreditCard(cardInfo, subdomain = undefined, orgId = undefined) {
    const doPost = function(id) {
      // we want all returned promises to have string messages on reject
      // so we use this additional deferred object.
      const deferred = ajax.Deferred();
      const url = orgId ? Urls.create_payment_methods(subdomain, orgId) : Urls.payment_methods();
      ajax.post(url, {
        payment_method: {
          type: 'CreditCard',
          stripe_one_time_id: id,
        }
      })
        .fail(xhr => deferred.reject(sentencesFromRailsError(xhr)))
        .done(payment_method => deferred.resolve(payment_method));
      return deferred;
    };

    return this.createStripeToken(cardInfo)
      .then(doPost)
      .done(payment_method => Dispatcher.dispatch({ type: 'PAYMENT_METHOD_CREATED', payment_method }));
  },

  addPurchaseOrder(poInfo, subdomain = undefined, orgId = undefined) {
    const deferred = ajax.Deferred();

    const payment_method = _.extend({}, poInfo, {
      type: 'PurchaseOrder',
      expiry: poInfo.expiry ? poInfo.expiry.format('YYYY-MM-DD') : undefined
    });
    const url = orgId ? Urls.create_payment_methods(subdomain, orgId) : Urls.payment_methods();
    ajax.post(url, { payment_method })
      .fail(xhr => deferred.reject(sentencesFromRailsError(xhr)))
      .done(response => deferred.resolve(response));

    return deferred.done(response => Dispatcher.dispatch({ type: 'PAYMENT_METHOD_CREATED', payment_method: response }));
  },

  createStripeToken(cardInfo) {
    const stripe_one_time_id = ajax.Deferred();

    const stripeCardInfo = {
      number:      cardInfo.number,
      cvc:         cardInfo.cvc,
      exp_month:   cardInfo.expiry ? (cardInfo.expiry.month() + 1) : undefined,
      exp_year:    cardInfo.expiry ? cardInfo.expiry.year() : undefined,
      name:        cardInfo.name,
      address_zip: cardInfo.address_zip
    };

    Stripe.card.createToken(stripeCardInfo, (status, response) => {
      if (response.error) {
        stripe_one_time_id.reject(response.error.message);
      } else {
        stripe_one_time_id.resolve(response.id);
      }
    }
    );

    return stripe_one_time_id;
  },

  destroyPaymentMethod(id, subdomain = undefined, orgId = undefined) {
    const url = orgId ? Urls.org_payment_method(id, subdomain, orgId) : Urls.payment_method(id);
    return ajax.delete(url)
      .done(() => {
        Dispatcher.dispatch({ type: 'PAYMENT_METHOD_DESTROYED', id });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  makeDefault(id, subdomain = undefined, orgId = undefined) {
    return this.update(id, { default: true }, subdomain, orgId);
  },

  update(id, updates, subdomain = undefined, orgId = undefined) {
    const url = orgId ? Urls.org_payment_method(id, subdomain, orgId) : Urls.payment_method(id);
    return ajax.patch(url, { payment_method: updates })
      .done((data) => {
        Dispatcher.dispatch({ type: 'PAYMENT_METHOD_LIST', payment_methods: data });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default PaymentMethodActions;
