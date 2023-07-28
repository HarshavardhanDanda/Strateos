import React from 'react';
import PropTypes from 'prop-types';
import { SearchFilter, SearchFilterBar } from '@transcriptic/amino';
import Immutable from 'immutable';
import _ from 'lodash';

import SourceFilterHOC from '../SourceFilterHOC';

class VendorCatalogSearchFilter extends React.Component {

  onSelectOption(field) {
    return ((value) => {
      const { searchOptions, onSearchFilterChange } = this.props;
      return onSearchFilterChange(searchOptions.set(field, value));
    });
  }

  renderSupplierFilter() {
    const { suppliers, selectedSupplier, onSelectSupplier } = this.props;
    const defaultOption = {
      queryTerm: 'all',
      display: 'All Suppliers',
      allOption: true
    };
    const sortedSuppliers = _.sortBy(suppliers, supplier => supplier.toLowerCase());
    const options = sortedSuppliers.map((supplier) => ({
      queryTerm: supplier,
      display: supplier
    }));
    return (
      <SearchFilter
        id="suppliers"
        title="Suppliers"
        options={[defaultOption, ...options]}
        currentSelection={selectedSupplier}
        onSelectOption={onSelectSupplier}
        isScroll
      />
    );
  }

  render() {
    const { showSourceFilter, onSelectSource, searchOptions } = this.props;

    return (
      <SearchFilterBar orientation="vertical" onReset={this.props.onSearchFilterReset}>
        <If condition={showSourceFilter}>
          {this.props.renderSource(onSelectSource, 'emolecules')}
        </If>
        <SearchFilter
          id="similarity"
          title="Similarity"
          options={[
            {
              queryTerm: 'all',
              display: 'All',
              allOption: true
            },
            {
              queryTerm: 'exact',
              display: 'Exact'
            },
            {
              queryTerm: 'similar',
              display: 'Alternate'
            }
          ]}
          currentSelection={searchOptions.get('searchSimilarity')}
          onSelectOption={this.onSelectOption('searchSimilarity')}
        />
        {this.renderSupplierFilter()}
      </SearchFilterBar>
    );
  }
}

VendorCatalogSearchFilter.defaultProps = {
  showSourceFilter: true
};

VendorCatalogSearchFilter.propTypes = {
  onSelectSource: PropTypes.func,
  showSourceFilter: PropTypes.bool,
  suppliers: PropTypes.array,
  selectedSupplier: PropTypes.string,
  onSelectSupplier: PropTypes.func,
  onSearchFilterChange: PropTypes.func,
  searchOptions: PropTypes.instanceOf(Immutable.Map)
};

export default SourceFilterHOC(VendorCatalogSearchFilter);
