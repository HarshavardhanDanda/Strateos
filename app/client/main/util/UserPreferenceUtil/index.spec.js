import { expect } from 'chai';
import Immutable from 'immutable';
import sinon from 'sinon';
import SessionStore from 'main/stores/SessionStore';
import UserPreference from './index';

describe('UserPreference', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.fromJS({ id: 'uid' }));
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'orgId' }));
  });

  afterEach(() => {
    sandbox.restore();
    UserPreference.remove('run');
    UserPreference.remove('filter');
  });

  it('should save preference and get value by key', () => {
    const preference = { run: 'value1' };
    UserPreference.save(preference);
    expect(UserPreference.get('run')).to.be.equal(preference.run);
  });

  it('should save two preferences and remove one', () => {
    const preference = { run: 'value1', filter: 'value2' };
    UserPreference.save(preference);
    expect(UserPreference.get('run')).to.be.equal(preference.run);
    expect(UserPreference.get('filter')).to.be.equal(preference.filter);
    UserPreference.remove('filter');
    expect(UserPreference.get('filter')).to.be.equal(null);
    expect(UserPreference.get('run')).to.be.equal(preference.run);
  });

  it('should package expected user info object for key generation', () => {
    const keyInfo1 = UserPreference.packInfo();
    const keyInfo2 = UserPreference.packInfo('tagged-menu');
    const keyInfo3 = UserPreference.packInfo('runTabs');

    expect(keyInfo1).to.be.undefined;
    expect(keyInfo2).to.be.deep.equal({
      appName: 'Web',
      orgId: 'orgId',
      userId: 'uid',
      key: 'tagged-menu'
    });
    expect(keyInfo3).to.be.deep.equal({
      appName: 'Web',
      orgId: 'orgId',
      userId: 'uid',
      key: 'runTabs'
    });
  });

});
