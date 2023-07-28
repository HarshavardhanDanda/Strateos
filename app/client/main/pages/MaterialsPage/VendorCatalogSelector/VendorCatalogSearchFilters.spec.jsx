import React from 'react';
import sinon from 'sinon';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { SearchFilter } from '@transcriptic/amino';

import VendorCatalogSearchFilters from './VendorCatalogSearchFilters';

describe('VendorCatalogSearchFilters', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  const searchOptions = Immutable.Map({
    searchSimilarity: 'all'
  });

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should have smiliarity filter ', () => {
    const onSearchFilterChange = sandbox.stub();
    wrapper = shallow(
      <VendorCatalogSearchFilters
        suppliers={[]}
        onSearchFilterChange={onSearchFilterChange}
        searchOptions={searchOptions}
      />
    ).dive();
    const searchFilters = wrapper.find(SearchFilter);
    expect(searchFilters.length).to.equal(3);
    const similarityFilter = searchFilters.at(1);
    expect(similarityFilter.props()).to.deep.include({
      title: 'Similarity',
      currentSelection: 'all',
      options: [
        {
          display: 'All',
          queryTerm: 'all',
          allOption: true
        },
        {
          display: 'Exact',
          queryTerm: 'exact'
        },
        {
          display: 'Alternate',
          queryTerm: 'similar'
        }
      ]
    });
    similarityFilter.prop('onSelectOption')('exact');
    expect(onSearchFilterChange.calledOnce).to.be.true;
    expect(onSearchFilterChange.args[0][0].get('searchSimilarity')).to.equal('exact');
  });

  it('should have supplier filter ', () => {
    const onSupplierFilterChange = sandbox.stub();
    wrapper = shallow(
      <VendorCatalogSearchFilters
        onSelectSupplier={onSupplierFilterChange}
        suppliers={['sup1', 'sup2']}
        selectedSupplier="all"
        searchOptions={searchOptions}
      />
    ).dive();
    const searchFilters = wrapper.find(SearchFilter);
    expect(searchFilters.length).to.equal(3);
    const supplierFilter = searchFilters.at(2);
    expect(supplierFilter.props()).to.deep.include({
      title: 'Suppliers',
      currentSelection: 'all',
      options: [
        {
          display: 'All Suppliers',
          queryTerm: 'all',
          allOption: true
        },
        {
          display: 'sup1',
          queryTerm: 'sup1'
        },
        {
          display: 'sup2',
          queryTerm: 'sup2'
        }
      ]
    });
    supplierFilter.prop('onSelectOption')('sup2');
    expect(onSupplierFilterChange.calledOnce).to.be.true;
    expect(onSupplierFilterChange.args[0][0]).to.equal('sup2');
  });
});
