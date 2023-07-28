import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import Immutable from 'immutable';
import SessionStore from 'main/stores/SessionStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import {
  Table,
  List,
  Pagination
} from '@transcriptic/amino';
import CompoundStore from 'main/stores/CompoundStore';
import CompoundLinkedContainerSearchResults from './CompoundLinkedContainerSearchResults';

describe('CompoundLinkedContainerSearchResults', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const data = [
    {
      aliquot_count: 1,
      aliquot_search_scores: [],
      barcode: null,
      compound_id: 'FFROQSBSJYRALS-RTBKNWGFSA-N',
      container_type_id: 'd1-vial',
      container_type_name: 'D1 vial',
      cover: null,
      created_at: '2019-11-20T17:50:59.957-08:00',
      created_by: null,
      current_mass_mg: null,
      deleted_at: null,
      device_id: null,
      empty_mass_mg: null,
      expires_at: null,
      generated_by_run_id: null,
      hazards: [],
      id: 'ct1dt8dnq8zhwnw',
      orderable_material_component_id: null,
      kit_order_id: null,
      kit_request_id: null,
      lab: {
        id: 'lb1fj4qj5gr29aj',
        name: 'San Diego',
        operated_by_id: 'org13',
        address_id: 'addr1fj4qj5gh83hc',
        created_at: '2021-03-22T05:56:36.967-07:00'
      },
      label: 'D1-vial_10',
      location_id: 'loc18jxfnqdm4pr',
      organization_id: 'org1cytx5sk6tvss',
      organization_name: 'L2S2 - Development',
      public_location_description: 'In storage',
      shipment_code: 'DTI',
      shipment_id: 'sr1dt8dnq9amgq6',
      slot: null,
      status: 'available',
      storage_condition: 'ambient',
      suggested_user_barcode: null,
      tared_weight_mg: null,
      test_mode: false,
      type: 'containers',
      updated_at: '2019-11-20T17:53:11.754-08:00'
    }
  ];
  const compound = Immutable.fromJS({
    id: 'cmpl1fvcv6cc54age',
    name: 'my_fav_compound',
    smiles: 'N[C@H]1CCC2CCCCC2C1',
    reference_id: '1235'
  });
  const records = Immutable.fromJS(data);

  const props = {
    data: records,
    selected: [],
    searchOptions: { get: () => [] },
    pageSize: 12,
    page: 1,
    numPages: 5,
    onSearchPageChange: sinon.spy(),
    onSelectRow: sinon.spy(),
    onSortChange: sinon.spy(),
    onSearchFilterChange: sinon.spy(),
    onRowClick: sinon.spy(),
    isSearching: false
  };

  const tableRowSelector = '.amino-table__row';
  beforeEach(() => {
    sandbox.stub(CompoundStore, 'getById').returns(compound);
  });

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should have a default empty message', () => {
    const input = { ...props };
    input.data = Immutable.fromJS([]);
    wrapper = mount(<CompoundLinkedContainerSearchResults {...input} />);
    expect(wrapper.find('em').length).to.equal(1);
    expect(wrapper.find('em').text()).to.equal('No records.');
  });

  it(' should have 8 columns by default', () => {
    wrapper = mount(<CompoundLinkedContainerSearchResults {...props} />);
    expect(wrapper.find(Table).length).to.equal(1);
    expect(wrapper.find(Table).instance().props.children.length).to.equal(8);
    expect(wrapper.instance().state.visibleColumns.length).to.equal(8);
  });

  it('should have header', () => {
    wrapper = mount(<CompoundLinkedContainerSearchResults {...props} />);
    const table = wrapper.find(Table).instance();
    expect(table.hasHeader()).to.equal(true);
    const th = wrapper.find('table').find('tr').find('th');
    expect(th.at(1).text()).to.equal('structure');
  });

  it('check box selection should not be onRowClick', () => {
    wrapper = mount(<CompoundLinkedContainerSearchResults {...props} />);
    const checkbox = wrapper.find(tableRowSelector).at(0).find('Checkbox');
    checkbox.simulate('click');
    expect(props.onRowClick.calledOnce).to.be.false;
  });

  it('data validation in rows', () => {
    wrapper = mount(<CompoundLinkedContainerSearchResults {...props} />);
    const tds = wrapper.find('tbody').find('tr').find('td');
    expect(tds.find('Molecule').at(0).prop('SMILES')).to.equal('N[C@H]1CCC2CCCCC2C1');
    expect(tds.at(2).text(), 'name').to.equal('my_fav_compound');
    expect(tds.at(3).text(), 'ref id').to.equal('1235');
    expect(tds.at(4).children().children().find('i')
      .prop('className'), 'type').to.equal('baby-icon aminol-plate');
    expect(tds.at(4).children().children().text()).to.equal(data[0].container_type_name);
    expect(tds.at(5).text(), 'container').to.equal('D1-vial_10');
    expect(tds.at(6).text(), 'compound id').to.equal('cmpl1fvcv6cc54age');
    expect(tds.at(7).text(), 'created').to.equal('Nov 20, 2019');
    expect(tds.at(8).text(), 'last used').to.equal('Nov 20, 2019');
  });

  it('no of rows validation', () => {
    wrapper = mount(<CompoundLinkedContainerSearchResults {...props} />);
    const trs = wrapper.find('tbody').find('tr');
    expect(trs.length).to.equal(1);
  });

  it('should show records per page', () => {
    wrapper = mount(<CompoundLinkedContainerSearchResults {...props} />);
    expect(wrapper.find('.list__topBar--right').text()).to.contains('Rows 12');
  });

  it('should select 8 columns when table component is loaded', () => {
    wrapper = mount(<CompoundLinkedContainerSearchResults {...props} />);
    expect(wrapper.find('.list__topBar--right').text()).to.contains('Columns 8');
  });

  it('should have corresponding persistence key info to enable user preference', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));

    wrapper = mount(<CompoundLinkedContainerSearchResults {...props} />);
    const list = wrapper.find(List);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.REACTIONS_COMPOUND_LINKED_CONTAINERS_TABLE
    });
  });

  it('should  show pagination if there are  records', () => {
    wrapper = mount(<CompoundLinkedContainerSearchResults {...props} />);
    expect(wrapper.find(Pagination)).to.have.length(1);
  });

  it('should not show pagination if there are no records', () => {
    const input = { ...props };
    input.data = Immutable.fromJS([]);
    wrapper = mount(<CompoundLinkedContainerSearchResults {...input} />);
    expect(wrapper.find(Pagination)).to.have.length(0);
  });

  it('should show containers when the compound details are not defined', () => {
    sandbox.restore();
    sandbox.stub(CompoundStore, 'getById').returns(undefined);
    wrapper = mount(<CompoundLinkedContainerSearchResults {...props} />);
    const tds = wrapper.find('tbody').find('tr').find('td');
    expect(tds.at(2).text(), 'name').to.equal('-');
    expect(tds.at(3).text(), 'ref id').to.equal('-');
  });

  it('should have spinner when isSearching is true', () => {
    wrapper = mount(<CompoundLinkedContainerSearchResults {...props} isSearching />);
    expect(wrapper.find('Spinner').length).to.be.equal(1);
  });
});
