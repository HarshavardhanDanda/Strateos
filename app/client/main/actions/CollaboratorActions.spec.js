import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import CollaboratorActions  from 'main/actions/CollaboratorActions';
import NotificationActions from 'main/actions/NotificationActions';
import Urls from 'main/util/urls';
import Dispatcher from 'main/dispatcher';

describe('CollaboratorActions', () => {
  const mockResponse = {
    id: 4053,
    collaborating_id: 'u1hg6j',
    collaborative_id: 'orgzp',
    collaborative_type: 'Organization',
    collaborating_type: 'User',
    organization: {
      id: 'orgzp',
      name: 'testorg',
      subdomain: 'testdomain',
      projects: []
    },
    collaborating: {
      id: 'u1hg6j',
      email: 'abcxyz@gmail.com',
      name: 'Bob',
      'two_factor_auth_enabled?': false,
      'locked_out?': null
    }
  };

  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });

  it('should create a collaborator for a given organization', () => {
    const name = 'Bob', email = 'abcxyz@gmail.com', orgId = 'orgzp', featureGroupId = 'abc123';
    const labId = 'lb123', subdomain = 'testdomain';
    const post = sandbox.stub(ajax, 'post')
      .returns({
        done: (cb) => {
          cb(mockResponse);
          return { fail: () => ({}) };
        }
      });

    CollaboratorActions.create(name, email, featureGroupId, labId, subdomain, orgId);
    expect(post.calledOnce).to.be.true;
    const url = Urls.create_collaborator(subdomain, orgId);
    const postData = { collaborator: { name, email }, permission: { featureGroupId, labId } };
    expect(post.calledOnceWithExactly(url, postData)).to.be.true;
  });

  it('should destroy a collaborator for a given organization', () => {
    const subdomain = 'testdomain', collaboratingId = 'u1hg6j', orgId = 'orgzp', permissionId = '123abc';
    const canDestroy = true;
    const url = Urls.destroy_collaborator(subdomain, collaboratingId, orgId);
    const dispatch = sandbox.stub(Dispatcher, 'dispatch');
    const destroyCollaborator = sandbox.stub(ajax, 'delete').returns({
      done: () => {
        Dispatcher.dispatch({
          type: 'COLLABORATOR_DESTROYED',
          collaboratingId
        });
        return { fail: () => ({}) };
      }
    });
    CollaboratorActions.destroy(collaboratingId, permissionId, canDestroy, subdomain, orgId);
    expect(destroyCollaborator.calledOnce).to.be.true;
    expect(destroyCollaborator.calledOnceWith(url)).to.be.true;
    expect(dispatch.calledWithExactly({
      type: 'COLLABORATOR_DESTROYED',
      collaboratingId
    })).to.be.true;
  });

  it('should remove collaborators for a user with success notification', () => {
    const collaboratingId = 'u1hg6j', orgIds = ['orgzp'];
    const url = Urls.remove_collaborators();
    const removeCollaborators = sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb();
        return {
          fail: () => {} };
      }
    });
    const createNotification = sandbox.stub(NotificationActions, 'createNotification');

    CollaboratorActions.removeCollaboratorsForUser(collaboratingId, orgIds);
    expect(removeCollaborators.calledOnce).to.be.true;
    expect(removeCollaborators.calledOnceWith(url)).to.be.true;
    expect(createNotification.calledWithExactly({ text: 'Successfully removed Collaborators' })).to.be.true;
  });

  it('should throw an error notification if remove collaborators for a user is failed', () => {
    const collaboratingId = 'u1hg6j', orgIds = ['orgzp'];
    const url = Urls.remove_collaborators();
    const removeCollaborators = sandbox.stub(ajax, 'post').returns({
      done: () => ({ fail: (cb) => cb({ responseText: '' }) })
    });
    const mockErrorNotification = sandbox.stub(NotificationActions, 'handleError');
    CollaboratorActions.removeCollaboratorsForUser(collaboratingId, orgIds);
    expect(removeCollaborators.calledOnce).to.be.true;
    expect(removeCollaborators.calledOnceWith(url)).to.be.true;
    expect(mockErrorNotification.calledOnce).to.be.true;
  });

});
