import PropTypes from 'prop-types';
import React from 'react';
import Immutable from 'immutable';

import { Column, List, SearchField, DateTime, TopFilterBar } from '@transcriptic/amino';
import BaseTableTypes from 'main/components/BaseTableTypes';
import ContainerDestructionActions from 'main/actions/ContainerDestructionActions';
import ContainerDestructionStore from 'main/stores/ContainerDestructionStore';
import ContainerStore from 'main/stores/ContainerStore';
import ContainerActions from 'main/actions/ContainerActions';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';
import { PAGE_SIZE_OPTION_2, PAGE_SIZE_OPTIONS } from 'main/util/List';

export class ContainerDestructionPane extends React.Component {

  constructor(props, context) {
    super(props, context);
    this.onDestroy = this.onDestroy.bind(this);
    this.onRestore = this.onRestore.bind(this);
    this.onResultsChange = this.onResultsChange.bind(this);
    this.onSelectionChange = this.onSelectionChange.bind(this);
    this.currentSelection = this.currentSelection.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
    this.onSortChange = this.onSortChange.bind(this);
    this.fetch = this.fetch.bind(this);
    this.state = {
      selected: {},
      pageSize: PAGE_SIZE_OPTION_2,
      page: 1,
      maxPage: 1,
      sortKey: 'created_at',
      sortDirection: 'desc'
    };
  }

  componentDidMount() {
    this.fetch();
  }

  fetch() {
    const { page, pageSize, sortKey, sortDirection, search } = this.state;
    ContainerDestructionActions.search(
      page,
      pageSize,
      { orderBy: sortKey, direction: sortDirection, search }
    )
      .then(({ pagination, results }) => {
        if (results.filter(data => data.status === 'pending_destroy').length == 0 && page > 1) {
          this.setState({ page: 1 }, this.fetch);
          return;
        }
        const maxPage = pagination.total_pages;
        this.setState({ page: pagination.page, maxPage, hasLoaded: true, selected: {} });
      })
      .fail(() => {
        this.setState({ hasLoaded: true });
      });
  }

  onSelectionChange(selected) {
    return this.setState({
      selected
    });
  }

  onResultsChange() {
    return this.onSelectionChange([]);
  }

  onSearchChange(query) {
    this.setState({ search: query, page: 1 }, this.fetch);
  }

  currentSelection() {
    const selectedRows = Object.keys(this.state.selected);
    return this.props.destructionRequests
      .filter(row => selectedRows.includes(row.id))
      .map(row => row.containerId);
  }

  onDestroy(done) {
    const ids = this.currentSelection();
    return ContainerActions.destroyManyContainer(ids, false).always(() => {
      done();
      this.fetch();
    });
  }

  onRestore(done) {
    const ids = this.currentSelection();
    return ContainerActions.restoreMany(ids).always(() => {
      done();
      this.fetch();
    });
  }

  onPageChange(page, pageSize) {
    this.setState({ page, pageSize }, this.fetch);
  }

  onSortChange(sortKey, sortDirection) {
    this.setState({ sortKey, sortDirection, page: 1 }, this.fetch);
  }

  renderContainer(destructionContainer) {
    const container = destructionContainer.get('container').toJS();
    return FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, destructionContainer.get('labId')) ?
      <BaseTableTypes.ContainerDetailsUrl data={container} /> : container.id;
  }

  renderOrgSubdomain(destructionContainer) {
    const organizationUrl = destructionContainer.get('organizationSubdomain').toJS();
    return organizationUrl.subdomain;
  }

  renderBarCode(destructionContainer) {
    return destructionContainer.get('barcode');
  }

  renderCtypeId(destructionContainer) {
    const containerTypeId = destructionContainer.get('containerTypeId');
    return <BaseTableTypes.ContainerTypeId data={containerTypeId} />;
  }

  renderHumanPath(destructionContainer) {
    return <p>{destructionContainer.get('humanPath')}</p>;
  }

  renderRequester(destructionContainer) {
    return <p>{destructionContainer.get('requester')}</p>;
  }

  renderStatus(destructionContainer) {
    if (!destructionContainer.get('status')) return '__';
    return destructionContainer.get('status');
  }

  renderCreatedAt(destructionContainer) {
    return <DateTime timestamp={new Date(destructionContainer.get('createdAt'))} />;
  }

  render() {

    const records = this.props.destructionRequests;
    return (
      <div className="tx-stack tx-stack--xxs">
        {AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_CONTAINER_DESTRUCTION_REQUESTS) && (
          <TopFilterBar>
            <TopFilterBar.Wrapper>
              <SearchField
                name="search-field"
                searchType="Container ID"
                value={this.state.search}
                onChange={(e) => this.onSearchChange(e.target.value)}
              />
            </TopFilterBar.Wrapper>
          </TopFilterBar>
        )}
        <List
          data={Immutable.fromJS(records)}
          showPagination
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          pageSize={this.state.pageSize}
          onPageChange={this.onPageChange}
          maxPage={this.state.maxPage}
          currentPage={this.state.page}
          loaded={this.state.hasLoaded}
          onSelectRow={(record, willBeSelected, selectedRows) => { this.setState({ selected: selectedRows }); }}
          onSelectAll={(selectedRows) => { this.setState({ selected: selectedRows }); }}
          selected={this.state.selected}
          id="destruction-list"
          actions={[
            {
              title: 'Confirm destruction',
              action: (_a, _b, done) => this.onDestroy(done),
              icon: 'far fa-trash-alt',
              waitForAction: true
            },
            {
              title: 'Remove destruction request',
              action: (_a, _b, done) => this.onRestore(done),
              waitForAction: true
            }
          ]}
        >
          <Column renderCellContent={this.renderContainer} header="container" id="container-column" />
          <Column renderCellContent={this.renderOrgSubdomain} sortable onSortChange={this.onSortChange} header="Organization" id="organizationSubdomain" />
          <Column renderCellContent={this.renderBarCode} sortable onSortChange={this.onSortChange} header="barcode" id="barcode" />
          <Column renderCellContent={this.renderCtypeId}  sortable onSortChange={this.onSortChange} header="container type" id="containerTypeId" />
          <Column renderCellContent={this.renderHumanPath} sortable onSortChange={this.onSortChange} header="Location" id="humanPath" />
          <Column renderCellContent={this.renderRequester} header="requester" id="requester" />
          <Column renderCellContent={this.renderStatus} sortable onSortChange={this.onSortChange} header="status" id="status" />
          <Column renderCellContent={this.renderCreatedAt}  sortable onSortChange={this.onSortChange} header="created At" id="createdAt" />
        </List>
      </div>
    );
  }
}

ContainerDestructionPane.propTypes = {
  destructionRequests: PropTypes.arrayOf(
    PropTypes.shape({
      container: PropTypes.object.isRequired,
      barcode: PropTypes.string,
      containerTypeId: PropTypes.string.isRequired,
      humanPath: PropTypes.string,
      organizationSubdomain: PropTypes.object.isRequired,
      requester: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired
    })
  )
};

const getStateFromStores = function() {
  const destructionRequests = ContainerDestructionStore.getLastSearch()
    .map((dr) => {
      const destructionRequest = dr.toJS();
      const container = ContainerStore.getById(destructionRequest.containerId);

      const label = container != undefined ? container.get('label') : undefined;
      let requester;
      if (destructionRequest.adminId) {
        requester = 'Admin';
      } else if (destructionRequest.userId) {
        requester = 'User';
      } else if (destructionRequest.jobId) {
        requester = 'System';
      }

      return Object.assign(destructionRequest, {
        requester,
        organizationSubdomain: { subdomain: destructionRequest.organizationSubdomain },
        container: { id: destructionRequest.containerId, label }
      });
    })
    .filter(dr => dr.status === 'pending_destroy');

  return {
    destructionRequests
  };
};

const ConnectedContainerDestructionPane = ConnectToStores(
  ContainerDestructionPane,
  getStateFromStores
);

export default ConnectedContainerDestructionPane;
