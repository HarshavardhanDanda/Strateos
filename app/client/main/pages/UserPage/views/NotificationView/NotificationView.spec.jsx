import React from 'react';
import Immutable from 'immutable';

import { expect } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import { Button, LabeledInput, Select, Spinner, TextBody, TextTitle } from '@transcriptic/amino';
import SessionStore from 'main/stores/SessionStore';
import Footer from 'main/pages/UserPage/components/Footer.jsx';
import UserActions  from 'main/actions/UserActions';
import NotificationActions from 'main/actions/NotificationActions';
import NotificationView from './NotificationView';
import NotificationPreferences from './NotificationPreferences';

describe('Notification View', () => {
  let component;
  const sandbox = sinon.createSandbox();
  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', org_type: 'CCS' }));
  });

  afterEach(() => {
    sandbox.restore();
  });

  const org = {
    id: 'org13',
    name: 'transcriptic',
    org_type: 'CCS'
  };

  const user = Immutable.fromJS({
    id: 'u18dcbwhctbnj',
    name: 'john doe',
    email: 'jdoe@transcriptic.com',
    lastSignInIp: '0.0.0.0',
    createdAt: '2020-05-27T09:16:16.522-07:00',
    organizations: [org, {
      id: 'org1',
      name: 'Sample CL org',
      org_type: 'CL'
    }]
  });

  it('should render the component and have title, caption', () => {
    component = shallow(<NotificationView user={user} />);
    expect(component.find('.notification-view').length).to.equal(1);
    expect(component.find(TextTitle).children().text()).to.equal('Notification settings');
    expect(component.find(TextBody).children().text()).to.equal('Strateos may still send you important notifications about your account and alerts outside your preferred notification settings');
  });

  it('should pass selectCheckboxes based on the user attributes', () => {
    component = shallow(<NotificationView user={user} />).setState({ loaded: true, subscribedTopics: ['notify_for_my_run_status'] });
    const notificationPreferences = component.find(NotificationPreferences);
    expect(notificationPreferences.prop('selectedCheckboxes')).to.deep.equal(['notify_for_my_run_status']);
  });

  it('should have NotificationPreferences', () => {
    component = shallow(<NotificationView user={user} />).setState({ loaded: true });
    expect(component.find(NotificationPreferences).exists()).to.be.true;
  });

  it('should have footer component and save button should be disabled by default', () => {
    component = shallow(<NotificationView user={user} />).setState({ loaded: true });

    const footer = component.find(Footer).dive();
    expect(footer.find('.user-page__content-footer').length).to.equal(1);
    expect(footer.find(Button).childAt(0).text()).to.equal('Save Changes');
    expect(footer.find(Button).prop('disabled')).to.be.true;
  });

  it('should have enabled save button and cancel button when there are changes made', () => {
    component = shallow(<NotificationView user={user} />).setState({ hasChanges: true, loaded: true });

    const footer = component.find(Footer).dive();
    const cancelButton = footer.find(Button).at(0);
    expect(cancelButton.childAt(0).text()).to.equal('Cancel');

    const saveButton = footer.find(Button).at(1);
    expect(saveButton.childAt(0).text()).to.equal('Save Changes');

    expect(saveButton.prop('disabled')).to.be.false;
  });

  it('should have org drop down', () => {
    component = shallow(<NotificationView user={user} />).setState({ currentOrg: Immutable.fromJS(org) });
    expect(component.find(Select).props().value).to.equal(org.name);
    expect(component.find(Select).props().options.size).to.equal(user.get('organizations').size);
  });

  it('should pass selected organization to updateUserPreferences method when save button is clicked', () => {
    const updateUserPreferences = sandbox.stub(UserActions, 'updateUserPreferences').returns({
      done: () => {}
    });

    component = mount(<NotificationView user={user} />).setState({ currentOrg: Immutable.fromJS(org) });
    component.setState({ loaded: true });

    const expandableIcon = component.find('.fa.fa-chevron-right').at(0);

    expandableIcon.simulate('click');

    const checkBoxOptions = component.find('#project-notification-group-notify_for_my_run_status');
    checkBoxOptions.at(1).simulate('change', { target: { value: 'notify_for_my_run_status' } });

    component.find(Button).at(1).simulate('click');
    expect(updateUserPreferences.calledOnce).to.be.true;
    expect(updateUserPreferences.getCall(0).args[0].org_id).to.equal(org.id);
    component.unmount();
  });

  it('should check user preference payload and pass appropriate options to select checkbox as request payload when onSave is clicked', () => {
    const onSaveApi = sandbox.stub(UserActions, 'updateUserPreferences').returns({
      done: () => {}
    });

    component = mount(<NotificationView user={user} />);
    component.setState({ loaded: true });

    const expandableIcon = component.find('.fa.fa-chevron-right').at(0);

    expandableIcon.simulate('click');

    const checkBoxOptions = component.find('#project-notification-group-notify_for_my_run_status');
    checkBoxOptions.at(1).simulate('change', { target: { value: 'notify_for_my_run_status' } });

    component.find(Button).at(1).simulate('click');
    expect(onSaveApi.calledOnce).to.be.true;
    expect(onSaveApi.getCall(0).args[0].user_preferences.notify_for_my_run_status).to.be.true;
    expect(onSaveApi.getCall(0).args[0].user_preferences.notify_for_org_run_status).to.be.false;
    expect(onSaveApi.getCall(0).args[0].user_preferences.notify_for_my_run_schedule).to.be.false;
    expect(onSaveApi.getCall(0).args[0].user_preferences.notify_for_org_run_schedule).to.be.false;
    expect(onSaveApi.getCall(0).args[0].user_preferences.notify_for_stale_container).to.be.false;
    expect(onSaveApi.getCall(0).args[0].user_preferences.notify_for_my_intake_kit_shipped).to.be.false;
    expect(onSaveApi.getCall(0).args[0].user_preferences.notify_for_intake_kit_shipped).to.be.false;
    expect(onSaveApi.getCall(0).args[0].user_preferences.notify_for_my_shipment_checked_in).to.be.false;
    expect(onSaveApi.getCall(0).args[0].user_preferences.notify_for_shipment_checked_in).to.be.false;
    component.unmount();
  });

  it('should render Spinner if the data is not loaded from NS', () => {
    component = shallow(<NotificationView user={user} />);
    expect(component.find(Spinner)).to.have.length(1);
  });

  it('should call fetchData on componentDidUpdate when the org is changed from dropdown menu', () => {
    component = shallow(<NotificationView user={user} />).setState({ currentOrg: Immutable.fromJS(org) });
    const componentDidUpdateSpy = sinon.spy(NotificationView.prototype, 'componentDidUpdate');
    const fetchDataSpy = sinon.spy(NotificationView.prototype, 'fetchData');
    const newOrg = {
      id: 'org12345',
      name: 'Sample CL org',
      org_type: 'CL'
    };
    component.setState({ currentOrg: Immutable.fromJS(newOrg) });
    expect(componentDidUpdateSpy.calledOnce).to.be.true;
    expect(fetchDataSpy.calledOnce).to.be.true;
  });

  it('should have labeled input above organization selector drop down', () => {
    component = shallow(<NotificationView user={user} />).setState({ currentOrg: Immutable.fromJS(org) });
    expect(component.find(LabeledInput).props().label).eq('Organization');
  });

  it('should display error toast message when Notification service API fails', () => {
    const newOrg = {
      id: 'org12345',
      name: 'Sample CL org',
      org_type: 'CL'
    };
    sandbox.stub(UserActions, 'getTopicsOfOrgType').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    const notificationActionsSpy = sandbox.spy(NotificationActions, 'handleError');
    component.setState({ currentOrg: Immutable.fromJS(newOrg) });
    expect(notificationActionsSpy.calledOnce).to.be.true;
  });
});
