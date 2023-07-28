import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { SinglePaneModal } from 'main/components/Modal';
import CreditStore from 'main/stores/CreditStore';
import CreditActions from 'main/actions/CreditActions';
import InvoiceStore from 'main/stores/InvoiceStore';
import InvoiceActions from 'main/actions/InvoiceActions';
import ConnectToStoresHOC from 'main/containers/ConnectToStoresHOC';
import ApplyCreditToInvoice from 'main/admin/components/ApplyCreditToInvoice';
import { Spinner } from '@transcriptic/amino';
import InvoiceAPI from 'main/api/InvoiceAPI';

class ApplyCreditModal extends React.Component {
  static get propTypes() {
    return {
      credits: PropTypes.instanceOf(Immutable.Iterable),
      invoices: PropTypes.instanceOf(Immutable.Iterable),
      modalId: PropTypes.string.isRequired,
      customerSubdomain: PropTypes.string,
      customerOrgId: PropTypes.string,
      isAdmin: PropTypes.bool
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      loadingCredits: true,
      loadingInvoices: true
    };
  }

  componentWillMount() {
    if (this.props.isAdmin) {
      CreditActions
        .loadAll()
        .done(() => this.setState({ loadingCredits: false }));

      InvoiceActions
        .loadAll()
        .done(() => this.setState({ loadingInvoices: false }));
    } else {
      CreditActions
        .loadByOrg(this.props.customerSubdomain, this.props.customerOrgId)
        .done(() => this.setState({ loadingCredits: false }));

      InvoiceAPI.indexAll({ filters: { organization_id: this.props.customerOrgId },
        version: 'v1',
        limit: 100,
        includes: ['payment_method']
      }).done(() => this.setState({ loadingInvoices: false }));

    }

  }

  render() {
    const { credits, invoices, customerSubdomain, isAdmin } = this.props;

    const fetching          = this.state.loadingCredits || this.state.loadingInvoices;
    const hasSufficientData = credits.count() > 0 && invoices.count() > 0;

    if (fetching && !hasSufficientData) return <Spinner />;
    return (
      <SinglePaneModal
        title="Apply a Credit"
        modalId={this.props.modalId}
      >
        <ApplyCreditToInvoice
          credits={credits}
          invoices={invoices}
          customerSubdomain={customerSubdomain}
          isAdmin={isAdmin}
        />
      </SinglePaneModal>
    );
  }
}

const getStateFromStores = ({ orgId, customerOrgId, modalId }) => {
  const credits = CreditStore
    .getAllByOrgId(customerOrgId || orgId)
    .filter(CreditStore.hasMoneyLeft);

  const invoices = InvoiceStore
    .getAllForOrg(customerOrgId || orgId)
    .filter(i => !InvoiceStore.hasBeenCharged(i))
    .filter(i => !InvoiceStore.hasBeenRemitted(i));

  return {
    credits,
    invoices,
    modalId
  };
};

const Connected = ConnectToStoresHOC(ApplyCreditModal, getStateFromStores);

Connected.propTypes = { customerSubdomain: PropTypes.string, customerOrgId: PropTypes.string.isRequired, modalId: PropTypes.string.isRequired };

export default Connected;
