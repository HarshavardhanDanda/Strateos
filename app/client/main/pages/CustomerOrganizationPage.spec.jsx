import React from 'react';

import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Page, TabRouter } from '@transcriptic/amino';
import { CustomerOrganizationPage, Tabs } from './CustomerOrganizationPage';

const routeProps = {
  match: {
    params: {
      subdomain: 'Billing'
    },
    path: ''
  }
};

describe('Customer Organization Page', () => {

  it('Should Check if Page is Present', () => {
    const ref = shallow(
      <CustomerOrganizationPage {...routeProps} />
    );
    const Page1 = ref.find(Page);
    expect(Page1.length).to.be.eql(1);
  });

  it('Should have Tabrouter', () => {
    const ref = shallow(
      <CustomerOrganizationPage {...routeProps} />
    ).dive();
    const TabRouter1 = ref.find(TabRouter);
    expect(TabRouter1.length).to.equal(1);
  });

  it('Should have Overview subtab', () => {
    const  component = shallow(
      <Tabs />
    );
    const Overview = component.find('NavLink').findWhere(l => l.text() === 'Overview');
    expect(Overview).to.have.length(1);
  });

  it('Should have Security subtab', () => {
    const  component = shallow(
      <Tabs />
    );
    const Security = component.find('NavLink').findWhere(l => l.text() === 'Security');
    expect(Security).to.have.length(1);
  });

  it('Should have Addresses subtab', () => {
    const  component = shallow(
      <Tabs />
    );
    const Addresses = component.find('NavLink').findWhere(l => l.text() === 'Addresses');
    expect(Addresses).to.have.length(1);
  });

  it('Should have Billing subtab', () => {
    const  component = shallow(
      <Tabs />
    );
    const Billing = component.find('NavLink').findWhere(l => l.text() === 'Billing');
    expect(Billing).to.have.length(1);
  });

});
