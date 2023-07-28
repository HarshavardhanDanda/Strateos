import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';
import _ from 'lodash';

const UnpaidInvoiceStore = _.extend({}, CRUDStore('unpaidInvoices'), {
  act(action) {
    switch (action.type) {
      case 'UNPAID_INVOICE_LIST':
        this._receiveData(action.invoices);
        break;

      case 'UNPAID_INVOICE_SELECT':
        this._receiveData([{
          id: action.id,
          selected: action.selected
        }]);
        break;

      case 'UNPAID_INVOICE_SELECT_ALL':
        this._objects.update(objs =>
          objs.map(obj => obj.set('selected', true))
        );
        break;

      case 'UNPAID_INVOICE_SELECT_NONE':
        this._objects.update(objs =>
          objs.map(obj => obj.set('selected', false))
        );
        break;

      case 'UNPAID_INVOICE_CHARGING':
        this._objects.update((objs) => {
          let setObjects = objs;
          _.each(action.invoice_ids, (value, id) => {
            setObjects = objs.setIn([id, 'charge_in_progress'], true);
          });

          return setObjects;
        });
        break;

      case 'UNPAID_INVOICE_CHARGE_FAILED':
        this._receiveData([
          {
            id: action.id,
            charge_in_progress: false
          }
        ]);
        break;

      default:

    }
  },

  getAll() {
    return this._objects
      .get()
      .filter(x => x.get('forgiven_at') == undefined && x.get('remitted_at') == undefined)
      .valueSeq();
  },

  // sorts by invoice year, month, orgname
  getAllSorted() {
    const compareMapper = (inv) => {
      const orgName = inv.getIn(['organization', 'name'], '');
      const yearMonthStr = inv.get('month', '');

      if (!yearMonthStr.match(/\d+-\d+/)) {
        return [0, 0, orgName];
      }

      const [yearStr, monthStr] = Array.from(yearMonthStr.split('-'));

      // array of values to sort on
      return [parseInt(yearStr, 10), parseInt(monthStr, 10), orgName];
    };

    const comparator = (arr1, arr2) => {
      // year
      if (arr1[0] < arr2[0]) {
        return -1;
      }
      if (arr1[0] > arr2[0]) {
        return 1;
      }

      // month
      if (arr1[1] < arr2[1]) {
        return -1;
      }
      if (arr1[1] > arr2[1]) {
        return 1;
      }

      // org, in reverse order
      return -1 * arr1[2].localeCompare(arr2[2]);
    };

    return UnpaidInvoiceStore.getAll().sortBy(compareMapper, comparator);
  }
});

UnpaidInvoiceStore._register(Dispatcher);

export default UnpaidInvoiceStore;
