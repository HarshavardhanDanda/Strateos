import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import LocationTreeLogic from './LocationTreeLogic';

const locations = Immutable.fromJS([
  {
    ancestors: [],
    col: null,
    location_type: {
      id: 'loctyp1egnd6qa5z8g2',
      name: 'Region',
      category: 'region',
      capacity: null,
      created_at: '2021-01-09T20:57:51.361-08:00',
      updated_at: '2021-01-09T20:57:51.361-08:00',
      location_type_categories: [
        ''
      ]
    },
    merged_properties: {},
    position: null,
    created_at: '2020-06-01T13:52:26.042-07:00',
    name: '📋 Test Region',
    lab_id: 'lb1fknzm4k8qkq7',
    parent_id: null,
    properties: {},
    updated_at: '2021-03-23T20:36:35.629-07:00',
    row: null,
    parent_path: [],
    id: 'loc1egneyc9dd5yu'
  },
  {
    ancestors: [
      {
        id: 'loc1egneyc9dd5yu',
        parent_id: null,
        name: '📋 Test Region',
        position: null,
        human_path: '📋 Test Region',
        ancestor_blacklist: []
      }
    ],
    col: null,
    location_type: {
      id: 'loctyp1959vuy4482f',
      name: 'Unknown',
      category: 'Unknown',
      capacity: null,
      created_at: '2016-06-21T16:30:16.096-07:00',
      updated_at: '2016-07-18T19:41:00.006-07:00',
      location_type_categories: []
    },
    merged_properties: {
      environment: 'ambient'
    },
    position: null,
    created_at: '2019-09-03T12:07:01.542-07:00',
    name: "[Test] Elvis' desk",
    lab_id: 'lb1fknzm4k8qkq7',
    parent_id: 'loc1egneyc9dd5yu',
    properties: {
      environment: 'ambient'
    },
    updated_at: '2020-06-01T14:35:02.815-07:00',
    row: null,
    parent_path: [
      'loc1egneyc9dd5yu'
    ],
    id: 'loc1dhk6eswmjhbk'
  },
]);

const nodeState = Immutable.fromJS({
  null: {
    isOpen: true
  },
  undefined: {
    isBusy: false
  }
});

const locationId = 'loc1egneyc9dd5yu';

describe('LocationTreeLogic', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should call openPath when complete location tree is expanded', () => {
    const openPathSpy = sandbox.spy(LocationTreeLogic, 'openPath');
    LocationTreeLogic.openPath(nodeState, locationId, locations);
    expect(openPathSpy.calledOnce).to.be.true;
    expect(openPathSpy.args[0][0]).to.deep.equal(nodeState);
    expect(openPathSpy.args[0][1]).to.deep.equal(locationId);
    expect(openPathSpy.args[0][2]).to.deep.equal(locations);
  });

  it('should call closeAll when location tree is closed', () => {
    const closeAllSpy = sandbox.spy(LocationTreeLogic, 'closeAll');
    LocationTreeLogic.closeAll(nodeState);
    expect(closeAllSpy.calledOnce).to.be.true;
    expect(closeAllSpy.args[0][0]).to.deep.equal(nodeState);
  });

  it('should call isOpen when location tree is expanded', () => {
    const isOpenSpy = sandbox.spy(LocationTreeLogic, 'isOpen');
    LocationTreeLogic.isOpen(nodeState, locationId);
    expect(isOpenSpy.calledOnce).to.be.true;
    expect(isOpenSpy.args[0][0]).to.deep.equal(nodeState);
    expect(isOpenSpy.args[0][1]).to.deep.equal(locationId);
  });

  it('should call addDefault to set the default location', () => {
    const addDefaultSpy = sandbox.spy(LocationTreeLogic, 'addDefault');
    LocationTreeLogic.addDefault(nodeState, locationId);
    expect(addDefaultSpy.calledOnce).to.be.true;
    expect(addDefaultSpy.args[0][0]).to.deep.equal(nodeState);
    expect(addDefaultSpy.args[0][1]).to.deep.equal(locationId);
  });

  it('should call exclusiveSelect to select the default location', () => {
    const exclusiveSelectSpy = sandbox.spy(LocationTreeLogic, 'exclusiveSelect');
    LocationTreeLogic.exclusiveSelect(nodeState, locationId);
    expect(exclusiveSelectSpy.calledOnce).to.be.true;
    expect(exclusiveSelectSpy.args[0][0]).to.deep.equal(nodeState);
    expect(exclusiveSelectSpy.args[0][1]).to.deep.equal(locationId);
  });

  it('should call setBusy when locations are loading', () => {
    const setBusySpy = sandbox.spy(LocationTreeLogic, 'setBusy');
    LocationTreeLogic.setBusy(nodeState, locationId, true);
    expect(setBusySpy.calledOnce).to.be.true;
    expect(setBusySpy.args[0][0]).to.deep.equal(nodeState);
    expect(setBusySpy.args[0][1]).to.deep.equal(locationId);
    expect(setBusySpy.args[0][2]).to.deep.equal(true);
  });

  it('should call setOpen when locations are loading', () => {
    const setOpenSpy = sandbox.spy(LocationTreeLogic, 'setOpen');
    LocationTreeLogic.setOpen(nodeState, locationId, true);
    expect(setOpenSpy.calledOnce).to.be.true;
    expect(setOpenSpy.args[0][0]).to.deep.equal(nodeState);
    expect(setOpenSpy.args[0][1]).to.deep.equal(locationId);
    expect(setOpenSpy.args[0][2]).to.deep.equal(true);
  });
});
