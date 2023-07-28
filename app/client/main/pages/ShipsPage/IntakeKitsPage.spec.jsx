import React from 'react';
import Immutable from 'immutable';

import { expect } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import SessionStore from 'main/stores/SessionStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import { List, Button, Column } from '@transcriptic/amino';
import { IntakeKitsPage } from './IntakeKitsPage';

const intakeKits = [
  {
    admin_processed_at: null,
    bag_count: 8,
    commercial_invoice_url: { url: null, text: 'Invoice' },
    created_at: '2018-03-02T22:46:39.423-08:00',
    easy_post_label_url: { url: 'https://easypost-files.s3-us-west-2.amazonaws.com/…bel/20210303/d1a4c7046cb340588884ea56f0b2d0a7.png', text: 'Label' },
    id: 'ik1ffyqzjpug891',
    lab: { id: 'lb1fdrvmzhe6jt3', type: 'labs', name: 'Menlo Park', operated_by_id: 'org13', address_id: 'addr188rr9ukd7ry' },
    organization: { id: 'org13', name: 'Strateos', subdomain: 'transcriptic' },
    organization_id: 'org13',
    invoice_item_id: 'chrg123',
    status: 'pending'
  },
  {
    admin_processed_at: null,
    bag_count: 5,
    commercial_invoice_url: { url: null, text: 'Invoice' },
    created_at: '2021-03-02T22:46:39.423-08:00',
    easy_post_label_url: { url: 'https://easypost-files.s3-us-west-2.amazonaws.com/…bel/20210303/d1a4c7046cb340588884ea56f0b2d0a7.png', text: 'Label' },
    id: 'ik1ffyqzjpug892',
    lab: { id: 'lb1fdrvmzhe6jt3', type: 'labs', name: 'Menlo Park', operated_by_id: 'org13', address_id: 'addr188rr9ukd7ry' },
    organization: { id: 'org13', name: 'Strateos', subdomain: 'transcriptic' },
    organization_id: 'org13',
    status: 'pre_transit'
  }
];

const props = {
  intakeKits,
  searchOptions: Immutable.Map({}),
  pageSize: 12,
  page: 1,
  numPages: 5,
  isSearching: false,
  selected: [],
  router: { history: [] },
  status: undefined
};
const actions = {
  onSearchFilterChange: sinon.spy(),
  onProcessKits: () => { },
  onPageChange: () => { },
  onChangeSelection: () => { },
  onRowClick: () => { },
  onSortChange: () => { },
  onResetClicked: () => { }
};
const search = Immutable.fromJS({ results: [] });

describe('Intake kits Page', () => {
  let component;
  let confirmStub;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (component) {
      component.unmount();
    }
    if (confirmStub) {
      confirmStub.restore();
    }
    sandbox.restore();
  });

  it('Check if Page is Present', () => {
    component = shallow(
      <IntakeKitsPage {...props} actions={actions} search={search} />
    );
    const pageContent = component.find('.intake-kits-page');
    expect(pageContent.length).to.be.eql(1);
  });

  it('Intake kits page should have Table and Pagination', () => {
    component = shallow(<IntakeKitsPage {...props} actions={actions} search={search} />);
    const list = component.find(List);
    expect(list.length).to.equal(1);
    expect(list.props().showPagination).to.be.true;
  });

  it('Intake kits page should have 8 columns by default', () => {
    component = shallow(
      <IntakeKitsPage {...props} actions={actions} search={search} />
    );
    const list = component.find(List);
    const listColumn = list.find(Column).filterWhere(col => col.props().header);
    expect(listColumn.length).to.equal(8);
    expect(listColumn.at(0).props().header).to.equal('organization');
    expect(listColumn.at(1).props().header).to.equal('easy post label url');
    expect(listColumn.at(2).props().header).to.equal('payment');
    expect(listColumn.at(3).props().header).to.equal('status');
    expect(listColumn.at(4).props().header).to.equal('item count');
    expect(listColumn.at(5).props().header).to.equal('requested');
    expect(listColumn.at(6).props().header).to.equal('processed');
    expect(listColumn.at(7).props().header).to.equal('lab');
  });

  it('should have corresponding persistence key info to enable user preference', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));

    component = shallow(
      <IntakeKitsPage {...props} actions={actions} search={search} />
    );
    const list = component.find(List);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.SHIPMENT_LAB_INTAKE_KITS_TABLE
    });
  });

  it('Payment status should be paid if invoice exist for the intake kit', () => {
    component = mount(
      <IntakeKitsPage {...props} actions={actions} search={search} />
    );

    const columns = component.find('td').map(column => column.text());
    // In first row, the payment status will be Paid.
    expect(columns[2]).to.eql('Paid');
    // In second row, the payment status will be empty.
    expect(columns[9]).to.eql('-');
  });

  it('should have status dropdown', () => {
    component = shallow(
      <IntakeKitsPage {...props} actions={actions} search={search} />
    );
    component.setState({ statuses: [
      { name: 'Pending', value: 'pending' },
      { name: 'Delivered', value: 'delivered' },
      { name: 'Pre transit', value: 'pre_transit' },
      { name: 'Return to sender', value: 'return_to_sender' }
    ] });
    const statusDropDown = component.find('Select').at(0);
    expect(statusDropDown.prop('placeholder')).to.equal('Order Status');
    expect(statusDropDown.prop('options').length).to.equal(4);
  });

  it('reset button should be disabled if status filter is not applied', () => {
    component = shallow(
      <IntakeKitsPage {...props} actions={actions} search={search} />
    );
    expect(component.find(Button).props().disabled).to.be.true;
  });

  it('should display the corresponding statuses in the status column', () => {
    component = mount(
      <IntakeKitsPage {...props} actions={actions} search={search} />
    );

    const columns = component.find('td').map(column => column.text());
    expect(columns[3]).to.eql('Pending');
    expect(columns[10]).to.eql('Pre transit');
  });
});
