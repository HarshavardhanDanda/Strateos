import React from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import SessionStore from 'main/stores/SessionStore';
import { List, Table } from '@transcriptic/amino';

import MaterialsSelectorSearchResults from './MaterialsSelectorSearchResults';

describe('MaterialsSelectorSearchResults', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const data = Immutable.fromJS([
    {
      id: 'id',
      name: 'PCR kit',
      vendor: { name: 'eMolecules' },
      supplier: { name: 'Bobs chemicals' },
      categories: [{ id: 1, path: ['abcd123'] }],
      orderable_materials: [{
        price: 10,
        tier: '5 days',
        orderable_material_components: [{
          vol_measurement_unit: 'µL',
          volume_per_container: 10
        }]
      }],
      total_ordered: 3,
      created_at: '2020-10-09T03:21:58.628-07:00'
    }
  ]);

  const materialsWithMass = Immutable.fromJS([
    {
      id: 'id',
      name: 'PCR kit',
      vendor: { name: 'eMolecules' },
      supplier: { name: 'Bobs chemicals' },
      categories: [{ id: 1, path: ['abcd123'] }],
      orderable_materials: [{
        price: 10,
        tier: '5 days',
        orderable_material_components: [{
          mass_measurement_unit: 'mg',
          mass_per_container: 5
        }]
      }],
      total_ordered: 3,
      created_at: '2020-10-09T03:21:58.628-07:00',
    }
  ]);

  const props = {
    data,
    searchOptions: Immutable.Map({}),
    pageSize: 12,
    page: 1,
    numPages: 5,
    isSearching: false,
    selected: [],
    onSearchPageChange: () => { },
    onSelectRow: () => { },
    onSortChange: () => { },
    onSearchFilterChange: () => { }
  };

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should have 5 visible columns', () => {
    wrapper = shallow(<MaterialsSelectorSearchResults {...props} />);

    expect(wrapper.find(List).length).to.equal(1);
    expect(wrapper.instance().state.visibleColumns.length).to.equal(5);
  });

  it('should display search results', () => {
    wrapper = shallow(<MaterialsSelectorSearchResults {...props} />);
    const table = wrapper.find(List).dive().find(Table).dive();
    const headerRow = table.find('HeaderCell');

    expect(headerRow.at(1).find('SortableHeader').props().children).to.equal('name');
    expect(headerRow.at(2).find('SortableHeader').props().children).to.equal('vendor');
    expect(headerRow.at(3).find('SortableHeader').props().children).to.equal('category');
    expect(headerRow.at(4).find('SortableHeader').props().children).to.equal('cost');
    expect(headerRow.at(5).dive().text()).to.equal('tier');

    const bodyRow = table.find('BodyCell').find('p');

    expect(bodyRow.at(0).text()).to.equal('PCR kit');
    expect(bodyRow.at(1).text()).to.equal('eMolecules');
    expect(bodyRow.at(2).text()).to.equal('abcd123');
    expect(bodyRow.at(3).text()).to.equal('$10.00');
    expect(bodyRow.at(4).text()).to.equal('5 days');
  });

  it('should have individual selector table persistence key info to enable user preference', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));
    wrapper = mount(<MaterialsSelectorSearchResults {...props}  />);
    const list = wrapper.find(List);

    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.MATERIAL_GROUP_SELECTOR_TABLE
    });
  });

  it('should have group selector table persistence key info to enable user preference', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));
    wrapper = mount(<MaterialsSelectorSearchResults {...props} isIndividual />);
    const list = wrapper.find(List);

    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.MATERIAL_INDIVIDUAL_SELECTOR_TABLE
    });
  });

  it('should display search results for individual materials', () => {
    wrapper = shallow(<MaterialsSelectorSearchResults {...props} isIndividual />);
    const table = wrapper.find(List).dive().find(Table).dive();
    const headerRow = table.find('HeaderCell');

    expect(headerRow.at(1).find('SortableHeader').props().children).to.equal('name');
    expect(headerRow.at(2).find('SortableHeader').props().children).to.equal('vendor');
    expect(headerRow.at(3).find('SortableHeader').props().children).to.equal('cost');
    expect(headerRow.at(4).dive().text()).to.equal('amount');
    expect(headerRow.at(5).dive().text()).to.equal('tier');

    const bodyRow = table.find('BodyCell').find('p');

    expect(bodyRow.at(0).text()).to.equal('PCR kit');
    expect(bodyRow.at(1).text()).to.equal('eMolecules');
    expect(bodyRow.at(2).text()).to.equal('$10.00');
    expect(bodyRow.at(3).text()).to.equal('10.00 μL');
  });

  it('should display search results for individual materials with mass', () => {
    const mass_props = _.merge({}, props, { data: materialsWithMass });
    wrapper = shallow(<MaterialsSelectorSearchResults {...mass_props} isIndividual />);

    const table = wrapper.find(List).dive().find(Table).dive();
    const headerRow = table.find('HeaderCell');

    expect(headerRow.at(1).find('SortableHeader').props().children).to.equal('name');
    expect(headerRow.at(2).find('SortableHeader').props().children).to.equal('vendor');
    expect(headerRow.at(3).find('SortableHeader').props().children).to.equal('cost');
    expect(headerRow.at(4).dive().text()).to.equal('amount');

    const bodyRow = table.find('BodyCell').find('p');

    expect(bodyRow.at(0).text()).to.equal('PCR kit');
    expect(bodyRow.at(1).text()).to.equal('eMolecules');
    expect(bodyRow.at(2).text()).to.equal('$10.00');
    expect(bodyRow.at(3).text()).to.equal('5.00 mg');
  });

  it('should show selected rows', () => {
    wrapper = shallow(
      <MaterialsSelectorSearchResults
        {...props}
        selected={['foo', 'bar']}
      />
    );
    expect(wrapper.find(List).props().selected).to.deep.equal({ foo: true, bar: true });
  });

  it('should display hyphen when price is null', () => {
    const priceIsNull = _.merge({}, props, { data: data.setIn([0, 'orderable_materials', '0', 'price'], null) });
    wrapper = shallow(<MaterialsSelectorSearchResults {...priceIsNull} isIndividual />);
    const bodyRow = wrapper.find(List).dive().find(Table).dive()
      .find('BodyCell')
      .find('p');
    expect(bodyRow.at(2).text()).to.equal('-');
  });

  it('should display hyphen when orderable_material does not contain price', () => {
    const priceIsNull = _.merge({}, props, { data: data.setIn([0, 'orderable_materials'], {}) });
    wrapper = shallow(<MaterialsSelectorSearchResults {...priceIsNull} isIndividual />);
    const bodyRow = wrapper.find(List).dive().find(Table).dive()
      .find('BodyCell')
      .find('p');
    expect(bodyRow.at(2).text()).to.equal('-');
  });
});
