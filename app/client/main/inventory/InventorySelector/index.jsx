import _ from 'lodash';
import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import { Button } from '@transcriptic/amino';
import Urls from 'main/util/urls';
import ShipmentActions from 'main/actions/ShipmentActions';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import SessionStore from 'main/stores/SessionStore';
import SelectorContent from 'main/components/SelectorContent/SelectorContentNew';
import withSelectorContent from 'main/components/SelectorContent/SelectorContentHOC';
import ContainerSearchFilters from 'main/pages/InventoryPage/ContainerSearchFilters';
import ContainerSearchResults from 'main/pages/InventoryPage/ContainerSearchResults';
import ContainerStore from 'main/stores/ContainerStore';
import { ShipmentStore } from 'main/stores/ShipmentStore';
import InventoryUtil from 'main/inventory/inventory/util/InventoryUtil';
import { ContainerSearchStore } from 'main/stores/search';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import ModalActions from 'main/actions/ModalActions';
import {
  InventorySelectorModalAliquotActions,
  InventorySelectorModalContainerActions
} from 'main/inventory/inventory/InventoryActions';
import {
  InventorySelectorModalAliquotDefaults, InventorySelectorModalContainerDefaults,
  InventorySelectorModalAliquotState, InventorySelectorModalContainerState
} from 'main/inventory/inventory/InventoryState';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import StructureSearchModal from 'main/pages/CompoundsPage/StructureSearchModal';

import '../InventorySelector/InventorySelector.scss';

export class InventorySelector extends React.Component {
  constructor(props) {
    super(props);
    _.bindAll(this,
      'onSearchSmileChange',
      'onSearchFilterReset',
      'load',
      'renderFilters',
      'renderSearchResults'
    );
  }

  componentDidMount() {
    this.initialize();
    this.load();
  }

  findById(id) {
    return ContainerStore.getById(id);
  }

  initializeStoreState(state) {
    this.props.actions.initializeStoreState(state);
  }

  initialize() {
    this.initializeStoreState({ visibleColumns: InventoryUtil.getVisibleColumns() });
  }

  getDefaultContainerTypes() {
    const { defaultFilters } = this.props;
    if (defaultFilters && defaultFilters.containerTypeWellCount) {
      return ContainerTypeStore.getContainerTypeIDsByWellCount(defaultFilters.containerTypeWellCount).toJS();
    }
    return [];
  }

  setStoreDefaultFilters() {
    const defaultFilters = {
      defaultFilters: {
        containerTypes: this.getDefaultContainerTypes()
      }
    };
    this.props.actions.updateState(defaultFilters);
  }

  load() {
    this.setStoreDefaultFilters();
    const firstLabConsumer = LabConsumerStore.getAllForCurrentOrg().first();
    const searchOptions = {
      ...this.props.searchOptions,
      per_page: this.props.searchPerPage,
      onlyShowTestContainers: this.props.testMode,
      runsLabId: this.props.labId ? this.props.labId :
        firstLabConsumer ? firstLabConsumer.getIn(['lab', 'id']) : undefined,
      organization_id: this.props.organizationId ? this.props.organizationId : SessionStore.getOrg().get('id')
    };

    this.props.actions.doSearch(searchOptions, this.props.onSearchFailed, () => {
      this.props.actions.updateState(searchOptions);
    });

    ShipmentActions.loadAll();
  }

  getSelectedRows(selected) {
    const selectionMap = {};
    selected.forEach(element => {
      selectionMap[element] = true;
    });
    return selectionMap;
  }

  onSearchFilterReset() {
    this.props.onSearchFilterChange(Immutable.fromJS(
      { ...this.props.zeroStateSearchOptions, organization_id: this.props.organizationId || SessionStore.getOrg().get('id') }
    ), this.props.testMode);
  }

  onRowClick(container, selected) {
    this.props.onRowClick(container, selected);
  }

  onSelectRow(record, willBeChecked, selectedRows) {
    if (this.props.selectionType != 'ALIQUOT') {
      this.props.onSelectRow(record, willBeChecked, selectedRows);
    } else {
      let selectedRow;
      if (willBeChecked) {
        selectedRow = { [Object.keys(selectedRows).pop()]: true };
      } else {
        selectedRow = {};
      }
      this.props.onSelectRow(record, willBeChecked, selectedRow);
    }
  }

  onSelectAll(selectedRows) {
    this.props.actions.updateState({ selected: _.keys(selectedRows) });
    this.props.onSelectAll(selectedRows);
  }

  onSearchSmileChange(query) {
    this.props.actions.onSearchSmileChange(this.onSearchFailed, query, this.props.testMode);
  }

  renderFilters() {
    return (
      <React.Fragment>
        <ContainerSearchFilters
          onSearchFilterChange={(options, testMode) => this.props.onSearchFilterChange(options, testMode)}
          orientation="vertical"
          searchOptions={Immutable.fromJS(this.props.searchOptions)}
          showTestFilter
          showStatusFilter
          testMode={this.props.testMode}
          drawStructure={() => ModalActions.open(StructureSearchModal.MODAL_ID)}
          onSearchSmileChange={this.onSearchSmileChange}
          onSearchInputChange={this.props.onSearchInputChange}
          onSearchFilterReset={this.onSearchFilterReset}
          defaultFilters={this.props.defaultFilters}
        />
        <StructureSearchModal
          SMILES={Immutable.fromJS(this.props.searchOptions).get('searchSmiles')}
          onSave={this.onSearchSmileChange}
        />
      </React.Fragment>
    );
  }

  renderSearchResults() {
    const records = this.props.search.get('results', Immutable.List())
      .map((result) => this.findById(result.get('id'))).filter(result => result);

    const { createdIds, shipments, selected, isSingleSelect } = this.props;
    return (
      <div className="tx-stack tx-stack--sm">
        <ContainerSearchResults
          data={records}
          disabledSelection={!_.includes(this.props.selectionType, '+')}
          onRowClick={(container) => { this.onRowClick(container, selected); }}
          onSelectRow={!_.includes(this.props.selectionType, '+') ? undefined : ((record, willBeChecked, selectedRows) => { this.onSelectRow(record, willBeChecked, selectedRows); })}
          onSelectAll={!isSingleSelect && ((selectedRows) => { this.onSelectAll(selectedRows); })}
          selected={this.getSelectedRows(selected)}
          page={this.props.page()}
          numPages={this.props.numPages()}
          onSearchPageChange={searchPage => this.props.onSearchPageChange(searchPage, this.props.testMode)}
          onSortChange={(key, direction) => this.props.onSortChange(key, direction, this.props.testMode)}
          createdIds={createdIds}
          shipments={shipments}
          searchOptions={Immutable.fromJS(this.props.searchOptions)}
          pageSize={this.props.pageSize()}
          onSearchFilterChange={options => this.props.onSearchFilterChange(options)}
          onModal
          visibleColumns={this.props.visibleColumns}
          onVisibleColumnChange={this.onVisibleColumnChange}
          isSearching={this.props.isSearching}
        />
      </div>
    );
  }

  render() {
    return (
      <SelectorContent
        hasResults={this.props.hasResults}
        isSearching={this.props.isSearching}
        zeroStateProps={this.props.zeroStateProps}
        searchOptions={this.props.searchOptions}
        renderFilters={this.renderFilters}
        renderSearchResults={this.renderSearchResults}
      />
    );
  }
}

InventorySelector.defaultProps = {
  onSelectAll: () => {}
};
InventorySelector.propTypes = {
  onRowClick: PropTypes.func.isRequired,
  onSelectRow: PropTypes.func.isRequired,
  onSelectAll: PropTypes.func,
  organizationId: PropTypes.string,
  labId: PropTypes.string,
  testMode: PropTypes.bool,
  selectionType: PropTypes.string,
  isSingleSelect: PropTypes.bool,
  onSelectedContainerChange: PropTypes.func,
  onAllWellsSelected: PropTypes.func,
  defaultFilters: PropTypes.object,
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
export const getStateFromStores = ({ selectionType }) => {
  const isSelectingContainer = _.includes(selectionType, 'CONTAINER');
  const modalState = isSelectingContainer ? InventorySelectorModalContainerState : InventorySelectorModalAliquotState;
  const modalActions = isSelectingContainer ? InventorySelectorModalContainerActions : InventorySelectorModalAliquotActions;
  const modalZeroState = isSelectingContainer ? InventorySelectorModalContainerDefaults : InventorySelectorModalAliquotDefaults;
  const {
    createdContainers,
    isSearching,
    selected,
    searchQuery,
    searchPage,
    searchPerPage,
    visibleColumns
  } = modalState.get();
  const search = ContainerSearchStore.getSearch(searchQuery, searchPage);
  const hasResults = (search.get('results') && (search.get('results').size > 0));
  const searchOptions = modalActions.searchOptions();
  const zeroStateSearchOptions = { ...modalZeroState };
  const isAdmin = SessionStore.isAdmin();
  const canAddTestSamples = SessionStore.isDeveloper() || isAdmin;
  const shipments = ShipmentStore.getAll();
  searchOptions.include = ['container_type'];
  const actions = modalActions;
  const zeroStateProps = {
    title: 'No containers were found...',
    subTitle: "You'll need to create containers and ship them to Transcriptic before you launch a run.",
    button: (
      <Button
        type="primary"
        size="medium"
        icon="fa-plus"
        onClick={() => ModalActions.open('ADD_CONTAINER_MODAL')}
      >
        Add Container
      </Button>
    )
  };
  const listUrl = Urls.samples();
  const resultUrl = Urls.container;
  const title = 'Inventory';
  const className = 'compound-selector';
  return {
    createdIds: createdContainers,
    search,
    searchOptions,
    zeroStateSearchOptions,
    hasResults,
    canAddTestSamples,
    isAdmin,
    shipments,
    isSearching,
    selected,
    searchPerPage,
    actions,
    zeroStateProps,
    listUrl,
    resultUrl,
    title,
    hasPageLayout: true,
    hasTableActions: true,
    visibleColumns,
    className
  };
};

const inventorySelectorWithSelectorContent = withSelectorContent(InventorySelector);
export default ConnectToStores(inventorySelectorWithSelectorContent, getStateFromStores);
