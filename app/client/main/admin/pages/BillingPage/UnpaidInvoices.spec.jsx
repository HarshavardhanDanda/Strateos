import React       from 'react';
import { expect }  from 'chai';
import { shallow, mount } from 'enzyme';
import Immutable   from 'immutable';
import { Table } from '@transcriptic/amino';
import { UnpaidInvoices } from './UnpaidInvoices';

describe('unpaid invoices test', () => {

  let wrapper;

  const invoices = [{
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
  }];

  const emptyProps = {
    loaded: true,
    data: Immutable.fromJS([]),
    emptyMessage: 'No unpaid invoices.'
  };

  const props = {
    loaded: true,
    data: Immutable.fromJS(invoices),
    emptyMessage: 'No unpaid invoices.'
  };

  afterEach(() => {
    wrapper.unmount();
  });

  it('When data is empty message should be displayed', () => {
    wrapper = shallow(<UnpaidInvoices {...emptyProps} />).find(Table).shallow();

    expect(wrapper.text()).to.equal(emptyProps.emptyMessage);
  });

  it('When data is present table should be rendered', () => {
    wrapper = shallow(<UnpaidInvoices {...props} />).find(Table).shallow();

    expect(wrapper.children()).to.have.lengthOf(3);
  });

  it('test all rows selected scenario', () => {
    wrapper = shallow(<UnpaidInvoices {...props} />);
    wrapper.setState({ selected: { inv17kau42fpzcg: true } });
    expect(wrapper.instance().isOneSelected()).to.true;
    expect(wrapper.instance().isAnySelected()).to.true;
    expect(wrapper.instance().allSelectedInXeroOrNetSuite()).to.true;
    expect(wrapper.instance().allSelectedNotInXeroAndNetSuite()).to.false;
    expect(wrapper.instance().getAllSelected().equals(props.data)).to.true;
  });

  it('test no rows selected scenario', () => {
    wrapper = shallow(<UnpaidInvoices {...props} />);
    wrapper.setState({ selected: {} });
    expect(wrapper.instance().isOneSelected()).to.false;
    expect(wrapper.instance().isAnySelected()).to.false;
    expect(wrapper.instance().allSelectedInXeroOrNetSuite()).to.true;
    expect(wrapper.instance().allSelectedNotInXeroAndNetSuite()).to.true;
    expect(wrapper.instance().getAllSelected().equals(Immutable.fromJS([]))).to.true;
  });

  it('test selected rows for xero invoice', () => {

    const invoice1 = { ...invoices[0] };
    invoice1.id = 'inv17kau42fpzch';
    invoice1.xero_invoice_number = undefined;
    invoice1.xero_invoice_guid = undefined;

    const props1 = { ...props };
    props1.data = Immutable.fromJS([...invoices, invoice1]);

    wrapper = shallow(<UnpaidInvoices {...props1} />);
    wrapper.setState({ selected: { inv17kau42fpzcg: true, inv17kau42fpzch: true } });
    expect(wrapper.instance().allSelectedNotInXeroAndNetSuite()).to.false;
    expect(wrapper.instance().allSelectedInXeroOrNetSuite()).to.false;
  });

  it('test render xero invoice number', () => {
    wrapper = mount(<UnpaidInvoices {...props} />);
    expect(wrapper.find('tbody td').at(4).text()).to.equal(props.data.get(0).get('xero_invoice_number'));
  });

});
