import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { SearchField, TopFilterBar, Button } from '@transcriptic/amino';
import { TabLayoutTopbar } from 'main/components/TabLayout';
import ContainerTypeSelector from 'main/components/ContainerTypeSelector';
import { CompoundBatchesSearchDefaults } from './CompoundBatchesState';

function CompoundBatchesFilter({ searchOptions, onSearchInputChange, onSearchFilterChange }) {

  const defaultCompoundBatchFilters =  Immutable.fromJS({ ...CompoundBatchesSearchDefaults, compound_link_id: searchOptions.get('compound_link_id') });

  const onResetFilters = () => {
    onSearchFilterChange(defaultCompoundBatchFilters);
  };

  const resetDisabled = () => {
    const searchInput = searchOptions.get('searchInput');
    const container_types = searchOptions.get('container_types');

    return searchInput === '' && _.isEmpty(container_types);
  };

  return (
    <TabLayoutTopbar>
      <TopFilterBar>
        <TopFilterBar.Wrapper grow={4}>
          <SearchField
            name="search-field"
            value={searchOptions.get('searchInput')}
            reset={() => onSearchInputChange('')}
            onChange={(e) => {
              onSearchInputChange(e.target.value);
            }}
            placeholder="Search by Batch ID"
          />
        </TopFilterBar.Wrapper>
        <TopFilterBar.Wrapper grow={3}>
          <ContainerTypeSelector
            isMultiSelect
            value={searchOptions.get('container_types', Immutable.List())}
            onChange={(e) => {
              onSearchFilterChange(searchOptions.set('container_types', e.target.value));
            }}
            placeholder={'Select container type...'}
            isSearchEnabled
            closeOnSelection={false}
            includeRetiredContainerTypes
          />
        </TopFilterBar.Wrapper>
        <TopFilterBar.Wrapper grow={false}>
          <Button
            type="secondary"
            size="small"
            onClick={onResetFilters}
            className={'reset-btn'}
            disabled={resetDisabled()}
          >Reset
          </Button>
        </TopFilterBar.Wrapper>
      </TopFilterBar>
    </TabLayoutTopbar>
  );
}

CompoundBatchesFilter.propTypes = {
  searchOptions: PropTypes.instanceOf(Immutable.Map).isRequired,
  onSearchInputChange: PropTypes.func.isRequired,
  onSearchFilterChange: PropTypes.func.isRequired
};

export default CompoundBatchesFilter;
