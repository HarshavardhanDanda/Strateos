import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { BrowserRouter as Router } from 'react-router-dom';
import Imm from 'immutable';

import ProtocolActions from 'main/actions/ProtocolActions';
import { Page } from '@transcriptic/amino';
import SessionStore from 'main/stores/SessionStore';
import PackageOverviewPage from './PackageOverviewPage';

const routeProps = {
  match: {
    params: {
      subdomain: 'xyz',
      packageId: 'pk1eczcyxsr2urq'
    },
    path: ''
  }
};

const myPackage = Imm.Map({
  name: 'some package',
  id: 'pk1eczcyxsr2urq'
});

const protocolA = {
  display_name: 'protocol A',
  name: 'ProtocolA',
  published: true,
  version: '0.0.19',
  id: 'pr1'
};

const protocolB = {
  display_name: 'protocol A',
  name: 'ProtocolA',
  published: false,
  version: '0.0.18',
  id: 'pr2'
};

const protocolC = {
  display_name: 'protocol B',
  name: 'ProtocolB',
  published: false,
  version: '0.0.15',
  id: 'pr3'
};

describe('PackageOverviewPage', () => {

  let component;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Imm.Map({ id: 'org13', subdomain: 'transcriptic' }));
  });

  afterEach(() => {
    if (component) {
      component.unmount();
    }
    sandbox.restore();
  });

  it('Check if Page is Present', () => {
    const component = mount(
      <Router>
        {<PackageOverviewPage
          package={myPackage}
          {...routeProps}
        />}
      </Router>
    );
    const page = component.find(Page);
    expect(page.length).to.be.eql(1);
  });

  it('should set package_id in intercom settings', () => {
    window.intercomSettings = {};
    mount(
      <Router>
        {<PackageOverviewPage
          package={myPackage}
          {...routeProps}
        />}
      </Router>);
    expect(window.intercomSettings.package_id).to.be.equal(myPackage.get('id'));
  });

  it('should have two protocols lists sections', () => {
    const component = mount(
      <Router>
        {<PackageOverviewPage
          package={myPackage}
          {...routeProps}
        />}
      </Router>);
    const instance = component.find('SearchableProtocolList');
    expect(instance.length).to.be.equals(2);
  });

  it('should display published protocols in published protocols section', async () => {
    const sandbox = sinon.createSandbox();
    sandbox.stub(ProtocolActions, 'loadPackageProtocols').returns(
      new Promise((resolve) => { resolve([protocolA, protocolB, protocolC]); })
    );

    const component = mount(
      <Router>
        {<PackageOverviewPage
          package={myPackage}
          {...routeProps}
        />}
      </Router>);

    const componentInstance = component.find('PackageOverviewPage').instance();
    await new Promise(((resolve) => {
      setTimeout(() => {
        expect(componentInstance.state.publishedProtocols.size).to.be.equals(1);
        const ListInstance = component.find('SearchableProtocolList').first().instance();
        expect(ListInstance.props.protocols.size).to.be.equals(1);
        resolve();
      }, 100);
    }));
    sandbox.restore();
  });

  it('should display unpublished protocols in un-published protocols section', async () => {
    const sandbox = sinon.createSandbox();
    sandbox.stub(ProtocolActions, 'loadPackageProtocols').returns(
      new Promise((resolve) => { resolve([protocolA, protocolB, protocolC]); })
    );

    const component = mount(
      <Router>
        {<PackageOverviewPage
          package={myPackage}
          {...routeProps}
        />}
      </Router>);

    const componentInstance = component.find('PackageOverviewPage').instance();
    await new Promise(((resolve) => {
      setTimeout(() => {
        expect(componentInstance.state.unpublishedProtocols.size).to.be.equals(1);
        const ListInstance = component.find('SearchableProtocolList').last().instance();
        expect(ListInstance.props.protocols.size).to.be.equals(1);
        resolve();
      }, 100);
    }));
    sandbox.restore();
  });
});
