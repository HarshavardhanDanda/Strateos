import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import _ from 'lodash';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import { List, Column, Molecule } from '@transcriptic/amino';

class VendorCatalogSearchResults extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visibleColumns: ['structure', 'supplier', 'delivery', 'cost', 'amount'],
      pageSizeOptions: [6, 12, 24],
      pageSize: 6,
      currentPage: 1,
      selected: []
    };

    _.bindAll(
      this,
      'onChangeSelection',
      'renderDelivery',
      'renderSupplier',
      'renderStructure',
      'renderCost',
      'renderAmount',
      'onPageChange'
    );
  }

  onChangeSelection(selectedColumns) {
    this.setState({ visibleColumns: selectedColumns });
  }

  onPageChange(requestedPage, pageSize) {
    this.setState({
      pageSize: pageSize,
      currentPage: requestedPage,
    });
  }

  renderSupplier(material) {
    return <p>{material.getIn(['supplier', 'name'], '-')}</p>;
  }

  renderDelivery(material) {
    return <p className="tx-type--secondary">{material.getIn(['supplier', 'catalog', 'type'], '-')}</p>;
  }

  renderCost(material) {
    let currency = material.getIn(['supplier', 'currency'], '');
    if (currency === 'USD') {
      currency = '$';
    }
    const price = material.getIn(['supplier', 'price'], '-');
    return <p className="tx-type--secondary">{currency + price}</p>;
  }

  renderAmount(material) {
    const unit = material.getIn(['supplier', 'units'], '');
    const amount = material.getIn(['supplier', 'quantity'], '-');
    return <p className="tx-type--secondary">{amount + unit}</p>;
  }

  renderStructure(material) {
    return <div className="material-order-items__molecule"><Molecule SMILES={material.get('smiles')} size="tiny" /></div>;
  }

  render() {
    const {
      isSearching,
      onSelectRow
    } = this.props;

    const maxPage = Math.ceil(this.props.data.size / this.state.pageSize);
    const currentPage = this.state.currentPage <= maxPage ? this.state.currentPage : 1;
    const data = this.props.data.slice((currentPage - 1) * this.state.pageSize, currentPage * this.state.pageSize);

    const columns = [
      <Column
        renderCellContent={this.renderStructure}
        header="structure"
        id="smiles"
        key="column-smiles"
      />,
      <Column
        relativeWidth={1.3}
        renderCellContent={this.renderSupplier}
        header="supplier"
        id="supplier"
        key="column-supplier"
      />,
      <Column
        relativeWidth={1.6}
        renderCellContent={this.renderDelivery}
        header="delivery"
        id="delivery"
        key="column-delivery"
      />,
      <Column
        renderCellContent={this.renderCost}
        header="cost"
        id="cost"
        key="column-cost"
      />,
      <Column
        renderCellContent={this.renderAmount}
        header="amount"
        id="amount"
        key="column-amount"
      />
    ];

    return (
      <List
        id={KeyRegistry.MATERIAL_VENDORS_CATALOG_TABLE}
        loaded={!isSearching}
        data={Immutable.Iterable(data)}
        tallRows
        disableCard
        showColumnFilter
        showPagination
        pageSizeOptions={this.state.pageSizeOptions}
        pageSize={this.state.pageSize}
        onPageChange={(requestedPage, pageSize) => this.onPageChange(requestedPage, pageSize)}
        maxPage={maxPage}
        currentPage={currentPage}
        visibleColumns={this.state.visibleColumns}
        persistKeyInfo={UserPreference.packInfo(KeyRegistry.MATERIAL_VENDORS_CATALOG_TABLE)}
        selected={this.state.selected}
        onSelectRow={(_records, _willBeChecked, selectedRows) => {
          this.setState({ selected: selectedRows });
          onSelectRow(selectedRows);
        }}
        onSelectAll={(selectedRows) => onSelectRow(selectedRows)}
        onChangeSelection={this.onChangeSelection}
      >
        {columns}
      </List>
    );
  }
}

VendorCatalogSearchResults.propTypes = {
  data: PropTypes.instanceOf(Immutable.Iterable),
  isSearching: PropTypes.bool,
  onSelectRow: PropTypes.func,
  disableCard: PropTypes.bool
};

export default VendorCatalogSearchResults;
