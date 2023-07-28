import React       from 'react';
import { expect }  from 'chai';
import { shallow } from 'enzyme';
import Immutable   from 'immutable';
import { Table } from '@transcriptic/amino';

import ProjectInvoice from './ProjectInvoice';

describe('ProjectInvoice test cases', () => {
  let wrapper;

  const project = Immutable.Map({
    id: 'p188rdc7b77ck',
    name: 'Glycerol Stocks',
    created_at: '2015-10-08T13:39:26.746-07:00',
    archived_at: undefined,
    bsl: 1,
    run_count: Immutable.Map({
      in_progress: 0,
      aborted: 1,
      complete: 10,
      accepted: 0,
      test_mode: 1
    })
  });

  const project1 = Immutable.Map({
    id: 'p188rdc7b77ck',
    created_at: '2015-10-08T13:39:26.746-07:00',
    archived_at: undefined,
    bsl: 1,
    run_count: Immutable.Map({
      in_progress: 0,
      aborted: 1,
      complete: 10,
      accepted: 0,
      test_mode: 1
    })
  });

  const items = Immutable.fromJS([
    {
      id: 'chrg18egukm4pe3u',
      name: 'Run r18egukkz9tpr: Workcell Time',
      charge: '0.03',
      description: undefined,
      created_at: '2015-12-01T06:55:36.224-08:00',
      quantity: '1.0',
      project_id: 'p188rdc7b77ck',
      total: '0.03'
    },

    {
      id: 'chrg18egukm4pe4u',
      name: 'Run r18egukkz9tqr: Workcell Time',
      charge: '1.03',
      description: undefined,
      created_at: '2015-12-07T06:55:36.224-08:00',
      quantity: '3.0',
      project_id: 'p188rdc7b77ck',
      total: '1.03'
    }]);

  const invoice = Immutable.fromJS({
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
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it('Invoice is by default collapsed state', () => {
    wrapper = shallow(<ProjectInvoice project_id="p188rdc7b77ck" items={items} project={project} />);
    expect(wrapper.hasClass('expanded')).to.be.false;
    expect(wrapper.state().expanded).to.be.false;
  });

  it('Invoice on click should expand', () => {
    wrapper = shallow(<ProjectInvoice project_id="p188rdc7b77ck" items={items} project={project} />);
    expect(wrapper.hasClass('expanded')).to.be.false;
    wrapper.simulate('click');
    expect(wrapper.hasClass('expanded')).to.be.true;
    expect(wrapper.state().expanded).to.be.true;
  });

  it('Invoice name should be displayed', () => {
    wrapper = shallow(<ProjectInvoice project_id="p188rdc7b77ck" items={items} project={project} />);
    expect(wrapper.find('h4').first().text()).to.equal('Project: Glycerol Stocks');
  });

  it('Invoice project id should be displayed if name is empty', () => {
    wrapper = shallow(<ProjectInvoice project_id="p188rdc7b77ck" items={items} project={project1} />);
    expect(wrapper.find('h4').first().text()).to.equal('Project: p188rdc7b77ck');
  });

  it('Table should be rendered on expand', () => {
    wrapper = shallow(<ProjectInvoice project_id="p188rdc7b77ck" items={items} project={project} />);
    expect(wrapper.find(Table).exists()).to.be.false;
    wrapper.simulate('click');
    expect(wrapper.find(Table).exists()).to.be.true;
  });

  it('Invoice link should be shown', () => {
    wrapper = shallow(<ProjectInvoice project_id="p188rdc7b77ck" items={items} project={project} invoice={invoice} />);
    expect(wrapper.find('a').exists()).to.be.true;
    expect(wrapper.find('a').prop('href')).to.contain(invoice.get('id'));
  });

});
