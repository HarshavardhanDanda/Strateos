import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { BrowserRouter as Router } from 'react-router-dom';

import PackageProtocolPage from './PackageProtocolPage';

const packageId = 'pk1eczcyxsr2urq';
const protocolName = 'Peeler';

const routeProps = {
  match: {
    params: {
      subdomain: 'xyz',
      packageId: 'pk1eczcyxsr2urq',
      protocolName: 'Peeler'
    },
    path: ''
  }
};

describe('PackageProtocolPage', () => {

  let component;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (component) {
      component.unmount();
    }
    sandbox.restore();
  });

  it('should set package_id in intercom settings', () => {
    window.intercomSettings = {};
    component = mount(
      <Router>
        {<PackageProtocolPage
          {...routeProps}
        />}
      </Router>);
    expect(window.intercomSettings.package_id).to.be.equal(packageId);
    expect(window.intercomSettings.protocol_name).to.be.equal(protocolName);
  });
});
