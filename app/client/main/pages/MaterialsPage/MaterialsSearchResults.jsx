import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import _ from 'lodash';
import moment from 'moment';
import { List, Column, Molecule, DateTime, Tooltip } from '@transcriptic/amino';

import Urls from 'main/util/urls';
import MaterialActions from 'main/actions/MaterialActions';
import { MaterialsPageActions } from 'main/pages/MaterialsPage/MaterialsActions';
import MaterialStore from 'main/stores/MaterialStore';
import SessionStore from 'main/stores/SessionStore';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import { PAGE_SIZE_OPTIONS } from 'main/util/List';

import './MaterialsSearchResults.scss';

class MaterialsSearchResults extends React.Component {
  constructor(props) {
    super(props);
    this.visibleColumns = ['structure', 'name', 'ID', 'type', 'vendor', 'supplier', 'times ever ordered', 'created', 'tier'];
    this.state = {
      visibleColumns: this.getVisibleColumns(),
      listId: this.getListId(),
      deletingMaterial: false,
      hasLabPermissions: AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES)
    };

    _.bindAll(
      this,
      'onChangeSelection',
      'renderStructure',
      'renderName',
      'renderId',
      'renderType',
      'renderVendor',
      'renderSupplier',
      'renderTotalOrdered',
      'renderCreatedAt',
      'renderOrganization',
      'renderResourceId',
      'renderTier'
    );
  }

  componentDidUpdate(prevProps) {
    const prevSearchOptions = prevProps.searchOptions;
    if (prevSearchOptions.get('searchType') !== this.props.searchOptions.get('searchType')) {
      this.updateColumnStates();
    }
  }

  getVisibleColumns() {
    let visibleColumns = this.visibleColumns;
    if (this.isIndividualColumns()) {
      visibleColumns = this.visibleColumns.filter(column => column !== 'type');
    }
    return visibleColumns;
  }

  getListId() {
    return this.isIndividualColumns() ? KeyRegistry.MATERIALS_TABLE_INDIVIDUAL : KeyRegistry.MATERIALS_TABLE;
  }

  updateColumnStates() {
    this.setState({ visibleColumns: this.getVisibleColumns(), listId: this.getListId() });
  }

  isIndividualColumns() {
    return (this.props.searchOptions.get('searchType') === 'individual');
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

  isConfirm(message) {
    return confirm(message);
  }

  renderName(material) {
    return <p>{material.get('name')}</p>;
  }

  renderId(material) {
    return <p className="tx-type--secondary">{material.get('id')}</p>;
  }

  renderType(material) {
    return <p className="tx-type--secondary">{_.startCase(material.get('material_type'))}</p>;
  }

  renderVendor(material) {
    return <p className="tx-type--secondary">{material.getIn(['vendor', 'name']) || '-'}</p>;
  }

  renderSupplier(material) {
    return <p className="tx-type--secondary">{material.getIn(['supplier', 'name']) || '-'}</p>;
  }

  renderTotalOrdered(material) {
    return <p className="tx-type--secondary">{(material.get('total_ordered') || '-').toString()}</p>;
  }

  renderCreatedAt(material) {
    const timestamp = material.get('created_at');
    return (
      <Tooltip
        invert
        title={moment(timestamp).format('ll')}
        placement="bottom"
      >
        <p className="tx-type--secondary">{<DateTime timestamp={timestamp} />}</p>
      </Tooltip>
    );
  }

  renderOrganization(material) {
    return <p className="tx-type--secondary">{material.getIn(['organization', 'name'])}</p>;
  }

  renderTier(material) {
    return <p className="tx-type--secondary">{material.getIn(['orderable_materials', 0, 'tier']) || '-'}</p>;
  }

  renderStructure(material) {
    const smiles = material.getIn(['material_components', 0, 'resource', 'compound', 'model', 'smiles'], '');
    return (
      <Tooltip
        title={smiles}
        placement="bottom"
      >
        <div className="material-results__molecule"><Molecule SMILES={smiles} size="tiny" /></div>
      </Tooltip>
    );
  }

  renderResourceId(material) {
    return <p className="tx-type--secondary">{material.getIn(['material_components', 0, 'resource', 'id'])}</p>;
  }

  render() {
    const {
      data,
      isSearching,
      searchOptions,
      page,
      pageSize,
      numPages,
      onRowClick,
      onSearchFilterChange,
      onSearchPageChange,
      onSortChange,
      onSelectRow
    } = this.props;

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

    const isOneRowSelected = () => {
      const selectedRows = Object.keys(this.getSelectedRows());
      const selectedMaterials = MaterialStore.getByIds(selectedRows);
      let belongsToUserOrg = true;
      selectedMaterials.forEach(material => {
        if (material.getIn(['organization', 'id']) !== SessionStore.getOrg().get('id')) {
          belongsToUserOrg = false;
        }
      });
      return (Object.keys(this.getSelectedRows()).length === 1) && belongsToUserOrg;
    };

    const isOrderAllowed = () => {
      const selectedRowData = [];
      this.props.selected.forEach((materialId) => {
        const material = this.props.data.find((row) => row.get('id') === materialId);
        if (material) {
          selectedRowData.push(material);
        }
      });
      if (selectedRowData.length > 0) {
        const types = selectedRowData.map((row) => row.get('material_type'));
        const isSameType = _.uniq(types).length === 1;
        return isSameType && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KIT_ORDERS);
      }
      return false;
    };

    const onClickEdit = () => {
      this.props.history.push(
        Urls.edit_material(Object.keys(this.getSelectedRows())[0])
      );
    };

    const onClickOrder = () => {
      const { selected } = this.props;
      const materials = Immutable.fromJS(MaterialStore.getByIds(selected)
        .map(material => {
          const orderableMaterials = material.get('orderable_materials')
            .map(orderableMaterial => orderableMaterial.set('count', 1));
          return material
            .set('orderable_materials', orderableMaterials)
            .set('material_id', material.get('id'))
            .set('id', orderableMaterials.getIn(['0', 'id']))
            .set('type', orderableMaterials.getIn(['0', 'type']));
        }));
      this.props.history.push({
        pathname: Urls.new_material_order(),
        state: {
          materialType: materials.get(0).get('material_type'),
          materials: materials
        }
      });
    };

    const getMaterialName = (materialId) => {
      const material = this.props.data.find((material) => material.get('id') === materialId);
      return material.get('name');
    };

    const getMaterialType = (materialId) => {
      const material = this.props.data.find((material) => material.get('id') === materialId);
      return material.get('material_type');
    };

    const onClickDelete = () => {
      const selectedMaterialId = Object.keys(this.getSelectedRows())[0];
      const materialName = getMaterialName(selectedMaterialId);
      const materialType = getMaterialType(selectedMaterialId);
      let message;

      MaterialActions.materialStats(selectedMaterialId).done((resp) => {
        if (!(resp.kit_orders_count > 0 || resp.containers_count > 0)) {
          message = `Are you sure you would like to delete material "${materialName}"?`;
          if (materialType === 'individual') {
            message = `Are you sure you would like to delete multiple price points associated to material "${materialName}"?`;
          }

          if (!this.isConfirm(message)) {
            return;
          }

          this.setState({ deletingMaterial: true }, () => {
            MaterialActions.destroyDependent(selectedMaterialId)
              .done(() => {
                this.props.onDeleteRow();
                MaterialsPageActions.refetch();
                this.setState({ deletingMaterial: false });
              })
              .fail(() => {
                this.setState({ deletingMaterial: false });
              });
          });
        } else {
          message = 'This material cannot be deleted as it is associated with either Material Orders or Containers';
          this.isConfirm(message);
        }
      });
    };

    const getColumns = (allColumns) => {
      let columnsToShow = allColumns;

      if (searchOptions.get('searchType') !== 'individual') {
        columnsToShow = columnsToShow.filter(column => column.props.id !== 'smiles' && column.props.id !== 'resource_id');
      }

      if (this.state.hasLabPermissions) {
        return columnsToShow;
      } else {
        return columnsToShow.filter(column => column.props.id !== 'total_ordered');
      }
    };

    const defaultActions = () => {
      if (AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES)) {
        return [{
          title: 'New',
          to: Urls.new_material()
        }];
      }
    };

    const listActions = () => {
      if (AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES)) {
        return [{
          title: 'Edit',
          action: onClickEdit,
          disabled: !isOneRowSelected()
        }, {
          title: 'Delete',
          action: onClickDelete,
          disabled: !isOneRowSelected()
        },
        {
          title: 'Order',
          action: onClickOrder,
          disabled: !isOrderAllowed()
        }];
      }
    };

    const columns = [
      <Column
        renderCellContent={this.renderStructure}
        header="structure"
        id="smiles"
        key="column-smiles"
      />,
      <Column
        relativeWidth={1.3}
        renderCellContent={this.renderName}
        sortable
        onSortChange={onSortChange}
        header="name"
        id="name"
        key="column-name"
        popOver
      />,
      <Column
        relativeWidth={1.3}
        renderCellContent={this.renderId}
        header="ID"
        id="id"
        key="column-id"
        disableFormatHeader
        popOver
      />,
      <Column
        renderCellContent={this.renderResourceId}
        header="resource id"
        id="resource_id"
        key="column-resource_id"
        popOver
      />,
      <Column
        renderCellContent={this.renderType}
        sortable
        onSortChange={onSortChange}
        header="type"
        id="material_type"
        key="column-material_type"
        popOver
      />,
      <Column
        renderCellContent={this.renderVendor}
        sortable
        onSortChange={onSortChange}
        header="vendor"
        id="vendor.name"
        key="column-vendor"
        popOver
      />,
      <Column
        renderCellContent={this.renderSupplier}
        sortable
        onSortChange={onSortChange}
        header="supplier"
        id="supplier.name"
        key="column-supplier"
        popOver
      />,
      <Column
        renderCellContent={this.renderTotalOrdered}
        header="times ever ordered"
        id="total_ordered"
        key="column-total_ordered"
        popOver
      />,
      <Column
        renderCellContent={this.renderCreatedAt}
        sortable
        onSortChange={onSortChange}
        header="created"
        id="created_at"
        key="column-created_at"
      />,
      <Column
        renderCellContent={this.renderOrganization}
        sortable
        onSortChange={onSortChange}
        header="organization"
        id="organization"
        key="column-organization"
        popOver
      />,
      <Column
        renderCellContent={this.renderTier}
        header="tier"
        id="tier"
        key="column-tier"
        popOver
      />
    ];

    return (
      <div className="material-results">
        <List
          id={this.state.listId}
          loaded={!isSearching && !this.state.deletingMaterial}
          data={Immutable.Iterable(data)}
          showPagination
          showColumnFilter
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          pageSize={pageSize}
          maxPage={numPages}
          currentPage={page}
          visibleColumns={this.state.visibleColumns}
          selected={this.getSelectedRows()}
          onRowClick={onRowClick}
          onPageChange={onPageChange}
          onSelectRow={(_records, _willBeChecked, selectedRows) => onSelectRow(selectedRows)}
          onSelectAll={(selectedRows) => onSelectRow(selectedRows)}
          onChangeSelection={this.onChangeSelection}
          showActions
          defaultActions={defaultActions()}
          actions={listActions()}
          popoverOnHeader
          persistKeyInfo={UserPreference.packInfo(this.state.listId)}
        >
          {getColumns(columns)}
        </List>
      </div>
    );
  }
}

MaterialsSearchResults.propTypes = {
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
  onDeleteRow: PropTypes.func,
  history: PropTypes.object
};

export default MaterialsSearchResults;
