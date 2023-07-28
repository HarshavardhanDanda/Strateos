import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { List, Column, Molecule, DateTime } from '@transcriptic/amino';

import Urls from 'main/util/urls';
import UserProfile from 'main/components/UserProfile';
import KitOrderActions from 'main/actions/KitOrderActions';
import NotificationActions from 'main/actions/NotificationActions';
import CSVUtil from 'main/util/CSVUtil';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import MaterialOrderStatus from 'main/util/MaterialOrderStatus';
import { PAGE_SIZE_OPTIONS } from 'main/util/List';

import './MaterialOrdersSearchResults.scss';

class MaterialOrdersSearchResults extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visibleColumns: ['structure', 'Order ID', 'type', 'name', 'tracking code', 'vendor', 'supplier', 'lab',
        'date ordered', 'status', 'ordered by'],
    };

    _.bindAll(
      this,
      'onChangeSelection',
      'renderName',
      'renderVendorOrderId',
      'renderTrackingCode',
      'renderVendor',
      'renderSupplier',
      'renderLabName',
      'renderDateOrdered',
      'renderStatus',
      'renderType',
      'renderOrderedBy'
    );

    this.debounceFetch = this.debounceFetch.bind(this);
  }

  debounceFetch(delay = 650) {
    return _.debounce(this.props.load, delay);
  }

  onChangeSelection(selectedColumns) {
    this.setState({ visibleColumns: selectedColumns });
  }

  getSelectedRows() {
    const selectionMap = {};
    this.props.selected.forEach(element => {
      selectionMap[element] = true;
    });
    return selectionMap;
  }

  getSelectedRowsData() {
    const selectedRowsData = [];
    const { data } = this.props;
    this.props.selected.forEach(kitOrderId => {
      data.forEach((row) => {
        if (row.get('id') === kitOrderId) {
          selectedRowsData.push(row);
        }
      });
    });
    return selectedRowsData;
  }

  isConfirm(message) {
    return confirm(message);
  }

  renderStructure(order) {
    return <div className="material-results__molecule"><Molecule SMILES={order.getIn(['orderable_material', 'material', 'material_components', 0, 'resource', 'compound', 'smiles'])} size="tiny" /></div>;
  }

  renderType(order) {
    return <p>{_.startCase(order.getIn(['orderable_material', 'material', 'material_type'])) || '-' }</p>;
  }

  renderSku(order) {
    return <p>{order.getIn(['orderable_material', 'sku']) || '-'}</p>;
  }

  renderName(order) {
    return <p>{order.getIn(['orderable_material', 'material', 'name'], '-')}</p>;
  }

  renderVendorOrderId(order) {
    return <p>{order.get('vendor_order_id') || '-'}</p>;
  }

  renderTrackingCode(order) {
    return <p>{order.get('tracking_code') || '-'}</p>;
  }

  renderVendor(order) {
    return <p>{order.getIn(['orderable_material', 'material', 'vendor', 'name'], '-')}</p>;
  }

  renderSupplier(order) {
    return <p>{order.getIn(['orderable_material', 'material', 'supplier', 'name'], '-')}</p>;
  }

  renderLabName(order) {
    return <p>{order.getIn(['lab', 'name'], '-')}</p>;
  }

  renderDateOrdered(order) {
    return <p><DateTime timestamp={(order.get('created_at'))} /></p>;
  }

  renderStatus(order) {
    const status = order.get('state', '-').toLowerCase();
    switch (status) {
      case 'checkedin':
        return <p>Checked-in</p>; // special treatment for display purpose
      default:
        return <p>{_.startCase(status)}</p>;
    }
  }

  renderOrderedBy(order) {
    const user = order.get('user');
    return user ? <UserProfile user={user} /> : '-';
  }

  render() {
    const {
      data,
      isSearching,
      searchOptions,
      page,
      pageSize,
      numPages,
      onSearchFilterChange,
      onSearchPageChange,
      onSortChange,
      onSelectRow,
      onRowClick
    } = this.props;
    const selectedRowsData = this.getSelectedRowsData();
    const onPageChange = (requestedPage, requestedPageSize) => {
      const onSelectOption = field => value =>
        onSearchFilterChange(searchOptions.set(field, value));

      if (requestedPage !== page) {
        onSearchPageChange(requestedPage);
      }
      if (requestedPageSize !== pageSize) {
        onSelectOption('searchPerPage')(requestedPageSize);
      }
    };

    const isUniqueAttribute = path => {
      if (selectedRowsData) {
        const uniqueAttributes = new Set();
        selectedRowsData.forEach(row => uniqueAttributes.add(row.getIn(path)));
        return uniqueAttributes.size === 1;
      }
      return false;
    };
    const isUniqueTypeSelected = isUniqueAttribute(['orderable_material', 'material', 'material_type']);
    const isUniqueVendorSelected = isUniqueAttribute(['orderable_material', 'material', 'vendor', 'id']);

    const onClickCheckin = () => {
      this.props.history.push({ pathname: Urls.material_orders_checkin_page(), data: getOrders() });
    };

    const onClickCheckinCSV = () => {
      this.props.history.push({ pathname: Urls.material_orders_checkin_csv_page(), data: getOrders() });
    };

    const getOrders = () => selectedRowsData.map(row => {
      return Immutable.fromJS({
        order: row,
        orderableMaterialId: row.getIn(['orderable_material', 'id'])
      });
    });

    const isAllowDelete = () => !!(selectedRowsData.length > 0 && selectedRowsData.every(row => row.get('state') === 'PENDING'));
    const isAllowExport = () => isUniqueTypeSelected && isUniqueVendorSelected;
    const isAllowCheckin = () => isUniqueTypeSelected;
    const isAllowEdit = () => {
      const { selected, data } = this.props;
      if (selected && selected.length === 1) {
        const selectedItems = data.filter(row => selected.includes(row.get('id')));
        if (selectedItems === null || selectedItems.get(0) === null || selectedItems.get(0) === undefined) {
          return false;
        }
        return !selectedItems.get(0).get('checked_in_at');
      }
      return false;
    };

    const hasCheckedInData = () => {
      if (selectedRowsData.length > 0) {
        return selectedRowsData.some(row => row.get('state') === MaterialOrderStatus.CHECKEDIN);
      }
      return false;
    };

    const isIndividualMaterialType = type => type === 'individual';

    const onClickExport = () => {
      const exportData = [];
      this.props.selected.forEach(kitOrderId => {
        const selectedRowData = data.find(row => row.get('id') === kitOrderId);

        exportData.push({
          Quantity: selectedRowData.getIn(['count']) || '',
          ...(isIndividualMaterialType(selectedRowData.getIn(['orderable_material', 'material', 'material_type']))
            && { Smiles: selectedRowData.getIn(['orderable_material', 'material', 'material_components', 0, 'resource', 'compound', 'smiles'])  || '' }),
          OrderId: selectedRowData.get('vendor_order_id') || '',
          Type: selectedRowData.getIn(['orderable_material', 'material', 'material_type']) || '',
          Name: selectedRowData.getIn(['orderable_material', 'material', 'name']) || '',
          TrackingCode: selectedRowData.get('tracking_code') || '',
          Vendor: selectedRowData.getIn(['orderable_material', 'material', 'vendor', 'name']) || '',
          Supplier: selectedRowData.getIn(['orderable_material', 'material', 'supplier', 'name']) || '',
          Lab: selectedRowData.getIn(['lab', 'name']) || '',
          DateOrdered: selectedRowData.get('created_at') || '',
          Status: selectedRowData.get('state') || '',
          OrderedBy: selectedRowData.getIn(['user', 'name']) || '',
          Sku: selectedRowData.getIn(['orderable_material', 'sku']) || ''
        });
      });
      return CSVUtil.downloadCSVFromJSON(exportData, 'materials_order');
    };

    const onClickEdit = () => this.props.history.push(
      Urls.edit_material_order(Object.keys(this.getSelectedRows())[0])
    );

    const getOrderName = orderId => {
      const order = this.props.data.find(order => order.get('id') === orderId);
      return order.getIn(['orderable_material', 'material', 'name']);
    };

    const getEditTooltip = () => {
      const { selected, data } = this.props;
      if (selected.length === 1) {
        const selectedItems = data.filter(row => selected.includes(row.get('id')));
        if (selectedItems === null || selectedItems.get(0) === null || selectedItems.get(0) === undefined) {
          return undefined;
        }
        return selectedItems.get(0).get('checked_in_at') && 'Cannot edit an order that has been checked in';
      } else if (selected.length > 1) {
        return 'Only one order can be edited at a time';
      }
    };

    const getExportTooltip = () => {
      if (this.props.selected.length > 1) {
        if (!isUniqueTypeSelected) {
          return 'Individual and Group Orders must be exported separately';
        } else if (!isUniqueVendorSelected) {
          return 'Vendor must be unique';
        }
      }
    };

    const onClickDelete = () => {
      const { selected } = this.props;
      let message = '';
      if (selected.length === 1) {
        const selectedOrderId = Object.keys(this.getSelectedRows())[0];
        const orderName = getOrderName(selectedOrderId);
        message = `Are you sure you would like to delete order "${orderName}"?`;
      } else {
        message = `Are you sure you would like to delete ${selected.length} orders?`;
      }

      if (!this.isConfirm(message)) {
        return;
      }

      KitOrderActions.destroyMany(selected).done(() => {
        NotificationActions.createNotification({
          text: `Order${selected.length > 1 ? 's' : ''} Deleted`,
          isSuccess: true
        });
        // give more breathing room to back end to complete its work if records > 50
        const waitTime = (selected.length > 50) ? 1500 : 800;
        this.debounceFetch(waitTime)();
      });
    };

    const listActions = () => {
      return [{
        title: 'Edit',
        action: onClickEdit,
        disabled: !isAllowEdit(),
        label: getEditTooltip()
      },
      {
        title: 'Delete',
        action: onClickDelete,
        disabled: !isAllowDelete(),
        label: !!(this.props.selected.length > 0) && !isAllowDelete() ? 'Only Orders in Pending status can be deleted' : ''
      },
      {
        title: 'Checkin',
        nestedActions: [
          {
            title: 'Checkin',
            action: onClickCheckin,
            disabled: !isAllowCheckin() || hasCheckedInData(),
            label: (this.props.selected.length > 0 && !isAllowCheckin()) ? 'Individual and Group Orders must be checked in separately' :
              (hasCheckedInData()) ? 'One or more selected orders has already been checked in' : null
          },
          {
            title: 'Check in via CSV import',
            action: onClickCheckinCSV,
            disabled: false,
            enableWithoutSelection: true
          }
        ],
      },
      {
        title: 'Export',
        action: onClickExport,
        disabled: !isAllowExport(),
        label: getExportTooltip()
      },
      {
        title: 'Status',
        action: this.props.onStatusClick
      },
      {
        title: 'Assign Order ID',
        type: 'primary',
        action: this.props.onAssignOrderIdClick
      }];
    };

    const getColumns = (allColumns) => {
      let columnsToShow = allColumns;

      if (searchOptions.get('searchType') !== 'individual') {
        columnsToShow = columnsToShow.filter(column => column.props.id !== 'smiles');
      }

      return columnsToShow;
    };

    const columns = [
      <Column
        relativeWidth={1.3}
        renderCellContent={this.renderStructure}
        header="structure"
        id="smiles"
        key="smiles"
      />,
      <Column
        relativeWidth={1.3}
        renderCellContent={this.renderName}
        sortable
        onSortChange={onSortChange}
        header="name"
        id="name"
        key="name"
      />,
      <Column
        relativeWidth={1.3}
        renderCellContent={this.renderType}
        sortable
        onSortChange={onSortChange}
        header="type"
        id="material_type"
        key="material_type"
      />,
      <Column
        relativeWidth={1.3}
        renderCellContent={this.renderSku}
        sortable
        onSortChange={onSortChange}
        header="sku"
        id="sku"
        key="sku"
      />,
      <Column
        relativeWidth={1.3}
        renderCellContent={this.renderVendorOrderId}
        sortable
        onSortChange={onSortChange}
        header="Order ID"
        id="vendor_order_id"
        key="vendor_order_id"
        disableFormatHeader
      />,
      <Column
        relativeWidth={1.3}
        renderCellContent={this.renderTrackingCode}
        sortable
        onSortChange={onSortChange}
        header="tracking code"
        id="tracking_code"
        key="tracking_code"
      />,
      <Column
        renderCellContent={this.renderVendor}
        sortable
        onSortChange={onSortChange}
        header="vendor"
        id="vendor_name"
        key="vendor_name"
      />,
      <Column
        renderCellContent={this.renderSupplier}
        sortable
        onSortChange={onSortChange}
        header="supplier"
        id="supplier_name"
        key="supplier_name"
      />,
      <Column
        renderCellContent={this.renderLabName}
        sortable
        onSortChange={onSortChange}
        header="lab"
        id="location"
        key="location"
      />,
      <Column
        relativeWidth={1.3}
        renderCellContent={this.renderDateOrdered}
        sortable
        onSortChange={onSortChange}
        header="date ordered"
        id="created_at"
        key="created_at"
      />,
      <Column
        renderCellContent={this.renderStatus}
        sortable
        onSortChange={onSortChange}
        header="status"
        id="state"
        key="state"
      />,
      <Column
        renderCellContent={this.renderOrderedBy}
        sortable
        onSortChange={onSortChange}
        header="ordered by"
        id="user_name"
        key="user_name"
      />
    ];
    return (
      <List
        id={KeyRegistry.MATERIAL_ORDERS_TABLE}
        loaded={!isSearching}
        data={Immutable.Iterable(data)}
        showPagination
        showColumnFilter
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        pageSize={pageSize}
        maxPage={numPages}
        currentPage={page}
        visibleColumns={this.state.visibleColumns}
        selected={this.getSelectedRows()}
        onPageChange={onPageChange}
        onSelectRow={(_records, _willBeChecked, selectedRows) => onSelectRow(selectedRows)}
        onSelectAll={(selectedRows) => onSelectRow(selectedRows)}
        onChangeSelection={this.onChangeSelection}
        showActions
        actions={listActions()}
        onRowClick={onRowClick}
        persistKeyInfo={UserPreference.packInfo(KeyRegistry.MATERIAL_ORDERS_TABLE)}
      >
        {getColumns(columns)}
      </List>
    );
  }
}

MaterialOrdersSearchResults.propTypes = {
  data: PropTypes.instanceOf(Immutable.Iterable),
  isSearching: PropTypes.bool,
  searchOptions: PropTypes.shape({}),
  selected: PropTypes.arrayOf(PropTypes.string),
  page: PropTypes.number,
  numPages: PropTypes.number,
  pageSize: PropTypes.number,
  onRowClick: PropTypes.func,
  onSearchPageChange: PropTypes.func,
  onSearchFilterChange: PropTypes.func,
  onSortChange: PropTypes.func,
  onSelectRow: PropTypes.func,
  history: PropTypes.object.isRequired,
  onAssignOrderIdClick: PropTypes.func
};

export default MaterialOrdersSearchResults;
