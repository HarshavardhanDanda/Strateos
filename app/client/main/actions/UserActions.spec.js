import sinon from 'sinon';
import { expect } from 'chai';
import Urls from 'main/util/urls';
import HTTPUtil from 'main/util/HTTPUtil';

import ajax from 'main/util/ajax';
import Dispatcher from 'main/dispatcher';
import NotificationActions from 'main/actions/NotificationActions';
import UserActions from './UserActions';

describe('User Actions', () => {
  const sandbox = sinon.createSandbox();
  const orgType = 'CCS';
  const orgId = 'org13';
  const userId = 'user1';
  const orgTopics = {
    totalPages: 1,
    totalElements: 1,
    size: 10000,
    content: [
      {
        id: '016770bb-fba9-4d6d-bcfb-72ba6ae6e5f0',
        name: 'container.stale',
        description: 'Notify for stale container',
        org_type: [
          'CCS',
          'CL',
          'CL_IMPL'
        ],
        scope: [
          'ORG'
        ],
        delivery_channels: [
          {
            id: '61a649a3-3f28-69e5-e35f-bb7aff3a80d9',
            name: 'EMAIL',
            description: 'Send email'
          }
        ]
      }
    ],
    number: 0
  };
  const orgSubscriptions = {
    totalPages: 1,
    totalElements: 1,
    size: 10,
    content: [
      {
        id: '5e4f7753-25bb-4c00-a5cb-272a72f139e6',
        topicChannelDetails: [
          {
            topicId: 'a55b2783-6604-1a5a-acbd-958cefd38728',
            deliveryChannelId: [
              '61a649a3-3f28-69e5-e35f-bb7aff3a80d9'
            ]
          }
        ],
        type: 'USER',
        userId: 'u18ze7ysrng2v',
        scope: 'ORG'
      }
    ],
    number: 0
  };
  const params = {
    user_preferences: {
      notify_for_my_run_status: true,
      notify_for_org_run_status: false,
      notify_for_my_run_schedule: false,
      notify_for_org_run_schedule: false,
      notify_for_stale_container: false,
      notify_for_my_intake_kit_shipped: false,
      notify_for_intake_kit_shipped: false,
      notify_for_my_shipment_checked_in: false,
      notify_for_shipment_checked_in: false
    },
    org_id: orgId,
    org_type: orgType
  };
  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully confirm 2FA', () => {
    const code = { code: '123456' };
    const post = sandbox.stub(ajax, 'post');
    UserActions.confirm2fa(code.code);
    expect(post.calledWithExactly('/2fa_check_code.json', code)).to.be.true;
  });

  it('should successfully request developer access', () => {
    const userId = { user_id: '13' };
    const post = sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb(userId);
        return { fail: () => ({}) };
      }
    });
    UserActions.requestDeveloperAccess(userId.user_id);
    expect(post.calledWith('/users/13/request_developer_access')).to.be.true;
  });

  it('should successfully update user notification preferences', () => {
    const put = sandbox.stub(ajax, 'put').returns({
      done: (cb) => {
        cb(params);
        return { fail: () => ({}) };
      }
    });
    UserActions.updateUserPreferences(params);
    expect(put.calledWith('/users')).to.be.true;
  });

  it('should display error toast message when update user preferences API fails', () => {
    const notificationActionsSpy = sandbox.stub(NotificationActions, 'handleError');

    sandbox.stub(ajax, 'put').returns({
      done: () => ({ fail: (cb) => cb('Unable to create user subscription/save user preferences') })
    });

    UserActions.updateUserPreferences(params);
    expect(notificationActionsSpy.calledOnce).to.be.true;
    expect(notificationActionsSpy.args[0]).to.deep.equal(['Unable to create user subscription/save user preferences']);
  });

  it('should successfully return topics of given org type', () => {
    const get = sandbox.stub(HTTPUtil, 'get').returns({
      done: (cb) => {
        cb(orgTopics);
        return { fail: () => ({}) };
      }
    });
    UserActions.getTopicsOfOrgType(orgType);
    expect(get.calledWith(Urls.topics_of_org_type(orgType))).to.be.true;
  });

  it('should successfully dispatch org topics to store', () => {
    const dispatch = sandbox.stub(Dispatcher, 'dispatch');
    const getOrgTopics = sandbox.stub(HTTPUtil, 'get').returns({
      done: () => {
        Dispatcher.dispatch({
          type: 'TOPIC_OF_ORG_TYPE_LIST',
          orgTopics: orgTopics.content
        });
        return { fail: () => ({}) };
      }
    });
    UserActions.getTopicsOfOrgType(orgType);
    expect(getOrgTopics.calledOnceWith(Urls.topics_of_org_type(orgType))).to.be.true;
    expect(dispatch.calledWithExactly({
      type: 'TOPIC_OF_ORG_TYPE_LIST',
      orgTopics: orgTopics.content
    })).to.be.true;
  });

  it('should successfully return subscriptions of the user in given org', () => {
    const get = sandbox.stub(HTTPUtil, 'get').returns({
      done: (cb) => {
        cb(orgSubscriptions);
        return { fail: () => ({}) };
      }
    });
    UserActions.getSubscriptions(orgId, userId);
    expect(get.calledOnceWith(Urls.subscriptions(orgId, userId))).to.be.true;
  });

  it('should successfully dispatch user subscriptions to store', () => {
    const dispatch = sandbox.stub(Dispatcher, 'dispatch');
    const getUserSubscriptions = sandbox.stub(HTTPUtil, 'get').returns({
      done: () => {
        Dispatcher.dispatch({
          type: 'SUBSCRIPTION_LIST',
          subscriptions: orgSubscriptions.content
        });
        return { fail: () => ({}) };
      }
    });
    UserActions.getSubscriptions(orgId, userId);
    expect(getUserSubscriptions.calledOnceWith(Urls.subscriptions(orgId, userId))).to.be.true;
    expect(dispatch.calledWithExactly({
      type: 'SUBSCRIPTION_LIST',
      subscriptions: orgSubscriptions.content
    })).to.be.true;
  });

  it('should successfully update user parameters', () => {
    const Params = { params: 'ct1e52nvhs46zws' };
    const post = sandbox.stub(ajax, 'put').returns({
      done: (cb) => {
        cb(Params);
        return { fail: () => ({}) };
      }
    });
    UserActions.update(Params.params);
    expect(post.calledWith('/users')).to.be.true;
  });

  it('should successfully update user parameters without notification', () => {
    const Params = { params: 'ct1e52nvhs46zws' };
    const post = sandbox.stub(ajax, 'put').returns({
      done: (cb) => {
        cb(Params);
        return { fail: () => ({}) };
      }
    });
    UserActions.updateWithoutNotification(Params.params);
    expect(post.calledWith('/users')).to.be.true;
  });

  it('should successfully request developer access', () => {
    const userId = { user_id: '13' };
    const post = sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb(userId);
        return { fail: () => ({}) };
      }
    });
    UserActions.rotateAPIKey(userId.user_id);
    expect(post.calledWith('/users/13/api/rotate')).to.be.true;
  });

});
