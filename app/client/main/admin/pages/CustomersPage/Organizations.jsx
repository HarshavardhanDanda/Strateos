import Immutable from 'immutable';
import _ from 'lodash';
import React from 'react';

import { SearchField, Button, ButtonGroup, Column, List } from '@transcriptic/amino';
import BaseTableTypes from 'main/components/BaseTableTypes';
import connectToStores from 'main/containers/ConnectToStoresHOC';
import { OrganizationSearchStore } from 'main/stores/search';
import OrganizationStore from 'main/stores/OrganizationStore';
import OrganizationActions from 'main/admin/actions/OrganizationActions';
import AjaxButton from 'main/components/AjaxButton';
import ModalActions from 'main/actions/ModalActions';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import NewOrgModalHOC from './NewOrgModal';
import './Organizations.scss';

class Organizations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: {},
      searchQuery: '',
      data: [],
      pageSizeOptions: [5, 10, 15, 20],
      pageSize: 10,
      maxPage: 1,
      currentPage: 1,
      sortKey: 'name',
      sortDirection: 'asc',
      visibleColumns: ['name', 'ID', 'num collaborators', 'open runs', 'total runs', 'created at']
    };
    this.fetch                   = this.fetch.bind(this);
    this.selectedOrganization    = this.selectedOrganization.bind(this);
    this.onDelete                = this.onDelete.bind(this);
    this.onColumnsSelection      = this.onColumnsSelection.bind(this);
    this.onSortChange            = this.onSortChange.bind(this);
    this.onSelectRow             = this.onSelectRow.bind(this);
  }

  componentDidMount() {
    this.fetch(this.state.currentPage, this.state.pageSize);
  }

  fetch(page, perPage) {
    return OrganizationActions.search(page, perPage, {
      search: this.state.searchQuery,
      orderBy: this.state.sortKey,
      direction: this.state.sortDirection
    })
      .then(response => {
        this.setState({
          data: response.results.map(o =>
            ({ ...o, name: _.pick(o, 'name', 'subdomain') })
          ),
          maxPage: response.pagination.total_pages,
          currentPage: page,
          pageSize: perPage
        });
      });
  }

  onSortChange(sortKey, sortDirection) {
    this.setState(
      { sortKey, sortDirection, currentPage: 1 },
      () => this.fetch(this.state.currentPage, this.state.pageSize)
    );
  }

  onSelectRow(record, willBeSelected) {
    this.setState({
      selected: willBeSelected ? { [record.get('id')]: willBeSelected } : {}
    });
  }

  onColumnsSelection(selectedColumns) {
    this.setState({ visibleColumns: selectedColumns });
  }

  onDelete() {
    const org = this.selectedOrganization()[0];
    OrganizationActions.destroy(org);
    this.setState(
      { selected: {} },
      () => this.fetch(this.state.currentPage, this.state.pageSize)
    );
  }

  selectedOrganization() {
    const ids = Object.keys(this.state.selected);
    return this.state.data.filter((result) => {
      return ids.indexOf(result.id) !== -1;
    });
  }

  renderNameRecord(record) {
    return <BaseTableTypes.OrganizationUrl data={record.get('name').toJS()} />;
  }

  renderIdRecord(record) {
    return <BaseTableTypes.Text data={record.get('id')} />;
  }

  renderNumCollaboratorsRecord(record) {
    return <BaseTableTypes.Text data={record.get('numCollaborators')} />;
  }

  renderOpenRunStatsRecord(record) {
    const runStats = record.get(('runStats'));
    return <BaseTableTypes.Text data={runStats.get('open')} />;
  }

  renderTotalRunStatsRecord(record) {
    const runStats = record.get(('runStats'));
    return <BaseTableTypes.Text data={runStats.get('total')} />;
  }

  renderCreatedAtRecord(record) {
    return <BaseTableTypes.Time data={record.get('createdAt')} />;
  }

  render() {
    const { id } = this.selectedOrganization()[0] || {};
    return (
      <div className="tx-organizations">
        <div className="tx-organizations__action-bar">
          <ButtonGroup>
            <AjaxButton
              type="danger"
              disabled={Object.keys(this.state.selected).length === 0}
              action={this.onDelete}
              confirmMessage={`Are you sure you want to delete ${id}?`}
            >
              <span>Delete</span>
            </AjaxButton>
            <Button
              type="info"
              onClick={() => ModalActions.open('NewOrganizationModal')}
            >
              New Organization
            </Button>
          </ButtonGroup>
        </div>
        <NewOrgModalHOC
          modalId="NewOrganizationModal"
        />
        <div className="tx-stack__block tx-stack__block--md">
          <SearchField
            id="search"
            onChange={
              e => this.setState(
                { searchQuery: e.target.value },
                () => this.fetch(1, this.state.pageSize)
              )
            }
            reset={() => this.setState(
              { searchQuery: '' },
              () => this.fetch(1, this.state.pageSize)
            )}
            value={this.state.searchQuery}
            placeholder="Filter Rows"
            searchType=""
          />
        </div>
        <List
          data={Immutable.fromJS(this.state.data)}
          id={KeyRegistry.ADMIN_CUSTOMERS_ORGANIZATIONS_TABLE}
          showPagination
          pageSizeOptions={this.state.pageSizeOptions}
          pageSize={this.state.pageSize}
          onPageChange={(requestedPage, pageSize) => this.fetch(requestedPage, pageSize)}
          maxPage={this.state.maxPage}
          currentPage={this.state.currentPage}
          loaded
          onSelectRow={(record, willBeSelected) => this.onSelectRow(record, willBeSelected)}
          onSelectAll={() => { this.setState({ selected: {} }); }}
          selected={this.state.selected}
          visibleColumns={this.state.visibleColumns}
          persistKeyInfo={UserPreference.packInfo(KeyRegistry.ADMIN_CUSTOMERS_ORGANIZATIONS_TABLE)}
          onChangeSelection={selectedColumns => this.onColumnsSelection(selectedColumns)}
          showColumnFilter
        >
          <Column
            renderCellContent={this.renderNameRecord}
            sortable
            onSortChange={this.onSortChange}
            header="name"
            id="name"
            key="column-name"
          />
          <Column
            renderCellContent={this.renderIdRecord}
            header="ID"
            id="id"
            key="column-id"
            disableFormatHeader
          />
          <Column
            renderCellContent={this.renderNumCollaboratorsRecord}
            sortable
            onSortChange={this.onSortChange}
            header="num collaborators"
            id="numCollaborators"
            key="column-numCollaborators"
          />
          <Column
            renderCellContent={this.renderOpenRunStatsRecord}
            sortable
            onSortChange={this.onSortChange}
            header="open runs"
            id="run_stats.open"
            key="column-run_stats.open"
          />
          <Column
            renderCellContent={this.renderTotalRunStatsRecord}
            sortable
            onSortChange={this.onSortChange}
            header="total runs"
            id="run_stats.total"
            key="column-run_stats.total"
          />
          <Column
            renderCellContent={this.renderCreatedAtRecord}
            sortable
            onSortChange={this.onSortChange}
            header="created at"
            id="created_at"
            key="column-created_at"
          />
        </List>
      </div>
    );
  }
}

const getStateFromStores = () => {
  const lastSearch = OrganizationSearchStore.getLatestSearch();
  let results = [];
  if (lastSearch) {
    const ids = lastSearch.get('results').toJS();
    results   = OrganizationStore.getByIds(ids).map(result => result.toJS());
  }

  const organizations = results.map((organization) => {
    return Object.assign(
      _.pick(organization, 'id', 'name', 'subdomain', 'numCollaborators', 'createdAt'),
      { runStats: `${organization.runStats.open} open / ${organization.runStats.total} total` }
    );
  });
  return { organizations };
};

export default connectToStores(Organizations, getStateFromStores);
