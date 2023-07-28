import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import Accounting  from 'accounting';
import { Loading } from 'main/components/page';
import { Select }  from '@transcriptic/amino';

import InvoiceStore from 'main/stores/InvoiceStore';
import { setMonth, currentMonth } from 'main/stores/BillingPageStore';

import InvoiceView from './InvoiceView';

function Invoices(props) {
  const left = currentMonth();

  if (InvoiceStore.isLoaded() && (props.currentInvoices.size === 0)) {
    return <em>No Charges</em>;
  }

  if (!InvoiceStore.isLoaded() || (left === undefined)) {
    return <Loading />;
  }

  return (
    <div className="invoice-view">
      <div className="invoice-view__header">
        <h2 className="tx-type--heavy">Invoices</h2>
        <div className="invoice-view__header tx-inline tx-inline--md">
          <div>
            <h4>Monthly Total</h4>
            <p className="tx-type--primary tx-type--heavy">
              {
                Accounting.formatMoney(props.currentInvoices.reduce(((m, o) => {
                  return m + parseFloat(o.get('total'));
                }), 0))
              }
            </p>
          </div>
          <div>
            <Select
              value={left !== undefined ? left : 'selection'}
              options={props.invoiceMonthOptions}
              onChange={
                (e) => {
                  const month = e.target.value;
                  return setMonth(month === 'selection' ? undefined : month);
                }
              }
            />
          </div>
        </div>
      </div>
      {
        props.currentInvoices.map((inv) => {
          return <InvoiceView key={`${inv.get('id')}`} invoice={inv} />;
        })
      }
    </div>
  );
}

Invoices.propTypes = {
  currentInvoices: PropTypes.instanceOf(Immutable.Iterable),
  invoiceMonthOptions: PropTypes.instanceOf(Array)
};

export default Invoices;
