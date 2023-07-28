import sinon from 'sinon';
import React from 'react';
import AccessControlActions from 'main/actions/AccessControlActions';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import AuditTrailActions from 'main/actions/AuditTrailActions';
import { expect } from 'chai';
import SessionActions from 'main/actions/SessionActions';
import * as _index from 'main/initializeGlobals';
import initializeRouter from './initializeRouter';

function TestRouter() {
  return (<div>test app</div>);
}

describe('InitializeRouter', () => {
  const sandbox = sinon.createSandbox();
  const context = {
    user: 'Francesca',
    organization: { id: 'org17fs4u54pvf4',
      name: 'Angel Lab',
      subdomain: 'angel-lab'
    },
  };

  beforeEach(() => {
    Transcriptic = {
      setContext() {},
      current_user: { id: 'userId' },
      organization: { id: 'org13', subdomain: 'transcriptic' }
    };
    document.write("<div id='react_app'></div>");
    sandbox.stub(AccessControlActions, 'loadUser_acl').returns({
      then: (cb) => {
        cb({});
        return { fail: () => ({}) };
      }
    });
    sandbox.stub(SessionActions, 'load').returns({
      then: (cb) => {
        cb(context);
        return { fail: () => ({}) };
      }
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should load audit configuration when user has VIEW_AUDIT_TRAIL feature', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_AUDIT_TRAIL).returns(true);
    const spyLoadAuditConfiguration = sandbox.spy(AuditTrailActions, 'loadAuditConfiguration');
    const spyLoadAuditConfigurationHistory = sandbox.spy(AuditTrailActions, 'loadAuditConfigurationHistory');
    initializeRouter(TestRouter, 'react_app');
    expect(spyLoadAuditConfiguration.called).to.be.true;
    expect(spyLoadAuditConfigurationHistory.called).to.be.true;
  });

  it('should not load audit configuration when user does not have VIEW_AUDIT_TRAIL feature', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_AUDIT_TRAIL).returns(false);
    const spyLoadAuditConfiguration = sandbox.spy(AuditTrailActions, 'loadAuditConfiguration');
    const spyLoadAuditConfigurationHistory = sandbox.spy(AuditTrailActions, 'loadAuditConfigurationHistory');
    initializeRouter(TestRouter, 'react_app');
    expect(spyLoadAuditConfiguration.called).to.be.false;
    expect(spyLoadAuditConfigurationHistory.called).to.be.false;
  });
});
