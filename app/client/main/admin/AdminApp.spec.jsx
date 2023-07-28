import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import AdminApp from './AdminApp';

describe('AdminApp', () => {
  let adminApp;
  afterEach(() => {
    adminApp.unmount();
  });

  it('should have a total of 2 tabs', () => {
    adminApp = shallow(
      <AdminApp>
        <p />
      </AdminApp>);
    expect(adminApp.find('NavLink')).to.have.lengthOf(2);
  });
});
