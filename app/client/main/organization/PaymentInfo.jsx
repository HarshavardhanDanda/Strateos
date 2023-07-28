import { inflect } from 'inflection';
import _           from 'lodash';
import PropTypes   from 'prop-types';
import React       from 'react';
import Moment from 'moment';
import ajax from 'main/util/ajax';

import AddressActions                                    from 'main/actions/AddressActions';
import ModalActions                                      from 'main/actions/ModalActions';
import PaymentMethodActions                              from 'main/actions/PaymentMethodActions';
import { SinglePaneModal }                               from 'main/components/Modal';
import { CreditCardInfoEditor, PurchaseOrderInfoEditor } from 'main/components/payment';
import ConnectToStores                                   from 'main/containers/ConnectToStoresHOC';
import AddressStore                                      from 'main/stores/AddressStore';
import PaymentMethodStore                                from 'main/stores/PaymentMethodStore';
import Urls                                              from 'main/util/urls';

import { Button, Banner } from '@transcriptic/amino';
import './PaymentInfo.scss';

class PendingPaymentMethodModal extends React.Component {
  static get MODAL_ID() {
    return 'PENDING_PAYMENT_METHOD_MODAL';
  }

  render() {
    return (
      <SinglePaneModal
        modalId={PendingPaymentMethodModal.MODAL_ID}
        title="Purchase Order Pending Review"
      >
        <p>
          {`Your purchase order details have been received and are pending review
            by Transcriptic staff. You'll get an email once it's been approved.`}
        </p>
        <p>
          <Button type="primary" link tagLink href={Urls.organization_billing()}>
            View Payment Methods
          </Button>
        </p>
      </SinglePaneModal>
    );
  }
}

class PaymentInfoModal extends React.Component {

  static get propTypes() {
    return {
      // Called when the user successfully added a valid payment method (e.g. a
      // credit card) and can now submit charges.
      // eslint-disable-next-line
      onValidPaymentMethodAdded: PropTypes.func,

      // Called when the user successfully added a payment method that requires
      // approval (e.g. a purchase order), and cannot yet submit charges.
      // eslint-disable-next-line
      onPendingPaymentMethodAdded: PropTypes.func,
      modalId: PropTypes.string,
      modalType: PropTypes.string
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      isDataUptoDate: undefined
    };
  }

  componentDidMount() {
    if (!AddressStore.isLoaded()) {
      AddressActions.loadAll();
    }
  }

  save() {
    return this.paymentInfo
      .save()
      .done(() => ModalActions.close(this.props.modalId));
  }

  title() {
    const { modalType } = this.props;
    if (modalType === 'creditcard') {
      return 'Enter Credit Card Info';
    } else if (modalType === 'editpurchaseorder') {
      return 'Edit Purchase Order Info';
    }
    return 'Enter Purchase Order Info';
  }

  render() {
    const { modalType } = this.props;
    const buttonDisable = this.state.isDataUptoDate && modalType === 'editpurchaseorder';
    const paymentInfoProps = _.extend(
      { ref: (node) => { this.paymentInfo = node; } },
      this.props
    );

    return (
      <SinglePaneModal
        modalId={this.props.modalId}
        modalSize={['editpurchaseorder', 'purchaseorder'].includes(modalType) ? 'large' : 'medium'}
        title={this.title()}
        acceptText="Save"
        modalBodyClass={['editpurchaseorder', 'purchaseorder'].includes(modalType) ? 'paymentinfo__modalbody' : undefined}
        acceptBtnDisabled={buttonDisable ? this.state.isDataUptoDate : false}
        onAccept={() => this.save()}
      >
        <PaymentInfo {...paymentInfoProps} canPurchaseOrderUpdate={(flag) => { this.setState({ isDataUptoDate: flag }); }} />
      </SinglePaneModal>
    );
  }
}

class PaymentInfo extends React.Component {
  static get propTypes() {
    return {
      onValidPaymentMethodAdded:   PropTypes.func,
      onPendingPaymentMethodAdded: PropTypes.func,
      modalType: PropTypes.string,
      inputValues: PropTypes.any,
      customerOrganizationId: PropTypes.string,
      subdomain: PropTypes.string
    };
  }

  constructor(props, context) {
    super(props, context);
    const { data } = props;
    let inputValues;
    if (data) {
      inputValues = {
        alias: data.get('description'),
        po_reference_number: data.get('po_reference_number'),
        expiry: data.get('expiry') ? Moment(data.get('expiry')) : undefined,
        po_limit: data.get('po_limit'),
        address_id: data.get('address') ? data.get('address').get('id') : undefined
      };
    }
    this.inputValues = inputValues || {};
    this.state = {
      cardInfo: {},
      poInfo: inputValues || {},
      newPO: undefined,
      showBanner: false
    };
    const { expiry, ...inputData } = this.state.poInfo;
    this.canPurchaseOrderUpdate(expiry, inputData);
  }

  componentDidMount() {
    if (!PaymentMethodStore.isLoaded()) {
      PaymentMethodActions.loadAll();
    }
  }

  save() {
    const { subdomain, customerOrganizationId, modalType, onValidPaymentMethodAdded, data } = this.props;
    if (modalType === 'creditcard') {
      return PaymentMethodActions.addCreditCard(this.state.cardInfo, subdomain, customerOrganizationId)
        .done(onValidPaymentMethodAdded)
        .fail(msg => this.setState({ error: msg }));
    } else if (modalType === 'editpurchaseorder') {
      if (!this.state.poInfo.upload_id) {
        this.setState({ showBanner: true });
        return (new ajax.Deferred()).reject();
      } else {
        const updates = _.extend({}, this.state.poInfo, {
          type: 'PurchaseOrder',
          expiry: this.state.poInfo.expiry ? this.state.poInfo.expiry.format('YYYY-MM-DD') : undefined,
          po_approved_at: null
        });
        return PaymentMethodActions.update(data.get('id'), updates, subdomain, customerOrganizationId).done((data) => {
          this.setState({ newPO: data },
            () => ModalActions.open(PendingPaymentMethodModal.MODAL_ID));
        }).fail(msg => this.setState({ error: msg }));
      }
    } else {
      return PaymentMethodActions.addPurchaseOrder(this.state.poInfo, subdomain, customerOrganizationId)
        .done((data) => {
          this.setState({ newPO: data }, () =>
            ModalActions.open(PendingPaymentMethodModal.MODAL_ID)
          );
        })
        .fail(msg => this.setState({ error: msg }));
    }
  }

  canPurchaseOrderUpdate(stateExpirydate, stateInputs) {
    const { expiry, ...inputValues } = this.inputValues;
    const dateMatch =  (expiry && expiry.format('YYYY-MM-DD')) === (stateExpirydate && stateExpirydate.format('YYYY-MM-DD'));
    this.props.canPurchaseOrderUpdate(_.isEqual(inputValues, stateInputs) && dateMatch);
  }

  render() {
    const pending_methods = PaymentMethodStore.getAllPending();
    const url = this.props && this.props.data && this.props.data.get('po_attachment_url');

    return (
      <div className="payment-info">
        <PendingPaymentMethodModal
          onDismissed={() => {
            if (this.props.onPendingPaymentMethodAdded) {
              this.props.onPendingPaymentMethodAdded(this.state.newPO);
            }
          }}
        />
        <If condition={this.state.error != undefined}>
          <div className="alert alert-danger">
            <strong>Error</strong>
            {` ${this.state.error} `}
          </div>
        </If>
        <If condition={pending_methods.size > 0}>
          <div className="alert alert-warning">
            <strong>Pending Payment Methods: </strong>
            {`You have ${pending_methods.size}
              ${inflect('payment method', pending_methods.size)} pending staff review.`}
            <ul>
              {pending_methods.map((pm) => {
                return (
                  <li key={pm.get('id')}>
                    {pm.get('description')}
                  </li>
                );
              })}
            </ul>
          </div>
        </If>
        <If condition={this.state.showBanner}>
          <div className="paymentinfo__banner">
            <Banner
              bannerType="warning"
              bannerMessage="If the PO details have changed please make sure to also update the attachment"
            />
          </div>
        </If>
        <Choose>
          <When condition={this.props.modalType === 'creditcard'}>
            <CreditCardInfoEditor
              cardInfo={this.state.cardInfo}
              onChange={cardInfo => this.setState({ cardInfo })}
            />
          </When>
          <Otherwise>
            <PurchaseOrderInfoEditor
              poInfo={this.state.poInfo}
              onChange={poInfo => this.setState({ poInfo }, () => {
                const { expiry, ...inputValues } = this.state.poInfo;
                this.canPurchaseOrderUpdate(expiry, inputValues);
              })}
              address_id={this.state.poInfo.address_id}
              attachmentUrl={url}
              customerOrganizationId={this.props.customerOrganizationId}
            />
          </Otherwise>
        </Choose>
      </div>
    );
  }
}

const ConnectedPaymentInfoModal = ConnectToStores(PaymentInfoModal, () => {});

export {
  PaymentInfo,
  ConnectedPaymentInfoModal as PaymentInfoModal
};
