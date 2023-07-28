import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import ModalActions from 'main/actions/ModalActions';
import ResourceStore from 'main/stores/ResourceStore';
import ResourceSelectorModal from './ResourceSelectorModal';

describe('ResourceSelectorModal', () => {
  let wrapper;
  let onSelectSpy;
  let onModalCloseSpy;

  const sandbox = sinon.createSandbox();

  const resource1 = Immutable.fromJS({
    id: 'rs1'
  });

  const resource2 = Immutable.fromJS({
    id: 'rs2'
  });

  beforeEach(() => {
    const getById = sandbox.stub(ResourceStore, 'getById');
    getById.withArgs('rs1').returns(resource1);
    getById.withArgs('rs2').returns(resource2);

    onSelectSpy = sandbox.spy();
    onModalCloseSpy = sandbox.spy(ModalActions, 'close');
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  it('should render modal and resource selector', () => {
    wrapper = shallow(
      <ResourceSelectorModal onResourceSelected={onSelectSpy} />
    );
    expect(wrapper.find('ConnectedSelectorContentHOC').dive().dive()
      .find('ResourceSelector'))
      .to
      .have
      .length(1);
    expect(wrapper.find('ConnectedSinglePaneModal')).to.have.length(1);
    expect(wrapper.find('ConnectedSinglePaneModal').props()).to.include({ modalId: 'SEARCH_RESOURCE_MODAL', title: 'Select Resource' });
  });

  it('should be disabled when nothing is selected', () => {
    wrapper = shallow(
      <ResourceSelectorModal onResourceSelected={onSelectSpy} />
    );

    expect(wrapper.find('ConnectedSinglePaneModal').prop('acceptBtnDisabled')).to.equal(true);
  });

  it('should handle multi-select', () => {
    wrapper = shallow(
      <ResourceSelectorModal onResourceSelected={onSelectSpy} />
    );

    wrapper.find('ConnectedSelectorContentHOC').dive().dive()
      .find('ResourceSelector')
      .prop('onSelectRow')({ rs1: true, rs2: true });
    expect(onSelectSpy.notCalled).to.be.true;

    wrapper.find('ConnectedSinglePaneModal').prop('onAccept')();
    expect(onSelectSpy.calledWith(['rs1', 'rs2'], [resource1, resource2]));
    expect(onModalCloseSpy.calledOnce);
  });

  it('should handle single-select', () => {
    wrapper = shallow(
      <ResourceSelectorModal onResourceSelected={onSelectSpy} isSingleSelect />
    );

    wrapper.find('ConnectedSelectorContentHOC').dive().dive()
      .find('ResourceSelector')
      .prop('onSelectRow')({ rs1: true });

    expect(wrapper.find('ConnectedSinglePaneModal').prop('renderFooter')).to.equal(false);
    expect(onSelectSpy.calledWith(['rs1'], [resource1]));
    expect(onModalCloseSpy.calledOnce);
  });
});
