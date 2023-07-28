import Immutable from 'immutable';
import _ from 'lodash';
import React from 'react';

import { SearchField, Column, List, ButtonGroup, Button } from '@transcriptic/amino';
import BaseTableTypes from 'main/components/BaseTableTypes';
import OrganizationActions from 'main/actions/OrganizationActions';
import AjaxButton from 'main/components/AjaxButton';
import ModalActions from 'main/actions/ModalActions';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import OrganizationAPI from 'main/api/OrganizationAPI';
import NotificationActions from 'main/actions/NotificationActions';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
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
      hasLoaded: false,
      currentPage: 1,
      sortKey: 'name',
      sortDirection: 'asc',
      visibleColumns: ['name', 'ID', 'type', 'num collaborators', 'open runs', 'total runs', 'created at']
    };
    this.debounceFetch = _.debounce(this.fetch, 250).bind(this);
    this.onColumnsSelection      = this.onColumnsSelection.bind(this);
    this.onSortChange            = this.onSortChange.bind(this);
    this.onSelectRow             = this.onSelectRow.bind(this);
    this.selectedOrganization    = this.selectedOrganization.bind(this);
    this.onDelete                = this.onDelete.bind(this);
  }

  componentDidMount() {
    this.fetch(this.state.currentPage, this.state.pageSize);
  }

  fetch(page, perPage) {
    return OrganizationActions.loadCustomers(page, perPage, {
      search: this.state.searchQuery,
      orderBy: this.state.sortKey,
      direction: this.state.sortDirection
    })
      .then(response => {
        this.setState({
          data: response.data.map(o =>
            ({ id: o.id, ...o.attributes })
          ),
          maxPage:  Math.ceil(response.meta.record_count / perPage),
          currentPage: page,
          pageSize: perPage,
          hasLoaded: true
        });
      });
  }

  onSortChange(sortKey, sortDirection) {
    this.setState(
      { sortKey, sortDirection, currentPage: 1 },
      () => this.debounceFetch(this.state.currentPage, this.state.pageSize)
    );
  }

  onColumnsSelection(selectedColumns) {
    this.setState({ visibleColumns: selectedColumns });
  }

  onSelectRow(record, willBeSelected) {
    if (!_.isEmpty(record)) {
      this.setState({
        selected: willBeSelected ? { [record.get('id')]: willBeSelected } : {}
      });
    }
  }

  onDelete() {
    const org = this.selectedOrganization()[0];
    OrganizationAPI.destroy(org.id).done(() => {
      NotificationActions.createNotification({
        text: 'Organization is deleted'
      });
      this.setState(
        { selected: {} },
        () =>  {
          this.fetch(this.state.currentPage, this.state.pageSize);
        }
      );
    }).fail(() => {
      NotificationActions.createNotification({
        text: `Cannot delete the organization - ${org.name}`,
        isError: true
      });
    });
  }

  selectedOrganization() {
    const ids = Object.keys(this.state.selected);
    return this.state.data.filter((result) => {
      return ids.indexOf(result.id) !== -1;
    });
  }

  renderNameRecord(record) {
    return <BaseTableTypes.CustomerOrganizationUrl org={record} />;
  }

  renderIdRecord(record) {
    return <BaseTableTypes.Text data={record.get('id')} />;
  }

  renderTypeRecord(record) {
    return <BaseTableTypes.Text data={record.get('org_type')} />;
  }

  renderNumCollaboratorsRecord(record) {
    return <BaseTableTypes.Text data={record.get('num_collaborators')} />;
  }

  renderOpenRunStatsRecord(record) {
    return <BaseTableTypes.Text data={record.getIn(['run_stats', 'open'])} />;
  }

  renderTotalRunStatsRecord(record) {
    return <BaseTableTypes.Text data={record.getIn(['run_stats', 'total'])} />;
  }

  renderCreatedAtRecord(record) {
    return <BaseTableTypes.Time data={record.get('created_at')} />;
  }

  render() {
    const selectedOrganization = this.selectedOrganization();
    const { id } = (selectedOrganization && selectedOrganization[0]) ? selectedOrganization[0] : {};

    return (
      <div className="tx-organizations">
        <div className="tx-organizations__action-bar">
          {FeatureStore.hasPlatformFeature(FeatureConstants.CREATE_DELETE_ORGANIZATION) && (
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
          )}
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
                () => this.debounceFetch(1, this.state.pageSize)
              )
            }
            reset={() => this.setState(
              { searchQuery: '' },
              () => this.debounceFetch(1, this.state.pageSize)
            )}
            value={this.state.searchQuery}
            placeholder="Filter Rows"
            searchType=""
          />
        </div>
        <List
          id={KeyRegistry.CUSTOMERS_ORGANIZATIONS_TABLE}
          data={Immutable.fromJS(this.state.data)}
          showPagination
          pageSizeOptions={this.state.pageSizeOptions}
          pageSize={this.state.pageSize}
          onPageChange={(requestedPage, pageSize) => this.debounceFetch(requestedPage, pageSize)}
          maxPage={this.state.maxPage}
          currentPage={this.state.currentPage}
          loaded={this.state.hasLoaded}
          onSelectRow={(record, willBeSelected) => this.onSelectRow(record, willBeSelected)}
          onSelectAll={() => { this.setState({ selected: {} }); }}
          selected={this.state.selected}
          visibleColumns={this.state.visibleColumns}
          persistKeyInfo={UserPreference.packInfo(KeyRegistry.CUSTOMERS_ORGANIZATIONS_TABLE)}
          onChangeSelection={selectedColumns => this.onColumnsSelection(selectedColumns)}
          showColumnFilter
          disabledSelection={!FeatureStore.hasPlatformFeature(FeatureConstants.CREATE_DELETE_ORGANIZATION)}
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
            renderCellContent={this.renderTypeRecord}
            header="type"
            id="type"
            key="column-type"
          />
          <Column
            renderCellContent={this.renderNumCollaboratorsRecord}
            sortable
            onSortChange={this.onSortChange}
            header="num collaborators"
            id="num_collaborators"
            key="column-num_collaborators"
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

export default Organizations;
