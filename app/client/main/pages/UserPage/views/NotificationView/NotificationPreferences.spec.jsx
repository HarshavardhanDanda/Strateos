import React from 'react';

import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { Checkbox, CheckboxGroup, InputsController, Table, TextBody, TextDescription, Toggle } from '@transcriptic/amino';
import NotificationPreferences from './NotificationPreferences';

describe('Notification Preferences', () => {

  let component;
  const props = {
    onCheckboxChange: sinon.spy(),
    onEmailToggleClicked: sinon.spy(),
    selectedCheckboxes: [],
    isExpanded: true
  };

  it('should render the component and should have Table', () => {
    component = shallow(<NotificationPreferences {...props} />);

    expect(component.find('.notification-preferences').length).to.equal(1);
    expect(component.find(Table).exists()).to.be.true;
  });

  it('should show Projects title and caption', () => {
    component = shallow(<NotificationPreferences {...props} />);

    const expandedTable = component.find(Table).dive();
    const projectRow = expandedTable.find('Row').at(0);
    expect(projectRow.find('BodyCell').at(1).find(TextBody).children()
      .text()).to.equal('Projects');
    expect(projectRow.find('BodyCell').at(1).find(TextDescription).children()
      .text()).to.equal('Notifications related to projects and runs in your organization');
  });

  it('should show Inventory title and caption', () => {
    component = shallow(<NotificationPreferences {...props} />);

    const expandedTable = component.find(Table).dive();
    const inventoryRow = expandedTable.find('Row').at(2);
    expect(inventoryRow.find('BodyCell').at(1).find(TextBody).children()
      .text()).to.equal('Inventory');
    expect(inventoryRow.find('BodyCell').at(1).find(TextDescription).children()
      .text()).to.equal('These are the notifications related to your Inventory, containers, resources');
  });

  it('should show Shipment title and caption', () => {
    component = shallow(<NotificationPreferences {...props} />);

    const expandedTable = component.find(Table).dive();
    const shipmentRow = expandedTable.find('Row').at(4);
    expect(shipmentRow.find('BodyCell').at(1).find(TextBody).children()
      .text()).to.equal('Shipment');
    expect(shipmentRow.find('BodyCell').at(1).find(TextDescription).children()
      .text()).to.equal('These are the notifications related to shipmens, orders and kits');
  });

  it('should have email toggle on the each notification type', () => {
    component = shallow(<NotificationPreferences {...props} />);

    const expandableTable = component.find(Table).dive();
    const emailToggles = expandableTable.find(Toggle);
    expect(emailToggles.length).to.equal(3);
    expect(emailToggles.at(0).prop('label')).to.equal('Email');
  });

  it('should call onEmailToggleClicked when a toggle is changed', () => {
    const emailToggleSpy = sinon.spy();
    component = shallow(<NotificationPreferences {...props} onEmailToggleClicked={emailToggleSpy} />);

    const expandableTable = component.find(Table).dive();
    const emailToggles = expandableTable.find(Toggle);
    const event = {
      preventDefault: () => {},
      target: { name: 'project-notification-group-email-toggle', value: 'on' }
    };

    emailToggles.at(0).simulate('change', event);
    expect(emailToggleSpy.calledOnce).to.be.true;
  });

  it('should have CheckboxGroup when the notification row is expanded', () => {
    const checkboxOptions = {
      notify_for_stale_container: {
        value: 'notify_for_stale_container',
        label: 'Notify me when a container is flagged as stale',
        name: 'notify_for_stale_container',
        disabled: false
      }
    };
    component = shallow(<NotificationPreferences {...props} isExpanded />);

    const expandedTable = component.find(Table).dive();
    const checkboxGroup = expandedTable.find('Row')
      .at(3)
      .dive()
      .find('u')
      .dive()
      .find(CheckboxGroup);

    expect(checkboxGroup.exists()).to.be.true;
    expect(checkboxGroup.prop('options')).to.deep.equal(checkboxOptions);
  });

  it('should have checkboxes checked based on the selectedCheckboxes', () => {
    const selectedCheckboxes =  ['notify_for_my_run_status'];
    component = shallow(<NotificationPreferences {...props} selectedCheckboxes={selectedCheckboxes} isExpanded />);

    const expandedTable = component.find(Table).dive();
    const checkboxGroup = expandedTable.find('Row')
      .at(1)
      .dive()
      .find('u')
      .dive()
      .find(CheckboxGroup)
      .dive();

    expect(checkboxGroup.find(Checkbox).at(0).prop('checked')).to.equal('checked');
    expect(checkboxGroup.find(Checkbox).at(1).prop('checked')).to.equal('unchecked');
  });

  it('should call onCheckboxChange when a checkbox input is changed', () => {
    const onCheckboxChangeSpy = sinon.spy();
    component = shallow(<NotificationPreferences {...props} onCheckboxChange={onCheckboxChangeSpy} isExpanded />);

    const expandedTable = component.find(Table).dive();
    const expandedRow = expandedTable.find('Row')
      .at(1)
      .dive()
      .find('u')
      .dive();

    expandedRow.find(InputsController).props().inputChangeCallback();
    expect(onCheckboxChangeSpy.calledOnce).to.be.true;
  });
});
