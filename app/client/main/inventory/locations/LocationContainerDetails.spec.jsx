import React from 'react';
import { shallow, configure } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';
import Immutable from 'immutable';
import sinon from 'sinon';

import NotificationActions from 'main/actions/NotificationActions';
import ContainerAPI from 'main/api/ContainerAPI';
import LocationContainerDetails from './LocationContainerDetails';

configure({ adapter: new Adapter() });

describe('LocationContainerDetails', () => {
  const container = Immutable.fromJS({
    barcode: '75151345',
    container_type_id: 'micro-1.5',
    container_type_shortname: 'micro-1.5',
    id: 'ct18fc73q7kjn7',
    lab_id: 'lb1fej8nubcf3k3',
    label: 'C',
    location_id: 'loc19639h3hpqsx',
    organization_id: 'org18cbmg28j8ps',
    status: 'available',
  });

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should display error message when it fails to update barcode', () => {
    const wrapper = shallow(
      <LocationContainerDetails container={container} />
    );
    const notification = sandbox.spy(NotificationActions, 'handleError');
    sandbox.stub(ContainerAPI, 'update').returns({
      done: () => ({
        fail: (cb) => cb({})
      })
    });
    wrapper.instance().updateContainer({ barcode: 'ct1d9aacgytxnq5' });
    expect(notification.calledOnce).to.equal(true);
  });

  it('should display Destruction value as N/A when a container is available', () => {
    const wrapper = shallow(
      <LocationContainerDetails container={container} />
    );
    const keyValueList = wrapper.find('KeyValueList');
    const destruction = keyValueList.dive().find('InternalKeyValueEntry').at(4);
    expect(destruction.dive().find('div').find('p').text()).to.equal('N/A');
  });
});
