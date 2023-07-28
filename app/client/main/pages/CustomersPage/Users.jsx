import PropTypes from 'prop-types';
import React from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import { Column, List, SearchField, Button } from '@transcriptic/amino';

import Urls from 'main/util/urls';
import ModalActions from 'main/actions/ModalActions';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import UserActions from 'main/actions/UserActions';
import BaseTableTypes from 'main/components/BaseTableTypes';
import OrganizationStore from 'main/stores/OrganizationStore';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
import { PAGE_SIZE_OPTIONS } from 'main/util/List';
import RemoveUserModal from './RemoveUserModal';

import './Users.scss';

class Users extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      pageSize: 12,
      page: 1,
      maxPage: 1,
      search: '',
      sortKey: 'name',
      visibleColumns: ['name', 'ID', 'email', 'organizations', 'invitation sent at', 'invitation accepted at', 'last login', ''],
      hasLoaded: false,
    };
    this.onSortChange = this.onSortChange.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
    this.onChangeSelection = this.onChangeSelection.bind(this);
    this.onRowClick   = this.onRowClick.bind(this);
    this.debounceFetch = _.debounce(this.fetch, 250).bind(this);
  }

  componentDidMount() {
    this.fetch();
  }

  fetch() {
    const { page, pageSize, sortKey, sortDirection, search } = this.state;
    const options = {
      page,
      per_page: pageSize,
      orderBy: sortKey,
      direction: sortDirection,
      search,
      is_collaborator: true
    };

    UserActions.fetchUsers(options)
      .then(response => {
        this.setState({
          data: response.data.map(user => {
            const org_ids = user.relationships.organizations.data.map((d) => d.id);
            return { id: user.id, org_ids: org_ids, ...user.attributes };
          }),
          maxPage:  Math.ceil(response.meta.record_count / pageSize),
          currentPage: page,
          pageSize: pageSize,
          hasLoaded: true
        });
      });
  }

  onPageChange(page, pageSize) {
    this.setState({ page, pageSize }, () => {
      this.debounceFetch();
    });
  }

  onSortChange(sortKey, sortDirection) {
    this.setState({ sortKey, sortDirection, page: 1 }, () => {
      this.debounceFetch();
    });
  }

  onSearchChange(value) {
    this.setState({ search: value, page: 1 }, () => {
      this.debounceFetch();
    });
  }

  onChangeSelection(selectedColumns) {
    this.setState({ visibleColumns: selectedColumns });
  }

  getRecords() {
    return this.state.data && this.state.data.map((user) => {
      return {
        id:             user.id,
        name:           user.name,
        email:          user.email,
        org_ids:        user.org_ids,
        invitation_sent_at: user.invitation_sent_at,
        invitation_accepted_at: user.invitation_accepted_at,
        last_sign_in_at: user.last_sign_in_at,
        profile_img_url: user.profile_img_url
      };
    });
  }

  onRowClick(user) {
    const userId = user.get('id');
    this.context.router.history.push(
      Urls.customer_user(userId)
    );
  }

  render() {
    const renderId = (user) => {
      return <p className="tx-type--secondary">{user.get('id')}</p>;
    };

    const renderProperty = (user, prop) => {
      return user.get(prop) || '';
    };

    const renderDateTime = (user, prop) => {
      return <BaseTableTypes.Time data={user.get(prop)} />;
    };

    const renderOrganization = (user) => {
      const org_ids = user.get('org_ids');
      const org_names = org_ids && org_ids.map((id) => {
        const organization = id && OrganizationStore.getById(id);
        return organization && organization.get('name');
      });
      return org_names.join(', ') || '';
    };

    const renderDeleteButton = (user) => {
      return (
        <Button
          onClick={() => {
            ModalActions.openWithData('RemoveUserModal', user);
          }}
          type="info"
          size="small"
          height="short"
          icon="fa-light fa-trash"
          link
        />
      );
    };

    const columns = [
      <Column
        renderCellContent={(user) => renderProperty(user, 'name')}
        header="name"
        sortable
        onSortChange={this.onSortChange}
        id="name"
        key="column-name"
        defaultAsc={false}
      />,
      <Column
        renderCellContent={renderId}
        header="ID"
        sortable
        onSortChange={this.onSortChange}
        id="id"
        key="column-id"
        disableFormatHeader
      />,
      <Column
        renderCellContent={(user) => renderProperty(user, 'email')}
        sortable
        onSortChange={this.onSortChange}
        header="email"
        id="email"
        key="column-email"
      />,
      <Column
        renderCellContent={(user) => renderOrganization(user)}
        header="organizations"
        id="organizations"
        key="column-organizations"
      />,
      <Column
        renderCellContent={(user) => renderDateTime(user, 'invitation_sent_at')}
        header="invitation sent at"
        id="invitation_sent_at"
        key="column-invitation_sent_at"
        sortable
        onSortChange={this.onSortChange}
      />,
      <Column
        renderCellContent={(user) => renderDateTime(user, 'invitation_accepted_at')}
        header="invitation accepted at"
        id="invitation_accepted_at"
        key="column-invitation_accepted_at"
        sortable
        onSortChange={this.onSortChange}
      />,
      <Column
        renderCellContent={(user) => renderDateTime(user, 'last_sign_in_at')}
        header="last login"
        id="last_sign_in_at"
        key="column-last_sign_in_at"
        sortable
        onSortChange={this.onSortChange}
      />,
      <Column
        renderCellContent={(user) => renderDeleteButton(user)}
        header=""
        id="delete-button"
        key="column-action"
        relativeWidth={0.3}
      />
    ];

    const renderColumn = (column) => {
      switch (column.props.id) {
        case 'delete-button': return FeatureStore.hasPlatformFeature(FeatureConstants.CAN_REMOVE_USERS_FROM_PLATFORM);
        default: return true;
      }
    };

    return (
      <div className="tx-stack">
        <div className="tx-stack__block tx-users__search-bar">
          <SearchField
            name="search-field"
            searchType="Id, Name or Email"
            value={this.state.search}
            onChange={(e) => this.onSearchChange(e.target.value)}
            reset={() => this.onSearchChange('')}
          />
        </div>
        <div>
          <List
            id={KeyRegistry.CUSTOMERS_USERS_TABLE}
            data={Immutable.fromJS(this.getRecords())}
            showPagination
            pageSizeOptions={this.state.pageSizeOptions}
            pageSize={this.state.pageSize}
            onPageChange={this.onPageChange}
            maxPage={this.state.maxPage}
            currentPage={this.state.page}
            disabledSelection
            loaded={this.state.hasLoaded}
            visibleColumns={this.state.visibleColumns}
            persistKeyInfo={UserPreference.packInfo(KeyRegistry.CUSTOMERS_USERS_TABLE)}
            onChangeSelection={this.onChangeSelection}
            showColumnFilter
            onRowClick={this.onRowClick}
          >
            { columns.filter((column) => (renderColumn(column))) }
          </List>
        </div>
        <RemoveUserModal
          modalId="RemoveUserModal"
          fetchUserList={this.debounceFetch}
        />
      </div>
    );
  }
}

Users.contextTypes = {
  router: PropTypes.object.isRequired
};

export default Users;
