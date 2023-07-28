import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import MaterialOrderDetails from './MaterialOrderDetails';

describe('MaterialOrderDetails', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  const labs = [
    {
      id: '123',
      attributes: {
        name: 'Menlo Park'
      }
    },
    {
      id: '124',
      attributes: {
        name: 'San Diego'
      }
    }
  ];

  const props = {
    labs: labs,
    labId: '123',
    type: 'group',
    onChange: () => {}
  };

  it('should render select with label', () => {
    wrapper = shallow(
      <MaterialOrderDetails {...props} />);
    const select = wrapper.find('Select');
    const LabeledInput = wrapper.find('LabeledInput');
    expect(select.length).to.equal(2);
    expect(LabeledInput.length).to.equal(2);
    expect(LabeledInput.at(0).props().label).to.equal('TYPE');
    expect(LabeledInput.at(1).props().label).to.equal('LAB');
  });

  it('should disable select when disabled', () => {
    wrapper = shallow(
      <MaterialOrderDetails {...props} disabled />);
    const p = wrapper.find('p');
    expect(p.length).to.equal(2);
    expect(p.at(0).text()).to.equal('Group');
    expect(p.at(1).text()).to.equal('Menlo Park');
  });

  it('should trigger callback onChange', () => {
    const onChange = sinon.spy();
    wrapper = shallow(
      <MaterialOrderDetails {...props} onChange={onChange} />);
    const select = wrapper.find('Select');
    select.at(0).simulate('change', { target: { value: 'individual' } });
    expect(onChange.calledOnce).to.be.true;
    expect(onChange.calledWith('materialType', 'individual')).to.be.true;
  });
});
