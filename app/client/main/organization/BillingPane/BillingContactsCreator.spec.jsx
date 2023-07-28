import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import BillingContactsCreator from './BillingContactsCreator';

describe('BillingContactsCreator', () => {
  const sandbox = sinon.createSandbox();
  let billingContactsCreator;

  const data = Immutable.Map({
    id: '1',
    name: 'Joseph',
    email: 'joseph@transcriptic.com'
  });

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
    sandbox.restore();
    billingContactsCreator.unmount();
  });

  it('When a contact is passed as prop to contact creator in modal, the state should contain it', () => {
    billingContactsCreator = shallow(
      <BillingContactsCreator billingContacts={billingContacts} data={data} />
    );
    expect(billingContactsCreator.instance().state.id).to.be.eql('1');
    expect(billingContactsCreator.instance().state.name).to.be.eql('Joseph');
    expect(billingContactsCreator.instance().state.email).to.be.eql('joseph@transcriptic.com');
  });

  it('When a contact is not passed as prop to contact creator in modal, it should have a default state', () => {
    billingContactsCreator = shallow(
      <BillingContactsCreator billingContacts={billingContacts} />
    );
    expect(billingContactsCreator.instance().state.id).to.be.eql(undefined);
    expect(billingContactsCreator.instance().state.name).to.be.eql(undefined);
    expect(billingContactsCreator.instance().state.email).to.be.eql(undefined);
  });
});
