import Immutable  from 'immutable';
import _          from 'lodash';
import PropTypes  from 'prop-types';
import React      from 'react';

import { LabeledInput, Select, TextInput, Validated, Checkbox } from '@transcriptic/amino';

import InvoiceItemActions                    from 'main/actions/InvoiceItemActions';
import { SinglePaneModal }                   from 'main/components/Modal';
import { validators, SimpleInputsValidator } from 'main/components/validation';
import ajax                                  from 'main/util/ajax';

/*
 * Modal for Adding an Invoice Item to a specific Invoice.
 * Only applies to invoices that have not been sent to xero.
 */
class CreateInvoiceItemModal extends React.Component {

  static get propTypes() {
    return {
      invoice:        PropTypes.instanceOf(Immutable.Map)
    };
  }

  static initialState() {
    return {
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

    this.state = CreateInvoiceItemModal.initialState();
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

    return SimpleInputsValidator(checks);
  }

  isValid() {
    const immutableState = Immutable.fromJS(this.state);
    return this.validator().isValid(immutableState);
  }

  addCharge() {
    if (!this.isValid()) {
      return (new ajax.Deferred()).reject();
    }

    return InvoiceItemActions.create(
      {
        invoice_id: (this.props.invoice || Immutable.Map()).get('id'),
        name: this.state.name,
        description: this.state.description,
        quantity: parseInt(this.state.quantity, 10),
        charge: Number(this.state.amount),
        run_credit_applicable: this.state.runCreditApplicable,
        netsuite_item_id: parseInt(this.state.netSuiteItemId, 10),
        autocredit: this.state.autocredit
      }
    );
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
        <div className="tx-stack tx-stack--xs">
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
