import React from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import SuccessPane from './SuccessPane';

describe('SuccessPane', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  const props = {
    headerMessage: 'This is header message',
    onAcknowledge: () => {}
  };

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should render material illustrtion image', () => {
    wrapper = shallow(<SuccessPane {...props} />);
    const img = wrapper.find('img');
    expect(img.length).to.be.equal(1);
  });

  it('header message should be visible', () => {
    wrapper = shallow(<SuccessPane {...props} />);
    const  headerMsg = wrapper.find('h3');
    expect(headerMsg.text()).to.be.equal(props.headerMessage);
  });

  it('should render ShippingInstructions', () => {
    wrapper = shallow(<SuccessPane {...props} />);
    const shippingInstructions = wrapper.find('ShippingInstructions');
    expect(shippingInstructions).to.not.be.undefined;
  });

  it("should render button with text 'ok, got it'", () => {
    const onAcknowledge = sinon.spy();
    wrapper = shallow(<SuccessPane {...props} onAcknowledge={onAcknowledge} />);
    const closeButton = wrapper.find('Pane').dive().find('ModalStepFooter').dive()
      .find('Button');
    expect(closeButton.children().text()).to.equal('Ok, got it');
    closeButton.simulate('click');
    expect(onAcknowledge.calledOnce).to.be.true;
  });
});
