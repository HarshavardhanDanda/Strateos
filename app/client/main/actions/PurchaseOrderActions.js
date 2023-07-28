import ajax                from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import _ from 'lodash';
import PaymentMethodAPI from 'main/api/PaymentMethodAPI';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';
import Urls from 'main/util/urls';

const PurchaseOrderActions = {
  loadAll() {
    PaymentMethodAPI.indexAll({ filters: { type: 'PurchaseOrder', approved: false },
      version: 'v1',
      includes: ['address', 'organization'],
      fields: { organizations: ['id', 'name', 'subdomain'] },
    });
  },

  approve(ids) {
    const poApprovedAt = new Date();
    const promises = ids.map(id => {
      return ajax.patch(Urls.payment_method_approve_api(id), { data:  { id: id,
        type: 'payment_methods',
        attributes: { po_approved_at: poApprovedAt } } }
      ).done((response) => {
        JsonAPIIngestor.ingest(response);
        NotificationActions.createNotification({
          text: 'Purchase order is approved'
        });
      }).fail((...response) => {
        NotificationActions.handleError(...response);
      }
      );
    });
    return ajax.when(...promises);
  }
};

export default PurchaseOrderActions;
