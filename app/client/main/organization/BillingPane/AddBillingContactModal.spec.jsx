import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';

import { AddBillingContactModal } from './AddBillingContactModal';

describe('Add/Edit Billing contact modal', () => {
  let modal;

  const billingContacts = Immutable.fromJS([
    {
      id: '1',
      name: 'test_name_1',
      email: 'test1@email.com',
      organization_id: 'org13',
      confirmed_at: '',
      created_at: '2020-03-13T02:37:14.433-07:00',
      updated_at: '2020-03-17T21:09:55.866-07:00'
    },
    {
      id: '2',
      name: 'test_name_2',
      email: 'test2@email.com',
      organization_id: 'org13',
      confirmed_at: '',
      created_at: '2020-03-13T02:37:14.433-07:00',
      updated_at: '2020-03-17T21:09:55.866-07:00'
    }
  ]);

  afterEach(() => {
    modal.unmount();
  });

  it('AddBillingContactModal should exist and render BillingContactsCreator component for proper props', () => {
    modal = shallow(
      <AddBillingContactModal billingContacts={billingContacts} />
    );
    expect(modal.exists()).to.be.true;
    expect(modal.find('BillingContactsCreator')).to.have.length(1);
  });

  it('AddBillingContactModal should exist and render BillingContactsCreator component for empty billing contacts', () => {
    modal = shallow(
      <AddBillingContactModal billingContacts={Immutable.fromJS([])} />
    );
    expect(modal.exists()).to.be.true;
    expect(modal.find('BillingContactsCreator')).to.have.length(1);
  });
});
