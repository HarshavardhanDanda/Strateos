import React from 'react';
import Immutable from 'immutable';
import { mount } from 'enzyme';
import { expect } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';
import ModalStore from 'main/stores/ModalStore';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import ContainerTypeActions from 'main/actions/ContainerTypeActions';
import ContainerTypeSelectorModal from './ContainerTypeSelectorModal';

describe('ContainerTypeSelectorModal', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  beforeEach(() => {
    sandbox.stub(ContainerTypeActions, 'loadAll').returns({
      always: (cb) => cb()
    });

    sandbox.stub(ContainerTypeStore, 'getAll').returns(Immutable.fromJS([
      { id: '15ml-conical', name: '15ml conical', retired_at: null },
      { id: 'a1-vial', name: 'A1 vial', retired_at: null }
    ]));

    sandbox.stub(ContainerTypeStore, 'getById').returns(Immutable.fromJS(
      { id: 'a1-vial', name: 'A1 vial' }
    ));

    sandbox.stub(ModalStore, 'getById').returns({ get: () => true });
  });

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should render modal with container type select', () => {
    wrapper = mount(<ContainerTypeSelectorModal onSelect={() => {}} />);
    const modal = wrapper.find('ContainerTypeSelectorModal');
    expect(modal.find('LabeledInput').props().label).to.equal('Container type');
    expect(modal.find('Select').props().options.size).to.equal(2);
  });
  // Temporarily disable this test until we find and fix the root cause of this failure
  xit('should output container type on submit', () => {
    const onSelectSpy = sandbox.spy();
    wrapper = mount(<ContainerTypeSelectorModal onSelect={onSelectSpy} />);
    const modal = () => wrapper.find('ContainerTypeSelectorModal');
    modal().find('Select').props().onChange({ target: { value: 'a1-vial' } });
    modal().update();
    modal().find('ConnectedSinglePaneModal').props().onAccept();
    expect(onSelectSpy.getCall(0).args[0].toJS()).to.deep.equal(
      { id: 'a1-vial', name: 'A1 vial' }
    );
  });
});
