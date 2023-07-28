import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import {
  Select,
  Button,
  LabeledInput
} from '@transcriptic/amino';

import InvoiceActions from 'main/admin/actions/InvoiceActions';

const creditDisplayName = (credit) => {
  return `${credit.get('name')} -- $${credit.get('amount_remaining')} -- ${credit.get('id')}`;
};

const creditOptions = (credits) => {
  return credits
    .map((credit) => {
      return {
        value: credit.get('id'),
        name: creditDisplayName(credit)
      };
    }).toJS();
};

const invoiceDisplayName = (invoice) => {
  const pm = invoice.getIn(['payment_method', 'description'], '-');

  return `ID: ${invoice.get('id')}, PM: ${pm}, Date: ${invoice.get('reference')}`;
};

const invoiceOptions = (invoices) => {
  return invoices
    .map((invoice) => {
      return {
        name: invoiceDisplayName(invoice),
        value: invoice.get('id')
      };
    }).toJS();
};

class ApplyCreditToInvoice extends React.Component {
  static get propTypes() {
    return {
      credits: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      invoices: PropTypes.instanceOf(Immutable.Iterable).isRequired
    };
  }

  constructor(props) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);

    this.state = {
      creditId:   undefined,
      invoiceId:  undefined,
      submitting: false,
      success:    false,
      error:      undefined
    };
  }

  onSubmit() {
    this.setState({ submitting: true });

    InvoiceActions
      .applyCredit(this.state.invoiceId, this.state.creditId, this.props.isAdmin ? undefined : this.props.customerSubdomain)
      .done(() => this.setState({ success: true, error: undefined }))
      .fail(e => this.setState({ error: e.responseJSON.error, success: false }))
      .always(() => this.setState({ submitting: false }));
  }

  render() {
    if (this.state.success) {
      return <div>Success! Great work.</div>;
    } else if (this.props.credits.count() === 0) {
      return <div>No Credits Available</div>;
    } else if (this.props.invoices.count() === 0) {
      return <div>There are not any oustanding invoices for this org</div>;
    }

    return (
      <div className="vertical-spaced-list">
        <LabeledInput label="Select Credit">
          <Select
            options={creditOptions(this.props.credits)}
            value={this.state.creditId}
            onChange={e => this.setState({ creditId: e.target.value })}
            nullable
          />
        </LabeledInput>

        <LabeledInput label="Select Invoice">
          <Select
            options={invoiceOptions(this.props.invoices)}
            value={this.state.invoiceId}
            onChange={e => this.setState({ invoiceId: e.target.value })}
            nullable
          />
        </LabeledInput>

        <LabeledInput error={this.state.error}>
          <Button
            icon={this.state.submitting ? 'fa fa-spinner fa-spin' : undefined}
            type="primary"
            size="small"
            disabled={!this.state.creditId || !this.state.invoiceId || this.state.submitting}
            onClick={this.onSubmit}
          >
            Submit
          </Button>
        </LabeledInput>
      </div>
    );
  }
}

export default ApplyCreditToInvoice;
