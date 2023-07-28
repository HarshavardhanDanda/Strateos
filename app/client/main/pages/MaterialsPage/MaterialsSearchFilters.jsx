import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import _ from 'lodash';
import { SearchFilter, SearchFilterBar, SearchRangeFilter, SearchFilterWrapper, SearchField, ControlBox } from '@transcriptic/amino';

import NotificationActions from 'main/actions/NotificationActions';
import CategoryActions from 'main/actions/CategoryActions';
import { getNumericRangeText } from 'main/util/MeasurementUtil';
import VendorFilterHoc from './VendorFilterHOC';
import SourceFilterHOC from './SourceFilterHOC';

class MaterialsSearchFilter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      categoryOptions: []
    };
  }

  componentDidMount() {
    this.loadCategories();
  }

  loadCategories() {
    CategoryActions.loadCategories()
      .done((categories) => this.setCategoryOptions(categories))
      .fail((...response) => NotificationActions.handleError(...response));
  }

  setCategoryOptions(categories) {
    const defaultOption = {
      queryTerm: 'all',
      display: 'All categories',
      allOption: true
    };
    const sortedCategories = _.sortBy(categories, category => category.path[0].toLowerCase());
    const options = sortedCategories.map((category) => ({
      queryTerm: category.id,
      display: category.path
    }));
    this.setState({ categoryOptions: [defaultOption, ...options] });
  }

  onSelectOption(field) {
    return ((value) => {
      const { searchOptions, onSearchFilterChange } = this.props;
      return onSearchFilterChange(searchOptions.set(field, value));
    });
  }

  render() {
    const { categoryOptions } = this.state;
    const { searchOptions, showCategoriesFilter, showCostFilter, showTypeFilter, showSourceFilter, onSelectSource } = this.props;

    return (
      <SearchFilterBar orientation="vertical" onReset={_ => this.props.onSearchFilterReset()}>
        <SearchFilterWrapper
          title="Search"
          id="search"
          alwaysOpen
          controlBoxPills={(
            <ControlBox.Pill
              id="material-search"
              value={searchOptions.get('searchInput')}
              onReset={() => this.props.onSearchInputChange('')}
            />
          )}
        >
          <SearchField
            onChange={e => this.props.onSearchInputChange(e.target.value)}
            value={searchOptions.get('searchInput')}
            placeholder={this.props.placeholder}
            searchType=""
          />
        </SearchFilterWrapper>
        <If condition={showTypeFilter}>
          <SearchFilter
            id="type"
            title="Type"
            options={[
              {
                queryTerm: 'all',
                display: 'All',
                allOption: true
              },
              {
                queryTerm: 'group',
                display: 'Group'
              },
              {
                queryTerm: 'individual',
                display: 'Individual'
              }
            ]}
            currentSelection={searchOptions.get('searchType')}
            onSelectOption={this.onSelectOption('searchType')}
          />
        </If>
        {this.props.renderVendor((field) => this.onSelectOption(field))}
        <If condition={categoryOptions.length && showCategoriesFilter}>
          <SearchFilter
            id="categories"
            title="Categories"
            options={categoryOptions}
            currentSelection={searchOptions.get('searchCategory')}
            onSelectOption={this.onSelectOption('searchCategory')}
            isScroll
          />
        </If>
        <If condition={showCostFilter}>
          <SearchRangeFilter
            id="cost"
            title="Cost"
            searchOptions={searchOptions.get('searchCost', { min: '', max: '' })}
            onSearchInputChange={this.onSelectOption('searchCost')}
            lowerBoundPlaceholder="Min"
            upperBoundPlaceholder="Max"
            previewText={getNumericRangeText(searchOptions.get('searchCost'))}
            renderControlBoxPill={(range) => `Cost: ${range}`}
          />
        </If>
        <If condition={showSourceFilter}>
          {this.props.renderSource(onSelectSource, 'strateos')}
        </If>
      </SearchFilterBar>
    );
  }
}

MaterialsSearchFilter.defaultProps = {
  showCategoriesFilter: false,
  showCostFilter: false,
  showTypeFilter: true,
  showSourceFilter: false
};

MaterialsSearchFilter.propTypes = {
  onSearchFilterChange: PropTypes.func,
  onSelectSource: PropTypes.func,
  searchOptions: PropTypes.instanceOf(Immutable.Map),
  showCategoriesFilter: PropTypes.bool,
  showCostFilter: PropTypes.bool,
  showTypeFilter: PropTypes.bool,
  showSourceFilter: PropTypes.bool
};

export default SourceFilterHOC(VendorFilterHoc(MaterialsSearchFilter));
