import React, { useEffect, useState } from 'react';
import Immutable from 'immutable';
import _ from 'lodash';

import Urls from 'main/util/urls';
import InventoryUtil from 'main/inventory/inventory/util/InventoryUtil';
import FeatureConstants from '@strateos/features';
import AcsControls from 'main/util/AcsControls';
import InventoryPage from 'main/pages/InventoryPage';
import { InventorySearchDefaults } from 'main/inventory/inventory/InventoryState';
import { InventoryPageActions } from 'main/inventory/inventory/InventoryActions';
import ShipmentActions from 'main/actions/ShipmentActions';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import OrgCollaborationsActions from 'main/actions/OrgCollaborationsActions';
import ModalActions from 'main/actions/ModalActions';
import ShippingCartActions from 'main/actions/ShippingCartActions';
import OrganizationStore from 'main/stores/OrganizationStore';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import { ContainerSearchStore } from 'main/stores/search';
import ContainerStore from 'main/stores/ContainerStore';
import { ShipmentStore } from 'main/stores/ShipmentStore';
import SessionStore from 'main/stores/SessionStore';
import FeatureStore from 'main/stores/FeatureStore';
import LocationStore from 'main/stores/LocationStore';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import StructureSearchModal from 'main/pages/CompoundsPage/StructureSearchModal';
import { ContainerTransferModal } from 'main/components/TransferModal';
import ContainerActions from 'main/actions/ContainerActions';
import { LocationAssignmentModal } from 'main/models/LocationSelectorModal/LocationSelectorModal';
import BulkActionReportModal from 'main/components/BulkActionReportModal';
import BulkActionLoaderModal from 'main/components/BulkActionLoaderModal';
import CommonUiUtil from 'main/util/CommonUiUtil';
import FileUtil from 'main/util/FileUtil';
import UserPreference from 'main/util/UserPreferenceUtil';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import NotificationActions from 'main/actions/NotificationActions';
import AddContainersToShipmentModal from './AddContainersToShipmentModal';
import AddContainerModal from './AddContainerModal';
import BulkActionReportUtil from './BulkActionReportUtil';

function ConnectedInventoryPage(props) {
  const [hasCollaboratorOrgs, setHasCollaboratorOrgs] = useState(false);
  const [isShippable, setIsShippable] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [activeBulkAction, setActiveBulkAction] = useState(null);
  const [bulkSelectionCount, setBulkSelectionCount] = useState(0);
  const [isSelectionAcrossPagesActive, setIsSelectionAcrossPagesActive] = useState(false);

  useEffect(() => {
    ShipmentActions.loadAll();
    const labIds = FeatureStore.getLabIds();
    LabConsumerActions.loadLabConsumersByLab(labIds.join());
    OrgCollaborationsActions.loadOrgCollaborations({ topic: 'TRANSFER_CONTAINER' })
      .then(orgCollaborationData => setHasCollaboratorOrgs(orgCollaborationData.data.length > 0));
  }, []);

  const onContainerCreation = containers => {
    const currentCreatedContainers = props.createdIds;
    const newCreatedContainers = containers
      .toMap()
      .mapKeys((k, container) => container.get('id'));

    props.actions.updateState({
      createdContainers: currentCreatedContainers.merge(newCreatedContainers)
    });

    return containers.forEach(container =>
      ContainerSearchStore.prependResult(container)
    );
  };

  const setShippable = containerIds => {
    // containers belonging to user's organization and of same lab can be shipped in one shipment.
    const containers = ContainerStore.getByIds(containerIds);
    setIsShippable(ShippingCartActions.canContainersBeShipped(containers));
  };

  const deleteContainersInStore = selectedContainers => {
    selectedContainers.forEach(containerId => {
      ContainerStore.act({
        type: 'CONTAINER_DELETED',
        container: { id: containerId }
      });
    });
  };

  const allResultIds = () => (props.search.get('results').size > 0 ?
    props.search.get('results').map(result => result.get('id')) : Immutable.List([]));

  const selectedOnCurrentPage = () => props.selected && props.selected.filter(id => allResultIds().toJS().includes(id));

  const onOpenStructureSearchModal = () => ModalActions.open(StructureSearchModal.MODAL_ID);

  const onSearchSmileChange = query => props.actions.onSearchSmileChange(onSearchFailed, query);

  const onSearchFailed = xhr => xhr && xhr.responseText && console.error(xhr.responseText);

  const onSelectionAcrossPagesActiveChange = (toBeEnabled, selectionCount) => {
    setIsSelectionAcrossPagesActive(toBeEnabled);
    setBulkSelectionCount(selectionCount);
  };

  const onBulkActionRequest = (action, additionalData) => {
    setActiveBulkAction(action);
    ModalActions.open(BulkActionLoaderModal.MODAL_ID);

    ContainerActions.bulkRequest(action, props.searchOptions, bulkSelectionCount, additionalData).then((requestId) => {
      onPoll(action, requestId);
    }).fail(onBulkActionRequestFail);
  };

  const onPoll = (action, requestId) => {
    ContainerActions.pollForBulkRequest(requestId).then((res) => {
      onBulkActionComplete(action, res);
    });
  };

  const onBulkActionComplete = (action, response) => {
    ModalActions.close(BulkActionLoaderModal.MODAL_ID);
    const errorMsg = BulkActionReportUtil.getErrorMsgIfFailedWithErrors(response);

    if (_.isEmpty(errorMsg)) {
      const report = BulkActionReportUtil.buildReport(response);
      setReportData(report);
      ModalActions.open(BulkActionReportModal.MODAL_ID);

      if (action === BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DOWNLOAD) {
        downloadBulkActionAttachments(response);
      }
    } else {
      NotificationActions.createNotification({
        text: errorMsg,
        isError: true
      });
    }
    onSelectionAcrossPagesActiveChange(false, 0);
    props.actions.doSearch({ ...props.searchOptions, searchPage: 1 }, onSearchFailed);
  };

  const onBulkActionRequestFail = () => {
    ModalActions.close(BulkActionLoaderModal.MODAL_ID);
  };

  const onTransferClick = () => {
    if (isSelectionAcrossPagesActive) {
      ModalActions.open(ContainerTransferModal.MODAL_ID);
    }

    if (!_.isEmpty(props.selected)) {
      props.actions.updateState({
        selected: props.selected
      });
      ModalActions.open(ContainerTransferModal.MODAL_ID);
    }
  };

  const onTransferToOrganization = (orgId) => {
    if (isSelectionAcrossPagesActive) {
      onBulkActionRequest(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.TRANSFER, { organization_id: orgId });
    } else {

      ContainerActions.multiTransfer(props.selected, orgId)
        .done((response) => {
          props.actions.updateState({ selected: [] });
          const report = BulkActionReportUtil.buildReport(response);
          setActiveBulkAction(BulkActionReportUtil.MULTI_PER_PAGE_ACTIONS.TRANSFER);
          setReportData(report);
          ModalActions.open(BulkActionReportModal.MODAL_ID);
        });
    }
  };

  const updateContainerLocation = (selectedLocation) => {
    const locationId = _.isArray(selectedLocation) ? selectedLocation[0].get('id') : selectedLocation;
    const location = LocationStore.getById(locationId).get('name');
    const containersCount = isSelectionAcrossPagesActive ? bulkSelectionCount : selectedOnCurrentPage().length;
    const confirmed = CommonUiUtil.confirmWithUser(`Are you sure you want to relocate ${containersCount} containers to ${location}?`);
    if (confirmed) {
      if (isSelectionAcrossPagesActive) {
        onBulkActionRequest(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.RELOCATE, { location_id: locationId });
      } else {
        ContainerActions.relocateMany(selectedOnCurrentPage(), locationId)
          .done((response) => {
            UserPreference.save({ [KeyRegistry.PREFERRED_CONTAINER_RELOCATION_ID]: locationId });
            props.actions.updateState({ selected: [] });
            const report = BulkActionReportUtil.buildReport(response);
            setActiveBulkAction(BulkActionReportUtil.MULTI_PER_PAGE_ACTIONS.RELOCATE);
            setReportData(report);
            ModalActions.open(BulkActionReportModal.MODAL_ID);
            props.actions.doSearch({ ...props.searchOptions }, onSearchFailed);
          });
      }
    }
  };

  const downloadBulkActionAttachments = (response) => {
    response.data.attributes.attachments.forEach((attachment) => {
      const fileName = attachment.name;
      const blob = FileUtil.base64ToBlob(attachment.data, fileName, 'csv');
      FileUtil.downloadBlob(blob, fileName);
    });
  };

  const renderInventoryPage = () => {
    return (
      <InventoryPage
        {...props}
        selectedOnCurrentPage={() => selectedOnCurrentPage()}
        onOpenStructureSearchModal={() => onOpenStructureSearchModal()}
        hasCollaboratorOrgs={hasCollaboratorOrgs}
        canTransferContainer={AcsControls.isFeatureEnabled(FeatureConstants.TRANSFER_CONTAINER)}
        visibleColumns={InventoryUtil.getVisibleColumns()}
        allResultIds={() => allResultIds()}
        onTransferClick={onTransferClick}
        setShippable={containerIds => setShippable(containerIds)}
        isShippable={isShippable}
        deleteContainersInStore={selectedContainers => deleteContainersInStore(selectedContainers)}
        bulkSelectionCount={bulkSelectionCount}
        isSelectionAcrossPagesActive={isSelectionAcrossPagesActive}
        onSelectionAcrossPagesChange={onSelectionAcrossPagesActiveChange}
        onBulkActionClick={onBulkActionRequest}
      />
    );
  };

  const labId = (selectedOnCurrentPage().length > 0 &&
    ContainerStore.getById(selectedOnCurrentPage()[0])) ?
    ContainerStore.getById(selectedOnCurrentPage()[0]).get('lab_id') : null;

  return (
    <React.Fragment>
      {renderInventoryPage()}
      <AddContainerModal
        key="AddContainerModal"
        onContainerCreation={onContainerCreation}
        canAddTestMode={SessionStore.isDeveloper()}
        subdomain={SessionStore.getOrg().get('subdomain')}
        closeOnClickOut={false}
      />
      <AddContainersToShipmentModal
        key="AddContainersToShipmentModal"
        ids={selectedOnCurrentPage()}
        onSuccess={() => props.actions.updateState({ selected: [] })}
      />
      <StructureSearchModal
        SMILES={Immutable.fromJS(props.searchOptions).get('searchSmiles')}
        onSave={onSearchSmileChange}
      />
      <ContainerTransferModal
        key="ContainerTransferModal"
        selection={isSelectionAcrossPagesActive ? bulkSelectionCount : props.selected}
        onTransfer={onTransferToOrganization}
      />
      <LocationAssignmentModal
        labIdForFilter={labId}
        containersCount={selectedOnCurrentPage().length}
        modalId={LocationAssignmentModal.MODAL_ID}
        updateMultipleLocations={updateContainerLocation}
        initialLocationId={UserPreference.get(KeyRegistry.PREFERRED_CONTAINER_RELOCATION_ID)}
        key="LocationSelectorModal"
      />
      <BulkActionReportModal
        key="BulkActionReportModal"
        data={reportData || []}
        headers={BulkActionReportUtil.getHeaders(activeBulkAction)}
        errorHeaders={BulkActionReportUtil.getErrorHeaders(activeBulkAction)}
        errorBanner={BulkActionReportUtil.getErrorText(activeBulkAction)}
        fileText={BulkActionReportUtil.getFileText(activeBulkAction)}
        showDownloadButton
      />
      <BulkActionLoaderModal
        action={activeBulkAction}
        bulkSelectionCount={bulkSelectionCount}
      />
    </React.Fragment>
  );
}

export const getStateFromStores = () => {
  const {
    createdContainers,
    isSearching,
    selected,
    searchQuery,
    searchPage,
    searchPerPage,
    totalRecordCount
  } = InventoryPageActions.get();

  const org = OrganizationStore.findBySubdomain(SessionStore.getOrg().get('subdomain'));
  const orgId = org ? org.get('id') : undefined;
  const showOrgFilter = LabConsumerStore.isOrgFilterApplicable(orgId);
  const search = ContainerSearchStore.getSearch(searchQuery, searchPage);
  const totalContainersInDB = org.getIn(['container_stats', 'total']) || 0;
  const hasResults = (totalContainersInDB > 0);
  const searchOptions = InventoryPageActions.searchOptions();
  const canAddTestSamples = SessionStore.isDeveloper();
  const shipments = ShipmentStore.getAll();
  const actions = InventoryPageActions;
  const listUrl = Urls.containers();
  const resultUrl = Urls.container;
  const title = 'Inventory';

  const zeroStateSearchOptions = { ...InventorySearchDefaults };
  const zeroStateProps = {
    title: "You're ready to create some containers!",
    subTitle: "You'll need to create containers and ship them to Transcriptic before you launch a run."
  };
  const searchZeroStateProps = {
    title: 'No containers were found.'
  };

  return {
    createdIds: createdContainers,
    search,
    searchOptions,
    zeroStateSearchOptions,
    hasResults,
    canAddTestSamples,
    shipments,
    isSearching,
    selected,
    searchPerPage,
    actions,
    zeroStateProps,
    listUrl,
    resultUrl,
    title,
    searchZeroStateProps,
    hasPageLayout: true,
    hasPageHeader: false,
    showOrgFilter,
    totalRecordCount
  };
};

export default ConnectToStores(ConnectedInventoryPage, getStateFromStores);
