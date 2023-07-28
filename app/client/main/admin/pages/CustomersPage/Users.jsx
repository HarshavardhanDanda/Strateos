import PropTypes from 'prop-types';
import React from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import { Column, InputsController, List, SearchField } from '@transcriptic/amino';

import connectToStores from 'main/containers/ConnectToStoresHOC';
import { UserSearchStore } from 'main/stores/search';
import UserStore from 'main/stores/UserStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import AdminUrls from 'main/admin/urls';
import AdminUserActions from 'main/admin/actions/UserActions';
import { PAGE_SIZE_OPTIONS } from 'main/util/List';

import './Users.scss';

class Users extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: undefined,
      pageSize: 12,
      page: 1,
      maxPage: 1,
      search: '',
      sortKey: 'created_at',
      visibleColumns: ['name', 'ID', 'email', 'organizations', 'feature groups']
    };
    this.onMasquerade = this.onMasquerade.bind(this);
    this.onSortChange = this.onSortChange.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
    this.onSelectRow = this.onSelectRow.bind(this);
    this.onChangeSelection = this.onChangeSelection.bind(this);
    this.onRowClick   = this.onRowClick.bind(this);
    this.debounceFetch = _.debounce(this.fetch, 250).bind(this);
  }

  componentDidMount() {
    this.fetch();
  }

  fetch() {
    const { page, pageSize, sortKey, sortDirection, search } = this.state;
    AdminUserActions.search(
      page,
      pageSize,
      { orderBy: sortKey, direction: sortDirection, search }
    )
      .then(({ pagination }) => {
        const maxPage = pagination.total_pages;
        this.setState({ page: pagination.page, maxPage, selected: undefined });
      })
      .fail(() => {
        this.setState({ hasLoaded: true });
      });
  }

  getActions() {
    return [
      {
        title: 'Masquerade',
        icon: 'far fa-user',
        label: 'Masquerade',
        action: this.onMasquerade
      }
    ];
  }

  onMasquerade() {
    const selectedUserId = Object.keys(this.state.selected)[0];
    const masqueradeURL = AdminUrls.masquerade(selectedUserId);
    window.location = masqueradeURL;
  }

  isMasqueradeDisabled() {
    return !this.state.selected || Object.keys(this.state.selected).length !== 1;
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

  onSearchChange() {
    this.setState({ search: this.state.search, page: 1 }, () => {
      this.debounceFetch();
    });
  }

  onSelectRow(record, willBeSelected, selectedRows) {
    this.setState({ selected: selectedRows }, () => {
      const actions = this.getActions();
      if (!this.isMasqueradeDisabled()) {
        this.setState({ actions });
      } else {
        const newActions = actions.filter(action => action.title !== 'Masquerade');
        this.setState({ actions: newActions });
      }
    });
  }

  onChangeSelection(selectedColumns) {
    this.setState({ visibleColumns: selectedColumns });
  }

  getRecords() {
    return  this.props.results.map((user) => {
      return {
        id:             user.id,
        name:           user.name,
        email:          user.email,
        organizations:  user.organizations ? user.organizations.map(org => org.name) : [],
        feature_groups: user.featureGroups
      };
    });
  }

  onRowClick(user) {
    const userId = user.get('id');
    this.context.router.history.push(
      AdminUrls.customer_user(userId)
    );
  }

  render() {
    const renderId = (user) => {
      return <p className="tx-type--secondary">{user.get('id')}</p>;
    };

    const renderProperty = (user, prop) => {
      return user.get(prop) || '';
    };

    const renderListProperty = (user, prop) => {
      return (user.get(prop) && user.get(prop).join(',')) || '';
    };

    const columns = [
      <Column
        renderCellContent={(user) => renderProperty(user, 'name')}
        header="name"
        sortable
        onSortChange={this.onSortChange}
        id="name"
        key="column-name"
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
        renderCellContent={(user) => renderListProperty(user, 'organizations')}
        header="organizations"
        id="organizations"
        key="column-organizations"
      />,
      <Column
        renderCellContent={(user) => renderListProperty(user, 'feature_groups')}
        header="feature groups"
        id="featureGroups"
        key="column-featureGroups"
      />
    ];

    return (
      <div className="tx-stack">
        <div className="tx-stack__block tx-users__search-bar">
          <InputsController
            inputChangeCallback={state => this.setState({ search: state['search-field'] }, this.onSearchChange)}
          >
            <SearchField
              name="search-field"
              searchType="Id, Name or Email"
              value={this.state.search}
            />
          </InputsController>
        </div>
        <div>
          <List
            data={Immutable.fromJS(this.getRecords())}
            id={KeyRegistry.ADMIN_CUSTOMERS_USERS_TABLE}
            showPagination
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            pageSize={this.state.pageSize}
            onPageChange={this.onPageChange}
            maxPage={this.state.maxPage}
            currentPage={this.state.page}
            loaded={() => _.isEmpty(this.props.results)}
            onSelectRow={this.onSelectRow}
            onSelectAll={(selectedRows) => { this.setState({ selected: selectedRows }); }}
            selected={this.state.selected}
            actions={this.state.actions}
            visibleColumns={this.state.visibleColumns}
            persistKeyInfo={UserPreference.packInfo(KeyRegistry.ADMIN_CUSTOMERS_USERS_TABLE)}
            onChangeSelection={this.onChangeSelection}
            showColumnFilter
            onRowClick={this.onRowClick}
          >
            {
              columns
            }
          </List>
        </div>
      </div>
    );
  }
}

Users.contextTypes = {
  router: PropTypes.object.isRequired
};

Users.propTypes = {
  results: PropTypes.arrayOf(PropTypes.object)
};

const getStateFromStores = () => {
  const lastSearch = UserSearchStore.getLatestSearch();
  let results = [];
  if (lastSearch) {
    const ids = lastSearch.get('results').toJS();
    results   = UserStore.getByIds(ids).map(result => result.toJS());
  }
  return { results };
};

export default connectToStores(Users, getStateFromStores);
