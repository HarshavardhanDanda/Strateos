import _ from 'lodash';
import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from '@transcriptic/amino';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import CompoundStore from 'main/stores/CompoundStore';
import UserActions from 'main/actions/UserActions';
import { CompoundSearchStore } from 'main/stores/search';
import AcsControls             from 'main/util/AcsControls';
import { CompoundSelectorModalActions, CompoundSelectorPublicModalActions } from 'main/pages/CompoundsPage/CompoundsActions';
import { CompoundSelectorModalState, CompoundSelectorPublicModalState, CompoundSelectorModalDefaults, CompoundSelectorPublicOnlyDefaults } from 'main/pages/CompoundsPage/CompoundsState';
import SelectorContent from 'main/components/SelectorContent';
import CompoundSearchFilters from 'main/pages/CompoundsPage/CompoundSearchFilters';
import CompoundSearchResults from 'main/pages/CompoundsPage/CompoundSearchResults';
import FeatureConstants        from '@strateos/features';

import SessionStore from 'main/stores/SessionStore';

import './CompoundSelector.scss';

class CompoundSelector extends SelectorContent {
  constructor(props) {
    super(props);

    _.bindAll(this,
      'onSearchInputChange',
      'onSearchFilterReset',
      'loadCompoundRelations',
      'onColumnSelectionChange',
      'onSearchSucceed'
    );

    this.state = {
      ...this.state,
      libraries: {}
    };
  }

  findById(id) {
    return CompoundStore.getById(id);
  }

  load() {
    if (!this.props.actions.doSearch) {
      return;
    }

    const searchOptions = { ...this.props.searchOptions.toJS(), ...AcsControls.isFeatureEnabled(FeatureConstants.VIEW_LIBRARIES) && { includes: ['libraries'] } };
    this.props.actions.doSearch(searchOptions, this.onSearchFailed, (compounds) => {
      this.setState({ hasDoneDefaultSearch: true });
      this.onSearchSucceed(compounds);
      compounds.data.map((result) =>  UserActions.load(result.attributes.created_by));
    });
  }

  loadCompoundRelations(compounds) {
    const libraries = {};
    compounds.data.forEach((result) => {
      if (result.relationships && result.relationships.libraries && result.relationships.libraries.data.length > 0) {
        libraries[result.id] = result.relationships.libraries.data.map((record) => record.id);
      }
    });
    this.setState({
      libraries
    });

  }

  onSearchSucceed(results) {
    this.loadCompoundRelations(results);
    const { selected } = this.props;
    if (selected) {
      let updateSelected = _.get(results, 'data', [])
        .filter(compound => selected.includes(compound.id))
        .map(compound => compound.id);
      if (!this.props.persistSearchResultSelection) { updateSelected = _.uniq(selected.concat(updateSelected)); }
      this.props.actions.updateState({ selected: updateSelected });
      this.props.onSelectRow(updateSelected);
    }
  }

  onSearchFilterReset() {
    this.onSearchFilterChange(Immutable.Map(this.props.zeroStateSearchOptions), this.onSearchSucceed);
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

  filters() {
    const { searchOptions, onStructureSearchClick, showSource, disableOrgFilter } = this.props;
    const smiles = searchOptions.get('searchSimilarity');

    return (
      <CompoundSearchFilters
        searchOptions={searchOptions}
        showSource={showSource}
        drawStructure={() => onStructureSearchClick(smiles, value => this.onSearchSimilarityChange(value, this.onSearchSucceed))}
        onSearchSimilarityChange={value => this.onSearchSimilarityChange(value, this.onSearchSucceed)}
        onSearchFilterChange={options => this.onSearchFilterChange(options, this.onSearchSucceed)}
        onSearchInputChange={query => this.onSearchInputChange(query, this.onSearchSucceed)}
        onSearchFilterReset={this.onSearchFilterReset}
        disableOrgFilter={disableOrgFilter}
      />
    );
  }

  onColumnSelectionChange(selectedColumns) {
    if (this.props.handleColumnChange) {
      this.props.handleColumnChange(selectedColumns);
    }
  }

  searchResults(records) {
    const { onRowClick, searchOptions, isSearching, selected, onSelectRow, onRegisterClick, searchByPublicCompounds } = this.props;
    let results = records;

    if (searchByPublicCompounds && searchOptions.get('searchSource') === 'private' && !isSearching) {
      results = Immutable.List([]);
    }

    return (
      <div className="tx-stack tx-stack--sm">
        <If condition={!this.props.isSearching && this.props.allowCompoundRegistration}>
          <div className="compound-selector__register">
            <Button
              type="action"
              heavy
              height="short"
              icon="fa fa-plus"
              size="small"
              onClick={onRegisterClick}
            >
              Register New Compound
            </Button>
          </div>
        </If>
        <CompoundSearchResults
          data={results}
          onRowClick={compound => onRowClick(compound, selected, () => this.addToSelection(compound, selected))}
          onSelectRow={selectedRows => { onSelectRow(selectedRows); this.updateSelected(selectedRows); }}
          selected={selected}
          isSearching={isSearching}
          searchOptions={searchOptions}
          page={this.page()}
          numPages={this.numPages()}
          pageSize={this.pageSize()}
          onSortChange={(key, direction) => this.onSortChange(key, direction, this.onSearchSucceed)}
          onModal
          onSearchPageChange={searchPage => this.onSearchPageChange(searchPage, this.onSearchSucceed)}
          onSearchFilterChange={options => this.onSearchFilterChange(options, this.onSearchSucceed)}
          visibleColumns={this.props.visibleColumns}
          disableCard={this.props.disableCard}
          hideActions={this.props.hideActions}
          handleColumnChange={this.onColumnSelectionChange}
          libraries={this.state.libraries}
        />
      </div>
    );
  }

  render() {
    return super.render();
  }
}

CompoundSelector.defaultProps = {
  allowCompoundRegistration: true,
  isDrawer: false,
  showSource: true,
  disableCard: false,
  hideActions: false,
  searchByPublicCompounds: false,
  hasResources: false,
  persistSearchResultSelection: true
};

CompoundSelector.propTypes = {
  onStructureSearchClick: PropTypes.func.isRequired,
  onRowClick: PropTypes.func.isRequired,
  onUseCompound: PropTypes.func.isRequired,
  onSelectRow: PropTypes.func.isRequired,
  onRegisterClick: PropTypes.func,
  allowCompoundRegistration: PropTypes.bool,
  visibleColumns: PropTypes.instanceOf(Array),
  isDrawer: PropTypes.bool,
  showSource: PropTypes.bool,
  disableCard: PropTypes.bool,
  hideActions: PropTypes.bool,
  searchByPublicCompounds: PropTypes.bool,
  searchPublicAndPrivateByOrgId: PropTypes.string,
  hideRegisterAction: PropTypes.bool,
  hasResources: PropTypes.bool,
  persistSearchResultSelection: PropTypes.bool,
  disableOrgFilter: PropTypes.bool
};

export const getStateFromStores = (props) => {
  const {
    isSearching,
    searchQuery,
    searchPage,
    selected,
    searchPerPage
  } = props.searchByPublicCompounds ? CompoundSelectorPublicModalState.get() : CompoundSelectorModalState.get();

  let searchBySource = {};
  let compoundSelectorDefaults = CompoundSelectorModalDefaults;
  if (!(props.data && props.data.get('whenCreateContainer'))) {
    if (props.searchByPublicCompounds) {
      searchBySource = { searchByPublicCompounds: true };
      compoundSelectorDefaults = CompoundSelectorPublicOnlyDefaults;
    } else if (props.searchPublicAndPrivateByOrgId) {
      searchBySource = { searchPublicAndPrivateByOrgId: props.searchPublicAndPrivateByOrgId };
    }
  }
  let hasResources = {};
  if (props.hasResources) {
    hasResources = { hasResources: true };
  }

  const actions = props.searchByPublicCompounds ? CompoundSelectorPublicModalActions :  CompoundSelectorModalActions;
  const searchOptions = new Immutable.Map({ ...actions.searchOptions(), ...searchBySource, ...hasResources });

  const hideRegisterAction = SessionStore.isAdmin() || props.isDrawer || props.hideRegisterAction || !props.allowCompoundRegistration;
  const zeroStateProps = {
    title: 'No compounds match your search terms.',
    button: !hideRegisterAction ? (
      <Button
        type="action"
        heavy
        height="short"
        size="small"
        onClick={props.onRegisterClick}
      >
        Register as a New Compound
      </Button>
    ) : null
  };

  const search = CompoundSearchStore.getSearch(searchQuery, searchPage);
  const zeroStateSearchOptions = { ...compoundSelectorDefaults, ...searchBySource, ...AcsControls.isFeatureEnabled(FeatureConstants.VIEW_LIBRARIES) && { includes: ['libraries'] } };
  const hasResults = (search.get('results') && (search.get('results').size > 0));
  const className = classNames('compound-selector', props.className);

  return {
    zeroStateProps,
    actions,
    search,
    selected,
    searchOptions,
    zeroStateSearchOptions,
    hasResults,
    isSearching,
    searchPerPage,
    searchPage,
    className
  };
};

export default ConnectToStores(CompoundSelector, getStateFromStores);
