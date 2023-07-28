import React from 'react';
import sinon from 'sinon';
import Imm from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { SearchFilter, SearchRangeFilter } from '@transcriptic/amino';
import CategoryActions from 'main/actions/CategoryActions';
import VendorActions from 'main/actions/VendorActions';
import MaterialsSearchFilters from './MaterialsSearchFilters';

describe('MaterialsSearchFilters', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  const searchOptions = Imm.Map({
    searchType: 'all',
    searchVendor: 'all'
  });

  const vendors = {
    results: [
      {
        id: '1',
        name: 'eMolecules'
      },
      {
        id: '2',
        name: 'Sigma Aldrich'
      }
    ]
  };

  const categories = [
    {
      id: '1',
      path: ['category-1']
    },
    {
      id: '2',
      path: ['category-2']
    }
  ];

  beforeEach(() => {
    sandbox.stub(CategoryActions, 'loadCategories').returns({
      done: (cb) => {
        return { data: cb(categories), fail: () => ({}) };
      }
    });
  });

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should have type filter ', () => {
    const actions = {
      onSearchFilterChange: () => {}
    };

    wrapper = shallow(
      <MaterialsSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
      />
    ).dive().find('MaterialsSearchFilter').dive();

    const searchFilters = wrapper.find(SearchFilter);
    expect(searchFilters.length).to.equal(1);
    expect(searchFilters.at(0).props()).to.deep.include({
      title: 'Type',
      currentSelection: 'all',
      options: [
        {
          display: 'All',
          queryTerm: 'all',
          allOption: true
        },
        {
          display: 'Group',
          queryTerm: 'group'
        },
        {
          display: 'Individual',
          queryTerm: 'individual'
        }
      ]
    });
  });

  it('should have source filter ', () => {
    const actions = {
      onSearchFilterChange: () => {}
    };

    wrapper = shallow(
      <MaterialsSearchFilters
        searchOptions={searchOptions}
        showSourceFilter
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
      />
    ).dive().find('MaterialsSearchFilter').dive();

    const searchFilters = wrapper.find(SearchFilter);
    expect(searchFilters.length).to.equal(2);
    expect(searchFilters.at(1).props()).to.deep.include({
      title: 'Source',
      currentSelection: 'strateos',
      options: [
        {
          display: 'Strateos',
          queryTerm: 'strateos'
        },
        {
          display: 'eMolecules',
          queryTerm: 'emolecules'
        }
      ]
    });
  });

  it('should have vendor filter', () => {
    const actions = {
      onSearchFilterChange: sandbox.stub()
    };

    const getVendorsListStub = sandbox.stub(VendorActions, 'getVendorsList').returns({
      done: (cb) => {
        return { data: cb(vendors), fail: () => ({}) };
      }
    });

    wrapper = shallow(
      <MaterialsSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
      />
    ).dive().find('MaterialsSearchFilter').dive();

    const searchFilters = wrapper.find(SearchFilter);
    expect(searchFilters.length).to.equal(2);
    expect(getVendorsListStub.calledOnce).to.be.true;
    expect(searchFilters.at(1).props()).to.deep.include({
      title: 'Vendors',
      currentSelection: 'all',
      options: [
        {
          display: 'All vendors',
          queryTerm: 'all',
          allOption: true
        },
        {
          display: 'eMolecules',
          queryTerm: '1'
        },
        {
          display: 'Sigma Aldrich',
          queryTerm: '2'
        }
      ]
    });
  });

  it('should have selectable filters', () => {
    const actions = {
      onSearchFilterChange: sandbox.stub()
    };

    wrapper = shallow(
      <MaterialsSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
      />
    ).dive().find('MaterialsSearchFilter').dive();

    wrapper.instance().onSelectOption('searchType')('2');
    wrapper.instance().onSelectOption('searchVendor')('1');

    expect(actions.onSearchFilterChange.calledTwice).to.be.true;
    expect(actions.onSearchFilterChange.args[0][0].get('searchType')).to.equal('2');
    expect(actions.onSearchFilterChange.args[1][0].get('searchVendor')).to.equal('1');
  });

  it('should have category filter when showCategoriesFilter is true', () => {
    const actions = {
      onSearchFilterChange: sandbox.stub()
    };
    wrapper = shallow(
      <MaterialsSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
        showCategoriesFilter
      />
    ).dive().find('MaterialsSearchFilter').dive();
    const searchFilters = wrapper.find(SearchFilter);
    expect(searchFilters.length).to.equal(2);
    expect(searchFilters.at(1).props().title).equals('Categories');
  });

  it('should not have Type filter when showTypeFilter is false', () => {
    const actions = {
      onSearchFilterChange: sandbox.stub()
    };
    wrapper = shallow(
      <MaterialsSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
        showCategoriesFilter
        showTypeFilter={false}
      />
    ).dive().find('MaterialsSearchFilter').dive();
    const searchFilters = wrapper.find(SearchFilter);
    expect(searchFilters.length).to.equal(1);
    expect(searchFilters.at(0).props().title).not.equals('Type');
    expect(searchFilters.at(0).props().title).equals('Categories');
  });

  it('should have cost range filter when showCostFilter is true', () => {
    const actions = {
      onSearchFilterChange: sandbox.stub()
    };
    wrapper = shallow(
      <MaterialsSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
        showCostFilter
      />
    ).dive().find('MaterialsSearchFilter').dive();
    const searchRangeFilter = wrapper.find(SearchRangeFilter);
    expect(searchRangeFilter.length).to.equal(1);
    expect(searchRangeFilter.at(0).props().title).equal('Cost');
  });

  it('should not have cost range filter when showCostFilter is false', () => {
    const actions = {
      onSearchFilterChange: sandbox.stub()
    };
    wrapper = shallow(
      <MaterialsSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
        showCostFilter={false}
      />
    ).dive().find('MaterialsSearchFilter').dive();
    const searchRangeFilter = wrapper.find(SearchRangeFilter);
    expect(searchRangeFilter.length).to.equal(0);
  });

  it('should display previews for numeric range filters', () => {
    wrapper = shallow(
      <MaterialsSearchFilters
        searchOptions={Imm.Map({
          searchCost: { min: 1, max: 2 }
        })}
        onSearchFilterChange={() => {}}
        showCostFilter
      />
    ).dive().find('MaterialsSearchFilter').dive();

    expect(wrapper.find('SearchRangeFilter').props().previewText).to.eql('1-2');
  });

  it('should have SearchField to search materials', () => {
    wrapper = shallow(
      <MaterialsSearchFilters
        searchOptions={Imm.Map({
          searchCost: { min: 1, max: 2 }
        })}
        onSearchFilterChange={() => {}}
        showCostFilter
      />
    ).dive().find('MaterialsSearchFilter').dive();

    const searchFilterWrapper = wrapper.find('SearchFilterWrapper').at(0);
    expect(searchFilterWrapper.props().title).to.equal('Search');
    expect(searchFilterWrapper.find('SearchField').length).to.be.equal(1);
  });

});
