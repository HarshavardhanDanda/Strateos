import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { Button } from '@transcriptic/amino';

import CompoundCreationDropDown from 'main/pages/CompoundsPage/CompoundCreationDropDown';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import ModalActions from 'main/actions/ModalActions';

describe('CompoundCreationDropDown', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should display button to register compounds if user has permissions to register compounds', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.REGISTER_COMPOUND).returns(true);
    wrapper = shallow(<CompoundCreationDropDown />);
    expect(wrapper.find(Button).at(0).children().text()).to.equal('Register Compound');
  });

  it('should display button to register compounds if user has permissions to register public compounds', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.REGISTER_PUBLIC_COMPOUND).returns(true);
    wrapper = shallow(<CompoundCreationDropDown />);
    const button = wrapper.find('Button').at(0);
    expect(button.children().text()).to.equal('Register Compound');
    expect(button.props().icon).to.equal('fa-plus');
  });

  it('should contain button to draw a structure', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.REGISTER_COMPOUND).returns(true);
    wrapper = shallow(<CompoundCreationDropDown />);
    expect(wrapper.find('Button').at(1).children().text()).to.equal('Draw a Structure');
    expect(wrapper.find('Button').at(1).props().icon).to.equal('fal fa-pencil');
    expect(wrapper.find('Button').at(1).props().iconSize).to.equal('small');
  });

  it('should contain button to upload from a file', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.REGISTER_COMPOUND).returns(true);
    wrapper = shallow(<CompoundCreationDropDown />);
    expect(wrapper.find('Button').at(2).children().text()).to.equal('Upload from a File');
    expect(wrapper.find('Button').at(2).props().icon).to.equal('fal fa-upload');
    expect(wrapper.find('Button').at(2).props().iconSize).to.equal('small');
  });

  it('should set prop to display dropdown on clicking button to register compound', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.REGISTER_COMPOUND).returns(true);
    wrapper = shallow(<CompoundCreationDropDown />);
    expect(wrapper.find('DropDown').props().isOpen).to.be.false;
    const button = wrapper.find('Button').at(0);
    button.simulate('click');
    wrapper.update();
    expect(wrapper.find('DropDown').props().isOpen).to.be.true;
  });

  it('should call compound registration modal on clicking draw structure button', () => {
    const modalOpenStub = sandbox.stub(ModalActions, 'open');
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.REGISTER_COMPOUND).returns(true);
    wrapper = shallow(<CompoundCreationDropDown />);
    const button = wrapper.find('Button').at(1);
    button.simulate('click');
    expect(button.props().noPadding).to.exist;
    expect(button.props().type).to.equal('secondary');
    expect(button.props().link).to.exist;
    expect(modalOpenStub.calledOnce).to.be.true;
    expect(modalOpenStub.args[0][0]).to.equal('CompoundRegistrationModal');
  });

  it('should call compound registration modal on clicking Upload from a file button', () => {
    const modalOpenStub = sandbox.stub(ModalActions, 'open');
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.REGISTER_COMPOUND).returns(true);
    wrapper = shallow(<CompoundCreationDropDown />);
    const button = wrapper.find('Button').at(2);
    button.simulate('click');
    expect(button.props().noPadding).to.exist;
    expect(button.props().type).to.equal('secondary');
    expect(button.props().link).to.exist;
    expect(modalOpenStub.calledOnce).to.be.true;
    expect(modalOpenStub.args[0][0]).to.equal('BulkCompoundRegistrationModal');
  });

  it('should set align property in DropDown', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.REGISTER_COMPOUND).returns(true);
    wrapper = shallow(<CompoundCreationDropDown alignment={'right'} />);
    expect(wrapper.find('DropDown').props().hideTooltip).to.exist;
    expect(wrapper.find('DropDown').props().align).to.equal('right');
    expect(wrapper.find('DropDown').props().parentAlignment).to.equal('right');
  });
});
