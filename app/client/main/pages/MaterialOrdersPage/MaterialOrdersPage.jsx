import React from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import { OrdersSearchStore } from 'main/stores/search';
import Urls from 'main/util/urls';
import PageWithSearchAndList from 'main/components/PageWithSearchAndList/PageWithSearchAndList';
import withPageWithSearchAndList from 'main/components/PageWithSearchAndList/PageWithSearchAndListHOC';
import ModalActions from 'main/actions/ModalActions';
import MaterialOrderActions from 'main/actions/MaterialOrderActions';
import NotificationActions from 'main/actions/NotificationActions';
import MaterialOrderStore from 'main/stores/MaterialOrderStore';
import { MaterialOrdersPageActions } from './MaterialOrdersActions';
import { MaterialOrdersPageState, MaterialOrdersSearchDefaults } from './MaterialOrdersState';
import MaterialOrdersSearchResults from './MaterialOrdersSearchResults';
import MaterialOrdersSearchFilter from './MaterialOrdersSearchFilters';
import MaterialOrderStatusPicker from './MaterialOrderStatusPicker';
import MaterialOrderAssignOrderIdModal from './MaterialOrderAssignOrderIdModal';

export class MaterialOrdersPage extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this,
      'updateSelected',
      'load',
      'onStatusChange',
      'onAssignOrderId',
      'renderFilters',
      'renderSearchResults',
      'onSearchFilterReset',
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
    return 'Search by Name or Order ID';
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

  openStatusPicker() {
    ModalActions.open(MaterialOrderStatusPicker.MODAL_ID);
  }

  openAssignOrderIdModal() {
    ModalActions.open(MaterialOrderAssignOrderIdModal.MODAL_ID);
  }

  onAssignOrderId(orderId) {
    return MaterialOrderActions.updateMany(this.props.selected, { vendor_order_id: orderId })
      .done(() => {
        NotificationActions.createNotification({ text: 'Order ID updated!' });
        this.props.actions.refetch();
      });
  }

  onStatusChange(status) {
    const orderIds = this.props.selected;

    return MaterialOrderActions.updateMany(
      orderIds,
      { state: status }
    )
      .done(() => {
        NotificationActions.createNotification({ text: 'Status updated!' });
        this.props.actions.refetch();
      });
  }

  renderFilters() {
    return (
      <MaterialOrdersSearchFilter
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
    const data = this.props.search.get('results', []);

    return (
      <MaterialOrdersSearchResults
        data={data}
        isSearching={isSearching}
        load={() => this.props.actions.refetch()}
        searchOptions={searchOptions}
        selected={selected}
        page={this.page()}
        numPages={this.numPages()}
        pageSize={this.pageSize()}
        onSearchPageChange={this.props.onSearchPageChange}
        onSearchFilterChange={this.props.onSearchFilterChange}
        onSortChange={this.props.onSortChange}
        onSelectRow={this.updateSelected}
        history={this.props.history}
        onStatusClick={this.openStatusPicker}
        onRowClick={this.props.onViewDetailsClicked}
        onAssignOrderIdClick={this.openAssignOrderIdModal}
      />
    );
  }

  renderModals() {
    return [
      <MaterialOrderStatusPicker
        selected={this.props.selected}
        onSelected={this.onStatusChange}
        key="MaterialOrderStatusPicker"
      />,
      <MaterialOrderAssignOrderIdModal
        selected={this.props.selected}
        onAssignOrderId={this.onAssignOrderId}
        key="MaterialOrderAssignOrderIdModal"
      />
    ];
  }

  render() {
    return (
      <React.Fragment>
        <PageWithSearchAndList
          zeroStateProps={this.props.zeroStateProps}
          renderFilters={this.renderFilters}
          renderSearchResults={this.renderSearchResults}
          hasResults={this.props.hasResults}
          isSearching={this.props.isSearching}
          hasPageLayout={this.props.hasPageLayout}
        />
        {this.renderModals()}
      </React.Fragment>
    );
  }
}

export const props = () => {
  const {
    isSearching,
    selected
  } = MaterialOrdersPageState.get();

  let search = OrdersSearchStore.getLatestSearch() || Immutable.fromJS({ results: [] });
  const results = OrdersSearchStore.getResultsFromSearch(search);
  search = search.set('results', results);

  const searchOptions = new Immutable.Map(MaterialOrdersPageActions.searchOptions());
  const resultUrl = Urls.material_order;
  const allResults = MaterialOrderStore.getAll();
  const hasResults = allResults && allResults.size > 0;
  const hasPageLayout = false;
  const actions = MaterialOrdersPageActions;

  const zeroStateSearchOptions = _.merge({}, MaterialOrdersSearchDefaults, {});
  const zeroStateProps = {
    title: 'No orders were found.'
  };

  return {
    resultUrl,
    actions,
    search,
    searchOptions,
    hasResults,
    hasPageLayout,
    isSearching,
    selected,
    zeroStateSearchOptions,
    zeroStateProps
  };
};

MaterialOrdersPage.propTypes = {
  history: PropTypes.object.isRequired,
  search: PropTypes.instanceOf(Immutable.Map).isRequired,
  searchOptions: PropTypes.object.isRequired,
  zeroStateSearchOptions: PropTypes.object.isRequired,
  hasResults: PropTypes.bool.isRequired,
  isSearching: PropTypes.bool.isRequired,
  selected: PropTypes.array,
  actions: PropTypes.object.isRequired,
  zeroStateProps: PropTypes.object.isRequired,
  resultUrl: PropTypes.func.isRequired,
  hasPageLayout: PropTypes.bool,
  onSearchFailed: PropTypes.func.isRequired,
  onSortChange: PropTypes.func.isRequired,
  onSearchInputChange: PropTypes.func.isRequired,
  onSearchFilterChange: PropTypes.func.isRequired,
  onSearchPageChange: PropTypes.func.isRequired
};

const materialOrdersPageWithPageWithSearchAndList = withPageWithSearchAndList(MaterialOrdersPage);
export default ConnectToStores(materialOrdersPageWithPageWithSearchAndList, props);
