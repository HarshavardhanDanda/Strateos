import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import { Column, List, Molecule } from '@transcriptic/amino';

import './CompoundLinkedContainerSearch.scss';
import { PAGE_SIZE_OPTIONS } from 'main/util/List';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import CompoundStore from 'main/stores/CompoundStore';

class MaterialSearchResults extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visibleColumns: ['structure', 'name', 'ref id', 'mol wt', 'compound id', 'supplier', 'vendor', 'tier']
    };
  }

  render() {
    const { data, onRowClick, onSelectRow, onSearchPageChange, page, numPages, selected, pageSize, searchOptions, onSearchFilterChange } = this.props;

    const getSelectedRow = (selected) => {
      const selectionMap = {};
      selected.forEach(element => {
        selectionMap[element] = true;
      });
      return selectionMap;
    };

    const getCompound = (material) => {
      const compoundId = material.getIn(['material_components', 0, 'resource', 'compound', 'model', 'id']);
      const compound = CompoundStore.getById(compoundId);
      return compound;
    };

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

    const renderCompoundId = (material) => {
      const compoundLinkId = getCompound(material).get('id');
      return <p>{compoundLinkId}</p>;
    };

    const renderSupplier = (material) => {
      const supplier = material.get('supplier');
      return <p>{supplier.get('name') || '-'}</p>;
    };

    const renderVendor = (material) => {
      const vendor = material.get('vendor');
      return <p>{vendor.get('name')}</p>;
    };

    const renderStructure = (material) => {
      const smiles = getCompound(material).get('smiles');
      return <div className="container-results__molecule"><Molecule SMILES={smiles} size="tiny" /></div>;
    };

    const renderNickname = (material) => {
      const nickName = getCompound(material).get('name');
      return <p>{ nickName || '-'}</p>;
    };

    const renderRefId = (material) => {
      const referenceId = getCompound(material).get('reference_id');
      return <p>{ referenceId || '-'}</p>;
    };

    const renderMolWt = (material) => {
      const molWt = getCompound(material).get('molecular_weight');
      return <p>{ molWt || '-'}</p>;
    };

    const renderTier = (material) => {
      const tier = material.getIn(['orderable_materials', 0, 'tier']);
      return <p>{ tier || '-' }</p>;
    };

    const columns = [
      <Column
        renderCellContent={renderStructure}
        header="structure"
        id="smiles"
        key="column-smiles"
      />,
      <Column
        renderCellContent={renderNickname}
        header="name"
        id="compound_name"
        key="column-compound_name"
      />,
      <Column
        renderCellContent={renderRefId}
        header="ref id"
        id="ref_id"
        key="column-ref_id"
      />,
      <Column
        renderCellContent={renderMolWt}
        header="mol wt"
        id="mol_wt"
        key="column-mol_wt"
      />,
      <Column
        renderCellContent={renderCompoundId}
        header="compound id"
        id="compound_id"
        key="column-compound_id"
      />,
      <Column
        renderCellContent={renderSupplier}
        header="supplier"
        id="supplier"
        key="column-supplier"
      />,
      <Column
        renderCellContent={renderVendor}
        header="vendor"
        id="vendor"
        key="column-vendor"
      />,
      <Column
        renderCellContent={renderTier}
        header="tier"
        id="tier"
        key="column-tier"
      />
    ];

    return (
      <div className="container-results">
        <List
          loaded={!this.props.isSearching}
          data={data}
          id={KeyRegistry.REACTIONS_COMPOUND_LINKED_MATERIALS_TABLE}
          onRowClick={onRowClick}
          onSelectRow={(records, willBeChecked, selectedRows) => onSelectRow(selectedRows)}
          selected={getSelectedRow(selected)}
          showPagination
          currentPage={page}
          maxPage={numPages}
          onPageChange={onPageChange}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          showColumnFilter
          visibleColumns={this.state.visibleColumns}
          persistKeyInfo={UserPreference.packInfo(KeyRegistry.REACTIONS_COMPOUND_LINKED_MATERIALS_TABLE)}
          onChangeSelection={(selectedColumns) => this.setState({
            visibleColumns: selectedColumns
          })}
        >
          {columns}
        </List>
      </div>
    );
  }
}

MaterialSearchResults.propTypes = {
  data: PropTypes.instanceOf(Immutable.List),
  onRowClick: PropTypes.func,
  onSelectRow: PropTypes.func,
  selected: PropTypes.array,
  page: PropTypes.number,
  numPages: PropTypes.number,
  onSearchPageChange: PropTypes.func,
  onSearchPerPageChange: PropTypes.func,
  isSearching: PropTypes.bool.isRequired
};

export default MaterialSearchResults;
