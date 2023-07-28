import React from 'react';
import { expect } from 'chai';
import { shallow, mount } from 'enzyme';
import Immutable from 'immutable';
import { Spinner, Table } from '@transcriptic/amino';
import { BillingHistoryTable } from './BillingHistory';

describe('billing history test', () => {
  let wrapper;
  const pastInvoices = Immutable.fromJS([{
    id: 'inv17phe8skccfu',
    payment_method: {
      credit_card_type: 'Visa',
      is_removable: true,
      is_valid: true,
      organization_id: 'org17fs4u54pvf4',
      created_at: '2015-04-12T23:22:34.773-07:00',
      expiry: '2017-06-30',
      'is_default?': true,
      credit_card_last_4: '3183',
      credit_card_name: 'Axel Nyström',
      stripe_card_id: 'card_637CWKT0btPqe5',
      type: 'CreditCard',
      id: 'pm17mmj8a3wbmj',
      description: 'Visa 3183',
      can_make_default: false
    },

    month: '2015-04',
    charged_at: '2015-05-06T11:41:08.615-07:00',
    total: '30.0',
    remitted_at: '2015-05-06T11:41:10.551-07:00',
    issued_at: '2015-05-06T11:41:08.614-07:00',
    contact_user: {
      email: 'axel.nystrom@ccc.ox.ac.uk',
      name: 'Axel Nyström'
    },
    created_at: '2015-04-30T17:01:11.804-07:00',
    reference: '2015-04',
    xero_invoice_guid: '13c9ee03-227f-47eb-a5e9-fb13ece09a21',
    xero_invoice_number: 'INV-4351',
    organization: {
      id: 'org17fs4u54pvf4',
      name: 'Angel Lab',
      subdomain: 'angel-lab'
    },
    payment_method_id: 'pm17mmj8a3wbmj'
  }]);

  afterEach(() => {
    if (wrapper) { wrapper.unmount(); }
  });

  it('billing history should render on load', () => {
    wrapper = mount(<BillingHistoryTable pastInvoices={pastInvoices} />);
    expect(wrapper.find(Table)).to.have.length(1);
  });

  it('When bills are not loaded Loading should be displayed', () => {
    wrapper = shallow(<BillingHistoryTable />);
    expect(wrapper.find(Spinner)).to.have.length(1);
  });
});
