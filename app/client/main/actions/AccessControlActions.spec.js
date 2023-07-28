import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import AccessControlActions from 'main/actions/AccessControlActions';
import Urls from 'main/util/urls';

describe('AccessControlActions', () => {
  const mockResponse = {
    content: [
      {
        id: '5fd99-f263-40ff1e',
        label: 'Admin',
        description: 'Features applicable to users who manages org',
        context: 'ORGANIZATION'
      },
      {
        id: '6c-af6c-6d24d74',
        label: 'Manage Packages',
        description: 'Manage Packages',
        context: 'ORGANIZATION'
      }
    ]
  };

  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });

  it('should load feature groups for a given organization with organizationId as argument', () => {
    const get = sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb(mockResponse);
        return { fail: () => ({}) };
      }
    });
    AccessControlActions.loadFeatureGroupsByOrgId('org123');
    expect(get.calledOnce);
    expect(get.calledWithExactly(`${Urls.features()}?organization_id=org123`)).to.be.true;
  });
});
