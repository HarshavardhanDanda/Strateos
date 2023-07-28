import React from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';

import SelectorContent from 'main/components/SelectorContent/SelectorContentNew';
import withSelectorContent from 'main/components/SelectorContent/SelectorContentHOC';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import MaterialStore from 'main/stores/MaterialStore';
import { MaterialSearchStore } from 'main/stores/search';
import MaterialsSelectorSearchResults from 'main/pages/MaterialsPage/MaterialSelector/MaterialsSelectorSearchResults';
import { MaterialsSelectorModalState, MaterialsSelectorModalDefaults, IndividualMaterialsSelectorModalDefaults } from 'main/pages/MaterialsPage/MaterialsState';
import { MaterialsSelectorModalActions } from 'main/pages/MaterialsPage/MaterialsActions';
import MaterialsSearchFilter from 'main/pages/MaterialsPage/MaterialsSearchFilters';
import CompoundStore from 'main/stores/CompoundStore';

export class MaterialsSelector extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this,
      'updateSelected',
      'onSourceChange',
      'onSearchFilterReset',
      'renderFilters',
      'renderSearchResults'
    );
  }

  componentDidMount() {
    this.load();
  }

  findById(id) {
    return MaterialStore.getById(id);
  }

  load() {
    if (!this.props.actions.doSearch) {
      return;
    }
    this.props.actions.doSearch(this.props.searchOptions.toJS(), this.props.onSearchFailed);
  }

  onSearchFilterReset() {
    this.props.onSearchFilterChange(Immutable.fromJS(this.props.zeroStateSearchOptions));
    this.onSourceChange(false);
  }

  onSourceChange(source) {
    if (this.props.onSelectSource) {
      this.props.onSelectSource(source);
    }
  }

  getOrderableMaterialResults() {
    const results = this.props.search.get('results', Immutable.List());
    const orderableMaterialResults = [];
    results.forEach(material =>
      material.get('orderable_materials').forEach(orderableMaterial =>
        orderableMaterialResults.push(
          material
            .set('orderable_materials', Immutable.List([orderableMaterial]))
            .set('material_id', material.get('id'))
            .set('id', orderableMaterial.get('id'))
            .set('type', orderableMaterial.get('type'))
        )
      )
    );
    return Immutable.fromJS(orderableMaterialResults);
  }

  updateSelected(selectedRows) {
    this.props.actions.updateState({
      selected: _.keys(selectedRows)
    });
  }

  renderFilters() {
    return (
      <MaterialsSearchFilter
        placeholder={this.props.searchPlaceholder}
        searchOptions={this.props.searchOptions}
        onSearchFilterChange={this.props.onSearchFilterChange}
        showTypeFilter={false}
        showCategoriesFilter
        showCostFilter
        showSourceFilter={this.props.isIndividual}
        onSelectSource={this.onSourceChange}
        onSearchInputChange={this.props.onSearchInputChange}
        onSearchFilterReset={this.onSearchFilterReset}
      />
    );
  }

  renderSearchResults() {
    const orderableMaterialResults = this.getOrderableMaterialResults();

    return (
      <div className="tx-stack tx-stack--sm">
        <MaterialsSelectorSearchResults
          data={orderableMaterialResults}
          onSelectRow={selectedRows => { this.props.onSelectRow(selectedRows); this.updateSelected(selectedRows); }}
          selected={this.props.selected}
          isSearching={this.props.isSearching}
          searchOptions={this.props.searchOptions}
          page={this.props.page()}
          numPages={this.props.numPages()}
          pageSize={this.props.pageSize()}
          onSortChange={this.props.onSortChange}
          onSearchPageChange={this.props.onSearchPageChange}
          onSearchFilterChange={this.props.onSearchFilterChange}
          disableCard={this.props.disableCard}
          isIndividual={this.props.isIndividual}
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
      />
    );
  }
}

MaterialsSelector.defaultProps = {
  searchPlaceholder: 'Search by Name, ID',
  disableCard: true,
  showTypeFilter: false,
  showCategoriesFilter: true,
  showCostFilter: true
};

MaterialsSelector.propTypes = {
  onSelectRow: PropTypes.func.isRequired,
  searchPlaceholder: PropTypes.string,
  disableCard: PropTypes.bool,
  showTypeFilter: PropTypes.bool,
  showCategoriesFilter: PropTypes.bool,
  showCostFilter: PropTypes.bool,
  selected: PropTypes.array.isRequired,
  actions: PropTypes.object.isRequired,
  onSortChange: PropTypes.func.isRequired,
  onSearchInputChange: PropTypes.func.isRequired,
  onSearchFilterChange: PropTypes.func.isRequired,
  onSearchPageChange: PropTypes.func.isRequired,
  onSearchFailed: PropTypes.func.isRequired,
  page: PropTypes.func.isRequired,
  numPages: PropTypes.func.isRequired,
  pageSize: PropTypes.func.isRequired,
  hasResults: PropTypes.bool.isRequired,
  searchOptions: PropTypes.instanceOf(Immutable.Map).isRequired,
  isSearching: PropTypes.bool.isRequired,
  zeroStateProps: PropTypes.object.isRequired,
  zeroStateSearchOptions: PropTypes.object.isRequired
};

const getStateFromStores = (props) => {
  const {
    isSearching,
    selected,
    searchPerPage
  } = MaterialsSelectorModalState.get();

  let search = MaterialSearchStore.getLatestSearch() || Immutable.fromJS({ results: [] });
  const results = MaterialSearchStore.getResultsFromSearch(search);
  search = search.set('results', results);

  const hasResults = (search.get('results') && (search.get('results').size > 0));
  const actions = MaterialsSelectorModalActions;

  let zeroStateSearchOptions = {};
  let isIndividual = false;
  let options = MaterialsSelectorModalActions.searchOptions();
  let typeOption;
  if (props.compoundId) {
    typeOption = { searchCompound: CompoundStore.getById(props.compoundId).get('compound_id'), noAggregation: true, searchType: 'individual'  };
    zeroStateSearchOptions = _.merge({}, { ...IndividualMaterialsSelectorModalDefaults, ...typeOption }, {});
    isIndividual = true;
  } else {
    typeOption = { searchCompound: null, noAggregation: true, searchType: 'group'  };
    zeroStateSearchOptions = _.merge({}, MaterialsSelectorModalDefaults, {});
  }
  options = _.merge({}, { ...options, ...typeOption }, {});
  const searchOptions = new Immutable.Map(options);
  const zeroStateProps = {
    title: 'No materials were found.'
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
    searchPerPage,
    isIndividual,
    className
  };
};

const materialSelectorWithSelectorContent = withSelectorContent(MaterialsSelector);
export default ConnectToStores(materialSelectorWithSelectorContent, getStateFromStores);
