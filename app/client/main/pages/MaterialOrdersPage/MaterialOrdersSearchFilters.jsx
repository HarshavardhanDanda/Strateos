import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import _ from 'lodash';
import LabAPI from 'main/api/LabAPI';

import { SearchFilter, SearchFilterBar, SearchFilterWrapper, SearchField, ControlBox } from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';
import VendorFilterHoc from '../MaterialsPage/VendorFilterHOC';

const categories = [
  { name: 'Name', value: 'name' },
  { name: 'Order Id', value: 'vendor_order_id' }
];

class MaterialOrdersSearchFilters extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      labs: {}
    };
  }

  componentDidMount() {
    this.loadLabs();
  }

  loadLabs() {
    LabAPI.loadAllLabWithFeature(FeatureConstants.MANAGE_KIT_ORDERS)
      .done((res) => {
        const labs = res.data;
        this.setState({ labs });
      });
  }

  onSelectOption(field) {
    return ((value) => {
      const { searchOptions, onSearchFilterChange } = this.props;
      return onSearchFilterChange(searchOptions.set(field, value));
    });
  }

  render() {
    const { searchOptions } = this.props;
    const { labs } = this.state;
    const getLabOptions = () => {
      let options = [{ queryTerm: 'all', display: 'All Labs', allOption: true }];
      options = options.concat(labs.map((lab) => {
        return { queryTerm: lab.id,
          display: lab.attributes.name };
      }));
      return options;
    };

    return (
      <SearchFilterBar orientation="vertical" onReset={_ => this.props.onSearchFilterReset()}>
        <SearchFilterWrapper
          id="search"
          title="Search"
          alwaysOpen
          controlBoxPills={(
            <ControlBox.Pill
              id="material-order-search"
              value={searchOptions.get('searchInput')}
              onReset={() => this.props.onSearchInputChange('')}
            />
          )}
        >
          <SearchField
            onChange={e => this.props.onSearchInputChange(e.target.value)}
            showCategories
            value={searchOptions.get('searchInput')}
            categories={categories}
            placeholder={this.props.placeholder}
            searchType=""
            reset={() => this.props.onSearchInputChange('')}
            nameCategories="search-category"
            currCategory={searchOptions.get('searchField')}
            onCategoryChange={(e, searchField) => this.onSelectOption('searchField')(searchField.value)}
          />
        </SearchFilterWrapper>
        <If condition={labs.length > 0}>
          <SearchFilter
            id="lab"
            title="Lab"
            options={getLabOptions()}
            currentSelection={searchOptions.get('searchLab')}
            onSelectOption={this.onSelectOption('searchLab')}
          />
        </If>
        <SearchFilter
          id="title"
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
        {this.props.renderVendor((field) => this.onSelectOption(field))}
        <SearchFilter
          id="status"
          title="Status"
          options={[
            {
              queryTerm: 'pending',
              display: 'Pending'
            },
            {
              queryTerm: 'purchased',
              display: 'Purchased'
            },
            {
              queryTerm: 'shipped',
              display: 'Shipped'
            },
            {
              queryTerm: 'arrived',
              display: 'Arrived'
            },
            {
              queryTerm: 'checkedin',
              display: 'Checked-in'
            }
          ]}
          currentSelection={searchOptions.get('activeStatus')}
          onSelectOption={this.onSelectOption('activeStatus')}
          isMultiSelect
        />
      </SearchFilterBar>
    );
  }
}

MaterialOrdersSearchFilters.propTypes = {
  onSearchFilterChange: PropTypes.func,
  searchOptions: PropTypes.instanceOf(Immutable.Map)
};

export default VendorFilterHoc(MaterialOrdersSearchFilters);
