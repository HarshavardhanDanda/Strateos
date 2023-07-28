import React                  from 'react';
import sinon                  from 'sinon';
import Immutable              from 'immutable';
import { expect }             from 'chai';
import { shallow }            from 'enzyme';
import { Button } from '@transcriptic/amino';
import ShipmentCreatedSuccess from './ShipmentCreatedSuccess';

describe('ShipmentCreatedSuccess', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  const props = {
    headerMessage: 'This is header message',
    containers: Immutable.Map(),
    shipment: Immutable.Map()
  };

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('Should render success image', () => {
    wrapper = shallow(<ShipmentCreatedSuccess {...props} />);
    const img = wrapper.find('img');
    expect(img.length).to.be.equal(1);
  });

  it('Header message should be visible', () => {
    wrapper = shallow(<ShipmentCreatedSuccess {...props} />);
    const  headerMsg = wrapper.find('h2');
    expect(headerMsg.text()).to.be.equal(props.headerMessage);
  });

  it('Should render ContainerCardGrid', () => {
    wrapper = shallow(<ShipmentCreatedSuccess {...props} />);
    const  grid = wrapper.find('ContainerCardGrid');
    expect(grid).to.have.lengthOf(1);
  });

  it("ShippingModal should be closed on clicking 'ok, got it' button", () => {
    const onDismiss = sinon.stub();
    const modifiedProps = { ...props, onDismiss };
    wrapper = shallow(<ShipmentCreatedSuccess {...modifiedProps} />);
    const button = wrapper.find(Button);
    expect(button.children().text()).to.equal('Ok, got it');
    button.simulate('click');
    expect(onDismiss.calledOnce).to.be.true;
  });
});
