import React from 'react';
import Immutable from 'immutable';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Column, List, Molecule, DateTime } from '@transcriptic/amino';

import CompoundStore from 'main/stores/CompoundStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import { PAGE_SIZE_OPTIONS } from 'main/util/List';
import './CompoundLinkedContainerSearch.scss';

class CompoundLinkedContainerSearchResults extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visibleColumns: ['structure', 'name', 'ref id', 'type', 'container', 'compound id', 'created', 'last used']
    };
  }

  render() {
    const { data, onRowClick, onSelectRow, onSortChange,
      onSearchPageChange, page, numPages, selected,
      pageSize, onSearchFilterChange, searchOptions, compoundLinkId } = this.props;

    const compound = CompoundStore.getById(compoundLinkId);

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
        onSelectOption('searchPerPage')(requestedPageSize);
      }
    };

    const renderType = (container) => {
      const cTypeId = container.get('container_type_id');
      const cTypeName = container.get('container_type_name');

      const containerType = ContainerTypeStore.getById(cTypeId);
      const isTube = containerType && containerType.get('is_tube');

      return <p className="container-type"><i className={classNames('baby-icon', isTube ? 'aminol-tube' : 'aminol-plate')} />{cTypeName}</p>;
    };

    const renderName = (container) => {
      return (
        <p>
          {container.get('label')}
        </p>
      );
    };

    const renderCompoundId = () => {
      return <p>{compound ? compound.get('id') : '-'}</p>;
    };

    const renderCreatedAt = (container) => {
      const createdAt = <DateTime timestamp={(container.get('created_at'))} />;

      return <p>{createdAt}</p>;
    };

    const renderLastUsed = (container) => {
      const updatedAt = <DateTime timestamp={(container.get('updated_at'))} />;

      return <p>{updatedAt}</p>;
    };

    const renderStructure = () => {
      return <div className="container-results__molecule"><Molecule SMILES={compound && compound.get('smiles')} size="tiny" /></div>;
    };

    const renderNickname = () => {
      return compound ? compound.get('name') || '-' : '-';
    };
    const renderRefId = () => {
      return <p>{compound ? compound.get('reference_id') || '-' : '-'}</p>;
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
        onSortChange={onSortChange}
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
        renderCellContent={renderType}
        header="type"
        id="type-column"
        key="column-type"
      />,
      <Column
        renderCellContent={renderName}
        header="container"
        id="name"
        key="column-name"
      />,
      <Column
        renderCellContent={renderCompoundId}
        header="compound id"
        id="compound_id"
        key="column-compound_id"
      />,
      <Column
        renderCellContent={renderCreatedAt}
        sortable
        onSortChange={onSortChange}
        header="created"
        id="created_at"
        key="column-created_at"
      />,
      <Column
        renderCellContent={renderLastUsed}
        sortable
        onSortChange={onSortChange}
        header="last used"
        id="updated_at"
        key="column-updated_at"
      />
    ];

    return (
      <div className="container-results">
        <List
          loaded={!this.props.isSearching}
          data={data}
          id={KeyRegistry.REACTIONS_COMPOUND_LINKED_CONTAINERS_TABLE}
          onRowClick={onRowClick}
          onSelectRow={(records, willBeChecked, selectedRows) => onSelectRow(selectedRows)}
          selected={getSelectedRows(selected)}
          showPagination
          currentPage={page}
          maxPage={numPages}
          onPageChange={onPageChange}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          showColumnFilter
          visibleColumns={this.state.visibleColumns}
          persistKeyInfo={UserPreference.packInfo(KeyRegistry.REACTIONS_COMPOUND_LINKED_CONTAINERS_TABLE)}
          onChangeSelection={(selectedColumns) => this.setState({ visibleColumns: selectedColumns })}
        >
          {columns}
        </List>
      </div>
    );
  }
}

CompoundLinkedContainerSearchResults.propTypes = {
  data: PropTypes.instanceOf(Immutable.List),
  onRowClick: PropTypes.func,
  onSelectRow: PropTypes.func,
  selected: PropTypes.array,
  page: PropTypes.number,
  numPages: PropTypes.number,
  onSearchPageChange: PropTypes.func,
  onSortChange: PropTypes.func,
  onAddContainerClick: PropTypes.func,
  compoundLinkId: PropTypes.string,
  isSearching: PropTypes.bool.isRequired
};

export default CompoundLinkedContainerSearchResults;
