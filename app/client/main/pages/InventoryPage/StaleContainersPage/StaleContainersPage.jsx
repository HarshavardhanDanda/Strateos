import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { SearchField, Popover, Column, List, DateTime, TopFilterBar, ButtonGroup, Button } from '@transcriptic/amino';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import StaleContainerActions from 'main/actions/StaleContainerActions';
import ContainerActions from 'main/actions/ContainerActions';
import { StaleContainerSearchStore } from 'main/stores/search';
import ContainerStore from 'main/stores/ContainerStore';
import BaseTableTypes from 'main/components/BaseTableTypes';
import { Location } from 'main/inventory/ContainerProperties';
import { PAGE_SIZE_OPTION_2, PAGE_SIZE_OPTIONS } from 'main/util/List';

export class StaleContainerPane extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.fetch = this.fetch.bind(this);
    this.onDestroyWithoutNotice = this.onDestroyWithoutNotice.bind(this);
    this.onExtend = this.onExtend.bind(this);
    this.onResultsChange = this.onResultsChange.bind(this);
    this.onSelectionChange = this.onSelectionChange.bind(this);
    this.onSendNotice = this.onSendNotice.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSortChange = this.onSortChange.bind(this);

    this.state = {
      selected: {},
      pageSize: PAGE_SIZE_OPTION_2,
      page: 1,
      maxPage: 1,
      search: ''
    };
  }

  componentDidMount() {
    this.fetch();
  }

  onSelectionChange(selected) {
    this.setState({
      selected
    });
  }

  onResultsChange(results) {
    this.setState({
      results,
      selected: {}
    });
  }

  onSendNotice(done) {
    const ids = this.currentSelection().map(r => r.id.toString());
    return StaleContainerActions.flagForStaleNotifications(ids).always(() => {
      done();
      this.setState({
        selected: {}
      });
    });
  }

  onSearchChange() {
    this.setState({ search: this.state.search, page: 1 }, this.fetch);
  }

  onExtend(done) {
    const ids = this.currentSelection().map(r => r.id.toString());
    StaleContainerActions.flagForExtensions(ids).always(() => {
      done();
      this.setState({
        selected: {}
      });
    });
  }

  onDestroyWithoutNotice(done) {
    const ids = this.currentSelection().map(r => r.containerId);
    ContainerActions.destroyMany(ids).always(() => {
      done();
      this.setState({
        selected: {}
      });
    });
  }

  fetch() {
    const { page, pageSize, sortKey, sortDirection, search } = this.state;
    StaleContainerActions.search(
      page,
      pageSize,
      {
        search,
        direction: sortDirection,
        orderBy: sortKey
      }
    )
      .then(({ pagination }) => {
        const maxPage = pagination.total_pages;
        this.setState({ page: pagination.page, maxPage, hasLoaded: true, selected: {} });
      })
      .fail(() => {
        this.setState({ hasLoaded: true });
      }
      );
  }

  currentSelection() {
    return this.props.results.filter(row => Object.keys(this.state.selected).includes(row.id));
  }

  isStaleActionDisabled() {
    return (
      this.currentSelection().length === 0 ||
      _.some(this.currentSelection(), (r) => {
        return (
          r.adminFlaggedForNotificationAt ||
          r.adminFlaggedForExtensionAt ||
          r.destructionRequest
        );
      })
    );
  }

  isExtendActionDisabled() {
    return (
      this.currentSelection().length === 0 ||
      _.some(this.currentSelection(), (r) => {
        return (
          !r.adminFlaggedForNotificationAt ||
          r.adminFlaggedForExtensionAt ||
          r.destructionRequest
        );
      })
    );
  }

  isDestroyActionDisabled() {
    return (
      this.currentSelection().length === 0 ||
      _.some(this.currentSelection(), r => r.destructionRequest)
    );
  }

  onPageChange(page, pageSize) {
    this.setState({ page, pageSize }, this.fetch);
  }

  onSortChange(sortKey, sortDirection) {
    this.setState({ sortKey, sortDirection, page: 1 }, this.fetch);
  }

  renderContainer(staleContainer) {
    const container = staleContainer.get('container').toJS();
    return <BaseTableTypes.ContainerDetailsUrl data={container} />;
  }

  renderOrgName(staleContainer) {
    const organization = staleContainer.get('organization').toJS();
    return `${(organization.name)}`;
  }

  renderCtypeId(staleContainer) {
    const containerTypeId = staleContainer.get('containerTypeId');
    return <BaseTableTypes.ContainerTypeId data={containerTypeId} />;
  }

  renderNotifiedAt(staleContainer) {
    if (!staleContainer.get('adminFlaggedForNotificationAt')) return '__';
    return <DateTime timestamp={new Date(staleContainer.get('adminFlaggedForNotificationAt'))} />;
  }

  renderExtendedAt(staleContainer) {
    if (!staleContainer.get('adminFlaggedForExtensionAt')) return '__';
    return <DateTime timestamp={new Date(staleContainer.get('adminFlaggedForExtensionAt'))} />;
  }

  renderCreatedAt(staleContainer) {
    if (!staleContainer.get('createdAt')) return '__';
    return <DateTime timestamp={new Date(staleContainer.get('createdAt'))} />;
  }

  renderDestructionRequest(staleContainer) {
    if (!staleContainer.get('destructionRequest')) return '__';
    return staleContainer.get('destructionRequest');
  }

  render() {
    const actions = [
      {
        title: 'Send stale notice',
        action: (_a, _b, done) => this.onSendNotice(done),
        disabled: this.isStaleActionDisabled(),
        waitForAction: true
      },
      {
        title: 'Give extension',
        action: (_a, _b, done) => this.onExtend(done),
        disabled: this.isExtendActionDisabled(),
        waitForAction: true
      },
      {
        title: 'Destroy without notice',
        action: (_a, _b, done) => this.onDestroyWithoutNotice(done),
        disabled: this.isDestroyActionDisabled(),
        icon: 'far fa-trash-alt',
        waitForAction: true
      }
    ];

    return (
      <div className="tx-stack tx-stack--md">
        <div className="tx-stack tx-stack--xs">
          <TopFilterBar>
            <TopFilterBar.Wrapper>
              <SearchField
                name="search-field"
                searchType="Container ID"
                value={this.state.search}
                onChange={(e) => this.setState({ search: e.target.value }, this.onSearchChange)}
                reset={() => this.setState({ search: '' }, this.onSearchChange)}
              />
            </TopFilterBar.Wrapper>
          </TopFilterBar>
          <ButtonGroup>
            <Popover
              placement="right"
              content={(
                <ul>
                  <li>
                    {`Send Stale Notice - Notifies the customer they have 2 weeks to
                      use the container or it will be destroyed. After 2 weeks it will
                      appear as a container destruction request`}
                  </li>
                  <li>
                    {`Give Extension - Extends the container for 2 weeks. After 2 weeks it will
                      reappear in this list and can be marked as stale once again.`}
                  </li>
                  <li>
                    {`Destroy Without Notice - Send this container directly to container
                      destruction requests without notifying the customer or waiting 2 weeks`}
                  </li>
                </ul>
              )}
            >
              <Button icon="fa fa-question-circle" heavy={false} link>Directions</Button>
            </Popover>
          </ButtonGroup>
          <List
            data={Immutable.fromJS(this.props.results)}
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
            id="slatecontainer-list"
            actions={actions}
          >
            <Column renderCellContent={this.renderContainer} header="Container" id="container" />
            <Column renderCellContent={this.renderCtypeId}  sortable onSortChange={this.onSortChange} header="container Type" id="containerTypeId" />
            <Column renderCellContent={Location} sortable onSortChange={this.onSortChange} header="Location" id="locationName" />
            <Column renderCellContent={this.renderOrgName} sortable onSortChange={this.onSortChange} header="Organization" id="organization_name" />
            <Column renderCellContent={this.renderCreatedAt}  sortable onSortChange={this.onSortChange} header="Created" id="createdAt" />
            <Column renderCellContent={this.renderNotifiedAt} sortable onSortChange={this.onSortChange} header="Notified At" id="adminFlaggedForNotificationAt" />
            <Column renderCellContent={this.renderExtendedAt} sortable onSortChange={this.onSortChange} header="Extended At" id="adminFlaggedForExtensionAt" />
          </List>
        </div>
      </div>
    );
  }
}

StaleContainerPane.propTypes = {
  results: PropTypes.arrayOf(PropTypes.object)
};

const getStateFromStores = function() {
  const results = StaleContainerSearchStore.getLatestResults().toJS().map((s) => {
    const container = { id: s.containerId };
    const organization_name = { name: (s.organizationName) };

    // TODO: Need to think about the best way to do this...
    // Probably need to push container information from the route into stores and
    // then use store data. There is probably a nice way to handle this
    // generically
    const status =
      ContainerStore.getById(s.containerId) ? ContainerStore.getById(s.containerId).get('status') : undefined ||
        s.containerStatus;
    const destructionRequest = status !== 'available' ? true : undefined;

    return { container, organization_name, destructionRequest, ...s };
  })
    .filter(s => s.containerStatus !== 'destroyed');

  return { results };
};

export default ConnectToStores(StaleContainerPane, getStateFromStores);
