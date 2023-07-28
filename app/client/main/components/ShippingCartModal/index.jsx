import Immutable   from 'immutable';
import { inflect } from 'inflection';
import PropTypes   from 'prop-types';
import React       from 'react';

import { MultiStepModalWrapper, MultiStepModalPane } from 'main/components/Modal';
import ShippingCartStore from 'main/stores/ShippingCartStore';
import ContainerActions from 'main/actions/ContainerActions';
import AddressStore from 'main/stores/AddressStore';
import OrderSummary from 'main/project/launchRun/OrderSummary';
import ReturnShipmentActions from 'main/actions/ReturnShipmentActions';
import ReturnShipmentStore from 'main/stores/ReturnShipmentStore';
import PaymentMethodSelector from 'main/components/PaymentMethodSelector';
import { FormGroup, Spinner, Button } from '@transcriptic/amino';
import EditShipmentOptions from 'main/inventory/inventory/return_shipments/EditShipmentOptions';
import ShipmentContainersSummary from 'main/inventory/inventory/return_shipments/ShipmentContainersSummary';
import ReviewCourierPickup from 'main/inventory/inventory/return_shipments/ReviewCourierPickup';
import CourierPickupInstructions from 'main/inventory/inventory/return_shipments/CourierPickupInstructions';
import courierCopy from 'main/inventory/inventory/return_shipments/courierCopy';
import Address from 'main/components/address';
import ShippingCartActions from 'main/actions/ShippingCartActions';

import VerifySamples from './VerifySamples';

function ShippingOrderSummary(props) {
  return (
    <OrderSummary
      totalLabel="Estimated Total"
      quote={{
        items: [
          { title: `${inflect('Sample', props.count)}`, quantity: props.count, cost: 0 },
          { title: 'Shipping', quantity: 1, cost: props.quote }
        ]
      }}
    />
  );
}

ShippingOrderSummary.propTypes = {
  count: PropTypes.number.isRequired,
  quote: PropTypes.number.isRequired
};

function ReviewShipment(props) {
  const sampleCount = props.containers.count();

  return (
    <div className="order-overview">
      <div className="shipment-summary">
        <ShipmentContainersSummary
          containers={props.containers}
          onEditContainers={props.onEditContainers}
        />
        <div className="shipping-summary">
          <h3>Delivery Options</h3>
          <a onClick={props.onEditShipping}>Edit</a>
          <div className="shipping-temp shipping-option">
            <span>Temp: </span>
            <strong>{props.shippingTemp}</strong>
          </div>
          <div className="shipping-speed shipping-option">
            <span>Speed: </span>
            <strong>{props.shippingSpeed}</strong>
          </div>
          <div className="shipping-address shipping-option">
            <Address.AddressText
              address={AddressStore.getById(props.addressId)}
            />
          </div>
        </div>
      </div>
      <div className="shipping-payment">
        {
          props.waitingOnResponse ? (
            <div className="spinner-container">
              <Spinner />
            </div>
          ) : (
            <div>
              <ShippingOrderSummary
                count={sampleCount}
                quote={props.returnShipment.get('quote').toString()}
              />
            </div>
          )}
        <div className="shipping-payment-method">
          <FormGroup label="Payment Method">
            <PaymentMethodSelector
              onPaymentMethodSelected={props.onPaymentSelected}
              paymentMethodId={props.paymentMethodId}
            />
          </FormGroup>
        </div>
      </div>
    </div>
  );
}

ReviewShipment.propTypes = {
  containers: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  onEditContainers: PropTypes.func.isRequired,
  onEditShipping: PropTypes.func.isRequired,
  shippingSpeed: PropTypes.string.isRequired,
  shippingTemp: PropTypes.string.isRequired,
  addressId: PropTypes.string.isRequired,
  waitingOnResponse: PropTypes.bool.isRequired,
  onPaymentSelected: PropTypes.func.isRequired,
  paymentMethodId: PropTypes.string,
  returnShipment: PropTypes.instanceOf(Immutable.Map)
};

class ShippingCartModal extends React.Component {

  static get propTypes() {
    return {
      errorMessage: PropTypes.string,
      isCourierPickup: PropTypes.bool,
      onDismiss: PropTypes.func,
      modalId: PropTypes.string.isRequired
    };
  }

  constructor(props) {
    super(props);
    this.paneTitles = Immutable.List(['Verify Samples', 'Choose Delivery Options', 'Review Shipment']);
    this.state = this.initialState();
    this.onDismiss = this.onDismiss.bind(this);
    this.renderVerifySamples = this.renderVerifySamples.bind(this);
    this.renderChooseDeliveryOptions = this.renderChooseDeliveryOptions.bind(this);
    this.renderReviewShipment = this.renderReviewShipment.bind(this);
    this.renderSuccess = this.renderSuccess.bind(this);
    this.onNavigateToDeliveryOptions = this.onNavigateToDeliveryOptions.bind(this);
    this.onNavigateToReview = this.onNavigateToReview.bind(this);
    this.onShippingSpeedSelected = this.onShippingSpeedSelected.bind(this);
    this.onShippingTempSelected = this.onShippingTempSelected.bind(this);
    this.onAddressIdChange = this.onAddressIdChange.bind(this);
    this.onPaymentSelected = this.onPaymentSelected.bind(this);
    this.onAuthorizeShipment = this.onAuthorizeShipment.bind(this);
    this.onEditContainers = this.onEditContainers.bind(this);
    this.onEditShipping = this.onEditShipping.bind(this);
    this.canAuthorizeShipment = this.canAuthorizeShipment.bind(this);
    this.setCurrPaneIndex = this.setCurrPaneIndex.bind(this);
  }

  componentWillMount() {
    if (!ShippingCartStore.allContainersReady()) {
      return ContainerActions.loadSpecificIds(ShippingCartStore.keys());
    }
    return undefined;
  }

  onNavigateToDeliveryOptions(navigateToNext) {
    const sampleCount = ShippingCartStore.size();
    if (sampleCount) {
      this.setState({ sampleCount });
      navigateToNext();
      return;
    }
    this.onDismiss();
  }

  onNavigateToReview(navigateToNext) {
    return this.reviewWillLoad(navigateToNext);
  }

  onShippingSpeedSelected(shippingSpeed) { return this.setState({ shippingSpeed }); }

  onShippingTempSelected(shippingTemp) {
    const shippingSpeed = shippingTemp === 'Dry Ice' ? 'Overnight' : '2nd Day';
    return this.setState({ shippingTemp, shippingSpeed });
  }

  onAddressIdChange(addressId) { return this.setState({ addressId }); }

  onPaymentSelected(paymentMethodId) { return this.setState({ paymentMethodId }); }

  onAuthorizeShipment(navigateToNext) {
    return this.setState({ waitingOnResponse: true, errorMessage: undefined }, () => {
      return ReturnShipmentActions.authorize({
        id: this.state.returnShipment.get('id'),
        paymentMethodId: this.state.paymentMethodId
      })
        .done((returnShipment) => {
          return this.setState({
            waitingOnResponse: false,
            returnShipment: ReturnShipmentStore.getById(returnShipment.id)
          }, () => {
            ShippingCartActions.empty();
            return navigateToNext();
          }
          );
        }
        )
        .fail((xhr) => {
          return this.setState({
            waitingOnResponse: false,
            errorMessage: xhr.responseJSON && xhr.responseJSON.error_message
          });
        });
    });
  }

  onDismiss() {
    const { returnShipment } = this.state;
    const status = returnShipment && returnShipment.get('status');

    if (status === 'created') {
      ReturnShipmentActions.destroy_abandoned(returnShipment.get('id'));
    }

    this.setState(this.initialState());
    this.props.onDismiss();
  }

  onEditContainers() { return this.setState({ currPaneIndex: 0 }); }
  onEditShipping() { return this.setState({ currPaneIndex: 1 }); }

  setCurrPaneIndex(index) {
    this.setState({ currPaneIndex: index });
  }

  configurationIsValid() {
    if (this.state.isCourierPickup) {
      return !!this.state.courierName;
    }
    return !!this.state.addressId;
  }

  canAuthorizeShipment() {
    if (!this.state.returnShipment || this.state.errorMessage) {
      return false;
    } else if (this.state.isCourierPickup) {
      return true;
    }
    return !!this.state.paymentMethodId;
  }

  reviewWillLoad(navigateToNext) {
    return this.setState({ waitingOnResponse: true, errorMessage: undefined }, () => {
      const attrs = this.serializeShipment();
      if (this.state.returnShipment) {
        attrs.id = this.state.returnShipment.get('id');
        return ReturnShipmentActions.update(attrs)
          .done((returnShipment) => {
            this.setState({
              waitingOnResponse: false,
              returnShipment: ReturnShipmentStore.getById(returnShipment.id)
            });
            return navigateToNext();
          })
          .fail((xhr) => {
            this.setState({
              waitingOnResponse: false,
              errorMessage: xhr.responseJSON && xhr.responseJSON.error_message
            });
            return undefined;
          });
      }
      return ReturnShipmentActions.create(attrs)
        .done((returnShipment) => {
          this.setState({
            waitingOnResponse: false,
            returnShipment: ReturnShipmentStore.getById(returnShipment.id)
          });
          return navigateToNext();
        })
        .fail((xhr) => {
          this.setState({
            waitingOnResponse: false,
            errorMessage: xhr.responseJSON && xhr.responseJSON.error_message
          });
          return undefined;
        });
    });
  }

  serializeShipment() {
    const containerIds = ShippingCartStore.getContainers().map(container => container.get('id'));
    if (this.state.isCourierPickup) {
      return {
        containerIds,
        addressId: this.state.addressId,
        isCourierPickup: true,
        carrier: this.state.courierName
      };
    }
    return {
      containerIds,
      addressId: this.state.addressId,
      speed: this.state.shippingSpeed,
      temp: this.state.shippingTemp,
      isCourierPickup: false
    };
  }

  initialState() {
    return {
      waitingOnResponse: false,
      shippingSpeed:     '2nd Day',
      shippingTemp:      'Ambient',
      addressId:         undefined,
      returnShipment:    undefined,
      paymentMethodId:   undefined,
      sampleCount:       ShippingCartStore.size(),
      errorMessage:      undefined,
      isCourierPickup:   false,
      courierName:       undefined
    };
  }

  renderVerifySamples() {

    return (
      <MultiStepModalPane
        beforeNavigateNext={this.onNavigateToDeliveryOptions}
        nextBtnDisabled={this.state.showBadSealMessage && !this.state.hasAcceptedBadSealMessage}
        showBackButton={false}
        key="verifySamplesPane"
      >
        <div className="shipping-cart-modal">
          <VerifySamples
            waitingOnContainers={!ShippingCartStore.allContainersReady()}
            containers={ShippingCartStore.getContainers()}
            reportSealCheckChange={e => this.setState({ hasAcceptedBadSealMessage: e.target.checked })}
            reportBadSealMessagePresence={presence => this.setState({ showBadSealMessage: presence })}
            hasAcceptedBadSealMessage={this.state.hasAcceptedBadSealMessage}
          />
        </div>
      </MultiStepModalPane>
    );
  }

  renderChooseDeliveryOptions() {
    return (
      <MultiStepModalPane
        renderFooter
        beforeNavigateNext={this.onNavigateToReview}
        nextBtnDisabled={!this.configurationIsValid()}
        waitingOnResponse={this.state.waitingOnResponse}
        key="chooseDeliveryOptionsPane"
      >
        <div className="shipping-cart-modal">
          <div className="delivery-options">
            <div className="row">
              <h2 className="col-md-4 col-md-offset-4 shipping-cart-modal__title">
                {
                  this.state.isCourierPickup ?
                    'Courier Delivery Options'
                    :
                    'Mail Delivery Options'
                }
              </h2>
              <small
                className={'shipping-cart-modal__toggle-delivery-type shipping-cart-modal__title ' +
                'link-style-button col-md-4 col-md-offset-4'}
                onClick={() => {
                  this.setState({ isCourierPickup: !this.state.isCourierPickup });
                }}
              >
                {
                  this.state.isCourierPickup ?
                    'I\'ll use regular shipping instead'
                    :
                    'I\'ll have a courier pick this up instead'
                }
              </small>
            </div>
            <div className="row show-grid">
              <EditShipmentOptions
                isCourierPickup={this.state.isCourierPickup}
                courierName={this.state.courierName}
                onChangeCourierName={courierName => this.setState({ courierName })}
                shippingSpeed={this.state.shippingSpeed}
                shippingTemp={this.state.shippingTemp}
                onShippingSpeedSelected={this.onShippingSpeedSelected}
                onShippingTempSelected={this.onShippingTempSelected}
                addressId={this.state.addressId}
                onAddressIdChange={this.onAddressIdChange}
              />
            </div>
          </div>
        </div>
      </MultiStepModalPane>
    );
  }

  renderReviewShipment() {
    const renderCourierReview = () => {
      return (
        this.state.waitingOnResponse ?
          <Spinner />
          : (
            <ReviewCourierPickup
              containers={ShippingCartStore.getContainers()}
              onEditContainers={this.onEditContainers}
              onEditShipping={this.onEditShipping}
              courierName={this.state.returnShipment.get('carrier')}
              trackingNumber={this.state.returnShipment.get('tracking_number')}
            />
          )
      );
    };

    const renderShipmentReview = () => {
      if (!this.state.shippingSpeed || !this.state.shippingTemp || !this.state.addressId) {
        return <Spinner />;
      }
      return (
        <ReviewShipment
          containers={ShippingCartStore.getContainers()}
          shippingSpeed={this.state.shippingSpeed}
          shippingTemp={this.state.shippingTemp}
          addressId={this.state.addressId}
          returnShipment={this.state.returnShipment}
          paymentMethodId={this.state.paymentMethodId}
          onPaymentSelected={this.onPaymentSelected}
          errorMessage={this.state.errorMessage}
          onEditContainers={this.onEditContainers}
          onEditShipping={this.onEditShipping}
          waitingOnResponse={this.state.waitingOnResponse}
        />
      );
    };

    return (
      <MultiStepModalPane
        renderFooter
        beforeNavigateNext={this.onAuthorizeShipment}
        nextBtnName="Authorize"
        nextBtnDisabled={!this.canAuthorizeShipment()}
        waitingOnResponse={this.state.waitingOnResponse}
        showBackButton
        showNext
        key="shipmentReviewPane"
      >
        <div className="shipping-cart-modal">
          <div className="review-shipment">
            <h2 className="modal__body-title">Review Your Shipment</h2>
            {
              this.props.errorMessage ?
                <div className="error-message alert alert-danger">{this.props.errorMessage}</div>
                :
                undefined
            }
            {
              this.props.isCourierPickup ?
                renderCourierReview()
                :
                renderShipmentReview()
            }
          </div>
        </div>
      </MultiStepModalPane>
    );
  }

  renderSuccess() {
    if (!this.state.returnShipment || !this.state.sampleCount) return <Spinner key="successPane" />;
    return (
      <MultiStepModalPane
        isFinalPane
        key="successPane"
      >
        <div className="shipping-cart-modal">
          <div className="shipment-order-success">
            <img src="/images/icons/inventory_browser_icons/success-check.svg" alt="success" />
            <h2>We&apos;ll prepare your samples for shipment ASAP.</h2>
            <div>Shipment ID: {this.state.returnShipment.get('id')}</div>
            <ShippingOrderSummary
              count={this.state.sampleCount}
              quote={this.state.returnShipment.get('quote')}
            />
            {
              this.state.isCourierPickup ? [
                <CourierPickupInstructions
                  key="courier-pickup-instructions"
                  courierName={this.state.returnShipment.get('carrier')}
                  trackingNumber={this.state.returnShipment.get('tracking_number')}
                />,
                <div key="courier-pickup-copy">{courierCopy}</div>,
                <Button
                  type="primary"
                  size="large"
                  height="tall"
                  key="ok-dismiss-button"
                  onClick={this.onDismiss}
                >
                  OK
                </Button>
              ] :
                [
                  <div key="shipping-note" className="shipping-note ">
                    Samples are shipped as soon as possible, taking into account shipping
                    days that would result in your shipment arriving on a weekend.
                  </div>,
                  <Button
                    type="primary"
                    size="large"
                    height="tall"
                    key="ok-dismiss-button"
                    onClick={this.onDismiss}
                  >
                    OK
                  </Button>
                ]
            }
          </div>
        </div>
      </MultiStepModalPane>
    );
  }

  render() {
    return (
      <MultiStepModalWrapper
        paneTitles={this.paneTitles}
        title="Request Sample Return"
        modalId={this.props.modalId}
        currPaneIndex={this.state.currPaneIndex}
        paneIndexReporter={this.setCurrPaneIndex}
        closeOnClickOut={false}
        modalSize="large"
        allowOverflow
        onDismissed={() => this.setState(this.initialState())}
      >
        {[
          this.renderVerifySamples(),
          this.renderChooseDeliveryOptions(),
          this.renderReviewShipment(),
          this.renderSuccess()
        ]}
      </MultiStepModalWrapper>
    );
  }
}

export default ShippingCartModal;
