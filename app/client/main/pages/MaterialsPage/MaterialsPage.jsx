import React from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import { Button } from '@transcriptic/amino';
import PropTypes from 'prop-types';

import PageWithSearchAndList from 'main/components/PageWithSearchAndList/PageWithSearchAndList';
import withPageWithSearchAndList from 'main/components/PageWithSearchAndList/PageWithSearchAndListHOC';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import { MaterialSearchStore } from 'main/stores/search';
import MaterialStore from 'main/stores/MaterialStore';
import Urls from 'main/util/urls';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import MaterialsSearchResults from './MaterialsSearchResults';
import { MaterialsPageState, MaterialsSearchDefaults } from './MaterialsState';
import { MaterialsPageActions } from './MaterialsActions';
import MaterialsSearchFilter from './MaterialsSearchFilters';

export class MaterialsPage extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this,
      'updateSelected',
      'onDeleteRow',
      'renderFilters',
      'renderSearchResults',
      'onSearchFilterReset'
    );
  }

  componentDidMount() {
    this.load();
  }

  load() {
    const searchOptions = this.props.searchOptions.toJS();
    this.props.actions.doSearch(searchOptions, this.props.onSearchFailed, () => {
      this.setState({ hasDoneDefaultSearch: true });
    });
  }

  onSearchFilterReset() {
    this.props.onSearchFilterChange(Immutable.Map(this.props.zeroStateSearchOptions));
  }

  searchPlaceholder() {
    return 'Search';
  }

  page() {
    return this.props.search.get('page', 1);
  }

  numPages() {
    return this.props.search.get('num_pages', 1);
  }

  pageSize() {
    return this.props.search.get('per_page', 1);
  }

  updateSelected(selectedRows) {
    this.props.actions.updateState({
      selected: Object.keys(selectedRows)
    });
  }

  onDeleteRow() {
    this.props.actions.updateState({
      selected: []
    });
  }

  getSelectedRows() {
    const selected = {};
    this.props.selected.forEach(element => {
      selected[element] = true;
    });
    return selected;
  }

  renderFilters() {
    return (
      <MaterialsSearchFilter
        searchOptions={this.props.searchOptions}
        onSearchFilterChange={this.props.onSearchFilterChange}
        placeholder={this.searchPlaceholder()}
        onSearchInputChange={this.props.onSearchInputChange}
        onSearchFilterReset={this.onSearchFilterReset}
      />
    );
  }

  renderSearchResults() {
    const { searchOptions, isSearching, selected } = this.props;
    const data = this.props.search.get('results', Immutable.List());

    return (
      <MaterialsSearchResults
        data={data}
        isSearching={isSearching}
        searchOptions={searchOptions}
        selected={selected}
        page={this.page()}
        numPages={this.numPages()}
        pageSize={this.pageSize()}
        onRowClick={this.props.onViewDetailsClicked}
        onSearchPageChange={this.props.onSearchPageChange}
        onSearchFilterChange={this.props.onSearchFilterChange}
        onSortChange={this.props.onSortChange}
        onSelectRow={this.updateSelected}
        onDeleteRow={this.onDeleteRow}
        history={this.props.history}
      />
    );

  }

  renderPrimaryInfo() { }

  render() {

    return (
      <PageWithSearchAndList
        hasPageLayout={this.props.hasPageLayout}
        hasResults={this.props.hasResults}
        isSearching={this.props.isSearching}
        zeroStateProps={this.props.zeroStateProps}
        renderFilters={this.renderFilters}
        renderSearchResults={this.renderSearchResults}
      />
    );
  }
}

export const props = () => {
  const {
    isSearching,
    selected
  } = MaterialsPageState.get();

  let search = MaterialSearchStore.getLatestSearch() || Immutable.fromJS({ results: [] });
  const results = MaterialSearchStore.getResultsFromSearch(search);
  search = search.set('results', results);

  const searchOptions = new Immutable.Map(MaterialsPageActions.searchOptions());
  const resultUrl = Urls.material;
  const allResults = MaterialStore.getAll();
  const hasResults = allResults && allResults.size > 0;
  const hasPageLayout = false;
  const actions = MaterialsPageActions;

  const zeroStateSearchOptions = _.merge({}, MaterialsSearchDefaults, {});
  const searchZeroStateProps = {
    title: 'No materials were found.'
  };
  const zeroStatePropsWithCreatePermission = {
    title: "You're ready to add some materials!",
    button: (
      <Button to={Urls.new_material()}>Create material</Button>
    )
  };

  const canCreateMaterial =  AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES);
  const zeroStateProps = canCreateMaterial ? zeroStatePropsWithCreatePermission : searchZeroStateProps;

  return {
    resultUrl,
    actions,
    search,
    searchOptions,
    zeroStateProps,
    zeroStateSearchOptions,
    hasResults,
    hasPageLayout,
    isSearching,
    selected
  };
};

MaterialsPage.propTypes = {
  history: PropTypes.object.isRequired,
  search: PropTypes.instanceOf(Immutable.Map).isRequired,
  searchOptions: PropTypes.object.isRequired,
  zeroStateSearchOptions: PropTypes.object.isRequired,
  hasResults: PropTypes.bool.isRequired,
  isSearching: PropTypes.bool.isRequired,
  selected: PropTypes.array.isRequired,
  actions: PropTypes.object.isRequired,
  zeroStateProps: PropTypes.object.isRequired,
  resultUrl: PropTypes.func.isRequired,
  hasPageLayout: PropTypes.bool.isRequired,
  onSearchFailed: PropTypes.func.isRequired,
  onSortChange: PropTypes.func.isRequired,
  onSearchInputChange: PropTypes.func.isRequired,
  onSearchFilterChange: PropTypes.func.isRequired,
  onSearchPageChange: PropTypes.func.isRequired
};

const materialsPageWithPageWithSearchAndList = withPageWithSearchAndList(MaterialsPage);
export default ConnectToStores(materialsPageWithPageWithSearchAndList, props);
