import React from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import VendorCatalogStore from 'main/stores/VendorCatalogStore';
import { VendorCatalogSearchStore } from 'main/stores/search';
import { VendorCatalogPageState, VendorCatalogSearchDefaults  } from 'main/pages/MaterialsPage/VendorCatalogSelector/VendorCatalogState';
import { VendorCatalogPageActions } from 'main/pages/MaterialsPage/VendorCatalogSelector/VendorCatalogActions';
import VendorCatalogSearchFilter from 'main/pages/MaterialsPage/VendorCatalogSelector/VendorCatalogSearchFilters';
import CompoundStore from 'main/stores/CompoundStore';
import withSelectorContent from 'main/components/SelectorContent/SelectorContentHOC';
import SelectorContent from 'main/components/SelectorContent/SelectorContentNew';
import VendorCatalogSearchResults from 'main/pages/MaterialsPage/VendorCatalogSelector/VendorCatalogSearchResults';

export class VendorCatalogSelector extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this,
      'updateSelected',
      'onSourceChange',
      'renderFilters',
      'renderSearchResults'
    );

    this.state = {
      selectedSupplier: 'all',
    };
  }

  componentDidMount() {
    this.load();
  }

  findById(id) {
    return VendorCatalogStore.getById(id);
  }

  load() {
    if (!this.props.actions.doSearch) {
      return;
    }
    this.props.actions.doSearch(this.props.searchOptions.toJS(), this.props.onSearchFailed);
  }

  updateSelected(selectedRows) {
    this.props.actions.updateState({
      selected: _.keys(selectedRows)
    });
  }

  onSourceChange(source) {
    if (this.props.onSelectSource) {
      this.props.onSelectSource(source);
    }
  }

  onSearchFilterReset() {
    this.setState({ selectedSupplier: 'all' }, () => this.props.onSearchFilterChange(Immutable.fromJS(this.props.zeroStateSearchOptions)));
  }

  suppliers() {
    const allResults = this.props.search
      .get('results', Immutable.List())
      .map((result) => this.findById(result.get('id')))
      .filter(result => result);
    const suppliers = new Set();
    allResults.forEach(result => {
      suppliers.add(result.getIn(['supplier', 'name']));
    });
    return [...suppliers];
  }

  records() {
    const allResults = this.props.search
      .get('results', Immutable.List())
      .map((result) => this.findById(result.get('id')))
      .filter(result => result);
    if (this.state.selectedSupplier === 'all') {
      return allResults;
    }
    const filtered = allResults.filter(result => {
      return result.getIn(['supplier', 'name']) === this.state.selectedSupplier;
    });
    return filtered;
  }

  renderFilters() {
    return (
      <VendorCatalogSearchFilter
        searchOptions={this.props.searchOptions}
        onSearchFilterChange={this.props.onSearchFilterChange}
        showSourceFilter
        onSelectSource={this.onSourceChange}
        suppliers={this.suppliers()}
        selectedSupplier={this.state.selectedSupplier}
        onSelectSupplier={selectedSupplier => this.setState({ selectedSupplier })}
        onSearchFilterReset={() => this.onSearchFilterReset()}
      />
    );
  }

  renderSearchResults() {
    return (
      <div className="tx-stack tx-stack--sm">
        <VendorCatalogSearchResults
          data={this.records()}
          onSelectRow={selectedRows => { this.props.onSelectRow(selectedRows); this.updateSelected(selectedRows); }}
          isSearching={this.props.isSearching}
          searchOptions={this.props.searchOptions}
        />
      </div>
    );
  }

  render() {
    return (
      <SelectorContent
        hasResults={this.props.hasResults}
        searchOptions={this.props.searchOptions}
        isSearching={this.props.isSearching}
        zeroStateProps={this.props.zeroStateProps}
        renderFilters={this.renderFilters}
        renderSearchResults={this.renderSearchResults}
        hideSearchBar={false}
      />
    );
  }
}

VendorCatalogSelector.defaultProps = {
  searchPlaceholder: 'Search by Name, ID',
  disableCard: true,
  showTypeFilter: false,
  showCategoriesFilter: true,
  showCostFilter: true
};

VendorCatalogSelector.propTypes = {
  onSelectRow: PropTypes.func.isRequired,
  onSelectSource: PropTypes.func.isRequired,
  searchPlaceholder: PropTypes.string,
  selected: PropTypes.array,
  actions: PropTypes.object.isRequired,
  onSortChange: PropTypes.func.isRequired,
  onSearchFilterChange: PropTypes.func.isRequired,
  onSearchFailed: PropTypes.func.isRequired,
  disableCard: PropTypes.bool,
  showTypeFilter: PropTypes.bool,
  showCategoriesFilter: PropTypes.bool,
  showCostFilter: PropTypes.bool,
  hasResults: PropTypes.bool.isRequired,
  searchOptions: PropTypes.instanceOf(Immutable.Map).isRequired,
  isSearching: PropTypes.bool.isRequired,
  zeroStateProps: PropTypes.object.isRequired,
  zeroStateSearchOptions: PropTypes.object.isRequired
};

export const getStateFromStores = (props) => {
  const {
    isSearching,
    selected
  } = VendorCatalogPageState.get();

  let search = VendorCatalogSearchStore.getLatestSearch() || Immutable.fromJS({ results: [] });
  const results = VendorCatalogSearchStore.getResultsFromSearch(search);
  search = search.set('results', results);

  const hasResults = (search.get('results') && (search.get('results').size > 0));
  const actions = VendorCatalogPageActions;

  let options = VendorCatalogPageActions.searchOptions();
  const compound = CompoundStore.getById(props.compoundId);
  const smilesFilter = { searchSmiles: compound ? compound.get('smiles') : '' };
  const zeroStateSearchOptions = _.merge({}, { ...VendorCatalogSearchDefaults, ...smilesFilter }, {});
  options = _.merge({}, { ...options, ...smilesFilter }, {});
  const searchOptions = new Immutable.Map(options);
  const zeroStateProps = {
    title: 'No Vendors were found.'
  };
  const className = 'material-selector';

  return {
    actions,
    search,
    searchOptions,
    zeroStateProps,
    zeroStateSearchOptions,
    hasResults,
    isSearching,
    selected,
    className
  };
};

const vendorCatalogSelectorWithSelectorContent = withSelectorContent(VendorCatalogSelector);
export default ConnectToStores(vendorCatalogSelectorWithSelectorContent, getStateFromStores);
