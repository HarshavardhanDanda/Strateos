import React from 'react';
import _ from 'lodash';
import { SearchFilter } from '@transcriptic/amino';
import VendorActions from 'main/actions/VendorActions';

const VendorFilterHoc = (Wrapper) => {
  class VendorFilter extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        vendorOptions: []
      };
      this.renderVendor = this.renderVendor.bind(this);
    }

    componentDidMount() {
      this.loadVendors();
    }

    loadVendors() {
      VendorActions.getVendorsList()
        .done((data) => this.setVendorOptions(data.results));
    }

    setVendorOptions(vendors) {
      const defaultOption = {
        queryTerm: 'all',
        display: 'All vendors',
        allOption: true
      };
      const sortedVendors = _.sortBy(vendors, vendor => vendor.name.toLowerCase());
      const options = sortedVendors.map((vendor) => ({
        queryTerm: vendor.id,
        display: vendor.name
      }));
      this.setState({ vendorOptions: [defaultOption, ...options] });
    }

    renderVendor(onSelectOption) {
      const { vendorOptions } = this.state;
      const { searchOptions } = this.props;
      return (
        <If condition={vendorOptions.length}>
          <SearchFilter
            id="vendors"
            title="Vendors"
            options={vendorOptions}
            currentSelection={searchOptions.get('searchVendor')}
            onSelectOption={onSelectOption('searchVendor')}
            isScroll
          />
        </If>
      );
    }

    render() {
      return (
        <Wrapper
          renderVendor={this.renderVendor}
          {...this.props}
        />
      );
    }
  }
  return VendorFilter;
};

export default VendorFilterHoc;
