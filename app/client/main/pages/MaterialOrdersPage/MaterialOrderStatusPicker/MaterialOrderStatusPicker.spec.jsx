import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import _ from 'lodash';

import MaterialOrderStatusPicker from './MaterialOrderStatusPicker';

describe('MaterialOrderStatusPicker', () => {
  let wrapper;
  let onSelectedSpy;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    onSelectedSpy = sandbox.spy();

    wrapper = shallow(
      <MaterialOrderStatusPicker selected={['id1', 'id2']} onSelected={onSelectedSpy} />
    );
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should render modal', () => {
    const modal = wrapper.find('ConnectedSinglePaneModal');
    expect(modal.length).to.equal(1);
    expect(modal.prop('modalId')).to.equal('MATERIAL_ORDER_STATUS_PICKER');
    expect(modal.prop('title')).to.equal('Status(2)');
    expect(modal.prop('acceptText')).to.equal('Save');
    expect(wrapper.state().value).to.equal(undefined);
  });

  it('should show status options', () => {
    const radioGroup = wrapper.find('RadioGroup');
    const radioButtons = wrapper.find('Radio');
    expect(radioGroup.length).to.equal(1);
    expect(radioButtons.length).to.equal(4);
    expect(radioButtons.at(0).prop('value')).to.equal('PENDING');
    expect(radioButtons.at(0).prop('label')).to.equal('PENDING');
    expect(radioButtons.at(1).prop('value')).to.equal('PURCHASED');
    expect(radioButtons.at(1).prop('label')).to.equal('PURCHASED');
    expect(radioButtons.at(2).prop('value')).to.equal('SHIPPED');
    expect(radioButtons.at(2).prop('label')).to.equal('SHIPPED');
    expect(radioButtons.at(3).prop('value')).to.equal('ARRIVED');
    expect(radioButtons.at(3).prop('label')).to.equal('ARRIVED');
  });

  it('should be able to select status', () => {
    wrapper.find('RadioGroup').simulate('change', { target: { value: 'PURCHASED' } });
    wrapper.find('ConnectedSinglePaneModal').prop('onAccept')();

    expect(onSelectedSpy.calledOnceWithExactly('PURCHASED')).to.be.true;
  });
});
