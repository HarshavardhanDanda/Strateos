import { expect } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import sinon from 'sinon';

import ReturnShipmentActions from 'main/actions/ReturnShipmentActions';
import AddContainersToShipmentModal from 'main/pages/InventoryPage/AddContainersToShipmentModal/AddContainersToShipmentModal';
import OverviewPane from 'main/pages/InventoryPage/AddContainersToShipmentModal/OverviewPane';

describe('AddContainersToShipmentModal', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should set dataReady prop to false when shipabilityInfo state is undefined', () => {
    wrapper = shallow(<AddContainersToShipmentModal ids={[]} />);

    expect(wrapper.find(OverviewPane).props().dataReady).to.be.false;
  });

  it('should set dataReady prop to true when shipabilityInfo state is not undefined', () => {
    sandbox.stub(ReturnShipmentActions, 'shipabilityInfo').returns({ done: (cb) => cb({ errors: {} }) });
    wrapper = shallow(<AddContainersToShipmentModal ids={[]} />);
    wrapper.instance().onOpen();

    expect(wrapper.find(OverviewPane).props().dataReady).to.be.true;
  });
});
