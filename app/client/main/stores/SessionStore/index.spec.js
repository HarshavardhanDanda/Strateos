import { expect } from 'chai';

import Dispatcher from 'main/dispatcher';
import { getState, updateState, reset as resetAppState } from 'main/state';
import SessionStore from 'main/stores/SessionStore';
import sinon from 'sinon';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import Immutable from 'immutable';

const sessionPayload = {
  user: { id: '1', name: 'Alice Smith' },
  organization: { id: '1', name: 'Alice Lab' }
};

describe('SessionStore', () => {
  // Leave the global app state untouched after our tests
  // and reset to the original before each test.
  let originalState;
  const sandbox = sinon.createSandbox();
  before(() => {
    originalState = getState();
  });
  after(() => {
    updateState(originalState);
  });
  beforeEach(() => {
    resetAppState();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('loads empty', () => {
    const current = SessionStore.currentSession();
    expect(current.toJS()).to.deep.equal({});
  });

  it('receives session data', () => {
    Dispatcher.dispatch({
      type: 'SESSION_DATA',
      session: sessionPayload
    });
    const session = SessionStore.currentSession();
    expect(session.toJS()).to.deep.equal(sessionPayload);
  });

  it('updates user data', () => {
    Dispatcher.dispatch({
      type: 'SESSION_DATA',
      session: sessionPayload
    });
    const userEdited = { id: '1', name: 'Alice Edited' };
    Dispatcher.dispatch({
      type: 'USER_DATA',
      user: userEdited
    });
    const user = SessionStore.getUser();
    expect(user.toJS()).to.deep.equal(userEdited);
  });

  it('updates org data', () => {
    Dispatcher.dispatch({
      type: 'SESSION_DATA',
      session: sessionPayload
    });
    const orgEdited = { id: '1', name: 'Lab Name Edited' };
    Dispatcher.dispatch({
      type: 'ORGANIZATION_DATA',
      organization: orgEdited
    });
    const org = SessionStore.getOrg();
    expect(org.toJS()).to.deep.equal(orgEdited);
  });

  it('should trigger isAdmin and isFeatureEnabled methods when called canAdminCurrentOrg from session store', () => {
    sandbox.stub(SessionStore, 'isLoaded').returns(true);
    const systemAdminSpy = sandbox.spy(SessionStore, 'isAdmin');
    const hasAdminFeatureSpy = sandbox.spy(AcsControls, 'isFeatureEnabled');
    SessionStore.canAdminCurrentOrg();
    expect(systemAdminSpy.calledOnce).to.be.true;
    expect(hasAdminFeatureSpy.calledOnceWithExactly(FeatureConstants.ADMINISTRATION)).to.be.true;
  });

  it('canAdminCurrentOrg should return true when logged in person is system admin', () => {
    Dispatcher.dispatch({
      type: 'SESSION_DATA',
      session: sessionPayload
    });
    const userEdited = { id: '1', name: 'Alice Edited', system_admin: true };
    Dispatcher.dispatch({
      type: 'USER_DATA',
      user: userEdited
    });
    const systemAdminSpy = sandbox.spy(SessionStore, 'isAdmin');
    const canAdmin = SessionStore.canAdminCurrentOrg();
    expect(systemAdminSpy.calledOnce).to.be.true;
    expect(canAdmin).to.be.true;
  });

  it('should check record is in current org or not correctly', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org1' }));
    const record1 = Immutable.fromJS({ id: 'testid', organization_id: 'org1' });
    let isRecordInCurrentOrg = SessionStore.isRecordWithinCurrOrg(record1);
    expect(isRecordInCurrentOrg).to.be.true;

    const record2 = Immutable.fromJS({ id: 'testid', organization_id: 'org2' });
    isRecordInCurrentOrg = SessionStore.isRecordWithinCurrOrg(record2);
    expect(isRecordInCurrentOrg).to.be.false;
  });

  it('isCustomerAdmin should return true only when logged in user is admin of that organization', () => {
    Dispatcher.dispatch({
      type: 'SESSION_DATA',
      session: sessionPayload
    });
    sandbox.stub(AcsControls, 'isFeatureEnabled')
      .withArgs(FeatureConstants.ADMINISTRATION).returns(true);
    let customerOrgId = 1;
    let isCustomerAdmin = SessionStore.isCustomerAdmin(customerOrgId);
    expect(isCustomerAdmin).to.be.true;
    customerOrgId = 2;
    isCustomerAdmin = SessionStore.isCustomerAdmin(customerOrgId);
    expect(isCustomerAdmin).to.be.false;
  });
});
