import React from 'react';
import AccountManager from 'main/organization/OverviewPane/AccountManager';
import Immutable  from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';

describe('AccountManager', () => {
  const DEFAULT_NAME = 'Strateos';
  const DEFAULT_EMAIL = 'sales@strateos.com';
  const customerOrg = Immutable.fromJS({
    id: 'org123',
    account_manager: {
      name: 'Bob',
      email: 'bob123@gmail.com'
    } });
  const otherOrg = Immutable.fromJS({ id: 'org293' });
  it('should display AccountManager details', () => {
    const accountManager = shallow(<AccountManager org={customerOrg} customerOrgId={customerOrg.get('id')} />);
    expect(accountManager.text().includes(customerOrg.getIn(['account_manager', 'name']))).to.be.true;
    expect(accountManager.text().includes(customerOrg.getIn(['account_manager', 'email']))).to.be.true;
  });

  it('should display default account manager details if there is no account manager for the org', () => {
    const accountManager = shallow(<AccountManager org={otherOrg} customerOrgId={customerOrg.get('id')} />);
    expect(accountManager.text().includes(DEFAULT_NAME)).to.be.true;
    expect(accountManager.text().includes(DEFAULT_EMAIL)).to.be.true;
  });
});
