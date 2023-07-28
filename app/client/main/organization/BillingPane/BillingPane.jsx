import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';
import Moment from 'moment';
import _ from 'lodash';
import { Card, Divider }  from '@transcriptic/amino';

import Urls                                     from 'main/util/urls';
import { Loading }                              from 'main/components/page';
import InvoiceStore                             from 'main/stores/InvoiceStore';
import SessionActions                           from 'main/actions/SessionActions';
import BillingContactActions                    from 'main/actions/BillingContactActions';
import SessionStore                             from 'main/stores/SessionStore';
import BillingContactStore                      from 'main/stores/BillingContactStore';
import connectToStores                          from 'main/containers/ConnectToStoresHOC';
import { setMonth, setSubDomain, currentMonth } from 'main/stores/BillingPageStore';
import CreditActions                            from 'main/actions/CreditActions';
import InvoiceActions                           from 'main/actions/InvoiceActions';
import PaymentMethodActions                     from 'main/actions/PaymentMethodActions';
import OrganizationActions                      from 'main/actions/OrganizationActions';
import CollaboratorActions                      from 'main/actions/CollaboratorActions';
import InvoiceItemAPI                           from 'main/api/InvoiceItemAPI';
import OrganizationAPI                          from 'main/api/OrganizationAPI';
import InvoiceItemStore                         from 'main/stores/InvoiceItemStore';
import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';
import BillingContacts            from './BillingContacts';
// eslint-disable-next-line import/no-named-as-default
import PaymentMethods             from './PaymentMethods';
import CreditsTable               from './Credits';
import Invoices                   from './Invoices';

const propTypes = {
  billingContacts: PropTypes.instanceOf(Immutable.Iterable),
  billingContactsLoading: PropTypes.bool,
  subdomain: PropTypes.string.isRequired,
  currentInvoices: PropTypes.instanceOf(Immutable.Iterable),
  invoiceMonthOptions: PropTypes.instanceOf(Array)
};

class BillingPane extends React.Component {

  constructor(props) {
    super(props);
    SessionActions.load();
    if (props.customerOrganizationId) {
      this.loadActionsByOrganization();
    } else {
      this.loadAllActions();
    }
    setSubDomain(props.subdomain);
    InvoiceItemAPI.indexAll({
      filters: {
        subdomain: props.subdomain,
        invoice_id: 'none'
      }
    });

  }

  loadActionsByOrganization() {
    const { subdomain, customerOrganizationId } = this.props;
    CreditActions.loadByOrg(subdomain, customerOrganizationId);
    PaymentMethodActions.loadByOrg(customerOrganizationId, subdomain);
    if (FeatureStore.hasPlatformFeature(FeatureConstants.VIEW_INVOICES_GLOBAL)) {
      InvoiceActions.loadByOrg(subdomain, customerOrganizationId)
        .done(() => setMonth(InvoiceStore.getAvailableMonths().first()));
    }
    BillingContactActions.loadByOrganizationId(customerOrganizationId, subdomain);

    OrganizationAPI.get(customerOrganizationId);
  }

  loadAllActions() {
    const { subdomain } = this.props;
    CreditActions.loadAll();
    PaymentMethodActions.loadAll();
    InvoiceActions.loadAll()
      .done(() => setMonth(InvoiceStore.getAvailableMonths().first()));
    BillingContactActions.loadAll();
    OrganizationActions.loadBySubdomain(subdomain)
      .then((org) => {
        Urls.use(org.subdomain);
        CollaboratorActions.loadOrganizationCollaborators(org.id);
      });
  }

  render() {
    const { billingContacts, billingContactsLoading, customerOrganizationId, subdomain } = this.props;
    return (
      <div className="tx-stack tx-stack--xxlg">
        <Card container className="tx-stack tx-stack--sm">
          <h2 className="tx-type--heavy">Billing</h2>
          <Divider />
          <PaymentMethods
            subdomain={subdomain}
            customerOrganizationId={customerOrganizationId}
          />
          {billingContactsLoading ? <Loading /> : <BillingContacts billingContacts={billingContacts} subdomain={subdomain} customerOrganizationId={customerOrganizationId} />}
        </Card>
        <Card container>
          <h2 className="tx-type--heavy">Credits</h2>
          <Divider />
          <CreditsTable
            customerOrganizationId={customerOrganizationId}
          />
        </Card>
        {(!customerOrganizationId || FeatureStore.hasPlatformFeature(FeatureConstants.VIEW_INVOICES_GLOBAL)) && (
        <Card container>
          <h2 className="tx-type--heavy">Invoices</h2>
          <Divider />
          <Invoices
            currentInvoices={this.props.currentInvoices}
            invoiceMonthOptions={this.props.invoiceMonthOptions}
          />
        </Card>
        )}
      </div>
    );
  }
}

const currentInvoices = () => {
  if (currentMonth() === undefined) {
    return Immutable.List();
  }

  let invoices = InvoiceStore.getAllForMonth(currentMonth());
  const orgId  = SessionStore.getOrg() && SessionStore.getOrg().get('id');

  if (!orgId) {
    return invoices;
  }

  const unlinkedInvoiceItems = InvoiceItemStore.getAllUnlinkedByOrg(orgId);

  // Append artificial invoice using unlinked invoice items
  if (unlinkedInvoiceItems.count() !== 0) {
    const invoiceTotal = unlinkedInvoiceItems.reduce((sum, ii) => sum + (ii.get('charge') * ii.get('quantity')), 0);

    const unlinkedInvoice = Immutable.fromJS({
      id: 'unlinked',
      reference: 'Unlinked invoice items',
      month: currentMonth(),
      total: invoiceTotal,
      invoice_items: unlinkedInvoiceItems,
      payment_method: { description: 'Unlinked invoice items' }
    });

    invoices = invoices.push(unlinkedInvoice);
  }

  return invoices;
};

export const invoiceMonthOptions = () => {
  const options = InvoiceStore.getAvailableMonths().map(month => {
    const date = Moment(month).toDate();
    return { name: `${date.toLocaleString('default', { month: 'long' })}, ${date.getFullYear()}`, value: month };
  });

  return [{ name: 'Select Invoice Month', value: 'selection', disabled: true }].concat(options.toJS());
};

BillingPane.propTypes = propTypes;

const getStateFromStores = (props) => {
  const { customerOrganizationId } = props;
  const currentOrg = SessionStore.getOrg();
  const billingContacts = customerOrganizationId ? BillingContactStore.getAllByOrganizationId(customerOrganizationId) :
    BillingContactStore.getAllByOrganizationId(currentOrg.get('id'));
  const billingContactsLoading = !BillingContactStore.isLoaded();

  return {
    billingContacts,
    billingContactsLoading,
    currentInvoices: currentInvoices(),
    invoiceMonthOptions: invoiceMonthOptions(),
  };
};

const ConnectedBillingPane = connectToStores(BillingPane, getStateFromStores);
ConnectedBillingPane.propTypes = propTypes;

export default ConnectedBillingPane;
export  { BillingPane };
