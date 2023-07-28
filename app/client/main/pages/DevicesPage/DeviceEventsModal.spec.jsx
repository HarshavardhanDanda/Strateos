import React       from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect }  from 'chai';
import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';
import WorkUnitStore from '../../stores/WorkUnitStore';

import DeviceEventsModal, { EventEditorModal } from './DeviceEventsModal';

const device = {
  id: '84',
  configuration: {},
  device_class: 'echo',
  device_events: [{
    id: '10',
    event_type: 'qc',
    date: '2017-07-09',
    device_id: '84'
  }],
  location_id: 'loc1bv7bn3r8y6v',
  manufactured_at: undefined,
  manufacturer: 'Labcyte',
  model: 'Echo 525',
  name: 'Acoustic Liquid Handler',
  purchased_at: undefined,
  serial_number: undefined,
  work_unit_id: 'wu1fxkhrktn2h7n',
  work_unit_name: 'WC5'
};
const workUnit = {
  id: 'wu1fxkhrktd45ae',
  type: 'work_units',
  name: 'METAMCX-01',
  lab_id: 'lb1fxkgb9jt7nkk'
};

describe('EventEditorModal and DeviceEventsModal', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(WorkUnitStore, 'getById').returns(Immutable.fromJS(workUnit));
  });

  afterEach(() => {
    wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should have submit button disabled on load ', () => {
    wrapper = shallow(
      <EventEditorModal
        device={device}
        event={{ id: 1, event_type: 'qc' }}
        onSave={() => {}}
        modalId={'eventEditorModalID'}
      />
    );
    const modal = wrapper.find('ConnectedSinglePaneModal');
    expect(modal.props().acceptBtnDisabled).to.be.true;
  });

  it('should have new event button with permission', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.MANAGE_DEVICE_EVENTS).returns(true);
    wrapper = shallow(
      <DeviceEventsModal
        device={device}
        modalId={'deviceEventsModalID'}
      />
    );
    const modal = wrapper.find('ConnectedSinglePaneModal');
    expect(modal.find('Button').children().text()).to.equal('New Event');
  });

  it('should have render actions column with permission', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.MANAGE_DEVICE_EVENTS).returns(true);
    wrapper = shallow(
      <DeviceEventsModal
        device={device}
        modalId={'deviceEventsModalID'}
      />
    );
    const modal = wrapper.find('ConnectedSinglePaneModal');
    expect(modal.find('ConnectedSinglePaneModal').find('Column').length).to.equal(4);
    expect(modal.find('ConnectedSinglePaneModal').find('Column').at(3).props().id).to.equal('actions-column');
  });

  it('should not have render actions column and new event button without permission', () => {
    wrapper = shallow(
      <DeviceEventsModal
        device={device}
        modalId={'deviceEventsModalID'}
      />
    );
    const modal = wrapper.find('ConnectedSinglePaneModal');
    expect(modal.find('ConnectedSinglePaneModal').find('Column').length).to.equal(3);
  });
});
