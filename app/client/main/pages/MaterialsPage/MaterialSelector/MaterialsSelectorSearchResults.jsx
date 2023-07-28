import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { List, Column } from '@transcriptic/amino';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';

class MaterialsSelectorSearchResults extends React.Component {
  constructor(props) {
    super(props);

    this.individualColumns = ['name', 'vendor', 'cost', 'amount', 'tier'];
    this.groupColumns = ['name', 'vendor', 'category', 'cost', 'tier'];
    this.state = {
      visibleColumns: props.isIndividual ? this.individualColumns : this.groupColumns,
      persistenceKey: props.isIndividual ?
        KeyRegistry.MATERIAL_INDIVIDUAL_SELECTOR_TABLE
        :
        KeyRegistry.MATERIAL_GROUP_SELECTOR_TABLE,
      deletingKit: false
    };

    _.bindAll(
      this,
      'onChangeSelection',
      'renderName',
      'renderVendor',
      'renderCategory',
      'renderCost',
      'renderAmount',
      'renderTier'
    );
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

  renderName(material) {
    return <p>{material.get('name')}</p>;
  }

  renderVendor(material) {
    return <p className="tx-type--secondary">{material.getIn(['vendor', 'name']) || '-'}</p>;
  }

  renderCategory(material) {
    const category = material.getIn(['categories', '0', 'path'], ['-']).join();
    return <p className="tx-type--secondary">{category}</p>;
  }

  renderCost(material) {
    const cost = _.toNumber(material.getIn(['orderable_materials', '0', 'price']) || '-');
    return <p className="tx-type--secondary">{!isNaN(cost) ? `$${cost.toFixed(2)}` : '-'}</p>;
  }

  renderAmount(material) {
    const volume = _.toNumber(material.getIn(['orderable_materials', '0', 'orderable_material_components', '0', 'volume_per_container'], 0));
    const mass = _.toNumber(material.getIn(['orderable_materials', '0', 'orderable_material_components', '0', 'mass_per_container'], 0));
    let amount = `${volume.toFixed(2)} μL`;
    if (volume === 0 && mass > 0) {
      amount = `${mass.toFixed(2)} mg`;
    }
    return <p className="tx-type--secondary">{amount}</p>;
  }

  renderTier(material) {
    return <p className="tx-type--secondary">{(material.getIn(['orderable_materials', 0, 'tier']) || '-')}</p>;
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
      disableCard,
      isIndividual
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

    const columns = isIndividual ? [
      <Column
        relativeWidth={1.3}
        renderCellContent={this.renderName}
        sortable
        onSortChange={onSortChange}
        header="name"
        id="name"
        key="column-name"
      />,
      <Column
        renderCellContent={this.renderVendor}
        sortable
        onSortChange={onSortChange}
        header="vendor"
        id="vendor_name"
        key="column-vendor_name"
      />,
      <Column
        renderCellContent={this.renderCost}
        sortable
        onSortChange={onSortChange}
        header="cost"
        id="cost"
        key="column-cost"
      />,
      <Column
        renderCellContent={this.renderAmount}
        header="amount"
        id="amount"
        key="column-amount"
      />,
      <Column
        renderCellContent={this.renderTier}
        header="tier"
        id="tier"
        key="column-tier"
      />
    ] : [
      <Column
        relativeWidth={1.3}
        renderCellContent={this.renderName}
        sortable
        onSortChange={onSortChange}
        header="name"
        id="name"
        key="column-name"
      />,
      <Column
        renderCellContent={this.renderVendor}
        sortable
        onSortChange={onSortChange}
        header="vendor"
        id="vendor_name"
        key="column-vendor_name"
      />,
      <Column
        renderCellContent={this.renderCategory}
        sortable
        onSortChange={onSortChange}
        header="category"
        id="categories"
        key="column-categories"
      />,
      <Column
        renderCellContent={this.renderCost}
        sortable
        onSortChange={onSortChange}
        header="cost"
        id="cost"
        key="column-cost"
      />,
      <Column
        renderCellContent={this.renderTier}
        header="tier"
        id="tier"
        key="column-tier"
      />
    ];

    return (
      <List
        id={this.state.persistenceKey}
        loaded={!isSearching}
        data={Immutable.Iterable(data)}
        tallRows
        disableCard={disableCard}
        showPagination
        showColumnFilter
        pageSizeOptions={[6, 12, 24, 48]}
        pageSize={pageSize}
        maxPage={numPages}
        currentPage={page}
        visibleColumns={this.state.visibleColumns}
        persistKeyInfo={UserPreference.packInfo(this.state.persistenceKey)}
        selected={this.getSelectedRows()}
        onPageChange={onPageChange}
        onSelectRow={(_records, _willBeChecked, selectedRows) => onSelectRow(selectedRows)}
        onSelectAll={(selectedRows) => onSelectRow(selectedRows)}
        onChangeSelection={this.onChangeSelection}
      >
        {columns}
      </List>
    );
  }
}

MaterialsSelectorSearchResults.propTypes = {
  data: PropTypes.instanceOf(Immutable.Iterable),
  isSearching: PropTypes.bool,
  searchOptions: PropTypes.shape({}),
  selected: PropTypes.arrayOf(PropTypes.string),
  page: PropTypes.number,
  numPages: PropTypes.number,
  pageSize: PropTypes.number,
  onSearchPageChange: PropTypes.func,
  onSearchFilterChange: PropTypes.func,
  onSortChange: PropTypes.func,
  onSelectRow: PropTypes.func,
  disableCard: PropTypes.bool,
  isIndividual: PropTypes.bool
};

export default MaterialsSelectorSearchResults;
