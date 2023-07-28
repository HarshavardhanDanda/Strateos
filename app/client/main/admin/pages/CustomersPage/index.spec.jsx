import React         from 'react';
import { expect }    from 'chai';
import { shallow }   from 'enzyme';

import CustomersPage, { Tabs } from './index';

describe('Customers Page Test', () => {

  let customersPage;

  const props = {
    match: {
      path: ''
    }
  };

  afterEach(() => {
    customersPage.unmount();
  });

  it('customers page should have TabRouter component', () => {
    customersPage = shallow(<CustomersPage {...props} />);
    expect(customersPage.find('TabRouter').length).to.be.eql(1);
  });

  it('customers page should have three tabs', () => {
    customersPage = shallow(<Tabs />);
    expect(customersPage.find('NavLink').length).to.be.eql(3);
  });
});
