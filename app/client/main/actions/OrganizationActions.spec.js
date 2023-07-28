import sinon from 'sinon';
import ajax from 'main/util/ajax';
import { expect } from 'chai';
import Urls from 'main/util/urls';
import OrganizationActions from './OrganizationActions';

describe('Organization Actions', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully update customer Organization orgId passed as query param', () => {
    const data = { two_factor_auth_enabled: false };
    const orgId = 'org123', subdomain = 'transcriptic';
    const put = sandbox.stub(ajax, 'put').returns({
      done: (cb) => {
        cb({
          data: []
        });
        return { fail: () => ({}) };
      }
    });

    OrganizationActions.update(orgId, data, subdomain);
    expect(put.calledWithExactly(Urls.update_organization(subdomain, orgId),
      { organization: { two_factor_auth_enabled: false } }
    )).to.be.true;
  });

  it('should successfully transfer ownership when orgId passed as a query param', () => {
    const data = { owner_id: 'u12345' };
    const orgId = 'org123', subdomain = 'transcriptic';
    const put = sandbox.stub(ajax, 'put').returns({
      done: (cb) => {
        cb({
          data: []
        });
        return { fail: () => ({}) };
      }
    });

    OrganizationActions.update(orgId, data, subdomain);
    expect(put.calledWithExactly(Urls.update_organization(subdomain, orgId),
      { organization: { owner_id: 'u12345' } }
    )).to.be.true;
  });

});
