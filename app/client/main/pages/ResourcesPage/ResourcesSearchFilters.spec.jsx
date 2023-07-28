import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import ResourcesSearchFilters from './ResourcesSearchFilters';

describe('ResourcesSearchFilters', () => {
  const searchOptions = Immutable.Map();
  const onSearchFilterChange = sinon.spy();

  it('should have searchFilters', () => {
    const wrapper = shallow(
      <ResourcesSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const searchFilters = wrapper.find('SearchFilter');
    expect(searchFilters.length).to.equal(2);
    expect(searchFilters.at(0).dive().find('SearchFilterWrapper').dive()
      .find('span')
      .text()).to.equal('Kind');
    expect(searchFilters.at(1).dive().find('SearchFilterWrapper').dive()
      .find('span')
      .text()).to.equal('Storage');
  });

  it('should trigger onSearchFilterChange when kind filter is applied', () => {
    const wrapper = shallow(
      <ResourcesSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const searchFilters = wrapper.find('SearchFilter');
    searchFilters.at(0).props().onSelectOption('Cell');

    expect(onSearchFilterChange.calledOnce).to.be.true;
    expect(onSearchFilterChange.args[0][0]).to.deep.equal(searchOptions.set('searchKind', 'Cell'));

  });
  it('should trigger onSearchFilterChange when storage filter is applied', () => {
    const wrapper = shallow(
      <ResourcesSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    onSearchFilterChange.resetHistory();
    const searchFilters = wrapper.find('SearchFilter');
    searchFilters.at(1).props().onSelectOption('all');
    expect(onSearchFilterChange.args[0][0]).to.deep.equal(searchOptions.set('searchStorageCondition', 'all'));
  });

  it('should hide Kind filter when showKindFiler is false', () => {
    const wrapper = shallow(
      <ResourcesSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={onSearchFilterChange}
        showKindFilter={false}
      />
    );
    const searchFilters = wrapper.find('SearchFilter');
    expect(searchFilters.find('SearchFilter').length).to.be.equal(1);
    expect(searchFilters.find('SearchFilter').at(0).prop('title')).to.be.equal('Storage');
  });

  it('should have SearchField to search for resources', () => {
    const wrapper = shallow(
      <ResourcesSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={onSearchFilterChange}
        showKindFilter={false}
      />
    );
    const searchFilterWrapper = wrapper.find('SearchFilterWrapper').at(0);
    expect(searchFilterWrapper.props().title).to.equal('Search');
    expect(searchFilterWrapper.find('SearchField').length).to.be.equal(1);
  });
});
