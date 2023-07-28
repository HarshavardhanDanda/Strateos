import React       from 'react';
import { expect }  from 'chai';
import { shallow } from 'enzyme';
import Immutable   from 'immutable';
import { Table } from '@transcriptic/amino';
import { Loading } from 'main/components/page';
import { Invoices } from './quality_control';

describe('quality control test', () => {

  let wrapper;

  const invoices = Immutable.fromJS([{
    charged_at: undefined,
    contact_user: {
      email: 'chris.w.beitel@gmail.com',
      name: 'Christopher Beitel'
    },
    created_at: '2015-03-31T17:00:41.420-07:00',
    declined_at: undefined,
    forgiven_at: '2015-04-03T10:51:38.751-07:00',
    id: 'inv17kau42fpzcg',
    issued_at: undefined,
    month: '2015-03',
    organization: {
      id: 'org16quvsyfmr29',
      name: 'Eisen Lab, University of California',
      subdomain: 'eisen-lab-university-of-california'
    },
    payment_method: {
      can_make_default: false,
      created_at: '2015-03-18T10:46:13.466-07:00',
      credit_card_last_4: '5585',
      credit_card_name: 'Christopher Beitel',
      credit_card_type: 'Visa',
      description: 'Visa 5585',
      expiry: '2018-01-31',
      id: 'pm17hvtk7yxvnp',
      is_default: true,
      is_removable: true,
      is_valid: true,
      organization_id: 'org16quvsyfmr29',
      stripe_card_id: 'card_5tYLsf8l3fSUQ7',
      type: 'CreditCard'
    },
    reference: '2015-03',
    remitted_at: undefined,
    total: '0.0',
    xero_invoice_guid: '483fdc39-e9eb-47da-bdb0-f3144e102a55',
    xero_invoice_number: 'INV-4333'
  }]);

  afterEach(() => {
    wrapper.unmount();
  });

  it('Invoices should render on load', () => {
    wrapper = shallow(<Invoices field="badInvoices" invoices={invoices} />);
    expect(wrapper.find(Table)).to.have.length(1);
  });

  it('When invoices is not loaded Loading should be displayed', () => {
    wrapper = shallow(<Invoices field="badInvoices" />);
    expect(wrapper.find(Loading)).to.have.length(1);
  });

});
