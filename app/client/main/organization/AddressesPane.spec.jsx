import React       from 'react';
import { expect }  from 'chai';
import { shallow } from 'enzyme';
import Immutable   from 'immutable';
import sinon       from 'sinon';
import SessionStore from 'main/stores/SessionStore';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import AddressText from 'main/components/addressLib/addressText';
import {  Card, Table } from '@transcriptic/amino';
import FeatureConstants    from '@strateos/features';
import FeatureStore        from 'main/stores/FeatureStore';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import labConsumerData from 'main/test/labconsumer/testData.json';
import { AddressesPane, RemoveAddressModal, AddAddressModal } from './AddressesPane';

describe('AdressesPane test', () => {

  let addressPane;
  const sandbox = sinon.createSandbox();

  const windowData = {
    US: {
      name: 'United States of America',
      value: 'US',
      subdivisions: [
        'CA'
      ]
    }
  };

  const mockLabConsumers = Immutable.fromJS([labConsumerData[0]]);
  const mockCustomerOrgLabConsumers = Immutable.fromJS([labConsumerData[1]]);

  const addresses = Immutable.fromJS([
    {
      id: 'addr1e6y2wnrntmj8',
      attention: 'New Address',
      street: 'updated street',
      street_2: 'st2',
      city: 'abc',
      state: 'CA',
      zipcode: '88888',
      country: 'US'
    }
  ]);

  const customerOrganization = Immutable.fromJS({ id: 'org123' });

  const renderRemoveAddressModal = () => {
    addressPane.find('Table').dive().find('a').at(0)
      .props()
      .onClick();
  };

  beforeEach(() => {
    sandbox.stub(SessionStore, 'canAdminCurrentOrg').returns(true);
    sandbox.stub(LabConsumerActions, 'loadLabsForCurrentOrg').returns({ done: (cb) => cb() });
    sandbox.stub(LabConsumerActions, 'loadLabsByOrg').returns({ done: (cb) => cb() });
    sandbox.stub(LabConsumerStore, 'getAllForCurrentOrg').returns(mockLabConsumers);
    sandbox.stub(LabConsumerStore, 'getAllForOrg').returns(mockCustomerOrgLabConsumers);
  });

  afterEach(() => {
    addressPane.unmount();
    sandbox.restore();
  });

  it('Addresses should render on load', () => {
    addressPane = shallow(<AddressesPane addresses={addresses} windowData={windowData} />);
    expect(addressPane.find(Card)).to.exist;
  });

  it('should have labOperatorName in state on initial mount', () => {
    addressPane = shallow(<AddressesPane addresses={addresses} windowData={windowData} />);
    expect(addressPane.state().labOperatorName).to.equal('Strateos');
  });

  it('should have labOperatorName in state on initial mount when org is customer org', () => {
    addressPane = shallow(
      <AddressesPane
        addresses={addresses}
        windowData={windowData}
        customerOrganization={customerOrganization}
      />);
    expect(addressPane.state().labOperatorName).to.equal('orgccsone');
  });

  it('Check if state is changed on clicking delete icon', () => {
    addressPane = shallow(<AddressesPane addresses={addresses} windowData={windowData} />);
    const addressTable = addressPane.find(Table).dive();
    expect(addressPane.state().selectedAddress).to.be.undefined;
    addressTable.find('.address__admin-action').first().simulate('click');
    let arr = [];
    addresses.valueSeq().forEach((item) => {
      arr = item.toArray();
    });
    expect(addressPane.state().selectedAddress.toIndexedSeq().toArray()).to.eql(arr);
  });

  it('RemoveAddress Modal is present', () => {
    addressPane = shallow(<AddressesPane addresses={addresses} windowData={windowData} />);
    const addressTable = addressPane.find(Table).dive();
    addressTable.find('.address__admin-action').first().simulate('click');
    const modal = addressPane.find(RemoveAddressModal).dive().find(AddressText).dive();
    const modalMessage = 'New Addressupdated streetst2abc, CA 88888US';
    expect(modal.text()).to.eql(modalMessage);
  });

  it('Mock triggerAction', () => {
    const triggerAction = sandbox.stub(RemoveAddressModal.prototype, 'triggerAction');
    addressPane = shallow(<AddressesPane addresses={addresses} windowData={windowData} />);
    renderRemoveAddressModal();

    const modal = addressPane.find(RemoveAddressModal).dive();
    modal.find('ConnectedSinglePaneModal').prop('onAccept')();
    expect(triggerAction.callCount).to.be.eql(1);
  });

  it('Lab manager and operators should not see link to request a shipping kit', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.REQUEST_SAMPLE_CONTAINERS).returns(false);
    addressPane = shallow(<AddressesPane addresses={addresses} windowData={windowData} />);
    const Link = addressPane.find('Link');
    expect(Link.length).to.be.equal(0);
  });

  it('User with permission should see link to request a shipping kit', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.REQUEST_SAMPLE_CONTAINERS).returns(true);
    addressPane = shallow(<AddressesPane addresses={addresses} windowData={windowData} />);
    const Link = addressPane.find('Link');
    expect(Link.length).to.be.equal(1);
    expect(Link.children().text()).to.equal('request a shipping kit');
  });

  it('should pass customerOrganization to AddAddressModal and RemoveAddressModal', () => {
    sandbox.stub(SessionStore, 'canAdminCustomerOrg').returns(true);
    addressPane = shallow(<AddressesPane customerOrganization={customerOrganization} addresses={addresses} windowData={windowData} />);
    renderRemoveAddressModal();

    const addAddressModal = addressPane.find(AddAddressModal);
    const removeAddressModal = addressPane.find(RemoveAddressModal);
    expect(addAddressModal.props().customerOrganization).to.deep.equal(customerOrganization);
    expect(removeAddressModal.props().customerOrganization).to.deep.equal(customerOrganization);
  });

  it('should not render RemoveAddressModal when selectedAddress state is empty', () => {
    addressPane = shallow(<AddressesPane addresses={addresses} windowData={windowData} />);

    expect(addressPane.instance().state.selectedAddress).to.equals(undefined);
    expect(addressPane.find(RemoveAddressModal).length).to.equals(0);
  });

  it('should render RemoveAddressModal when selectedAddress state is not empty', () => {
    addressPane = shallow(<AddressesPane addresses={addresses} windowData={windowData} />);
    renderRemoveAddressModal();

    expect(addressPane.instance().state.selectedAddress.get('id')).to.equals('addr1e6y2wnrntmj8');
    expect(addressPane.find(RemoveAddressModal).length).to.equals(1);
  });
});
