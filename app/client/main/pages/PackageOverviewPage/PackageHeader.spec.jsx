import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Imm from 'immutable';
import FeatureConstants from '@strateos/features';
import AcsControls      from  'main/util/AcsControls';
import SessionStore from 'main/stores/SessionStore';
import PackageHeader from './PackageHeader';

describe('PackageHeader', () => {

  let component;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    Transcriptic = {
      current_user: { id: 'userId' },
      organization: { subdomain: 'transcriptic' }
    };
    sandbox.stub(SessionStore, 'getOrg').returns(Imm.Map({ id: 'org13', subdomain: 'transcriptic' }));
  });

  afterEach(() => {
    if (component) {
      component.unmount();
    }
    sandbox.restore();
  });

  const packageHeader = (myPackage, context = { context: { router: {} } }) => {
    return shallow(<PackageHeader package={myPackage} />, context);
  };

  it('users with required permission should be able to make package public', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.UPLOAD_NEW_RELEASE_DESTROY_PACKAGE_PROTOCOL).returns(true);
    const myPackage = Imm.Map({
      name: 'some package',
      id: 'pk1eczcyxsr2urq',
      owner: Imm.Map({
        id: 'userId'
      }),
      public: false
    });

    const component = packageHeader(myPackage);
    const buttons = component.find('ButtonGroup');
    const button = buttons.dive().find('Button').at(1);
    expect(button.length).to.be.eql(1);
    expect(button.dive().text()).to.equal('Make Public');
  });
  it('users with required permission should be able to make package private', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.UPLOAD_NEW_RELEASE_DESTROY_PACKAGE_PROTOCOL).returns(true);
    const myPackage = Imm.Map({
      name: 'some package',
      id: 'pk1eczcyxsr2urq',
      owner: Imm.Map({
        id: 'userId'
      }),
      public: true
    });

    const component = packageHeader(myPackage);
    const buttons = component.find('ButtonGroup');
    const button = buttons.dive().find('Button').at(1);
    expect(button.length).to.be.eql(1);
    expect(button.dive().text()).to.equal('Make Private');
  });
  it('users who does not have permission should not be able to make package public', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.UPLOAD_NEW_RELEASE_DESTROY_PACKAGE_PROTOCOL).returns(false);
    const myPackage = Imm.Map({
      name: 'some package',
      id: 'pk1eczcyxsr2urq',
      owner: Imm.Map({
        id: 'anotherUserId'
      }),
      public: false
    });
    const component = packageHeader(myPackage);
    const buttons = component.find('ButtonGroup');
    const button = buttons.dive().find('Button');
    expect(button.length).to.be.eql(0);
  });
  it('users who does not have permission should not be able to make package public', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.UPLOAD_NEW_RELEASE_DESTROY_PACKAGE_PROTOCOL).returns(false);
    const myPackage = Imm.Map({
      name: 'some package',
      id: 'pk1eczcyxsr2urq',
      owner: Imm.Map({
        id: 'userID'
      }),
      public: false
    });
    Transcriptic.current_user.id = 'userId';
    Transcriptic.organization.subdomain = 'otherOrg';
    const component = packageHeader(myPackage);
    const buttons = component.find('ButtonGroup');
    const button = buttons.dive().find('Button');
    expect(button.length).to.be.eql(0);
  });
  it('users with required permission should not be able to upload new release', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.UPLOAD_NEW_RELEASE_DESTROY_PACKAGE_PROTOCOL).returns(true);
    const myPackage = Imm.Map({
      name: 'some package',
      id: 'pk1eczcyxsr2urq',
      owner: Imm.Map({
        id: 'userID'
      })
    });
    const component = packageHeader(myPackage);
    const buttons = component.find('ButtonGroup');
    const button = buttons.dive().find('Button').at(0);
    expect(button.length).to.be.eql(1);
    expect(button.dive().text()).to.equal('Upload New Release');
  });
  it('user who has permission should be able to destroy', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.UPLOAD_NEW_RELEASE_DESTROY_PACKAGE_PROTOCOL).returns(true);
    const myPackage = Imm.Map({
      name: 'some package',
      id: 'pk1eczcyxsr2urq',
      owner: Imm.Map({
        id: 'userId'
      }),
      public: false
    });

    const component = packageHeader(myPackage);
    const buttons = component.find('ButtonGroup');
    const button = buttons.dive().find('Button').at(2);
    expect(button.length).to.be.eql(1);
    expect(button.dive().find('span').text()).to.equal('Destroy');
  });
});
