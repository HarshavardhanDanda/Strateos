import React from 'react';
import _ from 'lodash';
import { mount, shallow } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';
import sinon from 'sinon';
import SessionStore from 'main/stores/SessionStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import { List, Table } from '@transcriptic/amino';
import ResourceSearchResults from './ResourceSearchResults';

describe('ResourceSearchResults', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    sandbox.restore();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  const data = Immutable.List([
    Immutable.Map({
      name: 'Resource 1',
      id: 'rs1',
      kind: 'Reagent',
      purity: null
    }),
    Immutable.Map({
      name: 'Resource 2',
      id: 'rs2',
      kind: 'ChemicalStructure',
      purity: '90.0'
    })
  ]);

  const props = {
    data,
    selected: [],
    searchOptions: Immutable.Map({}),
    pageSize: 12,
    page: 1,
    numPages: 5,
    onSearchPageChange: () => {},
    onSelectRow: () => {},
    onSortChange: () => {},
    onSearchFilterChange: () => {},
    onRowClick: () => {},
    isSearching: false
  };

  it('should show spinner on load', () => {
    wrapper = shallow(<ResourceSearchResults {...props} isSearching />);
    const table = wrapper.find(List).dive().find(Table).dive();

    expect(table.find('Spinner')).to.have.lengthOf(1);
  });

  it('should have 4 visible columns', () => {
    wrapper = shallow(<ResourceSearchResults {...props} />);
    expect(wrapper.find(List).length).to.equal(1);
    const table = wrapper.find(List).dive().find(Table).dive();
    const headerRow = table.find('HeaderCell');
    expect(headerRow.length).to.equal(5); //  1 checkbox + 4 columns
  });

  it('should have corresponding persistence key info to enable user preference', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));
    wrapper = mount(<ResourceSearchResults {...props} />);
    const list = wrapper.find(List);

    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.MATERIAL_RESOURCES_TABLE
    });
  });

  it('should have list of resources', () => {
    wrapper = shallow(<ResourceSearchResults {...props} />);
    const table = wrapper.find(List).dive().find('Table').dive();
    const row1 = table.find('Row').at(1);
    const row2 = table.find('Row').at(2);

    expect(table).to.have.lengthOf(1);
    expect(row1.find('p').at(0).text()).to.equal('Resource 1');
    expect(row1.find('p').at(1).text()).to.equal('rs1');
    expect(row1.find('p').at(2).text()).to.equal('Reagent');
    expect(row1.find('p').at(3).text()).to.equal('-');
    expect(row2.find('p').at(0).text()).to.equal('Resource 2');
    expect(row2.find('p').at(1).text()).to.equal('rs2');
    expect(row2.find('p').at(2).text()).to.equal('Chemical Structure');
    expect(row2.find('p').at(3).text()).to.equal('90.0%');
  });

  it('should show selected rows', () => {
    wrapper = shallow(
      <ResourceSearchResults
        {...props}
        selected={['foo', 'bar']}
      />
    );

    expect(wrapper.find(List).props().selected).to.deep.equal({ foo: true, bar: true });
  });
});
