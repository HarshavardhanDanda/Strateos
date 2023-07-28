import Classnames                          from 'classnames';
import Immutable                           from 'immutable';
import _                                   from 'lodash';
import Urls                                from 'main/util/urls';
import PropTypes                           from 'prop-types';
import React, { PureComponent, Component } from 'react';

import {
  Column,
  List,
  DateTime
} from '@transcriptic/amino';
import ProvisionSpecActions    from 'main/actions/ProvisionSpecActions';
import ConnectToStores         from 'main/containers/ConnectToStoresHOC';
import ProvisionSpecStore      from 'main/stores/ProvisionSpecStore';
import { getMeasurementUnitFromMode, appendDefaultShortUnits } from 'main/util/MeasurementUtil';
import { LocationName } from 'main/inventory/ContainerProperties';

class PagedStockView extends Component {
  constructor() {
    super();

    this.state = {
      searchPage: 1,
      perPage: 12,
      orderBy: 'created_at',
      orderDesc: false,
      forceSearchSpinner: true
    };
  }

  componentWillMount() {
    this.loadStock();
    ProvisionSpecActions.loadAllForResource(
      this.props.searchParams.resource_id
    )
      .done(() => {
        this.setState({ forceSearchSpinner: false });
      });
  }

  componentDidUpdate(prevProps) {
    if ((this.props.refresh !== prevProps.refresh) && this.props.refresh) {
      this.loadStock();
      ProvisionSpecActions.loadAllForResource(
        prevProps.searchParams.resource_id
      )
        .done(() => {
          this.setState({ forceSearchSpinner: false });
        });
      this.props.onRefresh();
    }
  }

  getSearch() {
    return this.props.searchStore.getSearch(
      this.props.searchStoreQuery,
      this.state.searchPage
    );
  }

  loadStock(options) {
    const defaults = {
      page: this.state.searchPage,
      per_page: this.state.perPage,
      order_by: this.state.orderBy,
      order_desc: this.state.orderDesc,
      min_quantity: undefined,
      measurement_unit: getMeasurementUnitFromMode(this.props.measurementMode)
    };

    return this.props.loadStockAction(
      this.props.searchParams,
      { ...defaults, ...options }
    );
  }

  reloadStock() {
    this.queryStock(
      this.state.searchPage,
      this.state.orderBy,
      this.state.orderDesc
    );
  }

  queryStock(searchPage, pageSize, orderBy, sortDirection) {
    const orderDesc = sortDirection !== 'asc';
    this.setState({ forceSearchSpinner: true }, () => {
      const options = {
        page: searchPage,
        per_page: pageSize,
        order_by: orderBy,
        order_desc: orderDesc
      };

      this.loadStock(options)
        .always(() => this.setState({ forceSearchSpinner: false, perPage: pageSize }))
        .done(() => this.setState({ forceSearchSpinner: false, searchPage, orderBy, orderDesc }));
    });
  }

  render() {
    return (
      <PagedStockTable
        search={this.getSearch()}
        provisionSpecs={this.props.provisionSpecs}
        selectedContainerIds={this.props.selectedContainerIds}
        forceSpinner={this.state.forceSearchSpinner}
        orderBy={this.state.orderBy}
        orderDesc={this.state.orderDesc}
        perPage={this.state.perPage}
        onSearchPageChange={(page, pageSize) => this.queryStock(page, pageSize, this.state.orderBy, this.state.orderDesc)}
        onSearchReordered={(orderBy, orderDesc) => this.queryStock(this.state.searchPage, this.state.perPage, orderBy, orderDesc)}
        onChangeSelectedContainers={this.props.onChangeSelectedContainers}
        highlightedContainerIds={this.props.highlightedContainerIds}
        selectable={this.props.selectable}
        measurementMode={this.props.measurementMode}
        actions={this.props.actions}
      />
    );
  }
}

PagedStockView.propTypes = {
  selectedContainerIds: PropTypes.instanceOf(Immutable.Set),
  highlightedContainerIds: PropTypes.instanceOf(Immutable.Set),
  perPage: PropTypes.number.isRequired,
  loadStockAction: PropTypes.func.isRequired,
  searchStore: PropTypes.object.isRequired,
  searchStoreQuery: PropTypes.string.isRequired,
  actions: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    action: PropTypes.func.isRequired,
    disabled: PropTypes.bool
  })).isRequired,
  onChangeSelectedContainers: PropTypes.func,
  selectable: PropTypes.bool,
  searchParams: PropTypes.shape({
    resource_id: PropTypes.string,
    instruction_id: PropTypes.string
  }),
  provisionSpecs: PropTypes.instanceOf(Immutable.Iterable),
  measurementMode: PropTypes.oneOf(['mass', 'volume'])
};

PagedStockView.defaultProps = {
  selectedContainerIds: Immutable.Set(),
  selectable: true
};

class PagedStockTable extends PureComponent {
  page() {
    return this.props.search.get('page', 1);
  }

  numPages() {
    return this.props.search.get('num_pages', 1);
  }

  containers() {
    return this.props.search.get('results');
  }

  containerIds() {
    const { search } = this.props;
    const results = search ? search.get('results') : Immutable.List();

    return results.map(c => c.get('id'));
  }

  allContainersSelected() {
    return this.containerIds().toSet().equals(this.props.selectedContainerIds);
  }

  reservedQuantities() {
    const { measurementMode } = this.props;
    let containerIdToReservedQuantity = Immutable.Map();
    const provisionSpecsTransfers = this.props.provisionSpecs
      .map(spec => spec.get('transfers'))
      .flatten(1);

    if (provisionSpecsTransfers.count() > 0) {
      const groupedTransfers = provisionSpecsTransfers.groupBy(transfer =>
        transfer.get('from')
      );

      groupedTransfers.entrySeq().forEach(([containerId, transfers]) => {
        const reservedQuantity = transfers.reduce(
          (total, transfer) => total + Number(transfer.get(measurementMode) || 0),
          0
        );
        containerIdToReservedQuantity = containerIdToReservedQuantity.set(
          containerId,
          reservedQuantity
        );
      });
    }

    return containerIdToReservedQuantity;
  }

  onSelectRows = (selectedRows) => {
    this.props.onChangeSelectedContainers(selectedRows);
  };

  onSortChange = (id, sortDirection) => this.props.onSearchReordered(id, sortDirection);

  renderID = (record) => {
    const { highlightedContainerIds } = this.props;
    const highlighted = ((highlightedContainerIds && highlightedContainerIds.includes) ?
      highlightedContainerIds.includes(record.get('id')) : undefined);
    const id = record.get('id');
    return (
      <a
        className={Classnames({
          highlight: highlighted,
          yellow: highlighted
        })}
        href={Urls.container(id)}
      >
        {id}
      </a>
    );
  };

  renderAvailable = (record) => {
    const { measurementMode } = this.props;
    const quantity = _.toNumber(record.getIn(['aliquots', 0, getMeasurementUnitFromMode(measurementMode)])).toFixed(2);
    const reservedQuantity = this.reservedQuantities().get(record.get('id'), 0);
    return appendDefaultShortUnits(quantity - reservedQuantity, measurementMode);
  };

  renderReserved = (record) => {
    const { measurementMode } = this.props;
    const reservedQuantity = this.reservedQuantities().get(record.get('id'), 0);
    return appendDefaultShortUnits(reservedQuantity, measurementMode);
  };

  renderCreated = (record) => {
    return (
      <DateTime
        timestamp={record.getIn(['aliquots', 0, 'created_at'])}
      />
    );
  };

  renderExpired = (record) => {
    const expiresAt = record.get('expires_at');
    return (
      <Choose>
        <When condition={expiresAt != undefined}>
          <DateTime timestamp={expiresAt} isExpiryDate />
        </When>
        <Otherwise>
          -
        </Otherwise>
      </Choose>
    );
  };

  renderLocation = (record) => {
    const location = record.get('location');
    return (
      <Choose>
        <When condition={location != undefined}>
          {LocationName(record)}
        </When>
        <Otherwise>
          -
        </Otherwise>
      </Choose>
    );
  };

  render() {
    const containers = this.props.search.get('results');
    return (
      <div>
        <List
          loaded={!this.props.forceSpinner}
          data={containers}
          id="stock-containers-table"
          emptyMessage="No stock containers"
          disabledSelection={!this.props.selectable}
          showPagination
          maxPage={this.numPages()}
          onPageChange={this.props.onSearchPageChange}
          currentPage={this.page()}
          pageSize={this.props.perPage}
          pageSizeOptions={[12, 24, 36, 48]}
          disableBorder
          onSelectRow={(_record, _willBeChecked, selectedRows) => this.onSelectRows(selectedRows)}
          onSelectAll={(selectedRows) => this.onSelectRows(selectedRows)}
          selected={this.props.selectedContainerIds.toJS()}
          showActions
          actions={this.props.actions}
        >
          <Column
            renderCellContent={this.renderID}
            id="id"
            header="ID"
            disableFormatHeader
          />
          <Column
            renderCellContent={(record) => record.get('barcode', '-')}
            id="barcode"
            header="Barcode"
            sortable
            onSortChange={this.onSortChange}
          />
          <Column
            renderCellContent={(record) => record.get('container_type_id', '-')}
            id="container_type_id"
            header="Container Type"
            sortable
            onSortChange={this.onSortChange}
          />
          <Column
            renderCellContent={(record) => record.get('label', '-')}
            id="label"
            header="Label"
            sortable
            onSortChange={this.onSortChange}
          />
          <Column
            renderCellContent={this.renderAvailable}
            id="volume_ul"
            header="Available"
            sortable
            onSortChange={this.onSortChange}
          />
          <Column
            renderCellContent={this.renderReserved}
            id="reserved"
            header="Reserved"
          />
          <Column
            renderCellContent={this.renderCreated}
            id="created_at"
            header="Created"
            sortable
            onSortChange={this.onSortChange}
          />
          <Column
            renderCellContent={this.renderExpired}
            id="expires_at"
            header="Expiration"
            sortable
            onSortChange={this.onSortChange}
          />
          <Column
            renderCellContent={this.renderLocation}
            id="location_id"
            header="Location"
            sortable
            onSortChange={this.onSortChange}
          />
        </List>
      </div>
    );
  }
}

PagedStockTable.propTypes = {
  search: PropTypes.instanceOf(Immutable.Map).isRequired,
  provisionSpecs: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  selectedContainerIds: PropTypes.instanceOf(Immutable.Set),
  highlightedContainerIds: PropTypes.instanceOf(Immutable.Set),
  forceSpinner: PropTypes.bool,
  orderBy: PropTypes.string.isRequired,
  orderDesc: PropTypes.bool.isRequired,
  onSearchPageChange: PropTypes.func.isRequired,
  onSearchReordered: PropTypes.func.isRequired,
  onChangeSelectedContainers: PropTypes.func,
  selectable: PropTypes.bool,
  measurementMode: PropTypes.oneOf(['mass', 'volume'])
};

const getStateFromStores = (props) => {
  const resourceId = props.searchParams.resource_id;
  const instId = props.searchParams.instruction_id;

  const provisionSpecs = ProvisionSpecStore.findByResource(resourceId)
    .filter(ps => ps.get('instruction_id') !== instId);

  return { provisionSpecs };
};

const ConnectedPagedStockView = ConnectToStores(PagedStockView, getStateFromStores);

ConnectedPagedStockView.propTypes = {
  provisionSpecs: PropTypes.instanceOf(Immutable.Iterable)
};

export default ConnectedPagedStockView;
export { PagedStockView };
