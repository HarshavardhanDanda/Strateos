import Accounting     from 'accounting';
import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';
import _ from 'lodash';

import PaymentMethodStore   from 'main/stores/PaymentMethodStore';
import PaymentMethodActions from 'main/actions/PaymentMethodActions';
import ModalActions         from 'main/actions/ModalActions';
import { PaymentInfoModal } from 'main/organization/PaymentInfo';
import connectToStoresHOC   from 'main/containers/ConnectToStoresHOC';

import { Button, Select } from '@transcriptic/amino';

const PAYMENT_INFO_MODAL_ID = 'PAYMENT_SELECTOR_NEW_PAYMENT_MODAL';

class PaymentMethodSelector extends React.Component {
  static get propTypes() {
    return {
      onPaymentMethodSelected: PropTypes.func.isRequired,
      paymentMethodId: PropTypes.string,
      paymentMethods: PropTypes.instanceOf(Immutable.Iterable),
      disabled: PropTypes.bool,
      hideAddOption: PropTypes.bool,
      organizationId: PropTypes.string,
      loading: PropTypes.bool
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      initialPaymentMethod: props.paymentMethodId
    };
    this.onSelect = this.onSelect.bind(this);
    this.addNewPaymentMethod = this.addNewPaymentMethod.bind(this);
  }

  componentDidMount() {
    if (this.props.loading) {
      if (this.props.organizationId) {
        PaymentMethodActions.loadByOrg(this.props.organizationId);
      } else {
        PaymentMethodActions.loadAll();
      }
    } else {
      this.setDefaultPaymentMethod();
    }
  }

  componentDidUpdate(prevProps) {
    const { paymentMethods, loading } = this.props;
    if (!loading && paymentMethods && !paymentMethods.equals(prevProps.paymentMethods)) {
      this.setDefaultPaymentMethod();
    }
  }

  setDefaultPaymentMethod() {
    const { paymentMethods } = this.props;
    if (!this.props.paymentMethodId || !paymentMethods.find(pm => this.props.paymentMethodId === pm.get('id'))) {
      const paymentMethod = paymentMethods && (paymentMethods.find(pm => pm.get('is_default?')) || paymentMethods.first());
      if (paymentMethod) {
        this.props.onPaymentMethodSelected(paymentMethod.get('id'));
      }
    }
  }

  onSelect(e) {
    let newPmId = e.target.value;
    if (newPmId === 'new') {
      newPmId = this.props.paymentMethodId;
      this.addNewPaymentMethod();
    }
    this.props.onPaymentMethodSelected(newPmId);
  }

  onNewPaymentMethod(paymentMethod) { this.props.onPaymentMethodSelected(paymentMethod.id); }

  addNewPaymentMethod() {
    ModalActions.open(PAYMENT_INFO_MODAL_ID);
  }

  description(pm) {
    let extra = '';
    if (this.state.initialPaymentMethod === pm.get('id')) {
      if (pm.get('is_default?')) {
        extra = ' (org/project default)';
      } else  {
        extra = ' (project default)';
      }
    } else if (pm.get('is_default?')) {
      extra = ' (org default)';
    }

    if (pm.get('type') === 'PurchaseOrder') {
      return `${pm.get('description')} - ${Accounting.formatMoney(pm.get('limit'))} remaining${extra}`;
    }
    return `${pm.get('description')}${extra}`;
  }

  addOption() {
    if (this.props.hideAddOption) return [];
    return [{ value: 'new', name: 'Add new payment method...' }];
  }

  renderPaymentInfoModal() {
    return (
      <PaymentInfoModal
        modalId={PAYMENT_INFO_MODAL_ID}
        onValidPaymentMethodAdded={pm => this.onNewPaymentMethod(pm)}
        onPendingPaymentMethodAdded={pm => this.onNewPaymentMethod(pm)}
      />
    );
  }

  render() {
    if (this.props.loading) {
      return (
        <div>
          {'Loading...'}
        </div>
      );
    } else if (!this.props.paymentMethods.count()) {
      return (
        <div>
          {this.renderPaymentInfoModal()}
          <Button type="default" onClick={this.addNewPaymentMethod}>Add New Payment Method</Button>
        </div>
      );
    }

    return (
      <div>
        <Select
          disabled={this.props.disabled}
          onChange={this.onSelect}
          value={this.props.paymentMethodId}
          options={
            this.props.paymentMethods.map((paymentMethod) => {
              return {
                value: paymentMethod.get('id'),
                name: this.description(paymentMethod)
              };
            }).concat(this.addOption())
          }
        />
        {this.renderPaymentInfoModal()}
      </div>
    );
  }
}

const getStateFromStores = () => {
  return ({
    paymentMethods: PaymentMethodStore.getAll()
      .filter(paymentMethod => paymentMethod.get('is_valid') &&
      !_.isEmpty(paymentMethod.get('po_approved_at')) &&
      !paymentMethod.get('expired?')),
    loading: !PaymentMethodStore.isLoaded()
  });
};

export default connectToStoresHOC(PaymentMethodSelector, getStateFromStores);
