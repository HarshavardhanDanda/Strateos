import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import { Column, List, Molecule } from '@transcriptic/amino';

import { PAGE_SIZE_OPTIONS } from 'main/util/List';
import './CompoundLinkedContainerSearch.scss';

class EMoleculesSearchResults extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visibleColumns: props.eMoleculesSearchType === 'EXACT' ?
        ['structure', 'name', 'supplier', 'url', 'estimated_cost', 'tier'] :
        ['structure', 'name', 'cas', 'supplier', 'url', 'estimated_cost', 'tier']
    };
  }

  render() {
    const { data, onSelectRow, onSortChange,
      onSearchPageChange, page, numPages, selected,
      pageSize, onSearchFilterChange, searchOptions, isLoading } = this.props;

    const getSelectedRows = (selected) => {
      const selectionMap = {};
      selected.forEach(element => {
        selectionMap[element] = true;
      });
      return selectionMap;
    };

    const onPageChange = (requestedPage, requestedPageSize) => {
      const onSelectOption = field => value =>
        onSearchFilterChange(searchOptions.set(field, value));

      if (requestedPage !== page) {
        onSearchPageChange(requestedPage);
      }
      if (requestedPageSize !== pageSize) {
        isLoading();
        onSelectOption('searchPerPage')(requestedPageSize);
      }
    };

    const renderTier = (eMoleculesResource) => {
      return eMoleculesResource.get('tierText');
    };

    const renderEstimatedCost = (eMoleculesResource) => {
      return eMoleculesResource.get('estimatedCost');
    };

    const renderStructure = (eMoleculesResource) => {
      return <div className="container-results__molecule"><Molecule SMILES={eMoleculesResource.get('smiles')} size="tiny" /></div>;
    };

    const renderNickname = (eMoleculesResource) => {
      return eMoleculesResource.get('name') || '-';
    };

    const renderSupplier = (eMoleculesResource) => {
      return eMoleculesResource.get('supplierName');
    };

    const renderURL = (eMoleculesResource) => {
      const url = eMoleculesResource.get('structureUrl');
      return url ? <a href={url} target="_blank" rel="noreferrer">{url}</a> : '-';
    };

    const renderCas = (eMoleculesResource) => {
      return eMoleculesResource.get('casNumber') || '-';
    };

    const columns = [
      <Column
        renderCellContent={renderStructure}
        header="structure"
        id="smiles"
        key="smiles"
      />,
      <Column
        renderCellContent={renderNickname}
        onSortChange={onSortChange}
        header="name"
        id="compound_name"
        key="compound-name"
      />,
      <Column
        renderCellContent={renderCas}
        header="CAS"
        id="cas_number"
        key="cas-number"
        disableFormatHeader
      />,
      <Column
        renderCellContent={renderSupplier}
        header="supplier"
        id="supplier"
        key="supplier"
      />,
      <Column
        renderCellContent={renderURL}
        header="url"
        id="url"
        key="url"
      />,
      <Column
        renderCellContent={renderEstimatedCost}
        // sortable
        // onSortChange={onSortChange}
        header="estimated cost"
        id="estimatedCost"
        key="estimated-cost"
      />,
      <Column
        renderCellContent={renderTier}
        sortable
        onSortChange={onSortChange}
        header="tier"
        id="tier"
        key="tier"
      />
    ];

    const getColumns = (allColumns) => {
      let columnsToShow = allColumns;
      if (this.props.eMoleculesSearchType == 'EXACT') {
        columnsToShow = columnsToShow.filter(column => column.props.id !== 'cas_number');
      }
      return columnsToShow;
    };

    return (
      <div className="container-results">
        <List
          loaded={!this.props.isSearching}
          data={data}
          id="e-molecules-table"
          onSelectRow={(records, willBeChecked, selectedRows) => onSelectRow(selectedRows)}
          selected={getSelectedRows(selected)}
          showPagination
          currentPage={page}
          maxPage={numPages}
          onPageChange={onPageChange}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          visibleColumns={this.state.visibleColumns}
          onChangeSelection={(selectedColumns) => this.setState({ visibleColumns: selectedColumns })}
        >
          {getColumns(columns)}
        </List>
      </div>
    );
  }
}

EMoleculesSearchResults.propTypes = {
  data: PropTypes.instanceOf(Immutable.List),
  eMoleculesSearchType: PropTypes.oneOf(['EXACT', 'ALTERNATE']),
  onSelectRow: PropTypes.func,
  selected: PropTypes.array,
  page: PropTypes.number,
  numPages: PropTypes.number,
  onSearchPageChange: PropTypes.func,
  onSortChange: PropTypes.func,
  isLoading: PropTypes.func.isRequired,
  isSearching: PropTypes.bool.isRequired
};

export default EMoleculesSearchResults;
