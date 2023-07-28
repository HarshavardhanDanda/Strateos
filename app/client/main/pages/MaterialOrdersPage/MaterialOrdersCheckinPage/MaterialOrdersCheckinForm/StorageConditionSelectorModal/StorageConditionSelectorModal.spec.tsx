import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';
import ModalStore from 'main/stores/ModalStore';
import StorageConditionSelectorModal from './StorageConditionSelectorModal';

describe('StorageConditionSelectorModal', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  beforeEach(() => {
    sandbox.stub(ModalStore, 'getById').returns({ get: () => true });
  });

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should render modal with storage condition select', () => {
    wrapper = mount(<StorageConditionSelectorModal onSelect={() => {}} />);
    const modal = wrapper.find('StorageConditionSelectorModal');
    expect(modal.find('LabeledInput').props().label).to.equal('Storage condition');
    expect(modal.find('Select').props().options.length).to.equal(5);
  });

  it('should output storage condition on submit', () => {
    const onSelectSpy = sandbox.spy();
    wrapper = mount(<StorageConditionSelectorModal onSelect={onSelectSpy} />);
    const modal = () => wrapper.find('StorageConditionSelectorModal');
    modal().find('Select').props().onChange({ target: { value: 'cold_80' } });
    modal().update();
    modal().find('ConnectedSinglePaneModal').props().onAccept();
    expect(onSelectSpy.getCall(0).args[0]).to.deep.equal(
      { value: 'cold_80', name: '-80 °C (± 1 °C)' }
    );
  });
});
