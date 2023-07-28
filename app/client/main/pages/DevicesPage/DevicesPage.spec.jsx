import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import SessionStore from 'main/stores/SessionStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import { BrowserRouter as Router } from 'react-router-dom';
import DeviceActions from 'main/actions/DeviceActions';
import WorkUnitActions from 'main/actions/WorkUnitActions';
import DeviceStore from 'main/stores/DeviceStore';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';

import WorkUnitStore from 'main/stores/WorkUnitStore';
import AcsControls from 'main/util/AcsControls';
import DevicesPage from './index';

describe('Device page table test', () => {

  let deviceTable;
  let deviceActionsButtons;
  const sandbox = sinon.createSandbox();

  const lab_id = 'lb1fxkgb9jt7nkk';
  const props = {
    isDevicesLoaded: true,
    devices: [{
      id: '84',
      configuration: {},
      device_class: 'echo',
      device_events: [],
      location_id: 'loc1bv7bn3r8y6v',
      manufactured_at: undefined,
      manufacturer: 'Labcyte',
      model: 'Echo 525',
      name: 'Acoustic Liquid Handler',
      purchased_at: undefined,
      serial_number: undefined
    }],
    workUnits: [{
      id: 'wu1fxkhrktd45ae',
      type: 'work_units',
      name: 'METAMCX-01',
      lab_id
    }],
  };

  beforeEach(() => {
    sandbox.stub(DeviceStore, 'isLoaded').returns(true);
    sandbox.stub(WorkUnitStore, 'isLoaded').returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    sandbox.stub(WorkUnitStore, 'getAll').returns(Immutable.fromJS(props.workUnits));
    sandbox.stub(WorkUnitStore, 'getById').returns(Immutable.fromJS(props.workUnits[0]));
    sandbox.stub(DeviceStore, 'getAll').returns(Immutable.fromJS(props.devices));
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'u18dcbwhctbnj', organizations: Immutable.fromJS([{ group: 'com.transcriptic' }]) }));

    sandbox.stub(WorkUnitActions, 'loadAllWorkUnits').returns({ done: (cb) => {
      cb();
    } });
    sandbox.stub(DeviceActions, 'loadAll').returns({ done: (cb) => {
      cb();
    } });
  });

  afterEach(() => {
    if (deviceTable) deviceTable.unmount();
    if (deviceActionsButtons) deviceActionsButtons.unmount();
    if (sandbox) sandbox.restore();
  });

  it('Check if Page is Present', () => {
    deviceTable = shallow(
      <Router>
        <DevicesPage {...props} />
      </Router>
    );
    expect(deviceTable.find('PageLayout')).to.exist;
  });

  it('Check if List is Present', () => {
    deviceTable = shallow(
      <Router>
        <DevicesPage {...props} />
      </Router>
    ).setState({ devices: props.devices });
    expect(deviceTable.find('List')).to.exist;
  });

  it('should have all the 3 buttons with both manage and view devices permissons', () => {
    const permissionsStub = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    permissionsStub.withArgs(FeatureConstants.MANAGE_DEVICES, lab_id).returns(true);
    permissionsStub.withArgs(FeatureConstants.VIEW_DEVICES, lab_id).returns(true);

    deviceTable = shallow(
      <Router>
        <DevicesPage {...props} />
      </Router>
    ).setState({ devices: props.devices });

    deviceActionsButtons = shallow(deviceTable.find(DevicesPage).dive()
      .instance()
      .renderActions(Immutable.Map(props.devices[0])));

    expect(deviceActionsButtons.find('Button').length).to.equal(3);
    expect(deviceActionsButtons.find('Button').at(0).props().label).to.equal('Show Events');
    expect(deviceActionsButtons.find('Button').at(1).props().label).to.equal('Edit Device');
    expect(deviceActionsButtons.find('Button').at(2).props().label).to.equal('Remove Device');
  });

  it('should have corresponding persistence key info to enable user preference', () => {
    deviceTable = shallow(
      <Router>
        <DevicesPage {...props} />
      </Router>
    ).setState({ devices: props.devices });
    const list = deviceTable.find('DevicesPage').dive().find('List');

    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'u18dcbwhctbnj',
      key: KeyRegistry.DEVICES_TABLE
    });
  });

  it('should have only show events button with view devices permission', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.VIEW_DEVICES, lab_id).returns(true);

    deviceTable = shallow(
      <Router>
        <DevicesPage {...props} />
      </Router>
    ).setState({ devices: props.devices });

    deviceActionsButtons = shallow(deviceTable.find(DevicesPage).dive()
      .instance()
      .renderActions(Immutable.Map(props.devices[0])));

    expect(deviceActionsButtons.find('Button').length).to.equal(1);
    expect(deviceActionsButtons.find('Button').at(0).props().label).to.equal('Show Events');
  });

  it('should have no buttons without permission', () => {
    deviceTable = shallow(
      <Router>
        <DevicesPage {...props} />
      </Router>
    ).setState({ devices: props.devices });

    deviceActionsButtons = shallow(deviceTable.find(DevicesPage).dive()
      .instance()
      .renderActions(Immutable.Map(props.devices[0])));
    expect(deviceActionsButtons.find('Button').length).to.equal(0);
  });

  it('Device manager ui should be visible to all org users who have valid feature code', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_PROVISIONED_DEVICES).returns(true);
    deviceTable = shallow(
      <Router>
        <DevicesPage {...props} />
      </Router>
    ).setState({ devices: props.devices });

    const tabs = shallow(deviceTable.find(DevicesPage).dive().instance().renderTabs());

    expect(tabs.findWhere(navlink => navlink.text() === 'Workcells').length).to.equal(1);

  });

  it('Device manager ui should not be visible to users who do not have valid feature code', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_PROVISIONED_DEVICES).returns(false);
    deviceTable = shallow(
      <Router>
        <DevicesPage {...props} />
      </Router>
    ).setState({ devices: props.devices });
    const tabs = deviceTable.find(DevicesPage).dive().instance().renderTabs();
    expect(tabs).to.be.null;
  });

  it('Dispatch should be visible to all org users who have valid feature code', () => {
    sandbox.stub(DevicesPage.prototype, 'isDeviceManagerTab').returns(true);
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.DEPLOY_DEVICE_DRIVERS).returns(true);

    deviceTable = shallow(
      <Router>
        <DevicesPage {...props} />
      </Router>
    ).setState({ devices: props.devices });

    const tabs = shallow(deviceTable.find(DevicesPage).dive().instance().renderNewDeviceButton());
    expect(tabs.find('Dispatch')).to.exist;
  });

  it('Add Device should be visible to all org users who have valid feature code', () => {
    sandbox.stub(DevicesPage.prototype, 'isDeviceManagerTab').returns(true);
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.PROVISION_NEW_DEVICE).returns(true);

    deviceTable = shallow(
      <Router>
        <DevicesPage {...props} />
      </Router>
    ).setState({ devices: props.devices });

    const tabs = shallow(deviceTable.find(DevicesPage).dive().instance().renderNewDeviceButton());
    expect(tabs.find('Add Device')).to.exist;
  });
});
