import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';
import ContainerSettingsModal from './ContainerSettingsModal';

describe('ContainerSettingsModal Validations', () => {
  const containerObj = Immutable.Map({
    id: 'ct1et8cdx6bnmwr',
    label: 'pcr test'
  });
  const event = {
    preventDefault() {}
  };
  const moreThan250CharText = 'sapien faucibus et molestie ac feugiat sed lectus vestibulum mattis ullamcorper velit sed ullamcorper morbi tincidunt ornare massa eget egestas purus viverra accumsan in nisl nisi scelerisque eu ultrices vitae auctor eu augue ut lectus arcu bibendum at constius vel pharetra vel turpis nunc eget lorem dolor sed viverra ipsum';

  it("should show 'Comma not allowed' when a comma is entered for Container Name, and Accept Button Disabled", () => {
    const wrapper = shallow(<ContainerSettingsModal container={containerObj} />);
    event.target = { value: 'the,value' };
    expect(wrapper.find('ConnectedSinglePaneModal').props().acceptBtnDisabled).to.be.false;
    wrapper.find('TextInput').simulate('change', event);
    expect(wrapper.find('Validated').props().error).to.eql('Comma not allowed');
    expect(wrapper.find('ConnectedSinglePaneModal').props().acceptBtnDisabled).to.be.true;
  });

  it("should show 'Character / not allowed' when a / is entered for Container Name, and Accept Button Disabled", () => {
    const wrapper = shallow(<ContainerSettingsModal container={containerObj} />);
    event.target = { value: 'the/value' };
    expect(wrapper.find('ConnectedSinglePaneModal').props().acceptBtnDisabled).to.be.false;
    wrapper.find('TextInput').simulate('change', event);
    expect(wrapper.find('Validated').props().error).to.eql("Character '/' not allowed");
    expect(wrapper.find('ConnectedSinglePaneModal').props().acceptBtnDisabled).to.be.true;
  });

  it("should show 'Must be specified' when the field is made empty for Container Name, and Accept Button Disabled", () => {
    const wrapper = shallow(<ContainerSettingsModal container={containerObj} />);
    event.target = { value: '' };
    expect(wrapper.find('ConnectedSinglePaneModal').props().acceptBtnDisabled).to.be.false;
    wrapper.find('TextInput').simulate('change', event);
    expect(wrapper.find('Validated').props().error).to.eql('Must be specified');
    expect(wrapper.find('ConnectedSinglePaneModal').props().acceptBtnDisabled).to.be.true;
  });

  it("should show 'Maximum 250 characters' when more than 250 characters are entered for Container Name, and Accept Button Disabled", () => {
    const wrapper = shallow(<ContainerSettingsModal container={containerObj} />);
    event.target = { value: moreThan250CharText };
    expect(wrapper.find('ConnectedSinglePaneModal').props().acceptBtnDisabled).to.be.false;
    wrapper.find('TextInput').simulate('change', event);
    expect(wrapper.find('Validated').props().error).to.eql('Maximum 250 characters');
    expect(wrapper.find('ConnectedSinglePaneModal').props().acceptBtnDisabled).to.be.true;
  });
});
