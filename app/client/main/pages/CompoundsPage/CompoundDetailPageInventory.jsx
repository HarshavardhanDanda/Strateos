import Immutable from 'immutable';
import lodash from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { NavLink } from 'react-router-dom';
import classNames from 'classnames';
import { Button, Column, List, ZeroState, Spinner, Table } from '@transcriptic/amino';

import ContainerActions from 'main/actions/ContainerActions';
import AliquotAPI from 'main/api/AliquotAPI';
import ContainerStore from 'main/stores/ContainerStore';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import Urls from 'main/util/urls';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import UserStore from 'main/stores/UserStore';
import AliquotStore from 'main/stores/AliquotStore';
import AliquotCompoundLinkStore from 'main/stores/AliquotCompoundLinkStore';
import UserProfile from 'main/components/UserProfile/UserProfile';
import UserActions from 'main/actions/UserActions';
import ContainerTypeHelper from 'main/helpers/ContainerType';
import NotificationActions from 'main/actions/NotificationActions';
import { TabLayout, TabLayoutTopbar } from 'main/components/TabLayout';
import BaseTableTypes from 'main/components/BaseTableTypes';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import { PAGE_SIZE_OPTIONS } from 'main/util/List';
import CompoundInventoryFilters from './CompoundInventoryFilters';
import './CompoundDetailPageInventory.scss';

class CompoundDetailPageInventory extends React.Component {
  static get propTypes() {
    return {
      id: PropTypes.string.isRequired
    };
  }

  static get contextTypes() {
    return {
      router: PropTypes.object.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    lodash.bindAll(
      this,
      'search',
      'onRowClick',
      'onSortChange',
      'onPageChange',
      'onSearchPageChange',
      'renderExpandedRow',
      'renderConcentration',
      'fetchAliquots',
      'onScroll'
    );

    this.state = {
      containerIds: [],
      aliquotIds: {},
      page: 1,
      perPage: 10,
      numPages: 1,
      loading: true,
      inventoryFilters: {},
      searchSortBy: 'updated_at',
      descending: true,
      hasResultsInTheFirstCall: false,
      visibleColumns: ['', 'type', 'name', 'format', 'id', 'contents', 'condition',
        'organization', 'barcode', 'created', 'last used', 'code', 'created by'],
      expanded: {},
      expandedLoading: {},
      aliquotCompoundLinksCount: {}
    };
    this.debounceSearch = lodash.debounce(this.search, 500).bind(this);
  }

  componentDidMount() {
    this.search();
  }

  componentDidUpdate(_, prevState) {
    const prevInventoryFilters = { ...prevState.inventoryFilters };
    const currInventoryFilters = { ...this.state.inventoryFilters };

    if (!lodash.isEmpty(prevInventoryFilters) && !lodash.isEmpty(currInventoryFilters)) {
      lodash.update(prevInventoryFilters, 'query', (value) => value.trim());
      lodash.update(currInventoryFilters, 'query', (value) => value.trim());
    }

    if (!lodash.isEqual(prevInventoryFilters, currInventoryFilters)) {
      this.debounceSearch();
    }
  }

  search() {
    const { inventoryFilters } = this.state;
    const data = {
      query: inventoryFilters.query ? inventoryFilters.query.trim() : '*',
      search_fields: inventoryFilters.searchFields,
      ignore_score: true,
      page: this.state.page,
      per_page: this.state.perPage,
      sort_by: this.state.searchSortBy,
      sort_desc: this.state.descending,
      compound_link_id: this.props.id,
      status: 'all_except_deleted',
      container_type: inventoryFilters.searchContainerType
    };

    ContainerActions.search(data)
      .done(resp => {
        const containerIds = resp.data.map(entity => entity.id);
        const userIds = resp.data.map(entity => entity.attributes.created_by);
        UserActions.loadUsers(userIds);
        const total    = resp.meta.record_count;
        const numPages = Math.ceil(total / this.state.perPage);
        this.setState({ containerIds: containerIds, numPages: numPages, loading: false });
      });
  }

  onPageChange(requestedPage, requestedPageSize) {
    if (requestedPage !== this.state.page) {
      this.onSearchPageChange(requestedPage);
    }

    if (requestedPageSize !== this.state.perPage) {
      this.setState({ loading: true, perPage: requestedPageSize }, () => {
        this.search();
      });
    }
  }

  onSearchPageChange(page) {
    this.setState({ loading: true, page }, this.search);
  }

  onInventorySearchFilterChange = (inventoryFilters) => {
    this.setState({ inventoryFilters });
  };

  onSortChange(key, direction) {
    this.setState({
      searchSortBy: key,
      descending: direction === 'desc'
    }, () => {
      this.search();
    });
  }

  onRowClick(container) {
    const url =  Urls.container(container.get('id'));
    this.context.router.history.push(url);
  }

  linkButtonProps() {
    return {
      subTitle: 'You can link existing inventory if you want.',
      button: (
        <NavLink to={Urls.samples()}>
          <Button type="primary" size="large">
            Link Inventory
          </Button>
        </NavLink>
      )
    };
  }

  fetchAliquots(containerId, firstCall) {
    let currentPage;
    const limit = 12;
    const aliquot_count = lodash.size(this.state.aliquotIds[containerId]);
    aliquot_count === 0 ? currentPage = 1 : currentPage = Math.ceil(aliquot_count / limit) + 1;

    if (!firstCall && aliquot_count === this.state.aliquotCompoundLinksCount[containerId]) {
      this.setState((prevState) => {
        return { expandedLoading: { ...prevState.expandedLoading, [containerId]: false } };
      });
    } else {
      !firstCall && this.setState((prevState) => {
        return { expandedLoading: { ...prevState.expandedLoading, [containerId]: true } };
      });
      AliquotAPI.index({
        filters: {
          compound: this.props.id,
          container_id: containerId
        },
        includes: ['aliquots_compound_links'],
        limit,
        offset: (currentPage - 1) * limit
      })
        .done(response => {
          const aliquotIds = lodash.map(response.data, 'id');
          this.setState((prevState) => {
            return {
              expandedLoading: { ...prevState.expandedLoading, [containerId]: false },
              aliquotIds: { ...prevState.aliquotIds, [containerId]: [...lodash.values(prevState.aliquotIds[containerId]), ...aliquotIds] },
            };
          });
          firstCall && this.setState((prevState) => { return { aliquotCompoundLinksCount: { ...prevState.aliquotCompoundLinksCount, [containerId]: response.meta.record_count } }; });
        })
        .fail((...args) => {
          NotificationActions.handleError(...args);
          this.setState((prevState) => {
            return { expandedLoading: { ...prevState.expandedLoading, [containerId]: false } };
          });
        }
        );
    }
  }

  loadAliquots(container) {
    const containerAliquots = AliquotStore.getByContainer(container.get('id'));
    const compoundRelatedAliquots = containerAliquots.filter((aliquot) => lodash.values(this.state.aliquotIds[container.get('id')]).includes(aliquot.get('id')));

    if (!this.state.expandedLoading[container.get('id')] && compoundRelatedAliquots.isEmpty() && !lodash.values(this.state.expandedLoading).includes(true)) {
      this.fetchAliquots(container.get('id'), true);
    }
  }

  onExpandRow = (_record, _willBeExpanded, expanded) => {
    this.setState({ expanded });
    _willBeExpanded && this.loadAliquots(_record);
  };

  onScroll(event) {
    const { scrollTop, scrollHeight, clientHeight, id } = event.target;

    if (scrollTop + clientHeight === scrollHeight) {
      !this.state.expandedLoading[id] && this.fetchAliquots(id, false);
    }
  }

  renderName(container) {
    return (
      <p>
        {container.get('label')}
      </p>
    );
  }

  renderId(container) {
    return <p className="tx-type--secondary">{container.get('id')}</p>;
  }

  renderCondition(container) {
    return <p className="tx-type--secondary">{container.get('storage_condition') || '—'}</p>;
  }

  renderType(container)  {
    if (container.get('test_mode')) {
      return <h3><i className="tx-type--warning fas fa-flask test-icon" /></h3>;
    }
    const cTypeId = container.get('container_type_id');
    const containerType = ContainerTypeStore.getById(cTypeId);
    const isTube = containerType && containerType.get('is_tube');

    return <i className={classNames('baby-icon', isTube ? 'aminol-tube' : 'aminol-plate')} />;
  }

  renderCtypeId(container) {
    return <p className="tx-type--secondary">{container.get('container_type_id') || '—'}</p>;
  }

  renderContentsColumn(container) {
    const aliquotCount = container.get('aliquot_count');
    const aliquots     = container.get('aliquots');
    const count = aliquotCount || aliquots;
    return <p className="tx-type--secondary">{count ? `${count} aliquot${count > 1 ? 's' : ''}` : '—'}</p>;
  }

  renderBarcode(container) {
    return <p className="tx-type--secondary">{container.get('barcode') || '—'}</p>;
  }

  renderCreatedAt(container) {
    return <BaseTableTypes.Time data={container.get('created_at')} />;
  }

  renderLastUsed(container) {
    return <BaseTableTypes.Time data={container.get('updated_at')} />;
  }

  renderOrganization(container) {
    return <p className="tx-type--secondary">{(container.get('organization_name') || container.getIn(['organization', 'name'])) || '-'}</p>;
  }

  renderCreatedBy(container) {
    const user = UserStore.getById(container.get('created_by'));
    return (user ? <UserProfile user={user} onModal /> : '-');
  }

  renderWellIndex(containerAliquot, container) {
    const containerType = ContainerTypeStore.getById(container.get('container_type_id'));
    const helper = new ContainerTypeHelper({ col_count: containerType.get('col_count') });
    const wellIndex = containerAliquot.get('well_idx');
    return helper.humanWell(wellIndex);
  }

  renderConcentration(containerAliquot) {
    const aliquotCompoundLinks =  AliquotCompoundLinkStore.getByAliquotAndCompoundLinkId(containerAliquot.get('id'), this.props.id);
    const volume = containerAliquot.get('volume_ul');
    const concentration = aliquotCompoundLinks && aliquotCompoundLinks.first().get('concentration');
    return concentration ? (concentration + ' mM') : ((volume && lodash.gt(volume, 0)) ? '-' : 'N/A');
  }

  renderExpandedRow(container) {
    const containerAliquots = AliquotStore.getByContainer(container.get('id')).sortBy(aq => aq.get('well_idx'));
    const compoundRelatedAliquots = containerAliquots.filter((aliquot) => lodash.values(this.state.aliquotIds[container.get('id')]).includes(aliquot.get('id')));

    const columns = [
      <Column
        renderCellContent={(record) => this.renderWellIndex(record, container)}
        header="Well"
        id="Well"
        key="well"
      />,
      <Column
        renderCellContent={(record) => (record.get('volume_ul') ? record.get('volume_ul') + ' μL' : '-')}
        header="Volume"
        id="volume"
        key="volume"
      />,
      <Column
        renderCellContent={(record) => (record.get('mass_mg') ? record.get('mass_mg') + ' mg' : '-')}
        header="Mass"
        id="mass"
        key="mass"
      />,
      <Column
        renderCellContent={this.renderConcentration}
        header="Concentration"
        id="concentration"
        key="concentration"
      />
    ];

    return (
      (compoundRelatedAliquots && (
        <div className="compound-detail-page-inventory__scroll" id={container.get('id')} onScroll={this.onScroll}>
          <Table
            loaded={this.state.expandedLoading[container.get('id')] !== undefined}
            disabledSelection
            data={compoundRelatedAliquots}
            id="aliquots-table"
            disableBorder
          >
            {columns}
          </Table>
          {this.state.expandedLoading[container.get('id')] && !lodash.isUndefined(this.state.expandedLoading[container.get('id')])  && <Spinner />}
        </div>
      )
      )
    );
  }

  renderColumns() {
    return [
      <Column
        renderCellContent={this.renderType}
        header="type"
        id="is_tube"
        key="is-tube"
        sortable
        onSortChange={this.onSortChange}
        defaultAsc={false}
      />,
      <Column
        renderCellContent={this.renderCtypeId}
        header="format"
        id="container_type_id"
        key="container-type-id"
        popOver
        sortable
        onSortChange={this.onSortChange}
        defaultAsc={false}
      />,
      <Column
        renderCellContent={this.renderName}
        header="name"
        id="label"
        key="label"
        popOver
        sortable
        onSortChange={this.onSortChange}
        defaultAsc={false}
      />,
      <Column
        renderCellContent={this.renderId}
        header="id"
        id="id"
        key="id"
        popOver
      />,
      <Column
        renderCellContent={this.renderBarcode}
        header="barcode"
        id="barcode"
        key="barcode"
        popOver
      />,
      <Column
        renderCellContent={this.renderContentsColumn}
        header="contents"
        id="contents"
        key="contents"
        popOver
      />,
      <Column
        renderCellContent={this.renderCondition}
        header="condition"
        id="storage_condition"
        key="storage-condition"
        popOver
        sortable
        onSortChange={this.onSortChange}
        defaultAsc={false}
      />,
      <Column
        renderCellContent={this.renderCreatedAt}
        header="created"
        id="created_at"
        key="created-at"
        popOver
        sortable
        onSortChange={this.onSortChange}
        defaultAsc
      />,
      <Column
        renderCellContent={this.renderLastUsed}
        header="last used"
        id="updated_at"
        key="updated-at"
        sortable
        onSortChange={this.onSortChange}
        defaultAsc
        popOver
      />,
      <Column
        renderCellContent={this.renderOrganization}
        header="organization"
        id="organization_name"
        key="organization-name"
        popOver
        sortable
        onSortChange={this.onSortChange}
        defaultAsc={false}
      />,
      <Column
        renderCellContent={this.renderCreatedBy}
        header="created by"
        id="created_by"
        key="created-by"
        sortable
        onSortChange={this.onSortChange}
        defaultAsc={false}
      />];
  }

  render() {
    const { containerIds, visibleColumns, page, numPages, perPage, loading, hasResultsInTheFirstCall } = this.state;
    const containers = Immutable.fromJS(ContainerStore.getByIds(containerIds));
    if (!hasResultsInTheFirstCall && containers.size > 0) {
      this.setState({ hasResultsInTheFirstCall: true });
    }
    if (containers.size === 0 && !loading && !hasResultsInTheFirstCall) {
      return (
        <ZeroState
          title={"This compound isn't linked to any inventory yet!"}
          hasBorder={false}
          {...(AcsControls.isFeatureEnabled(FeatureConstants.LINK_INVENTORY) && this.linkButtonProps())}
        />
      );
    }

    return (
      loading ? <Spinner /> : (
        <TabLayout>
          <TabLayoutTopbar>
            <CompoundInventoryFilters
              inventoryFilters={this.state.inventoryFilters}
              onInventorySearchFilterChange={this.onInventorySearchFilterChange}
            />
          </TabLayoutTopbar>
          <List
            popoverOnHeader
            popoverOnHover
            loaded={!loading}
            data={containers}
            id={KeyRegistry.COMPOUND_DETAIL_INVENTORY_TABLE}
            showColumnFilter
            visibleColumns={visibleColumns}
            persistKeyInfo={UserPreference.packInfo(KeyRegistry.COMPOUND_DETAIL_INVENTORY_TABLE)}
            onChangeSelection={(selectedColumns) => {
              this.setState({ visibleColumns: selectedColumns });
            }}
            disabledSelection
            onRowClick={this.onRowClick}
            showPagination
            currentPage={page}
            maxPage={numPages}
            onPageChange={this.onPageChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            pageSize={perPage}
            onExpandRow={this.onExpandRow}
            renderExpandedRow={this.renderExpandedRow}
            expanded={this.state.expanded}
          >
            {this.renderColumns()}
          </List>
        </TabLayout>
      )
    );
  }
}

export default CompoundDetailPageInventory;
