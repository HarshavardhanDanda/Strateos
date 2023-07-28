import InvoiceItemAPI from 'main/api/InvoiceItemAPI';
import NotificationActions from 'main/actions/NotificationActions';

const InvoiceItemActions = {

  create(attributes) {
    return InvoiceItemAPI.create({ attributes })
      .done(() => {
        NotificationActions.createNotification({
          text: 'Created Invoice Item'
        });
      }).fail((...response) => NotificationActions.handleError(...response));
  }
};

export default InvoiceItemActions;
