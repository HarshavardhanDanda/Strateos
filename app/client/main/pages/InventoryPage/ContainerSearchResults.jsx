import React from 'react';
import Immutable from 'immutable';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Tooltip, Column, List, HierarchyPath, DateTime } from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';
import moment from 'moment';

import FeatureStore from 'main/stores/FeatureStore';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import UserStore from 'main/stores/UserStore';
import UserProfile from 'main/components/UserProfile/UserProfile';
import { tour, scan } from 'main/tours/create-implementation';
import HazardPopoverTags from 'main/components/Hazards/HazardPopoverTags';
import { CONTAINER_STATUS } from 'main/util/ContainerUtil';
import AliquotActions from 'main/actions/AliquotActions';
import ContainerActions from 'main/actions/ContainerActions';
import ModalActions from 'main/actions/ModalActions';
import NotificationActions from 'main/actions/NotificationActions';
import AcsControls from 'main/util/AcsControls';
import ContainerStore from 'main/stores/ContainerStore';
import { LocationAssignmentModal } from 'main/models/LocationSelectorModal/LocationSelectorModal';
import AddContainersToShipmentModal from 'main/pages/InventoryPage/AddContainersToShipmentModal';
import * as ContainerUtil from 'main/util/ContainerUtil';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import SessionStore from 'main/stores/SessionStore';
import CommonUiUtil from 'main/util/CommonUiUtil';
import { PAGE_SIZE_OPTIONS } from 'main/util/List';
import BulkActionReportUtil from './BulkActionReportUtil';

const queryString = require('query-string');

class ContainerSearchResults extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      labContextColumns: ['hazards', 'empty_mass', 'location_id', 'organization_name', 'lab_id', 'run_id'],
      visibleColumns: this.props.visibleColumns
    };
    this.debounceFetch = this.props.refetchContainers && _.debounce(this.props.refetchContainers, 500).bind(this);
    this.handleSortChange = this.handleSortChange.bind(this);
  }

  componentDidMount() {
    if (queryString.parse(window.location.search).continueTour) {
      scan('.tx-checkbox__icon', () => tour.show(3));
    }
  }

  handleSortChange(sortKey, sortDirection) {
    const { onSortChange, onSelectionAcrossPagesChange } = this.props;
    onSortChange(sortKey, sortDirection);

    if (onSelectionAcrossPagesChange) {
      onSelectionAcrossPagesChange(false, 0, true);
    }
  }

  render() {
    const { data, onRowClick, onSelectRow, onSelectAll, onSearchPageChange,
      page, numPages, createdIds, shipments, selected, pageSize, onSearchFilterChange,
      searchOptions, card, onModal, disabledSelection, refetchContainers,
      showOrgFilter, shippable, selectedContainers, onUnselectAllResults, totalRecordCount,
      enableSelectionAcrossPages, isSelectionAcrossPagesActive, bulkSelectionCount, onSelectionAcrossPagesChange,
      onBulkActionClick } = this.props;

    const hasLabPermissions = FeatureStore.hasFeature(FeatureConstants.MANAGE_CONTAINERS_IN_LAB);
    const hasSelectionAcrossPages = enableSelectionAcrossPages && SessionStore.getOrg().get('feature_groups').includes('bulk_action_experiment');

    const aliquotCount = (container) => {
      const count = container.get('aliquot_count');
      const aliquots = container.get('aliquots');

      if (count !== undefined) {
        return count;
      } else if (aliquots) {
        return aliquots.size;
      }

      return undefined;
    };

    const onPageChange = (requestedPage, requestedPageSize) => {
      const { onSelectionAcrossPagesChange } = this.props;

      const onSelectOption = field => value =>
        onSearchFilterChange(searchOptions.set(field, value));

      if (requestedPage !== page) {
        onSearchPageChange(requestedPage);
      }
      if (requestedPageSize !== pageSize) {
        onSelectOption('searchPerPage')(requestedPageSize);
      }

      if (onSelectionAcrossPagesChange) {
        onSelectionAcrossPagesChange(false, 0, true);
      }
    };

    const canShowShipmentInfo = (shipment, container) => {
      const status = container.get('status');

      return (
        (shipment !== undefined) &&
        (shipment.get('checked_in_at') == undefined) &&
        !['destroyed', 'pending_destroy'].includes(status)
      );
    };

    const showShipmentLabel = (container) => {
      const shipment = shipments.find(
        s => s.get('id') === container.get('shipment_id'));

      return (
        canShowShipmentInfo(shipment, container) &&
        shipment.get('label') != undefined
      );
    };

    const shipmentCode = (container) => {
      const shipment = shipments.find(
        s => s.get('id') === container.get('shipment_id'));
      const defaultValue = '';

      if (canShowShipmentInfo(shipment, container) && container.get('shipment_code')) {
        return container.get('shipment_code');
      }

      return defaultValue;
    };

    const renderType = (container) => {
      if (container.get('test_mode')) {
        return <h3><i className="tx-type--warning fas fa-flask test-icon" /></h3>;
      }
      const cTypeId = container.get('container_type_id');
      const containerType = ContainerTypeStore.getById(cTypeId);
      const isTube = containerType && containerType.get('is_tube');
      const isStock = ContainerUtil.isStock(container);

      return <i onClick={() => onRowClick(container)} className={classNames('baby-icon', { 'baby-icon--success': isStock }, isTube ? 'aminol-tube' : 'aminol-plate')} />;
    };

    const renderName = (container) => {
      const isTest = container.get('test_mode');
      const isStock = ContainerUtil.isStock(container);

      return (
        <p
          className={classNames({
            'tx-type--warning': isTest,
            'tx-type--success': isStock && !isTest
          })}
        >
          {container.get('label')}
        </p>
      );
    };

    const renderBarcode = (container) => {
      return <p className="tx-type--secondary">{container.get('barcode') || '—'}</p>;
    };

    const renderRunId = (container) => {
      return <p className="tx-type--secondary">{container.get('generated_by_run_id') || '—'}</p>;
    };

    const renderIdRecord = (container) => {
      return (
        <p className="tx-type--secondary">{container.get('id')}</p>
      );
    };

    const renderStatus = (container) => {
      const keys = Object.keys(CONTAINER_STATUS);
      let status = container.get('status');
      if (keys.includes(status)) {
        status = CONTAINER_STATUS[status];
      }
      return (
        <p className="tx-type--secondary">{_.upperFirst(status)}</p>
      );
    };

    const renderContentsColumn = (container) => {
      const count = aliquotCount(container);
      return <p className="tx-type--secondary">{count ? `${count} aliquots` : '—'}</p>;
    };

    const renderCondition = (container) => {
      return <p className="tx-type--secondary">{container.get('storage_condition') || '—'}</p>;
    };

    const renderLab = (container) => {
      return <p className="tx-type--secondary">{container.get('lab') ? container.get('lab').get('name') : '—'}</p>;
    };
    const renderCtypeId = (container) => {
      return <p className="tx-type--secondary">{container.get('container_type_id') || '—'}</p>;
    };

    const renderOrganization = (container) => {
      return <p className="tx-type--secondary">{(container.get('organization_name') || container.getIn(['organization', 'name'])) || '-'}</p>;
    };

    const renderCreatedAt = (container) => {
      const timestamp = container.get('created_at');
      const createdAt = <DateTime timestamp={timestamp} />;

      return (
        createdIds.has(container.get('id')) ?
          <p className="tx-type--secondary">Just now</p>
          : (
            <Tooltip
              invert
              placement="bottom"
              title={moment(timestamp).format('ll')}
            >
              <p className="tx-type--secondary">
                {createdAt}
              </p>
            </Tooltip>
          )
      );
    };

    const LocationPath = (container) => {
      const ancestors = container.getIn(['location', 'ancestors']);
      const location = container.getIn(['location']) || [];
      const ancestorLocations = ancestors ? [...ancestors] : [];
      const locationPaths = ancestorLocations.concat(location);
      return locationPaths.map((loc) => {
        return {
          name: loc.get('name', '-'),
          id: loc.get('id')
        };
      });
    };

    const renderLocation = (container) => {
      const pathNames = LocationPath(container);
      if (_.isEmpty(pathNames)) {
        return '-';
      }
      return (
        <HierarchyPath steps={pathNames} spacingPx={1} isTruncate />
      );
    };

    const renderLastUsed = (container) => {
      const shipment = shipments.find(
        s => s.get('id') === container.get('shipment_id'));
      const status = container.get('status');
      const destructionTime = container.get('will_be_destroyed_at');
      const timestamp = container.get('updated_at');
      const updatedAt = <DateTime timestamp={timestamp} />;

      return (
        showShipmentLabel(container) ? (
          <Tooltip
            invert
            placement="bottom"
            title={`Please ship ${shipment.get('label')}`}
          >
            <p className="desc search-results-table__shipping-label">
              {`Please ship ${shipment.get('label')}`}
            </p>
          </Tooltip>
        )
          :
          ((status === 'destroyed') || destructionTime) ? (
            <div>
              <Tooltip
                invert
                placement="bottom"
                title={moment(timestamp).format('ll')}
              >
                <p className="date container-row-spacing__text desc tx-type--error">
                  {updatedAt}
                </p>
              </Tooltip>
              <div>
                {status === 'destroyed' ?
                  (
                    <Tooltip
                      title="Destroyed"
                      placement="bottom"
                    >
                      <i className="tx-type--error fa fa-trash" />
                    </Tooltip>
                  ) :
                  (
                    <React.Fragment>
                      <Tooltip
                        title="Pending Destruction"
                        placement="bottom"
                      >
                        <i className="tx-type--error far fa-bomb" />
                      </Tooltip>
                      <span className="search-results-table__modifier-text desc tx-type--error">
                        {' (PENDING)'}
                      </span>
                    </React.Fragment>
                  )
                }
              </div>
            </div>
          ) : (
            <Tooltip
              invert
              placement="bottom"
              title={moment(timestamp).format('ll')}
            >
              <p className="date desc">{updatedAt}</p>
            </Tooltip>
          )

      );
    };

    const renderCode = (container) => {
      return (
        <h4 className="container-row-spacing__container-code container-row-spacing__column">
          {shipmentCode(container)}
        </h4>
      );
    };

    const renderEmptyMassMg = (container) => {
      return <p className="tx-type--secondary">{container.get('empty_mass_mg') || '—'}</p>;
    };

    const renderHazards = (container) => {
      const hazards = container.get('hazards', Immutable.List([])).toJS();
      return <HazardPopoverTags hazards={hazards} />;
    };

    const renderCreatedBy = (container) => {
      const user = UserStore.getById(container.get('created_by'));
      return (user ? <UserProfile user={user} onModal={onModal} /> : '-');
    };

    const renderRunCount = (container) => {
      return <p className="tx-type--secondary">{container.get('run_count') || '0'}</p>;
    };

    const columns = [
      <Column
        renderCellContent={renderType}
        header="type"
        id="type-column"
        key="column-type"
        relativeWidth={0.5}
      />,
      <Column
        renderCellContent={renderName}
        sortable
        onSortChange={this.handleSortChange}
        header="name"
        id="label"
        key="column-label"
        popOver
        sortFunction={containers => containers.sortBy(container => (container.get('label') ? container.get('label').toLowerCase() : container.get('label')))}
        relativeWidth={2}
      />,
      <Column
        renderCellContent={renderIdRecord}
        onSortChange={this.handleSortChange}
        header="ID"
        id="id"
        key="column-id"
        disableFormatHeader
        popOver
      />,
      <Column
        renderCellContent={renderCtypeId}
        sortable
        onSortChange={this.handleSortChange}
        header="format"
        id="container_type_id"
        key="column-container_type_id"
        popOver
        relativeWidth={1.5}
      />,
      <Column
        renderCellContent={renderStatus}
        header="status"
        id="status"
        key="column-status"
        popOver
      />,
      <Column
        renderCellContent={renderContentsColumn}
        header="contents"
        id="contents"
        key="column-contents"
        popOver
      />,
      <Column
        renderCellContent={renderCondition}
        sortable
        onSortChange={this.handleSortChange}
        header="condition"
        id="storage_condition"
        key="column-storage_condition"
        popOver
      />,
      <Column
        renderCellContent={renderCreatedAt}
        sortable
        onSortChange={this.handleSortChange}
        header="created"
        id="created_at"
        key="column-created_at"
      />,
      <Column
        renderCellContent={renderBarcode}
        sortable
        onSortChange={this.handleSortChange}
        header="barcode"
        id="barcode"
        key="column-barcode"
        popOver
      />,
      <Column
        renderCellContent={renderLastUsed}
        sortable
        onSortChange={this.handleSortChange}
        header="Last used"
        id="updated_at"
        key="column-updated_at"
      />,
      <Column
        renderCellContent={renderCode}
        header="code"
        id="code-column"
        key="column-code"
        popOver
      />,
      <Column
        renderCellContent={renderRunId}
        header="run"
        id="run_id"
        key="column-run_id"
        popOver
      />,
      <Column
        renderCellContent={renderRunCount}
        header="Run Count"
        id="run_count"
        key="column-run_count"
        popOver
      />,
      <Column
        renderCellContent={renderCreatedBy}
        sortable
        onSortChange={this.handleSortChange}
        header="creator"
        id="created_by"
        key="column-created_by"
        relativeWidth={0.5}
      />,
      <Column
        renderCellContent={renderLab}
        sortable
        onSortChange={this.handleSortChange}
        header="lab"
        id="lab_id"
        key="column-lab_id"
        popOver
      />,
      <Column
        renderCellContent={renderEmptyMassMg}
        header="empty mass"
        id="empty_mass"
        key="column-empty_mass"
        popOver
      />,
      <Column
        renderCellContent={renderLocation}
        sortable
        onSortChange={this.handleSortChange}
        header="location"
        id="location_id"
        key="column-location_id"
      />,
      <Column
        renderCellContent={renderHazards}
        header="hazards"
        id="hazards"
        key="column-hazards"
      />];

    const addListAction = (title, action, actionsList, isBulkEnabled, disabled, tooltip) => {
      const isActiveBulkAction = isBulkEnabled && isSelectionAcrossPagesActive;
      actionsList.push({
        title: title,
        action: action,
        disabled: isActiveBulkAction ? false : disabled,
        label: tooltip
      });
    };

    const canShipContainer = () => {
      return AcsControls.isFeatureEnabled(FeatureConstants.REQUEST_SAMPLE_RETURN);
    };

    const canDestroyContainer = (containers) => {
      const canDestroyContainer = AcsControls.isFeatureEnabled(FeatureConstants.DESTROY_CONTAINER);
      const canDestroyGeneratedContainer = !containers.map((container) => {
        return container.get('generated_by_run_id') != null && FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, container.getIn(['lab', 'id']));
      }).some((item) => item === 0 || item === false);
      return canDestroyContainer || canDestroyGeneratedContainer;
    };

    const canDeleteContainer = (labIds) => {
      return !labIds.map((labId) => {
        return FeatureStore.hasFeatureInLab(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS, labId);
      }).some((item) => item === 0);
    };

    const listActions = () => {
      const containers = ContainerStore.getByIds(selectedContainers);
      const labIds = containers.map(c => c.getIn(['lab', 'id']));

      const actionsList = [];
      const relocateToolTip = getRelocateToolTip(containers, labIds);
      const relocateDisabled = relocateToolTip !== null;

      if (canShipContainer()) {
        addListAction('Ship', onShipClicked, actionsList, false, !shippable);
      }

      addListAction('Download', onDownloadClicked, actionsList, true);

      addListAction('Relocate', onRelocateClicked, actionsList, true, relocateDisabled, relocateToolTip);

      if (this.props.canTransferContainers) {
        addListAction('Transfer', onTransferClick, actionsList, true);
      }

      if (canDestroyContainer(containers)) {
        addListAction('Destroy', onDestroyClicked, actionsList, true);
      }

      if (canDeleteContainer(labIds)) {
        addListAction('Delete', onDeleteClicked, actionsList, true);
      }

      return actionsList;
    };

    const getRelocateToolTip = (containers, labIds) => {
      if (isSelectionAcrossPagesActive) {
        return null;
      }
      const containsMultipleLabs = containers.some(container =>  container.getIn(['lab', 'id']) !== containers[0].getIn(['lab', 'id']));
      if (containsMultipleLabs) {
        return 'Only containers from a single lab can be relocated';
      }
      const doesUserLackContainerManagementPermissionInSelectedLabs = labIds.some(
        labId => !FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, labId)
      );
      if (doesUserLackContainerManagementPermissionInSelectedLabs) {
        return 'You do not have permission to relocate containers from the selected lab';
      }
      const containsDestroyedOrReturnedContainers = containers.some(container => container.get('status') === 'destroyed' || container.get('status') === 'returned');
      if (containsDestroyedOrReturnedContainers) {
        return 'Destroyed and Returned containers cannot be relocated';
      }
      return null;
    };

    const onShipClicked = () => {
      const modalId = AddContainersToShipmentModal.modalId;
      ModalActions.open(modalId);
    };

    const onDownloadClicked = () => {
      if (isSelectionAcrossPagesActive) {
        const confirmed = CommonUiUtil.confirmWithUser(`Are you sure you want to download ${getSelectionCount()} containers?`);
        if (confirmed && onBulkActionClick) {
          onBulkActionClick(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DOWNLOAD, { visible_columns: this.state.visibleColumns });
        }
      } else {
        AliquotActions.downloadCSV(selectedContainers, this.state.visibleColumns);
      }
    };

    const onTransferClick = () => {
      this.props.onTransferClick && this.props.onTransferClick();
    };

    const onRelocateClicked = () => {
      ModalActions.open(LocationAssignmentModal.MODAL_ID);
    };

    const onDestroyClicked = () => {
      if (CommonUiUtil.confirmWithUser(`Are you sure you want to destroy ${getSelectionCount()} containers?`)) {

        if (isSelectionAcrossPagesActive) {
          if (onBulkActionClick) {
            onBulkActionClick(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DESTROY);
          }
        } else {
          const promise = ContainerActions.destroyMany(selectedContainers);
          promise.done((_containers) => {
            onUnselectAllResults && onUnselectAllResults(selectedContainers);
            if (refetchContainers) {
              this.debounceFetch();
            }
          });
        }
      }
    };

    const onDeleteClicked = () => {
      if (CommonUiUtil.confirmWithUser(`Are you sure you want to delete ${getSelectionCount()} containers?`)) {

        if (isSelectionAcrossPagesActive) {
          if (onBulkActionClick) {
            onBulkActionClick(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DELETE);
          }
        } else {
          const promise = ContainerActions.destroyManyContainer(selectedContainers);
          promise.done((_containers) => {
            onUnselectAllResults && onUnselectAllResults(selectedContainers);
            if (refetchContainers) {
              this.debounceFetch();
            }
            NotificationActions.createNotification({
              text: `${selectedContainers.length} Containers deleted`
            });
          });
        }
      }
    };

    const getSelectionCount = () => {
      return isSelectionAcrossPagesActive ? bulkSelectionCount : selectedContainers.length;
    };

    if (showOrgFilter) {
      columns.splice(11, 0, <Column
        renderCellContent={renderOrganization}
        sortable
        onSortChange={this.handleSortChange}
        header="organization"
        id="organization_name"
        key="organization-name"
        popOver
      />
      );
    }

    return (
      <div>
        <List
          popoverOnHeader
          popoverOnHover
          loaded={!this.props.isSearching}
          data={data}
          disabledSelection={disabledSelection}
          onRowClick={onRowClick}
          onSelectRow={(!onSelectRow ? undefined : (records, willBeChecked, selectedRows) => onSelectRow(records, willBeChecked, selectedRows))}
          onSelectAll={(selectedRows) => onSelectAll(selectedRows)}
          selected={selected}
          id={KeyRegistry.CONTAINERS_TABLE}
          showPagination
          currentPage={page}
          maxPage={numPages}
          totalRecordCount={totalRecordCount}
          onPageChange={(requestedPage, requestedPageSize) => onPageChange(requestedPage, requestedPageSize)}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          pageSize={pageSize}
          showActions
          actions={!onModal && listActions()}
          tallRows
          disableCard={!card}
          showColumnFilter
          visibleColumns={this.state.visibleColumns}
          onChangeSelection={(selectedColumns) => {
            this.setState({ visibleColumns: selectedColumns });
          }}
          persistKeyInfo={UserPreference.packInfo(KeyRegistry.CONTAINERS_TABLE)}
          enableSelectionAcrossPages={hasSelectionAcrossPages}
          isSelectionAcrossPagesActive={isSelectionAcrossPagesActive}
          onSelectionAcrossPagesClick={onSelectionAcrossPagesChange}
        >
          {columns.filter(column => {
            return hasLabPermissions || !this.state.labContextColumns.includes(column.props.id);
          })}
        </List>
      </div>
    );
  }
}

ContainerSearchResults.propTypes = {
  data: PropTypes.instanceOf(Immutable.List),
  onRowClick: PropTypes.func,
  onSelectRow: PropTypes.func,
  onSelectAll: PropTypes.func,
  selected: PropTypes.object,
  page: PropTypes.number,
  numPages: PropTypes.number,
  totalRecordCount: PropTypes.number,
  onSearchPageChange: PropTypes.func,
  onSortChange: PropTypes.func,
  createdIds: PropTypes.instanceOf(Immutable.Map).isRequired,
  shipments: PropTypes.instanceOf(Immutable.Seq).isRequired,
  card: PropTypes.bool,
  onModal: PropTypes.bool,
  showOrgFilter: PropTypes.bool,
  shippable: PropTypes.bool,
  onUnselectAllResults: PropTypes.func,
  selectedContainers: PropTypes.array,
  visibleColumns: PropTypes.array.isRequired,
  refetchContainers: PropTypes.func,
  onTransferClick: PropTypes.func,
  enableSelectionAcrossPages: PropTypes.bool,
  onSelectionAcrossPagesChange: PropTypes.func,
  bulkSelectionCount: PropTypes.number,
  isSelectionAcrossPagesActive: PropTypes.bool,
  onBulkActionClick: PropTypes.func
};

ContainerSearchResults.defaultProps = {
  selectedContainers: []
};

export default ContainerSearchResults;
