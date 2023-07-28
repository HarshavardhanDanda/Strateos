import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import Immutable from 'immutable';
import { expect } from 'chai';
import AddressStore from 'main/stores/AddressStore';

import  RequestIntakeKitModal, { ReviewKitItems, ChooseDelivery, ChoosePaymentMethod, ChooseContainers }  from 'main/inventory/inventory/RequestIntakeKitModal.jsx';
import { Banner } from '@transcriptic/amino';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
import IntakeKitActions from 'main/actions/IntakeKitActions';
import labConsumerData from 'main/test/labconsumer/testData.json';

describe('RequestIntakeKitModal', () => {
  let wrapper;

  const mockLabConsumers = Immutable.fromJS([labConsumerData[0]]);

  beforeEach(() => {
    sandbox.stub(LabConsumerActions, 'loadLabsForCurrentOrg').returns({ done: (cb) => cb() });
    sandbox.stub(LabConsumerStore, 'getAllForCurrentOrg').returns(mockLabConsumers);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  const sandbox = sinon.createSandbox();
  it('should render without error', () => {

    wrapper = shallow(
      <RequestIntakeKitModal />
    );

    const panes = wrapper.find('Pane');
    expect(panes.length).to.equal(3);
  });

  it('should have three components in Confirm Shipment Method pane', () => {
    wrapper = shallow(
      <RequestIntakeKitModal />
    );
    expect(wrapper.find('Pane').find('ReviewKitItems')).to.exist;
    expect(wrapper.find('Pane').find('ChooseDelivery')).to.exist;
    expect(wrapper.find('Pane').find('ChoosePaymentMethod')).to.exist;
  });

  // it('should render custom icons from multi setp tracker by passing setCustomPaneTitleIcons function to MultiPaneModal', () => {
  //   wrapper = shallow(
  //     <RequestIntakeKitModal />
  //   );
  //   const multiStepTracker = wrapper.find('MultiPaneModal').dive().find('ConnectedModal').dive()
  //     .find('Modal')
  //     .dive()
  //     .find('MultiPaneModal')
  //     .dive()
  //     .find('PizzaTracker')
  //     .dive();
  //   const steps = multiStepTracker.find('.pizza-tracker__step');
  //   expect(steps.length).to.equal(3);

  //   expect(steps.at(0).props().step.iconClass).to.equal('fas fa-vial');
  //   expect(steps.at(1).props().step.iconClass).to.equal('far fa-shipping-fast');
  //   expect(steps.at(2).props().step.iconClass).to.equal('fal fa-box-check');
  // });

  it('should have review kit items', () => {
    const glassVials  = Immutable.fromJS(
      [
        {
          cost_each: '4.25',
          name: 'A1 vial',
          id: 'a1-vial'
        },
        {
          cost_each: '7.3',
          name: 'D1 vial',
          id: 'd1-vial'
        },
        {
          cost_each: '8.65',
          name: 'HRD2 vial',
          id: 'hrd2-vial'
        }
      ]
    );

    wrapper = shallow(
      <ReviewKitItems
        vials={glassVials}
        inputValues={Immutable.Map({
          a1Vial: '1',
          d1Vial: '1',
          d2Vial: '1',
          force_validate: false
        })}
        title={'Review your kit items'}
        boldText
      />
    );

    expect(wrapper.find('h3').text()).to.eql('Review your kit items');
    expect(wrapper.find('div.col-sm-5').at(0).text()).to.eql('CONTAINER TYPE');
    expect(wrapper.find('div.col-sm-9').at(0).text()).to.eql('QUANTITY');
    expect(wrapper.find('div.col-sm-3').at(0).text()).to.eql('COST');
    expect(wrapper.find('div.col-sm-5').at(1).text()).to.eql('A1 Vial - A rack of 24 vials');
    expect(wrapper.find('div.col-sm-9').at(1).text()).to.eql('1');
    expect(wrapper.find('div.col-sm-3').at(1).text()).to.eql('$102.00');
    expect(wrapper.find('div.col-sm-5').at(2).text()).to.eql('D1 Vial - A rack of 12 vials');
    expect(wrapper.find('div.col-sm-9').at(2).text()).to.eql('1');
    expect(wrapper.find('div.col-sm-3').at(2).text()).to.eql('$87.60');
    expect(wrapper.find('div.col-sm-5').at(3).text()).to.eql('HRD2 vial - A rack of 8 vials');
    expect(wrapper.find('div.col-sm-9').at(3).text()).to.eql('1');
    expect(wrapper.find('div.col-sm-3').at(3).text()).to.eql('$69.20');
    expect(wrapper.find('div.col-sm-3').at(4).text()).to.eql('Total Cost: $258.80');
  });

  it('Renders with correct address from AddressStore', () => {

    const addressStoreSpy = sandbox.spy(AddressStore, 'getById');

    wrapper = shallow(
      <ChooseDelivery
        addressId={'addr188rr9ukd7ry'}
        onAddressIdChange={() => {}}
      />);

    expect(addressStoreSpy.called).to.be.true;
    expect(addressStoreSpy.calledWith('addr188rr9ukd7ry')).to.be.true;

  });

  it('Choose containers renders correctly', () => {
    const glassVials  = Immutable.fromJS(
      [
        {
          cost_each: '4.25',
          name: 'A1 vial',
          id: 'a1-vial',
        },
        {
          cost_each: '7.3',
          id: 'd1-vial',
          name: 'D1 vial'
        },
        {
          cost_each: '8.65',
          name: 'HRD2 vial',
          id: 'HRD2-vial'
        }
      ]
    );

    wrapper = shallow(
      <ChooseContainers
        inputValues={
            Immutable.Map({
              a1Vial: '1',
              d1Vial: '1',
              d2Vial: '1',
              force_validate: false
            })}
        vials={glassVials}
        onInputValuesChange={() => {}}
      />);

    expect(wrapper.find('h3').text()).to.eql("Let's get started by selecting required containers for your experiment");
    expect(wrapper.find('div.col-sm-5').at(0).text()).to.eql('CONTAINER TYPE');
    expect(wrapper.find('div.col-sm-9').at(0).text()).to.eql('QUANTITY');
    expect(wrapper.find('div.col-sm-3').at(0).text()).to.eql('COST');
    expect(wrapper.find('div.col-sm-5').at(1).text()).to.eql('A1 Vial - A rack of 24 vials');
    expect(wrapper.find('div.col-sm-9').at(1).find('Select').props().value).to.eql('1');
    expect(wrapper.find('div.col-sm-3').at(1).text()).to.eql('$102.00');
    expect(wrapper.find('div.col-sm-5').at(2).text()).to.eql('D1 Vial - A rack of 12 vials');
    expect(wrapper.find('div.col-sm-9').at(2).find('Select').props().value).to.eql('1');
    expect(wrapper.find('div.col-sm-3').at(2).text()).to.eql('$87.60');
    expect(wrapper.find('div.col-sm-5').at(3).text()).to.eql('HRD2 vial - A rack of 8 vials');
    expect(wrapper.find('div.col-sm-9').at(3).find('Select').props().value).to.eql('1');
    expect(wrapper.find('div.col-sm-3').at(3).text()).to.eql('$69.20');
  });

  it('Choosing payment method works', () => {
    wrapper = shallow(<ChoosePaymentMethod
      onPaymentMethodSelected={() => {}}
      paymentMethodId={'pm1dffyk3tbmwsw'}
      isPaymentMethodExist={1}
    />);

    expect(wrapper.find('Tooltip').props().title).to.eql('Strateos accepts purchase orders as payment method. To update payment, please contact your Admin or add new purchase order in your organization.');
    expect(wrapper.find('Tooltip').find('i').hasClass('fa fa-info-circle'));
    expect(wrapper.find('ConnectedPaymentMethodSelector').props().paymentMethodId).to.eql('pm1dffyk3tbmwsw');
  });

  it('should not render error banner when purchase order is valid', () => {
    wrapper = shallow(
      <RequestIntakeKitModal />
    );
    wrapper.instance().setState({ isValidPurchaseOrder: true });
    expect(wrapper.find('ConnectedMultiPaneModal').dive().find('MultiPaneModal').dive()
      .find('MultiPaneModal')
      .dive()
      .find(Banner).length).to.be.equal(0);
  });

  it('should render error banner when purchase order does not exist or not valid', () => {
    wrapper = shallow(
      <RequestIntakeKitModal />
    );
    wrapper.instance().setState({ isValidPurchaseOrder: false });
    expect(wrapper.find('ConnectedMultiPaneModal').dive().find('MultiPaneModal').dive()
      .find('MultiPaneModal')
      .dive()
      .find(Banner).length).to.be.equal(1);
  });

  it('should not have Update action on banner when user did not have admin privilege', () => {
    wrapper = shallow(
      <RequestIntakeKitModal />
    );
    wrapper.instance().setState({ isValidPurchaseOrder: false });
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.ADMINISTRATION).returns(false);
    const banner = wrapper.find('ConnectedMultiPaneModal').dive().find('MultiPaneModal').dive()
      .find('MultiPaneModal')
      .dive()
      .find(Banner)
      .dive();
    expect(banner.find('a').length).to.be.equal(0);
  });

  it('should have Update action on banner when user has admin privilege', () => {
    const redirect = sandbox.spy();
    const props = { history: { push: redirect } };
    wrapper = shallow(
      <RequestIntakeKitModal
        {...props}
      />
    );
    wrapper.instance().setState({ isValidPurchaseOrder: false });
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.ADMINISTRATION).returns(true);
    const banner = wrapper.find('ConnectedMultiPaneModal').dive().find('MultiPaneModal').dive()
      .find('MultiPaneModal')
      .dive()
      .find(Banner)
      .dive();
    expect(banner.find('a').length).to.be.equal(1);
    expect(banner.find('a').at(0).text()).to.equal('Update');
    banner.find('a').at(0).simulate('click');
    expect(redirect.calledOnce).to.be.true;
  });

  it('should disable review button of select containers step when no purchase order or invalid', () => {
    wrapper = shallow(
      <RequestIntakeKitModal />
    );
    wrapper.instance().setState({ isValidPurchaseOrder: false });
    const selectContainerWrapperPane = wrapper.find('ConnectedMultiPaneModal').dive().find('MultiPaneModal').dive()
      .find('Pane')
      .at(0);
    expect(selectContainerWrapperPane.props().nextBtnDisabled).to.be.true;
  });

  it('should call the kit create action on submit', () => {
    const kitCreateSpy = sandbox.spy(IntakeKitActions, 'create');

    wrapper = shallow(
      <RequestIntakeKitModal />
    );
    wrapper.instance().setState({ charge: 123 });
    wrapper.instance().onSubmit();

    expect(kitCreateSpy.calledOnce).to.be.true;
  });

  it('should have labId in state on initial mount', () => {
    wrapper = shallow(
      <RequestIntakeKitModal />
    );
    expect(wrapper.state().labId).to.equal('lab1');
  });
});
