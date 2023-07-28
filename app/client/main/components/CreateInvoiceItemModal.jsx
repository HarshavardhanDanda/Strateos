import Immutable  from 'immutable';
import _          from 'lodash';
import PropTypes  from 'prop-types';
import React      from 'react';
import moment from 'moment';

import { LabeledInput, Select, TextInput, Validated, Checkbox } from '@transcriptic/amino';

import Accounting                            from 'accounting';
import AdminActions                          from 'main/actions/AdminActions';
import { SinglePaneModal }                   from 'main/components/Modal';
import { validators, SimpleInputsValidator } from 'main/components/validation';
import ajax                                  from 'main/util/ajax';
import PaymentMethodStore                    from 'main/stores/PaymentMethodStore';
import InvoiceActions                        from 'main/actions/InvoiceActions';
import InvoiceItemActions                    from 'main/actions/InvoiceItemActions';

/*
 * Modal for Adding an Invoice Item to a specific Invoice.
 * Only applies to invoices that have not been sent to xero.
 */
class CreateInvoiceItemModal extends React.Component {

  static get propTypes() {
    return {
      invoice:        PropTypes.instanceOf(Immutable.Map),
      paymentMethods: PropTypes.instanceOf(Immutable.Iterable)
    };
  }

  static initialState(props) {

    let paymentMethodId;
    if (props.paymentMethods && props.paymentMethods.first()) {
      paymentMethodId = props.paymentMethods.first().get('id');
    } else {
      paymentMethodId = '';
    }

    return {
      paymentMethodId: paymentMethodId,
      amount: '',
      description: '',
      name: '',
      quantity: '',
      runCreditApplicable: false,
      netSuiteItemId: 15, // molecular_biology
      autocredit: true,
      showSuccess: false
    };
  }

  static get modalId() {
    return 'CREATE_INVOICE_ITEM_MODAL';
  }

  constructor(props, context) {
    super(props, context);

    this.addCharge = this.addCharge.bind(this);
    this.isValid   = this.isValid.bind(this);

    this.state = CreateInvoiceItemModal.initialState(props);
  }

  validator() {
    const checks = {
      name: {
        validators: [validators.non_empty]
      },
      quantity: {
        validators: [validators.non_empty, validators.positive_integer]
      },
      amount: {
        validators: [validators.non_empty, validators.positive_float]
      },
      description: {
        validators: [validators.non_empty]
      }
    };

    // enforce that payment method is specified if invoice is not
    if (!this.props.invoice) {
      checks.paymentMethodId = { validators: [validators.non_empty] };
    }

    return SimpleInputsValidator(checks);
  }

  isValid() {
    const immutableState = Immutable.fromJS(this.state);
    return this.validator().isValid(immutableState);
  }

  createInvoiceIfNotExists() {
    const paymentMethodId = this.state.paymentMethodId;
    const orgId = PaymentMethodStore.getById(paymentMethodId).get('organization_id');

    // Switch time to PST so invoice generation cutoff is end of month midnight PST/PDT
    var currData = new Date();
    var pstDate = currData.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles'
    });
    const month = moment(pstDate).format('YYYY-MM');
    const filters = { payment_method_id: paymentMethodId, organization_id: orgId, month };
    const promise = new ajax.Deferred();

    InvoiceActions.fetchInvoices({ filters }).done((res) => {
      const  invoices = res[0].data;
      if (invoices.length) {
        promise.resolve(invoices[0].id);
      } else {
        InvoiceActions.create({ payment_method_id: paymentMethodId, organization_id: orgId, month, reference: month })
          .done(({ data }) => promise.resolve(data.id));
      }
    });
    return promise;
  }

  addCharge() {
    if (!this.isValid()) {
      return (new ajax.Deferred()).reject();
    }

    if (this.props.isAdmin) {
      return AdminActions.createCharge(
        (this.props.invoice || Immutable.Map()).get('id'),
        this.state.paymentMethodId,
        this.state.name,
        this.state.description,
        this.state.quantity,
        this.state.amount,
        this.state.runCreditApplicable,
        parseInt(this.state.netSuiteItemId, 10),
        this.state.autocredit
      );
    } else {
      return this.createInvoiceIfNotExists().then((invoiceId) => {
        return InvoiceItemActions.create(
          {
            invoice_id: invoiceId,
            name: this.state.name,
            description: this.state.description,
            quantity: parseInt(this.state.quantity, 10),
            charge: Number(this.state.amount),
            run_credit_applicable: this.state.runCreditApplicable,
            netsuite_item_id: parseInt(this.state.netSuiteItemId, 10),
            autocredit: this.state.autocredit
          }
        );
      });
    }
  }

  invoiceName() {
    if (!this.props.invoice) {
      return 'No Specific Invoice Specified';
    }

    const orgName = this.props.invoice.getIn(['organization', 'name']);
    const poNum   = this.props.invoice.getIn(['payment_method', 'po_reference_number']);

    return `${orgName} PO: ${poNum}`;
  }

  render() {
    const errors = this.validator().errors(Immutable.Map(this.state));

    return (
      <SinglePaneModal
        modalId={CreateInvoiceItemModal.modalId}
        modalSize="medium"
        title="Create Invoice Item"
        acceptBtnDisabled={!this.isValid()}
        acceptText="Add Invoice Item"
        onAccept={this.addCharge}
        onOpen={() => this.setState(CreateInvoiceItemModal.initialState(this.props))}
      >
        <div>
          <h2>
            {`${this.invoiceName()}`}
          </h2>
          <Validated error={errors.name}>
            <LabeledInput>
              <TextInput
                placeholder="Name"
                value={this.state.name}
                onChange={e => this.setState({ name: e.target.value })}
              />
            </LabeledInput>
          </Validated>
          <Validated error={errors.description}>
            <LabeledInput>
              <TextInput
                placeholder="Description"
                value={this.state.description}
                onChange={e =>
                  this.setState({
                    description: e.target.value
                  })}
              />
            </LabeledInput>
          </Validated>
          <Validated error={errors.quantity}>
            <LabeledInput>
              <TextInput
                placeholder="Quantity"
                value={this.state.quantity}
                onChange={e =>
                  this.setState({
                    quantity: e.target.value
                  })}
              />
            </LabeledInput>
          </Validated>
          <Validated error={errors.amount}>
            <LabeledInput>
              <TextInput
                placeholder="Amount"
                value={this.state.amount}
                onChange={e =>
                  this.setState({
                    amount: e.target.value
                  })}
              />
            </LabeledInput>
          </Validated>
          <If condition={!this.props.invoice && this.props.paymentMethods}>
            <LabeledInput label="Payment Methods">
              <Select
                value={this.state.paymentMethodId}
                onChange={e => this.setState({ paymentMethodId: e.target.value })}
                options={this.props.paymentMethods.map((pm) => {
                  return ({
                    name: `${pm.get('description')} (${Accounting.formatMoney(pm.get('limit'))} remaining)`,
                    value: pm.get('id')
                  });
                })}
              />
            </LabeledInput>
          </If>
          <LabeledInput label="Invoice Item Code">
            <Select
              id="netsuite-item-id"
              value={this.state.netSuiteItemId}
              onChange={e => this.setState({ netSuiteItemId: e.target.value })}
              options={[
                { name: 'CLOUD LAB-BIOLOGY',     value: '15' },
                { name: 'CLOUD LAB-CHEMISTRY',   value: '16' },
                { name: 'SHIPPING REVENUE',      value: '17' },
                { name: 'LAB OS-IMPLEMENTATION', value: '18' },
                { name: 'LAB OS-SUBSCRIPTION',   value: '19' },
                { name: 'EXECUTION SD2',         value: '20' },
                { name: 'IMPLEMENTATION SD2',    value: '21' },
                { name: 'TISSUE IMAGING',        value: '42' }

              ]}
            />
          </LabeledInput>
          <Checkbox
            label="Run credit?"
            id="run-credit"
            type="checkbox"
            value={this.state.runCreditApplicable}
            checked={this.state.runCreditApplicable ? 'checked' : 'unchecked'}
            onChange={e =>
              this.setState({
                runCreditApplicable: e.target.checked
              })}
          />
          <Checkbox
            id="add-charge"
            type="checkbox"
            label="Autocredit?"
            value={this.state.autocredit}
            checked={this.state.autocredit ? 'checked' : 'unchecked'}
            onChange={e =>
              this.setState({
                autocredit: e.target.checked
              })}
          />
        </div>
      </SinglePaneModal>
    );
  }
}

export default CreateInvoiceItemModal;
