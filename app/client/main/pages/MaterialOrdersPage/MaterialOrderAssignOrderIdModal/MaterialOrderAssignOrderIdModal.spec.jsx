import React from 'react';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import MaterialOrderAssignOrderIdModal from './MaterialOrderAssignOrderIdModal';

describe('MaterialOrderAssignOrderIdModal', () => {
  let wrapper;
  let onAssignOrderIdSpy;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    onAssignOrderIdSpy = sandbox.spy();

    wrapper = shallow(
      <MaterialOrderAssignOrderIdModal selected={['id1', 'id2']} onAssignOrderId={onAssignOrderIdSpy} />
    );
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should render modal with correct props', () => {
    wrapper = mount(
      <MaterialOrderAssignOrderIdModal selected={['id1', 'id2']} onAssignOrderId={onAssignOrderIdSpy} />
    );
    expect(wrapper.prop('selected').length).to.equal(2);
    expect(wrapper.prop('selected')[0]).to.equal('id1');
    expect(wrapper.prop('selected')[1]).to.equal('id2');
    expect(wrapper.prop('onAssignOrderId')).to.equal(onAssignOrderIdSpy);

    const modal = wrapper.find('ConnectedSinglePaneModal');
    expect(modal.length).to.equal(1);
    expect(modal.prop('modalId')).to.equal(MaterialOrderAssignOrderIdModal.MODAL_ID);
    expect(modal.prop('title')).to.equal('Assign Order ID(2)');
    expect(modal.prop('acceptText')).to.equal('Submit');
    expect(modal.prop('acceptBtnDisabled')).to.be.true;
    expect(wrapper.state().value).to.equal(undefined);
  });

  it('should render order id text input', () => {
    const textInputLabel = wrapper.find('LabeledInput');
    const textInput = wrapper.find('TextInput');
    expect(textInputLabel.length).to.equal(1);
    expect(textInput.length).to.equal(1);
    expect(textInputLabel.at(0).prop('label')).to.equal('Order ID');
    expect(textInput.at(0).prop('placeholder')).to.equal('Order ID');
    expect(textInput.at(0).prop('value')).to.equal('');
  });

  it('should be able to enter and submit order id', () => {
    wrapper.find('TextInput').simulate('change', { target: { value: 'test_external_id' } });
    wrapper.find('ConnectedSinglePaneModal').prop('onAccept')();
    expect(onAssignOrderIdSpy.calledOnceWithExactly('test_external_id')).to.be.true;
  });

  it('should reset order id state before dismiss', () => {
    wrapper.find('TextInput').simulate('change', { target: { value: 'test_external_id' } });
    expect(wrapper.state().orderId).to.equal('test_external_id');
    wrapper.find('ConnectedSinglePaneModal').prop('beforeDismiss')();
    expect(wrapper.state().orderId).to.equal('');
  });

  it('should auto focus text input', () => {
    expect(wrapper.find('TextInput').props().autoFocus).to.be.true;
  });
});
