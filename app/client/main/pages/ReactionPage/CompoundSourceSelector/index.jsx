import _ from 'lodash';
import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import ContainerStore from 'main/stores/ContainerStore';
import SelectorContent from 'main/components/SelectorContent/SelectorContentNew';
import withSelectorContent from 'main/components/SelectorContent/SelectorContentHOC';
import { ContainerSearchStore, MaterialSearchStore } from 'main/stores/search';
import { CompoundSourceSelectorMaterialModalActions } from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceMaterialActions';
import { CompoundSourceSelectorEMoleculesModalActions } from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceEmoleculesActions';
import { CompoundSourceSelectorContainerModalActions } from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceContainerActions';
import { CompoundSourceSelectorModalState, ContainerSearchDefaults, EMoleculesStateDefaults, MaterialSearchDefaults  } from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceState';
import CompoundLinkedContainerSearchResults from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundLinkedContainerSearchResults';
import { TabLayoutSidebar } from 'main/components/TabLayout/TabLayout';
import MaterialStore from 'main/stores/MaterialStore';
import SupplierActions from 'main/actions/SupplierActions';
import MaterialSearchResults from 'main/pages/ReactionPage/CompoundSourceSelector/MaterialSearchResults';
import { Button } from '@transcriptic/amino';
import CompoundSourceSearchFilters from './CompoundSourceSearchFilters';
import EMoleculesSearchResults from './EMoleculesSearchResults';
import ResourceEmptyState from './ResourceEmptyState';
import './CompoundSourceSelector.scss';

export class CompoundSourceSelector extends React.Component {

  constructor(props) {
    super(props);
    _.bindAll(
      this,
      'renderFilters',
      'renderSearchResults',
      'onSourceChange',
      'onSearchSucceed',
      'onEmoleculeSourceChange',
      'onStrateosSourceChange',
      'renderZeroState'
    );
  }

  componentDidMount() {
    this.load();
  }

  findByContainerId(id) {
    return ContainerStore.getById(id);
  }

  findByMaterialId(id) {
    return MaterialStore.getById(id);
  }

  load() {
    const { compound, labId, originalCompound } = this.props.data.toJS();
    const currentSource = this.props.searchSource;
    const defaultOptions = this.props.defaultOptions || {};

    let searchOptions = {
      ...defaultOptions,
      lab_id: labId,
      compound_link_id: originalCompound.linkId,
      container_type: ['a1-vial', 'd1-vial'],
      compound_count: 1,
      ...({ volume: compound.volume ? compound.volume : undefined }),
      ...({ mass: compound.mass ? compound.mass : undefined }),
      compound_smiles: originalCompound.smiles,
      compound_id: originalCompound.compoundId,
      searchSource: currentSource
    };
    SupplierActions.search({ filters: { is_preferred: true }, limit: 20 })
      .then(response => {
        const defaultSuppliers = response.data.map((supplier) => supplier.attributes.name);
        searchOptions = { ...searchOptions, searchSupplier: defaultSuppliers || [], searchEMoleculeSupplier: [] };
        this.props.onSearchFilterChange(Immutable.fromJS(searchOptions), () => { this.setState({ hasDoneDefaultSearch: true, isLoading: false }); });
      });
  }

  onSearchSucceed() {
    this.setState({ isLoading: false }, () => { this.props.disableSelectButton(); });
  }

  onSourceChange(options) {
    let actions;
    const { searchSource } = options.toJS();
    if (searchSource === 'user_inventory') {
      actions = CompoundSourceSelectorContainerModalActions;
    } else if (searchSource === 'strateos') {
      actions = CompoundSourceSelectorMaterialModalActions;
    } else {
      actions = CompoundSourceSelectorEMoleculesModalActions;
    }
    actions.onSearchFilterChange(this.props.onSearchFailed, options, this.onSearchSucceed);
  }

  updateSelected(selectedRows) {
    const keys = _.keys(selectedRows);
    const selectedRow = keys[keys.length - 1];
    this.props.actions.updateState({
      selected: selectedRow !== undefined ? [selectedRow] : []
    });
  }

  records() {
    if (this.props.searchSource === 'user_inventory') {
      return this.getContainerRecords();
    } else if (this.props.searchSource === 'strateos') {
      return this.getMaterialRecords();
    } else if (this.props.searchSource === 'e_molecules' && this.props.eMoleculesCurrentPage != null && this.props.eMoleculesCurrentPage.count) {
      return this.props.eMoleculesCurrentPage;
    }
    return Immutable.List();
  }

  getContainerRecords() {
    return this.props.search
      .get('results', Immutable.List())
      .map((result) => {
        const container = this.findByContainerId(result.get('id'));
        return container;
      });
  }

  getMaterialRecords() {
    return this.props.search
      .get('results', Immutable.List())
      .map((result) => {
        const material = this.findByMaterialId(result.get('id'));
        return material;
      });
  }

  onStrateosSourceChange() {
    const options = {
      searchSource: 'strateos',
      ...MaterialSearchDefaults
    };
    this.setState({ isLoading: true }, () => { this.onSourceChange(Immutable.fromJS(options)); });
  }

  onEmoleculeSourceChange() {
    const options = {
      searchSource: 'e_molecules',
      ...EMoleculesStateDefaults
    };
    this.setState({ isLoading: true }, () => { this.onSourceChange(Immutable.fromJS(options)); });
  }

  renderFilters() {
    return (this.props.searchSource && (
    <TabLayoutSidebar key="tab-layout-sidebar-left">
      <CompoundSourceSearchFilters
        key="compound-source-search-filters"
        searchOptions={Immutable.fromJS(this.props.searchOptions)}
        onSearchInputChange={query => this.props.onSearchInputChange(query)}
        onSearchFilterChange={options => this.props.onSearchFilterChange(options, this.onSearchSucceed)}
        modalSourceSelection={this.props.searchSource}
        eMoleculesSearchType={this.props.eMoleculesSearchType}
        eMoleculesData={this.props.eMoleculesData}
        isLoading={() => this.setState({ isLoading: true })}
        onSourceChange={this.onSourceChange}
      />
    </TabLayoutSidebar>
    ));
  }

  renderZeroState() {
    const { searchSource, onAddContainerClick } = this.props;
    return (
      <React.Fragment>
        {searchSource === 'user_inventory' && (
        <div className="container-selector tx-stack tx-stack--xxs">
          {this.renderAddContainer()}
          <div style={{ height: '100%', display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ResourceEmptyState sourceName={'User Inventory'} onStrateosSourceClick={this.onStrateosSourceChange} onEmoleculeSourceClick={this.onEmoleculeSourceChange} onAddContaineClick={onAddContainerClick} />
          </div>
        </div>
        )}
        {searchSource === 'e_molecules' && (
        <div style={{ height: '100%', display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ResourceEmptyState sourceName={'eMolecules'} />
        </div>
        )}
        {searchSource === 'strateos' && (
        <div style={{ height: '100%', display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ResourceEmptyState sourceName={'Strateos'} />
        </div>
        )}
      </React.Fragment>
    );

  }

  renderSearchResults() {
    const { selected, onRowClick, onSelectRow, searchSource, data } = this.props;
    const { originalCompound } = data.toJS();
    const records = this.records();
    return (
      <React.Fragment>
        {
         searchSource === 'user_inventory' && (
         <div className="container-selector tx-stack tx-stack--xxs">
           {this.renderAddContainer()}
           <CompoundLinkedContainerSearchResults
             data={records}
             isSearching={this.props.isSearching}
             selected={selected}
             onRowClick={(container) => onRowClick(container)}
             onSelectRow={selectedRows => { onSelectRow(selectedRows); this.updateSelected(selectedRows); }}
             page={this.props.page()}
             numPages={this.props.numPages()}
             onSearchPageChange={this.props.onSearchPageChange}
             onSortChange={this.props.onSortChange}
             searchOptions={Immutable.fromJS(this.props.searchOptions)}
             pageSize={this.props.pageSize()}
             onSearchFilterChange={this.props.onSearchFilterChange}
             compoundLinkId={originalCompound.linkId}
           />
         </div>
         )}
        {
         searchSource === 'e_molecules' && (
         <EMoleculesSearchResults
           data={records}
           isSearching={this.props.isSearching}
           eMoleculesSearchType={this.props.eMoleculesSearchType}
           selected={selected}
           onSelectRow={selectedRows => { onSelectRow(selectedRows); this.updateSelected(selectedRows); }}
           page={this.props.searchPage}
           numPages={this.props.eMoleculesNumPages}
           onSearchPageChange={this.props.onSearchPageChange}
           onSortChange={this.props.onSortChange}
           searchOptions={Immutable.fromJS(this.props.searchOptions)}
           pageSize={this.props.searchPerPage}
           onSearchFilterChange={options => this.props.onSearchFilterChange(options, () => { this.setState({ isLoading: false }); })}
           isLoading={() => this.setState({ isLoading: true })}
         />
         )
        }
        {
        searchSource === 'strateos' && (
        <MaterialSearchResults
          data={records}
          selected={selected}
          isSearching={this.props.isSearching}
          page={this.props.page()}
          numPages={this.props.numPages()}
          onSearchPageChange={this.props.onSearchPageChange}
          searchOptions={Immutable.fromJS(this.props.searchOptions)}
          pageSize={this.props.pageSize()}
          onSelectRow={selectedRows => {
            onSelectRow(selectedRows);
            this.updateSelected(selectedRows);
          }}
          onSearchFilterChange={this.props.onSearchFilterChange}
        />
        )}
      </React.Fragment>
    );
  }

  renderAddContainer() {
    const { onAddContainerClick } = this.props;
    return (
      AcsControls.isFeatureEnabled(FeatureConstants.CREATE_SAMPLE_SHIPMENTS) && (
      <div className="container-selector__register">
        <Button
          type="primary"
          icon="fa fa-plus"
          size="medium"
          onClick={onAddContainerClick}
        >
          Add container
        </Button>
      </div>
      )
    );
  }

  render() {
    return (
      <SelectorContent
        hasResults={this.props.hasResults}
        searchOptions={this.props.searchOptions}
        isSearching={this.props.isSearching}
        renderZeroState={this.renderZeroState}
        renderFilters={this.renderFilters}
        renderSearchResults={this.renderSearchResults}
      />
    );
  }
}

CompoundSourceSelector.propTypes = {
  onRowClick: PropTypes.func.isRequired,
  onSelectRow: PropTypes.func.isRequired,
  actions: PropTypes.object.isRequired,
  data: PropTypes.object,
  onSortChange: PropTypes.func.isRequired,
  onSearchInputChange: PropTypes.func.isRequired,
  onSearchFilterChange: PropTypes.func.isRequired,
  onSearchPageChange: PropTypes.func.isRequired,
  onSearchFailed: PropTypes.func.isRequired,
  page: PropTypes.func.isRequired,
  numPages: PropTypes.func.isRequired,
  pageSize: PropTypes.func.isRequired,
  searchOptions: PropTypes.object.isRequired,
  isSearching: PropTypes.bool.isRequired
};

export const getStateFromStores = (props) => {
  const {
    isSearching,
    selected,
    searchQuery,
    searchPage,
    searchPerPage,
    searchSource: currentSource,
    eMoleculesSearchType,
    numPages,
    eMoleculesCurrentPage,
    eMoleculesData
  } = CompoundSourceSelectorModalState.get() || {};

  const dataObj = props.data && props.data.toJS();
  const source = dataObj ? dataObj.source : undefined;
  const searchSource = currentSource || source;

  let defaultOptions = {};
  let actions;
  let search;
  let hasResults;
  if (searchSource === 'user_inventory') {
    actions = CompoundSourceSelectorContainerModalActions;
    search = ContainerSearchStore.getSearch(searchQuery, searchPage);
    hasResults = (search && search.get('results') && (search.get('results').size > 0));
    defaultOptions = { ...ContainerSearchDefaults };
  } else if (searchSource === 'strateos') {
    search = MaterialSearchStore.getSearch(searchQuery, searchPage);
    actions = CompoundSourceSelectorMaterialModalActions;
    defaultOptions = { ...MaterialSearchDefaults };
    hasResults = (search && search.get('results') && (search.get('results').size > 0));
  } else if (searchSource === 'e_molecules') {
    actions = CompoundSourceSelectorEMoleculesModalActions;
    defaultOptions = { ...EMoleculesStateDefaults };
    hasResults = eMoleculesCurrentPage && eMoleculesCurrentPage.size > 0;
  }

  const searchOptions = actions && actions.searchOptions();

  return {
    search,
    actions,
    hasResults,
    searchOptions,
    isSearching,
    searchPage,
    selected,
    searchPerPage,
    searchSource,
    eMoleculesSearchType,
    eMoleculesNumPages: numPages,
    eMoleculesCurrentPage,
    defaultOptions,
    eMoleculesData
  };
};

const resourceSelectorWithSelectorContent = withSelectorContent(CompoundSourceSelector);
export default ConnectToStores(resourceSelectorWithSelectorContent, getStateFromStores);
