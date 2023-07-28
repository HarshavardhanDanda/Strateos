import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import OrganizationAPI from './OrganizationAPI';

describe('OrganizationAPI', () => {
  const sandbox = sinon.createSandbox();
  const data = {
    attributes: {
      name: 'test-org123',
      subdomain: 'test-org',
      kind: 'academic',
      creatingUserEmail: 'abc@strateos.com',
      orgType: 'CL',
      lab_id: 'lab123'
    }
  };

  const mockResponse = {
    id: 'org123',
    type: 'organizations',
    attributes: {
      account_manager_id: null,
      created_at: '2022-08-12T03:26:02.209-07:00',
      default_payment_method_id: null,
      name: 'test-org123',
      owner_id: 'u123',
      subdomain: 'test-org',
      test_account: false,
      org_type: 'CL'
    },
  };

  afterEach(() => {
    sandbox.restore();
  });

  it('should call create api', () => {
    const post = sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb(mockResponse);
        return { fail: () => ({}) };
      }
    });

    const expectedRequestParams = {
      data: {
        attributes: {
          name: 'test-org123',
          subdomain: 'test-org',
          kind: 'academic',
          creating_user_email: 'abc@strateos.com',
          org_type: 'CL',
          lab_id: 'lab123'
        },
        type: 'organizations'
      }
    };

    OrganizationAPI.create(data);
    expect(post.calledWithExactly('/api/organizations', expectedRequestParams)).to.be.true;
  });
});
