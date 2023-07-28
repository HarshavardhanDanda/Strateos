import _ from 'lodash';
import React, { useEffect, useState }     from 'react';
import PropTypes from 'prop-types';
import { SearchField, TopFilterBar, Button } from '@transcriptic/amino';
import { TabLayoutTopbar } from 'main/components/TabLayout';
import ContainerTypeSelector from 'main/components/ContainerTypeSelector';

function CompoundInventoryFilters({ inventoryFilters, onInventorySearchFilterChange }) {

  const categories = [
    { name: 'All', value: 'all' },
    { name: 'Batch ID', value: 'batch_ids' },
    { name: 'Name', value: 'label' },
    { name: 'Barcode', value: 'barcode' }
  ];

  const defaultSearchFields = categories.map(opts => opts.value).filter(val => val !== 'all');
  const defaultInventoryFilters =  { searchFields: defaultSearchFields, query: '', searchContainerType: [] };
  const [categorySelected, setCategorySelected] = useState('all');

  useEffect(() => {
    onInventorySearchFilterChange(defaultInventoryFilters);
  }, []);

  const onCategoryChange = (event) => {
    const categorySelected = event.target.value;
    const searchFields = categorySelected === 'all' ? defaultSearchFields : [categorySelected];
    setCategorySelected(categorySelected);
    if (inventoryFilters.query && inventoryFilters.query.trim()) {
      const updatedInventoryFilters  = { ...inventoryFilters, searchFields };
      onInventorySearchFilterChange(updatedInventoryFilters);
    }
  };

  const onChange = (fieldName) => {
    return e => {
      const searchFields = categorySelected === 'all' ? defaultSearchFields : [categorySelected];
      const updatedInventoryFilters  = { ...inventoryFilters, [fieldName]: e.target.value, searchFields };
      onInventorySearchFilterChange(updatedInventoryFilters);
    };
  };

  const onResetFilters = () => {
    setCategorySelected('all');
    onInventorySearchFilterChange(defaultInventoryFilters);
  };

  const resetDisabled = () => {
    const { query, searchContainerType } = inventoryFilters;
    if (query === '' && _.isEmpty(searchContainerType) && categorySelected === 'all') {
      return true;
    }
    return false;
  };

  return (
    <TabLayoutTopbar>
      <TopFilterBar>
        <TopFilterBar.Wrapper grow={3}>
          <SearchField
            name="search-field"
            showCategories
            value={inventoryFilters && inventoryFilters.query}
            categories={categories}
            nameCategories="search-category"
            currCategory={categorySelected}
            onCategoryChange={onCategoryChange}
            onChange={onChange('query')}
          />
        </TopFilterBar.Wrapper>
        <TopFilterBar.Wrapper grow={2}>
          <ContainerTypeSelector
            isMultiSelect
            value={inventoryFilters && inventoryFilters.searchContainerType}
            onChange={onChange('searchContainerType')}
            placeholder={'Select container type...'}
            isSearchEnabled
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

CompoundInventoryFilters.propTypes = {
  inventoryFilters: PropTypes.shape({
    query: PropTypes.string,
    searchFields: PropTypes.array,
    searchContainerType: PropTypes.array
  }).isRequired,
  onInventorySearchFilterChange: PropTypes.func.isRequired
};

export default CompoundInventoryFilters;
