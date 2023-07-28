import React from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { List, Column } from '@transcriptic/amino';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';

class ResourceSearchResults extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visibleColumns: props.visibleColumns || ['name', 'ID', 'kind', 'purity']
    };
  }

  render() {
    const getSelectedRows = (selected) => {
      const selectionMap = {};
      selected.forEach(element => {
        selectionMap[element] = true;
      });
      return selectionMap;
    };

    const {
      data, isSearching, onSelectRow, searchOptions, onSortChange, onSearchFilterChange,
      page, pageSize, numPages, onSearchPageChange, selected, disableCard
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

    const renderName = (resource) => {
      return <p>{resource.get('name')}</p>;
    };

    const renderId = (resource) => {
      return <p className="tx-type--secondary">{resource.get('id')}</p>;
    };

    const renderKind = (resource) => {
      const kind = _.startCase(resource.get('kind'));
      return <p className="tx-type--secondary">{kind}</p>;
    };

    const renderPurity = (resource) => {
      const purity = resource.get('purity');
      return <p className="tx-type--secondary">{purity ? `${purity}%` : '-'}</p>;
    };

    const columns = [
      <Column
        renderCellContent={renderName}
        sortable
        onSortChange={onSortChange}
        header="name"
        id="name"
        key="column-name"
      />,
      <Column
        renderCellContent={renderId}
        sortable
        onSortChange={onSortChange}
        header="ID"
        id="id"
        key="column-id"
        disableFormatHeader
      />,
      <Column
        renderCellContent={renderKind}
        sortable
        onSortChange={onSortChange}
        header="kind"
        id="kind"
        key="column-kind"
      />,
      <Column
        renderCellContent={renderPurity}
        sortable
        onSortChange={onSortChange}
        header="purity"
        id="purity"
        key="column-purity"
      />
    ];

    return (
      <div className="resource-search-results">
        <List
          loaded={!isSearching}
          disableCard={disableCard}
          data={data}
          tallRows
          onSelectRow={(_records, _willBeChecked, selectedRows) => onSelectRow(selectedRows)}
          onSelectAll={(selectedRows) => onSelectRow(selectedRows)}
          selected={getSelectedRows(selected)}
          id={KeyRegistry.MATERIAL_RESOURCES_TABLE}
          showPagination
          currentPage={page}
          maxPage={numPages}
          onPageChange={(requestedPage, requestedPageSize) => onPageChange(requestedPage, requestedPageSize)}
          pageSizeOptions={[6, 12, 24, 48]}
          pageSize={pageSize}
          showColumnFilter
          visibleColumns={this.state.visibleColumns}
          persistKeyInfo={UserPreference.packInfo(KeyRegistry.MATERIAL_RESOURCES_TABLE)}
          onChangeSelection={(selectedColumns) => this.setState({ visibleColumns: selectedColumns })}
        >
          {columns}
        </List>
      </div>
    );
  }
}

ResourceSearchResults.propTypes = {
  data: PropTypes.instanceOf(Immutable.List),
  selected: PropTypes.array,
  onSelectRow: PropTypes.func,
  isSearching: PropTypes.bool,
  searchOptions: PropTypes.instanceOf(Immutable.Map),
  page: PropTypes.number,
  pageSize: PropTypes.number,
  numPages: PropTypes.number,
  onSearchPageChange: PropTypes.func,
  onSortChange: PropTypes.func,
  onSearchFilterChange: PropTypes.func,
  visibleColumns: PropTypes.instanceOf(Array),
  disableCard: PropTypes.bool
};

ResourceSearchResults.defaultProps = {
  disableCard: false
};

export default ResourceSearchResults;
