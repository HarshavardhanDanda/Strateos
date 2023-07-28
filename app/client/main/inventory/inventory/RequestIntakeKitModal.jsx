import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import IntakeKitActions from 'main/actions/IntakeKitActions';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import ModalActions from 'main/actions/ModalActions';
import { MultiStepModalWrapper, MultiStepModalPane } from 'main/components/Modal';
import PaymentMethodSelector from 'main/components/PaymentMethodSelector';
import AddressUI from 'main/components/address';
import { Select, Button, Tooltip, Banner, ModalDrawer } from '@transcriptic/amino';
import IntakeKitStore from 'main/stores/IntakeKitStore';
import { PaymentInfoModal } from 'main/organization/PaymentInfo';
import FeatureStore from 'main/stores/FeatureStore.js';
import FeatureConstants from '@strateos/features';
import titleize from 'underscore.string/titleize';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import ContainerTypeActions from 'main/actions/ContainerTypeActions';
import AddressActions from 'main/actions/AddressActions';
import AddressStore from 'main/stores/AddressStore';
import PaymentMethodActions from 'main/actions/PaymentMethodActions';
import Urls from 'main/util/urls';

/* LOGIC HELPERS */
const ChooseContainersLogic = {

  initialInputValues() {
    return Immutable.Map({
      a1Vial: '1',
      d1Vial: '1',
      d2Vial: '1',
      force_validate: false
    });
  },

  forceErrors(inputValues) {
    return inputValues.set('force_validate', true);
  },

  tooFewError(inputValues) {
    const a1Vials = parseInt(inputValues.get('a1Vial'), 10);
    const d1Vials = parseInt(inputValues.get('d1Vial'), 10);
    const d2Vials = parseInt(inputValues.get('d2Vial'), 10);

    if (a1Vials + d1Vials + d2Vials <= 0) {
      return 'Must choose at least one item';
    }

    return undefined;
  },

  isValid(inputValues) {
    return this.tooFewError(inputValues) == undefined;
  }
};

const RACK_OF_VIALS = Immutable.Map({
  a1Vial: 24,
  d1Vial: 12,
  d2Vial: 8
});

const PAYMENT_INFO_MODAL_ID = 'REQUEST_INTAKE_KIT_PAYMENT_MODAL';

/* View */
class RequestIntakeKitModal extends React.PureComponent {

  static get navigation() {
    return [
      'Select containers',
      'Confirm shipping method',
      'Kit request confirmation'
    ];
  }

  static get navigationIcons() {
    return ['fas fa-vial', 'far fa-shipping-fast',  'fal fa-box-check'];
  }

  static get MODAL_ID() {
    return 'RequestIntakeKitModal';
  }

  constructor(props, context) {
    super(props, context);

    _.bindAll(
      this,
      'onNavigateToDelivery',
      'onSubmit',
      'setCharge',
      'setBanner'
    );

    this.state = {
      addressId: undefined,
      navIndex: undefined, // used to link and jump to pane outside of modal header
      quantityInputValues: ChooseContainersLogic.initialInputValues(),
      waitingOnSubmit: false,
      labId: undefined,
      paymentMethodId: undefined,
      paymentMethodsCount: undefined,
      charge: undefined,
      vials: Immutable.List()
    };
  }

  componentDidMount() {
    LabConsumerActions.loadLabsForCurrentOrg().done(() => {
      const firstLabConsumer = LabConsumerStore.getAllForCurrentOrg().first();
      if (firstLabConsumer) {
        this.setState({ labId: firstLabConsumer.getIn(['lab', 'id']) });
      }
    });
    this.getGlassVials();
    this.loadAllAddresses();
    this.loadAllPaymentMethods();
  }

  loadAllAddresses() {
    AddressActions.loadAll()
      .done((response) => {
        if (!this.state.addressId && !_.isEmpty(response)) {
          this.setState({ addressId: response[0].id });
        }
      });
  }

  loadAllPaymentMethods() {
    PaymentMethodActions.loadAll()
      .done(paymentMethods => {
        const isValidPurchaseOrder = paymentMethods.filter(paymentMethod => paymentMethod.is_valid && !paymentMethod['expired?'] && !_.isEmpty(paymentMethod.po_approved_at)).length > 0;
        this.setState({
          paymentMethodsCount: paymentMethods.length,
          isValidPurchaseOrder: isValidPurchaseOrder
        });
      });
  }

  setBanner() {
    return (
      !this.state.isValidPurchaseOrder && (
        <Banner
          bannerType="error"
          bannerMessage={(
            <span>
              Unfortunately, we don’t have a valid purchase order on file.  Please contact your admin or add new purchase order to your organization.
              {FeatureStore.hasFeature(FeatureConstants.ADMINISTRATION) && (
                <a className="banner-button" onClick={() => this.props.history.push(Urls.organization_billing())}>Update</a>
              )}
            </span>
          )}
        />
      )
    );
  }

  getGlassVials() {
    let glassVials = Immutable.fromJS(ContainerTypeStore.getByIds(['a1-vial', 'd1-vial', 'd2-vial']));
    if (glassVials.size) {
      this.setState({ vials: glassVials });
      return;
    }
    ContainerTypeActions.loadAll().done(() => {
      glassVials = Immutable.fromJS(ContainerTypeStore.getByIds(['a1-vial', 'd1-vial', 'd2-vial']));
      this.setState({ vials: glassVials });
    });
  }

  onNavigateToDelivery(navigateNext) {
    if (ChooseContainersLogic.isValid(this.state.quantityInputValues)) {
      navigateNext();
    } else {
      const newValues = ChooseContainersLogic.forceErrors(this.state.quantityInputValues);

      this.setState({ quantityInputValues: newValues });
    }
  }

  setCharge(totalCost) {
    this.setState({ charge: totalCost });
  }

  onGreat() {
    ModalActions.close(RequestIntakeKitModal.MODAL_ID);
  }

  onSubmit(navigateNext) {
    this.setState({ waitingOnSubmit: true }, () => {
      const a1Vial = Number(this.state.quantityInputValues.get('a1Vial'));
      const d1Vial  = Number(this.state.quantityInputValues.get('d1Vial'));
      const d2Vial  = Number(this.state.quantityInputValues.get('d2Vial'));

      const count     = IntakeKitStore.size();
      const name      = `Intake Kit ${count}`;

      const intakeKitItems = [
        { container_type_id: 'a1-vial', quantity: a1Vial }, { container_type_id: 'd1-vial', quantity: d1Vial }, { container_type_id: 'd2-vial', quantity: d2Vial }
      ];

      const intakeKitItemAttributes = intakeKitItems.filter(vial => {
        return vial.quantity !== 0;
      });

      const intakeKit = {
        name: name,
        address_id: this.state.addressId,
        lab_id: this.state.labId,
        intake_kit_items_attributes: intakeKitItemAttributes,
        payment_method_id: this.state.paymentMethodId,
        charge: this.state.charge.toString()
      };
      IntakeKitActions.create(intakeKit)
        .fail((xhr) => {
          if (xhr.status === 402) {
            ModalActions.open(PAYMENT_INFO_MODAL_ID);
          }

          this.setState({ waitingOnSubmit: false });
        })
        .done(() => {
          this.setState({ waitingOnSubmit: false });
          navigateNext();
        });
    });
  }

  renderChooseContainers() {
    return (
      <MultiStepModalPane key="RenderContainers" showBackButton={false} beforeNavigateNext={this.onNavigateToDelivery} nextBtnName="Review" nextBtnDisabled={!this.state.isValidPurchaseOrder}>
        <ChooseContainers
          inputValues={this.state.quantityInputValues}
          vials={this.state.vials}
          onInputValuesChange={(values) => {
            this.setState({ quantityInputValues: this.state.quantityInputValues.merge(values) });
          }}
        />
      </MultiStepModalPane>
    );
  }

  renderConfirmShipmentMethod() {
    return (
      <MultiStepModalPane
        key="RenderDelivery"
        beforeNavigateNext={this.onSubmit}
        nextBtnDisabled={this.state.addressId == undefined}
        nextBtnName="Submit"
        waitingOnResponse={this.state.waitingOnSubmit}
      >
        <ReviewKitItems
          vials={this.state.vials}
          inputValues={this.state.quantityInputValues}
          title={'Review your kit items'}
          getTotalCost={this.setCharge}
          boldText
        />
        <ChooseDelivery
          addressId={this.state.addressId}
          onAddressIdChange={addressId => this.setState({ addressId })}
        />
        <PaymentInfoModal
          modalId={PAYMENT_INFO_MODAL_ID}
          onValidPaymentMethodAdded={pm => this.setState({ paymentMethodId: pm.id })}
          onPendingPaymentMethodAdded={pm => this.setState({ paymentMethodId: pm.id })}
        />
        <ChoosePaymentMethod
          onPaymentMethodSelected={id => this.setState({ paymentMethodId: id })}
          paymentMethodId={this.state.paymentMethodId}
          isPaymentMethodExist={this.state.paymentMethodsCount}
        />
      </MultiStepModalPane>
    );
  }

  renderSuccess() {
    return (
      <MultiStepModalPane
        key="RenderSuccess"
        nextBtnName="Great!"
        showBackButton={false}
        beforeNavigateNext={this.onGreat}
      >
        <KitRequestSuccess />
        <ReviewKitItems
          vials={this.state.vials}
          inputValues={this.state.quantityInputValues}
          title={'Your order summary'}
          boldText={false}
        />
      </MultiStepModalPane>
    );
  }

  render() {
    return (
      <MultiStepModalWrapper
        currPaneIndex={this.state.navIndex}
        paneTitles={Immutable.List(RequestIntakeKitModal.navigation)}
        title="Intake kit request"
        modalId={RequestIntakeKitModal.MODAL_ID}
        modalSize="large"
        stepHeaderIsClickable={() => false}
        renderBanner={this.setBanner}
        paneIcons={Immutable.List(RequestIntakeKitModal.navigationIcons)}
      >
        {[
          this.renderChooseContainers(),
          this.renderConfirmShipmentMethod(),
          this.renderSuccess()
        ]}
      </MultiStepModalWrapper>
    );
  }
}

class ChooseContainers extends React.PureComponent {

  static get propTypes() {
    return {
      inputValues:         PropTypes.instanceOf(Immutable.Iterable).isRequired,
      onInputValuesChange: PropTypes.func.isRequired,
      vials: PropTypes.instanceOf(Immutable.List).isRequired
    };
  }

  getCurrentVial(inputName) {
    return inputName === 'A1 vial' ? 'a1Vial' : inputName === 'D1 vial' ? 'd1Vial' : 'd2Vial';
  }

  render() {
    const tooFew = ChooseContainersLogic.tooFewError(this.props.inputValues);
    const quantityOptions = [0, 1, 2, 3, 4, 5].map(i => ({ value: i.toString(), name: i.toString() }));

    return (
      <div className="request-intake-kit__choose-containers row">
        <div className="body-container tx-stack tx-stack--xlg">
          <div className="col-sm-11">
            <h3 className="tx-type--heavy">{"Let's get started by selecting required containers for your experiment"}</h3>
          </div>
          <If condition={tooFew && this.props.inputValues.get('force_validate')}>
            <div className="alert alert-danger">{tooFew}</div>
          </If>
          <div className="col-sm-11">
            <div className="col-sm-12 vial-data">
              <div className="col-sm-5"><p className="tx-type--heavy">CONTAINER TYPE</p></div>
              <div className="col-sm-4">
                <div className="col-sm-9">
                  <p className="tx-type--heavy">QUANTITY</p>
                </div>
              </div>
              <div className="col-sm-3"><p className="tx-type--heavy">COST</p></div>
            </div>
            <If condition={this.props.vials && this.props.vials.size}>
              {this.props.vials.map((vial, index) => {
                const currentVial = this.getCurrentVial(vial.get('name'));
                const rackSize = RACK_OF_VIALS.get(currentVial);
                const rackCount = Number(this.props.inputValues.get(currentVial));
                const cost = `${Number(vial.get('cost_each') * rackSize * rackCount).toFixed(2)}`;
                return (
                  <div
                    className="col-sm-12 vial-data"
                    key={`${vial.get('id')}-${index}`}
                  >
                    <div className="col-sm-5">{currentVial !== 'd2Vial' ? titleize(vial.get('name')) : vial.get('name')} - A rack of {rackSize} vials</div>
                    <div className="col-sm-4">
                      <div className="col-sm-9">
                        <Select
                          value={this.props.inputValues.get(currentVial)}
                          options={quantityOptions}
                          onChange={e => this.props.onInputValuesChange({ [currentVial]: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="col-sm-3">{rackCount ? `$${cost}` : '-'}</div>
                  </div>
                );
              })}
            </If>
          </div>
        </div>
      </div>
    );
  }
}

class ChooseDelivery extends React.PureComponent {

  static get propTypes() {
    return {
      addressId:         PropTypes.string,
      onAddressIdChange: PropTypes.func.isRequired
    };
  }

  constructor(props) {
    super(props);
    this.state = { drawerState: false };
  }

  toggleDrawer() {
    this.setState({
      drawerState: !this.state.drawerState
    });
  }

  renderAddressSelector() {
    return (
      <AddressUI.AddressSelector
        onAddressIdChange={this.props.onAddressIdChange}
        addressId={this.props.addressId}
        disableAddressCreation={!FeatureStore.hasFeature(FeatureConstants.ADMINISTRATION)}
        useNewAddressSelectorFormat
      />
    );
  }

  renderFooterButtons() {
    return (
      <React.Fragment>
        <Button
          type="secondary"
          size="small"
          height="standard"
          className="goto-button"
          onClick={() => this.toggleDrawer()}
        >
          Back
        </Button>
        <Button
          type="primary"
          size="small"
          height="standard"
          className="goto-button"
          style={{ marginLeft: '8px' }}
          onClick={() => this.toggleDrawer()}
          disabled={this.props.addressId === undefined}
        >
          Use this address
        </Button>
      </React.Fragment>
    );
  }

  render() {
    const address = AddressStore.getById(this.props.addressId);
    return (
      <div className="request-intake-kit__choose-delivery">
        <div className="address-choice-modal-body">
          <div className="tx-stack tx-stack--xxs tx-inset--xxlg tx-inset--square">
            <h3 className="tx-type--heavy">Shipping Address</h3>
            <div className="row">
              {address ? (
                <React.Fragment>
                  <p className="col-sm-5">{address.get('attention')  && address.get('attention')}{address.get('attention') && <br />}
                    {address.get('street') ? `${address.get('street')},` : ''} {address.get('street_2') ? `${address.get('street_2')},` : ''} {address.get('city')}, {address.get('country')} {address.get('zipcode')}
                  </p>
                  <p><a onClick={() => this.toggleDrawer()}> Change Address </a></p>
                </React.Fragment>
              ) : <p className="col-sm-5"><a onClick={() => this.toggleDrawer()}> Add New Address </a></p>}
            </div>
            <ModalDrawer
              title="Your Addresses"
              drawerState={this.state.drawerState}
              onDrawerClose={() => this.toggleDrawer()}
              drawerChildren={this.renderAddressSelector()}
              drawerFooterChildren={this.renderFooterButtons()}
            />
          </div>
        </div>
      </div>
    );
  }
}

class ChoosePaymentMethod extends React.PureComponent {

  static get propTypes() {
    return {
      paymentMethodId:         PropTypes.string,
      onPaymentMethodSelected: PropTypes.func.isRequired,
      isPaymentMethodExist: PropTypes.number
    };
  }

  render() {
    return (
      <div className="request-intake-kit__choose-delivery">
        <div className="address-choice-modal-body">
          <div className="tx-stack tx-stack--xxs tx-inset--xxlg tx-inset--square">
            <h3 className="tx-type--heavy">Payment method</h3>
            <div className="row payment-method">
              {this.props.isPaymentMethodExist ? (
                <div className="col-sm-5">
                  <PaymentMethodSelector
                    onPaymentMethodSelected={this.props.onPaymentMethodSelected}
                    paymentMethodId={this.props.paymentMethodId}
                    hideAddOption
                  />
                </div>
              ) : <p className="col-sm-3">No Payment Method Exists</p>}
              <div className="col-sm-5">
                <Tooltip
                  placement="right"
                  title="Strateos accepts purchase orders as payment method. To update payment, please contact your Admin or add new purchase order in your organization."
                  invert
                >
                  <i className="fa fa-info-circle" />
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class ReviewKitItems extends React.Component {

  static get propTypes() {
    return {
      vials: PropTypes.instanceOf(Immutable.List).isRequired,
      inputValues: PropTypes.instanceOf(Immutable.Map),
      title: PropTypes.string.isRequired,
      boldText: PropTypes.bool.isRequired
    };
  }

  getCurrentVial(vial) {
    return vial.get('name') === 'A1 vial' ? 'a1Vial' : vial.get('name') === 'D1 vial' ? 'd1Vial' : 'd2Vial';
  }

  renderKitItemValues() {
    const { vials, inputValues, getTotalCost } = this.props;
    const totalCost = vials.reduce((acc, vial) => {
      const currentVial = this.getCurrentVial(vial);
      return acc + (vial.get('cost_each') *  RACK_OF_VIALS.get(currentVial) * inputValues.get(currentVial));
    }, 0);
    if (getTotalCost != undefined) { getTotalCost(totalCost); }

    return (
      <div>
        {vials.map((vial, index) => {
          const currentVial = this.getCurrentVial(vial);
          const rackSize = RACK_OF_VIALS.get(currentVial);
          return (
            <div
              className="col-sm-12 vial-data"
              key={`${vial.get('id')}-${index}`}
            >
              <div className="col-sm-5">{currentVial !== 'd2Vial' ? titleize(vial.get('name')) : vial.get('name')} - A rack of {rackSize} vials</div>
              <div className="col-sm-4">
                <div className="col-sm-9">
                  {inputValues.get(currentVial)}
                </div>
              </div>
              <div className="col-sm-3">${Number(vial.get('cost_each') * rackSize * inputValues.get(currentVial)).toFixed(2)}</div>
            </div>
          );
        })}
        <div className="col-sm-12 total-cost">
          <div className="col-sm-5" />
          <div className="col-sm-4" />
          <div className="col-sm-3">
            <b>Total Cost: $
              {Number(totalCost).toFixed(2)}
            </b>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { vials, title, boldText } = this.props;

    return (
      <div className="request-intake-kit__choose-containers row">
        <div className="body-container tx-stack tx-stack--sm">
          <div className="col-sm-11">
            <h3 className={boldText ? 'tx-type--heavy' : ' '}>{title}</h3>
          </div>
          <div className="col-sm-11 table-border">
            <div className="col-sm-12 vial-data">
              <div className="col-sm-5"><p className="tx-type--heavy">CONTAINER TYPE</p></div>
              <div className="col-sm-4">
                <div className="col-sm-9">
                  <p className="tx-type--heavy">QUANTITY</p>
                </div>
              </div>
              <div className="col-sm-3"><p className="tx-type--heavy">COST</p></div>
            </div>
            { vials && vials.size && this.renderKitItemValues() }
          </div>
        </div>
      </div>
    );
  }
}

class KitRequestSuccess extends React.PureComponent {

  render() {
    return (
      <div className="request-intake-kit__kit-request-success">
        <div className="success-modal-body">
          <div className="body-container">
            <img alt="check" src="/images/materials-illustration.svg" />
            <h2>Thank you for submitting your request! </h2>
            <p className="tx-type--secondary">Your intake kit will arrive in 3-5 business days.</p>
          </div>
        </div>
        <div className="goto-modal-body">
          <div className="body-container" />
        </div>
      </div>
    );
  }
}

export default RequestIntakeKitModal;
export { ReviewKitItems, ChooseContainers, ChooseDelivery, ChoosePaymentMethod };
