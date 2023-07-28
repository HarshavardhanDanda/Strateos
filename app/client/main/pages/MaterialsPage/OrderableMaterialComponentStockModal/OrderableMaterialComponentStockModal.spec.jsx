import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import Immutable from 'immutable';
import { expect } from 'chai';

import ContainerActions from 'main/actions/ContainerActions';
import OrderableMaterialComponentStockModal from './OrderableMaterialComponentStockModal';

const orderableMaterialComponent =  Immutable.Map({
  container_type_id: 'vendor-tube'
});

describe('OrderableMaterialComponentStockModal', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('OrderableMaterialComponentStockModal should render', () => {
    wrapper = shallow(
      <OrderableMaterialComponentStockModal orderableMaterialComponent={orderableMaterialComponent} />
    );
    expect(wrapper.find('ConnectedSinglePaneModal')).to.have.length(1);
  });

  it('OrderableMaterialComponentStockModal should have an action menu', () => {
    wrapper = shallow(
      <OrderableMaterialComponentStockModal orderableMaterialComponent={orderableMaterialComponent} />
    );

    expect(wrapper.find('ConnectedPagedStockView').props().actions).to.have.length(1);
  });

  it('should remove multiple containers from list if user wants to go ahead with deleting the multiple containers', () => {
    wrapper = shallow(
      <OrderableMaterialComponentStockModal orderableMaterialComponent={orderableMaterialComponent} />
    );
    const ContainersDestroySpy = sandbox.spy(ContainerActions, 'destroyBulkContainer');
    sandbox.stub(OrderableMaterialComponentStockModal.prototype, 'isConfirm').returns(true);
    wrapper.instance().setState({ selectedContainerIds: Immutable.List(['id1', 'id2']) });
    wrapper.find('ConnectedPagedStockView').props().actions[0].action();
    expect(ContainersDestroySpy.calledOnce).to.be.true;
  });

  it('should not remove row from list if user clicks Destroy button but does not want to go ahead with deletion', () => {
    wrapper = shallow(
      <OrderableMaterialComponentStockModal orderableMaterialComponent={orderableMaterialComponent} />
    );
    const ContainersDestroySpy = sandbox.spy(ContainerActions, 'destroyBulkContainer');
    sandbox.stub(OrderableMaterialComponentStockModal.prototype, 'isConfirm').returns(false);
    wrapper.instance().setState({ selectedContainerIds: Immutable.List(['id1']) });
    wrapper.find('ConnectedPagedStockView').props().actions[0].action();
    expect(ContainersDestroySpy.calledOnce).to.be.false;
  });

  it('should refresh the container screen after deleting the multiple containers', () => {
    wrapper = shallow(
      <OrderableMaterialComponentStockModal orderableMaterialComponent={orderableMaterialComponent} />
    );
    sinon.stub(ContainerActions, 'destroyBulkContainer').returns({ done: (cb) => cb() });
    sandbox.stub(OrderableMaterialComponentStockModal.prototype, 'isConfirm').returns(true);
    wrapper.instance().setState({ selectedContainerIds: Immutable.List(['id1', 'id2']) });
    expect(wrapper.instance().state.refreshStock).to.be.false;
    wrapper.find('ConnectedPagedStockView').props().actions[0].action();
    expect(wrapper.instance().state.refreshStock).to.be.true;
  });
});
