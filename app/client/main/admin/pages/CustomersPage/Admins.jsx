import React from 'react';
import Immutable from 'immutable';
import { Button, List, Column } from '@transcriptic/amino';

import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import AdminActions from 'main/admin/actions/AdminActions';
import ModalActions from 'main/actions/ModalActions';
import { PAGE_SIZE_OPTIONS } from 'main/util/List';
import CreateAdminModal from './CreateAdminModal';

class AdminsView extends React.Component {
  constructor(props) {
    super(props);

    this.onSortChange = this.onSortChange.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
    this.onColumnsSelection = this.onColumnsSelection.bind(this);
    this.fetch = this.fetch.bind(this);
    this.openCreateAdminModal = this.openCreateAdminModal.bind(this);

    this.state = {
      visibleColumns: ['ID', 'name', 'email'],
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      pageSize: 12,
      currentPage: 1,
      maxPage: 1,
      allAdmins: [],
      adminsPerPage: [],
      canCreateAdmins: Transcriptic.current_user.can_create_admins,
      hasLoaded: false
    };
  }

  componentDidMount() {
    this.fetch();
  }

  fetch() {
    const { currentPage, pageSize, sortKey, sortDirection } = this.state;
    const options = { page: currentPage, per_page: pageSize, order_by: sortKey, direction: sortDirection };
    AdminActions.search(options)
      .then(({ results, num_pages, per_page }) => {
        this.setState({ adminsPerPage: results, maxPage: num_pages, pageSize: per_page, hasLoaded: true });
      })
      .fail(() => {
        this.setState({ hasLoaded: true });
      });
  }

  onColumnsSelection(selectedColumns) {
    this.setState({ visibleColumns: selectedColumns });
  }

  onPageChange(requestedPage, pageSize) {
    this.setState({ currentPage: requestedPage, pageSize: pageSize }, () => { this.fetch(); });
  }

  onSortChange(sortKey, sortDirection) {
    this.setState({ sortKey: sortKey, sortDirection: sortDirection, currentPage: 1 }, () => { this.fetch(); });
  }

  openCreateAdminModal() {
    ModalActions.open(CreateAdminModal.MODAL_ID);
  }

  render() {
    const { adminsPerPage, visibleColumns, pageSizeOptions, pageSize, currentPage, maxPage, hasLoaded } = this.state;
    return (
      <div className="tx-stack tx-stack--md">
        <If condition={this.state.canCreateAdmins}>
          <Button onClick={this.openCreateAdminModal}>
            Add Admin
          </Button>
        </If>
        <List
          data={Immutable.fromJS(adminsPerPage)}
          id={KeyRegistry.ADMIN_CUSTOMERS_ADMIN_USERS_TABLE}
          loaded={hasLoaded}
          disabledSelection
          showColumnFilter
          visibleColumns={visibleColumns}
          persistKeyInfo={UserPreference.packInfo(KeyRegistry.ADMIN_CUSTOMERS_ADMIN_USERS_TABLE)}
          onChangeSelection={selectedColumns => this.onColumnsSelection(selectedColumns)}
          showPagination
          pageSizeOptions={pageSizeOptions}
          pageSize={pageSize}
          currentPage={currentPage}
          maxPage={maxPage}
          onPageChange={(requestedPage, rowsPerPage) => this.onPageChange(requestedPage, rowsPerPage)}
        >
          <Column
            renderCellContent={(admin) => admin.get('id')}
            sortable
            onSortChange={this.onSortChange}
            header="ID"
            id="id"
            key="column_id"
            disableFormatHeader
          />
          <Column
            renderCellContent={(admin) => admin.get('name')}
            sortable
            onSortChange={this.onSortChange}
            header="name"
            id="name"
            key="column_name"
          />
          <Column
            renderCellContent={(admin) => admin.get('email')}
            sortable
            onSortChange={this.onSortChange}
            header="email"
            id="email"
            key="column_email"
          />
        </List>
        <CreateAdminModal
          onSuccess={() => { this.fetch(); }}
        />
      </div>
    );
  }

}
export default AdminsView;
