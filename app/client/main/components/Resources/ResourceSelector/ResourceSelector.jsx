import React from 'react';
import _ from 'lodash';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import { ResourceSearchStore } from 'main/stores/search';
import { ResourceSelectorModalState, ResourceSelectorModalDefaults } from 'main/pages/ResourcesPage/ResourcesState';
import { ResourceSelectorModalActions } from 'main/pages/ResourcesPage/ResourcesSearchActions';
import ResourcesSearchFilters from 'main/pages/ResourcesPage/ResourcesSearchFilters';
import CompoundStore from 'main/stores/CompoundStore';
import withSelectorContent from 'main/components/SelectorContent/SelectorContentHOC';
import SelectorContent from 'main/components/SelectorContent/SelectorContentNew';
import ResourceSearchResults from '../ResourceSearchResults';

export class ResourceSelector extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this,
      'onSearchFilterReset',
      'renderFilters',
      'renderSearchResults'
    );

  }

  componentDidMount() {
    this.load();
  }

  load() {
    if (!this.props.actions.doSearch) {
      return;
    }

    this.props.actions.doSearch(this.props.searchOptions.toJS(), this.props.onSearchFailed);
  }

  onSearchFilterReset() {
    this.props.onSearchFilterChange(Immutable.fromJS(this.props.zeroStateSearchOptions));
  }

  updateSelected(selectedRows) {
    this.props.actions.updateState({
      selected: _.keys(selectedRows)
    });
  }

  renderFilters() {
    const { searchOptions } = this.props;

    return (
      <ResourcesSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={this.props.onSearchFilterChange}
        showKindFilter={this.props.showKindFilter}
        onSearchInputChange={this.props.onSearchInputChange}
        onSearchFilterReset={this.onSearchFilterReset}
      />
    );
  }

  renderSearchResults() {
    const records = this.props.search.get('results', Immutable.List());

    return (
      <div className="tx-stack tx-stack--sm">
        <ResourceSearchResults
          data={records}
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
          visibleColumns={this.props.visibleColumns}
          disableCard={this.props.disableCard}
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

ResourceSelector.defaultProps = {
  showSource: true,
  disableCard: false
};

ResourceSelector.propTypes = {
  onSelectRow: PropTypes.func.isRequired,
  visibleColumns: PropTypes.instanceOf(Array),
  disableCard: PropTypes.bool,
  selected: PropTypes.array,
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
    searchQuery,
    searchPage,
    searchPerPage,
    selected
  } = ResourceSelectorModalState.get();

  const search = ResourceSearchStore.getSearch(searchQuery, searchPage);
  const hasResults = (search.get('results') && (search.get('results').size > 0));
  let compoundOption = { compoundId: undefined };
  let showKindFilter = true;
  if (props.compoundLinkId) {
    showKindFilter = false;
    compoundOption = { compoundId: CompoundStore.getById(props.compoundLinkId).get('compound_id') };
  }

  const searchOptions = new Immutable.Map({ ...ResourceSelectorModalActions.searchOptions(),  ...compoundOption });

  const zeroStateSearchOptions = _.merge({},  { ...ResourceSelectorModalDefaults, ...compoundOption }, { });

  const actions = ResourceSelectorModalActions;

  const zeroStateProps = {
    title: 'No resources were found.'
  };

  return {
    search,
    searchOptions,
    selected,
    zeroStateSearchOptions,
    hasResults,
    isSearching,
    searchPerPage,
    actions,
    zeroStateProps,
    showKindFilter
  };
};

const resourceSelectorWithSelectorContent = withSelectorContent(ResourceSelector);
export default ConnectToStores(resourceSelectorWithSelectorContent, getStateFromStores);
