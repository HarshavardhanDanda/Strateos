import React from 'react';
import { expect } from 'chai';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { Button } from '@transcriptic/amino';
import AddressCreator from './addressCreator';
import AddressCreateFormLogic from './addressCreateFormLogic';

let sandbox;

describe('Addresscreator page', () => {
  before(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    if (sandbox) sandbox.restore();
  });

  const props_functions = {
    onAddressCreated: () => {},
    createAddress:    () => {},
    updateAddress: () => {}
  };

  const data = Immutable.Map({
    id: 'addretest123',
    attention: 'Test',
    street: 'stret',
    street_2: 'stret_2',
    city: 'CA',
    zipcode: '5555',
    country: 'US',
    state: 'CA',
    force_validate: false
  });

  const inputValues = Immutable.Map({
    attention: 'Test',
    street1: 'stret',
    street2: 'stret_2',
    city: 'CA',
    zip: '5555',
    country: 'US',
    state: 'CA',
    force_validate: false
  });

  it('input values should be default values when props data is empty', () => {
    const wrapper = shallow(<AddressCreator {...props_functions} />);
    const propData = wrapper.instance().state.inputValues;
    expect(Immutable.is(propData, AddressCreateFormLogic.initialInputValues())).to.be.true;
  });

  it('props data should be set as initial input when not empty', () => {
    const wrapper = shallow(<AddressCreator {...props_functions} data={data} />);
    const propData = wrapper.instance().state.inputValues;
    expect(Immutable.is(propData, inputValues)).to.be.true;
  });

  it('should save and select new address when button clicked', () => {
    const spy = sandbox.stub(AddressCreator.prototype, 'saveOrUpdate');
    const wrapper = shallow(<AddressCreator {...props_functions} />);
    wrapper.instance().onInputValuesChanged(inputValues);
    const button = wrapper.find(Button);
    button.simulate('click');

    expect(spy.called).to.be.true;
  });

  it('should return rejected promise if validation fails', async () => {
    const wrapper = shallow(<AddressCreator {...props_functions} />);
    let rejectionCalled = false;
    await wrapper.instance().saveOrUpdate().catch(() => { rejectionCalled = true; });
    expect(rejectionCalled).to.be.true;
  });
});
