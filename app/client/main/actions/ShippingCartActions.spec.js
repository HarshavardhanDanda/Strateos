import sinon from 'sinon';
import { expect } from 'chai';
import Immutable from 'immutable';

import SessionStore from 'main/stores/SessionStore';
import ShippingCartStore from 'main/stores/ShippingCartStore';
import ShippingCartActions from './ShippingCartActions';

describe('ShippingCartActions', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });

  it('should allow container to be shipped if user org is same as container org and labs are unique across all containers', () => {
    const isOrgSame = sandbox.stub(ShippingCartActions, 'isOrgSame').returns(true);
    const isLabAllowed = sandbox.stub(ShippingCartActions, 'isLabAllowed').returns(true);
    const containers = {};
    const canContainersBeShipped = ShippingCartActions.canContainersBeShipped(containers);
    expect(isOrgSame.called).to.be.true;
    expect(isLabAllowed.called).to.be.true;
    expect(canContainersBeShipped).to.be.true;
  });

  it('should not allow containers to be shipped if user org is different from container org', () => {
    sandbox.stub(ShippingCartActions, 'isOrgSame').returns(false);
    sandbox.stub(ShippingCartActions, 'isLabAllowed').returns(true);
    const containers = {};
    const canContainersBeShipped = ShippingCartActions.canContainersBeShipped(containers);
    expect(canContainersBeShipped).to.be.false;
  });

  it('should not allow container to be shipped if labs are not unique across containers', () => {
    sandbox.stub(ShippingCartActions, 'isOrgSame').returns(true);
    sandbox.stub(ShippingCartActions, 'isLabAllowed').returns(false);
    const containers = {};
    const canContainersBeShipped = ShippingCartActions.canContainersBeShipped(containers);
    expect(canContainersBeShipped).to.be.false;
  });

  it('should not allow containers to be shipped if user org is different from container org and lab is not allowed', () => {
    sandbox.stub(ShippingCartActions, 'isOrgSame').returns(false);
    sandbox.stub(ShippingCartActions, 'isLabAllowed').returns(false);
    const containers = {};
    const canContainersBeShipped = ShippingCartActions.canContainersBeShipped(containers);
    expect(canContainersBeShipped).to.be.false;
  });

  it('should pass org check if user is an admin', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(true);
    const result = ShippingCartActions.isOrgSame(Immutable.fromJS([]));
    expect(result).to.be.true;
  });

  it('should pass org check when user org is the same of all container orgs', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(false);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    const containers = [
      Immutable.fromJS({ id: 'ct123', organization_id: 'org13' }),
      Immutable.fromJS({ id: 'ct456', organization_id: 'org13' })
    ];
    const result = ShippingCartActions.isOrgSame(containers);
    expect(result).to.be.true;
  });

  it('should fail org check if any of the container org is null', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(false);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    const containers = [
      Immutable.fromJS({ id: 'ct123', organization_id: null }),
      Immutable.fromJS({ id: 'ct456', organization_id: 'org13' })
    ];
    const result = ShippingCartActions.isOrgSame(containers);
    expect(result).to.be.false;
  });

  it('should fail org check when user org is different from the container org', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(false);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    const containers = [
      Immutable.fromJS({ id: 'ct123', organization_id: 'other_org' }),
      Immutable.fromJS({ id: 'ct456', organization_id: 'org13' })
    ];
    const result = ShippingCartActions.isOrgSame(containers);
    expect(result).to.be.false;
  });

  it('should fail lab check if lab is not present for any selected containers', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(false);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    const containers = [
      Immutable.fromJS({ id: 'ct123', organization_id: 'other_org' }),
      Immutable.fromJS({
        id: 'ct456',
        organization_id: 'org13',
        lab: {
          id: 'lb2',
        }
      })];
    const result = ShippingCartActions.isLabAllowed(containers);
    expect(result).to.be.false;
  });

  it('should pass lab check if selected containers are all shipped to the same lab', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(false);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    sandbox.stub(ShippingCartStore, 'getContainers').returns(Immutable.fromJS([]));

    const containers = [Immutable.fromJS({
      id: 'ct123',
      lab: {
        id: 'lb1'
      }
    }), Immutable.fromJS({
      id: 'ct456',
      lab: {
        id: 'lb1'
      }
    })];
    const result = ShippingCartActions.isLabAllowed(containers);
    expect(result).to.be.true;
  });

  it('should pass lab check if selected containers and containers in cart are all shipped to the same lab', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(false);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    sandbox.stub(ShippingCartStore, 'getContainers').returns(Immutable.fromJS([{ lab: { id: 'lb1' } }]));

    const containers = [Immutable.fromJS({
      id: 'ct123',
      lab: {
        id: 'lb1'
      }
    }), Immutable.fromJS({
      id: 'ct456',
      lab: {
        id: 'lb1'
      }
    })];
    const result = ShippingCartActions.isLabAllowed(containers);
    expect(result).to.be.true;
  });
});
