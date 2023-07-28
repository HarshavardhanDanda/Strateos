import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import Immutable from 'immutable';

/**
 ** NOTE: Please do not add any new internal imports to this file. Add to ConnectedInventoryPage instead.
 **  https://strateos.atlassian.net/browse/PP-7725
 ** */

import PageWithSearchAndList from 'main/components/PageWithSearchAndList/PageWithSearchAndList';
import withPageWithSearchAndList from 'main/components/PageWithSearchAndList/PageWithSearchAndListHOC';
import NotificationActions from 'main/actions/NotificationActions';
import ContainerSearchFilters from './ContainerSearchFilters';
import ContainerSearchResults from './ContainerSearchResults';

import './InventoryPage.scss';

export class InventoryPage extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this,
      'handleSearchFilterReset',
      'handleSearchSmileChange',
      'handleSearchInputChange',
      'handleSelectionAcrossPagesChange',
      'handleSearchFilterChange',
      'renderSearchResults',
      'renderFilters',
      'getSelectedContainers',
      'onToggleResult',
      'onUnselectAllContainers',
      'searchPlaceholder',
      'onSelectAllResults',
      'onUnselectAllResults',
    );
  }

  componentDidMount() {
    this.initialize();
    this.load();
  }

  initializeStoreState(state) {
    this.props.actions && this.props.actions.initializeStoreState(state);
  }

  initialize() {
    this.initializeStoreState();
  }

  load() {
    const searchOptions = {
      ...this.props.searchOptions,
      per_page: this.props.searchPerPage
    };

    this.props.actions.doSearch(searchOptions, this.props.onSearchFailed);
  }

  handleSelectionAcrossPagesChange = (toBeEnabled, currentBulkSelectionCount = 0, isFilterChange = false) => {
    const { onSelectionAcrossPagesChange } = this.props;
    this.handleNotification(toBeEnabled, currentBulkSelectionCount, isFilterChange);
    if (onSelectionAcrossPagesChange) {
      onSelectionAcrossPagesChange(toBeEnabled, currentBulkSelectionCount);
    }
    this.onUnselectAllResults();
  };

  shouldDisplayNotification(isSelectionAcrossPagesActive, currentBulkSelectionCount, previousBulkSelectionCount) {
    return isSelectionAcrossPagesActive && ((currentBulkSelectionCount === 0 && previousBulkSelectionCount > 0) || currentBulkSelectionCount > 0);
  }

  handleNotification(toBeEnabled, currentBulkSelectionCount, isFilterChange) {
    const previousBulkSelectionCount = this.props.bulkSelectionCount;
    if (this.shouldDisplayNotification(this.props.isSelectionAcrossPagesActive, currentBulkSelectionCount, this.props.bulkSelectionCount)) {
      const { totalRecordCount } = this.props;

      const notification = {
        text: '',
        isInfo: true
      };

      if (toBeEnabled) {
        notification.text = totalRecordCount > currentBulkSelectionCount
          ? `You have selected the first ${currentBulkSelectionCount} of ${totalRecordCount} containers`
          : `You have selected ${currentBulkSelectionCount} containers`;
      } else {
        notification.text = isFilterChange
          ? `Selection of ${previousBulkSelectionCount} containers has been removed because the results have been modified.`
          : `Selection of ${previousBulkSelectionCount} containers has been removed.`;
      }

      NotificationActions.createNotification(notification);
    }
  }

  handleSearchInputChange(targetValue) {
    this.props.onSearchInputChange(targetValue);
    this.handleSelectionAcrossPagesChange(false, 0, true);
  }

  handleSearchFilterReset() {
    this.props.onSearchFilterChange(Immutable.fromJS(this.props.zeroStateSearchOptions));
    this.handleSelectionAcrossPagesChange(false, 0, true);
  }

  handleSearchSmileChange(query) {
    this.props.actions.onSearchSmileChange(this.props.onSearchFailed, query);
    this.handleSelectionAcrossPagesChange(false, 0, true);
  }

  handleDrawStructure() {
    this.props.onOpenStructureSearchModal();
    this.handleSelectionAcrossPagesChange(false, 0, true);
  }

  handleSearchFilterChange(...args) {
    this.props.onSearchFilterChange(...args);
    this.handleSelectionAcrossPagesChange(false, 0, true);
  }

  searchPlaceholder() {
    return ('Search by Id, Name or Barcode');
  }

  onToggleResult(rows) {
    const { actions } = this.props;
    actions.updateState({ selected: Object.keys(rows) });
  }

  getSelectedContainers() {
    const selectedContainers = {};
    this.props.selected && this.props.selected.forEach(element => {
      selectedContainers[element] = true;
    });
    return selectedContainers;
  }

  onSelectAllResults() {
    this.props.actions.updateState({
      selected: _.uniq(this.props.selected.concat(this.props.allResultIds().toJS()))
    });
  }

  onUnselectAllResults() {
    this.props.actions.updateState({
      selected: []
    });
  }

  onUnselectAllContainers(selectedContainers) {
    this.onUnselectAllResults();
    this.props.deleteContainersInStore(selectedContainers);
  }

  renderFilters() {
    const searchOptions = Immutable.fromJS(this.props.searchOptions);
    return (
      <React.Fragment>
        <ContainerSearchFilters
          onSearchFilterChange={this.handleSearchFilterChange}
          orientation="vertical"
          searchOptions={searchOptions}
          showTestFilter
          showStatusFilter
          showOrgFilter={this.props.showOrgFilter}
          drawStructure={() => this.handleDrawStructure()}
          onSearchSmileChange={this.handleSearchSmileChange}
          placeholder={this.searchPlaceholder()}
          onSearchInputChange={this.handleSearchInputChange}
          onSearchFilterReset={this.handleSearchFilterReset}
          onSelectionAcrossPagesChange={this.handleSelectionAcrossPagesChange}
        />
      </React.Fragment>
    );
  }

  renderSearchResults() {
    const containers = this.props.search.get('results', Immutable.List());
    const onSelectRow = (records, willBeChecked, rows) => {
      this.props.setShippable(_.keys(rows));
      this.onToggleResult(rows);
    };

    const onSelectAll = () => {
      if (Object.keys(this.getSelectedContainers()).length === containers.size) {
        this.onUnselectAllResults();
      } else {
        this.onSelectAllResults();
      }
      const selectedContainers = containers.map(container => container.get('id'));
      this.props.setShippable(selectedContainers.toJS());
    };

    return (
      <ContainerSearchResults
        card
        data={containers}
        onRowClick={this.props.onViewDetailsClicked}
        onSelectRow={(records, willBeChecked, selectedRows) => onSelectRow(records, willBeChecked, selectedRows)}
        onSelectAll={onSelectAll}
        selected={this.getSelectedContainers()}
        page={this.props.page()}
        numPages={this.props.numPages()}
        pageSize={this.props.pageSize()}
        totalRecordCount={this.props.totalRecordCount}
        onSearchPageChange={this.props.onSearchPageChange}
        onSearchFilterChange={this.props.onSearchFilterChange}
        searchOptions={Immutable.fromJS(this.props.searchOptions)}
        onSortChange={this.props.onSortChange}
        createdIds={this.props.createdIds}
        shipments={this.props.shipments}
        showOrgFilter={this.props.showOrgFilter}
        shippable={this.props.isShippable}
        onUnselectAllResults={this.onUnselectAllContainers}
        selectedContainers={this.props.selectedOnCurrentPage()}
        canTransferContainers={this.props.hasCollaboratorOrgs && this.props.canTransferContainer}
        visibleColumns={this.props.visibleColumns}
        refetchContainers={() => this.props.actions.refetch()}
        onTransferClick={this.props.onTransferClick}
        isSearching={this.props.isSearching}
        enableSelectionAcrossPages
        isSelectionAcrossPagesActive={this.props.isSelectionAcrossPagesActive}
        onSelectionAcrossPagesChange={this.handleSelectionAcrossPagesChange}
        bulkSelectionCount={this.props.bulkSelectionCount}
        onBulkActionClick={this.props.onBulkActionClick}
      />
    );
  }

  render() {
    return (
      <PageWithSearchAndList
        hasResults={this.props.hasResults}
        isSearching={this.props.isSearching}
        title={this.props.title}
        hasPageLayout={this.props.hasPageLayout}
        hasPageHeader={this.props.hasPageHeader}
        listUrl={this.props.listUrl}
        extendSidebar
        renderFilters={this.renderFilters}
        renderSearchResults={this.renderSearchResults}
        zeroStateProps={this.props.zeroStateProps}
      />
    );
  }
}

InventoryPage.propTypes = {
  selectedOnCurrentPage: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  createdIds: PropTypes.instanceOf(Immutable.Map),
  search: PropTypes.instanceOf(Immutable.Map).isRequired,
  searchOptions: PropTypes.object.isRequired,
  zeroStateSearchOptions: PropTypes.object.isRequired,
  hasResults: PropTypes.bool.isRequired,
  shipments: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  canAddTestSamples: PropTypes.bool,
  isSearching: PropTypes.bool.isRequired,
  selected: PropTypes.array,
  actions: PropTypes.object.isRequired,
  zeroStateProps: PropTypes.object,
  listUrl: PropTypes.string,
  resultUrl: PropTypes.func.isRequired,
  title: PropTypes.string,
  searchZeroStateProps: PropTypes.object,
  hasPageLayout: PropTypes.bool,
  hasPageHeader: PropTypes.bool,
  showOrgFilter: PropTypes.bool.isRequired,
  searchPerPage: PropTypes.number,
  onSearchFailed: PropTypes.func,
  onOpenStructureSearchModal: PropTypes.func.isRequired,
  hasCollaboratorOrgs: PropTypes.bool.isRequired,
  canTransferContainer: PropTypes.bool.isRequired,
  visibleColumns: PropTypes.array.isRequired,
  allResultIds: PropTypes.func.isRequired,
  onTransferClick: PropTypes.func,
  setShippable: PropTypes.func.isRequired,
  isShippable: PropTypes.bool.isRequired,
  deleteContainersInStore: PropTypes.func.isRequired,
  onSortChange: PropTypes.func.isRequired,
  onSearchInputChange: PropTypes.func.isRequired,
  onSearchFilterChange: PropTypes.func.isRequired,
  onSearchPageChange: PropTypes.func.isRequired,
  onViewDetailsClicked: PropTypes.func.isRequired,
  page: PropTypes.func.isRequired,
  numPages: PropTypes.func.isRequired,
  pageSize: PropTypes.func.isRequired,
  bulkSelectionCount: PropTypes.number,
  isSelectionAcrossPagesActive: PropTypes.bool,
  onSelectionAcrossPagesChange: PropTypes.func,
  onBulkActionClick: PropTypes.func.isRequired
};

export default withPageWithSearchAndList(InventoryPage);
