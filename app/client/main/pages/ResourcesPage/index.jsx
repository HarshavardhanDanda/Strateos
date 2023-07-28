import Immutable from 'immutable';
import React from 'react';
import _ from 'lodash';
import { Button } from '@transcriptic/amino';
import PropTypes from 'prop-types';

import { ResourceSearchStore } from 'main/stores/search';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import ModalActions from 'main/actions/ModalActions';
import PageWithSearchAndList from 'main/components/PageWithSearchAndList/PageWithSearchAndList';
import withPageWithSearchAndList from 'main/components/PageWithSearchAndList/PageWithSearchAndListHOC';
import { ResourcesPageState, ResourcesSearchDefaults } from 'main/pages/ResourcesPage/ResourcesState';
import ResourcesSearchFilters from 'main/pages/ResourcesPage/ResourcesSearchFilters';
import { ResourcesPageSearchActions } from 'main/pages/ResourcesPage/ResourcesSearchActions';
import AddResourceModal from 'main/pages/ResourcesPage/modals/AddResourceModal';
import ResourcesSearchResults from './ResourcesSearchResults';

export class ResourcesPage extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this,
      'onSearchFilterReset',
      'renderFilters',
      'renderSearchResults',
      'renderPrimaryInfo'
    );
  }

  componentDidMount() {
    this.load();
  }

  load() {
    const searchOptions = {
      ...this.props.searchOptions,
      per_page: this.props.searchPerPage
    };

    this.props.actions.doSearch(searchOptions, this.props.onSearchFailed);
  }

  onSearchFilterReset() {
    this.props.onSearchFilterChange(Immutable.fromJS(ResourcesSearchDefaults));
  }

  renderPrimaryInfo() {
    return (
      <div>
        <AddResourceModal />
        <div className="tx-stack__block--sm">
          <Button
            type="secondary"
            onClick={() => ModalActions.open(AddResourceModal.MODAL_ID)}
          >Add Resource
          </Button>
        </div>
      </div>
    );
  }

  renderFilters() {
    return (
      <ResourcesSearchFilters
        onSearchFilterChange={this.props.onSearchFilterChange}
        searchOptions={Immutable.fromJS(this.props.searchOptions)}
        onSearchInputChange={this.props.onSearchInputChange}
        onSearchFilterReset={this.onSearchFilterReset}
      />
    );
  }

  renderSearchResults() {
    const results = this.props.search.get('results', Immutable.List());

    return (
      <div className="resources">
        <AddResourceModal />
        <div className="tx-stack__block--sm">
          <Button
            size="small"
            height="short"
            type="secondary"
            onClick={() => { ModalActions.open(AddResourceModal.MODAL_ID); }}
          >Add Resource
          </Button>
        </div>
        <ResourcesSearchResults
          data={results}
          page={this.props.page()}
          numPages={this.props.numPages()}
          onSearchPageChange={this.props.onSearchPageChange}
        />
      </div>
    );
  }

  render() {
    return (
      <PageWithSearchAndList
        hasResults={this.props.hasResults}
        isSearching={this.props.isSearching}
        renderFilters={this.renderFilters}
        renderSearchResults={this.renderSearchResults}
        renderPrimaryInfo={this.renderPrimaryInfo}
        zeroStateProps={this.props.zeroStateProps}
        theme="gray"
      />
    );
  }
}

export const getStateFromStores = () => {
  const {
    isSearching,
    searchQuery,
    searchPage,
    searchPerPage
  } = ResourcesPageState.get();
  const search = ResourceSearchStore.getSearch(searchQuery, searchPage);
  const records = ResourceSearchStore.getAllResults();
  const hasResults = (records && (records.size > 0));
  const searchOptions = ResourcesPageSearchActions.searchOptions();
  const zeroStateSearchOptions = _.merge({}, ResourcesSearchDefaults, { });
  const actions = ResourcesPageSearchActions;
  const zeroStateProps = {
    title: "You're ready to add some resources!"
  };
  const searchZeroStateProps = {
    title: 'No resources were found.'
  };

  return {
    search,
    searchOptions,
    zeroStateSearchOptions,
    hasResults,
    isSearching,
    searchPerPage,
    actions,
    zeroStateProps,
    searchZeroStateProps
  };
};

ResourcesPage.propTypes = {
  search: PropTypes.instanceOf(Immutable.Map).isRequired,
  searchOptions: PropTypes.object.isRequired,
  zeroStateSearchOptions: PropTypes.object.isRequired,
  hasResults: PropTypes.bool.isRequired,
  isSearching: PropTypes.bool.isRequired,
  searchPerPage: PropTypes.string,
  actions: PropTypes.object.isRequired,
  zeroStateProps: PropTypes.object,
  searchZeroStateProps: PropTypes.object,
  page: PropTypes.func.isRequired,
  numPages: PropTypes.func.isRequired,
  onSearchPageChange: PropTypes.func.isRequired,
  onSearchFilterChange: PropTypes.func.isRequired,
  onSearchFailed: PropTypes.func.isRequired,
  onSearchInputChange: PropTypes.func.isRequired
};

const resourcesPageWithPageWithSearchAndList = withPageWithSearchAndList(ResourcesPage);
export default ConnectToStores(resourcesPageWithPageWithSearchAndList, getStateFromStores);
