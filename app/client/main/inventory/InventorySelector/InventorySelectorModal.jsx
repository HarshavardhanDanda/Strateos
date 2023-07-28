import Immutable from 'immutable';
import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { ButtonGroup, Button, ModalHeader, Banner, ModalDrawer } from '@transcriptic/amino';
import { pubSub } from '@strateos/micro-apps-utils';

import AliquotAPI from 'main/api/AliquotAPI';
import Dispatcher from 'main/dispatcher';
import ContainerStore from 'main/stores/ContainerStore';
import AliquotActions from 'main/actions/AliquotActions';
import AliquotStore from 'main/stores/AliquotStore';
import { SinglePaneModal } from 'main/components/Modal';
import InventorySelector from 'main/inventory/InventorySelector';
import InventoryDetails from 'main/inventory/InventorySelector/InventoryDetails';
import SessionStore from 'main/stores/SessionStore';
import { InventorySelectorModalAliquotActions, InventorySelectorModalContainerActions } from 'main/inventory/inventory/InventoryActions';
import { InventorySelectorModalAliquotDefaults, InventorySelectorModalContainerDefaults } from 'main/inventory/inventory/InventoryState';
import InventoryUtil from 'main/inventory/inventory/util/InventoryUtil';
import SelectedInventory from './SelectedInventory';

import './InventorySelectorModal.scss';

class InventorySelectorModal extends React.Component {
  static get MODAL_ID() {
    return 'SEARCH_CONTAINER_MODAL';
  }

  constructor(props) {
    super(props);
    this.state = {
      drawerOpen: false,
      disabled: true,
      containerSelectionMap: Immutable.Map(),
      wellSelectionMap: Immutable.Map(),
      disableSelectButton: false,
      showBanner: false,
      negativeVolumeOrMassContainerIds: [],
      negativeVolumeOrMassContainerLabels: [],
      aliquotsSelectedContainer: [],
      modalOpen: false,
      title: '',
      selectionType: '',
      organizationId: '',
      labId: '',
      testMode: '',
      isPubSub: false,
      selectionMap: Immutable.Map(),
      pubSubKey: '',
      defaultFilters: {},
      detailsMode: false,
      detailsDrawerTitle: '',
      containerId: ''
    };
    _.bindAll(
      this,
      'closeDrawer',
      'beforeDismiss',
      'onSelectedWellsChange',
      'onSelectedContainerChange',
      'onSelectRow',
      'onSelectAll',
      'onRowClick',
      'onFinalSelect',
      'onAllWellsSelected',
      'disableButton',
      'getDrawerFooter',
      'onDetailsDrawerButtonSelect',
      'showModal',
      'hideModal',
      'closeDetailDrawer',
      'onClickDrawerFooterButton',
      'isSingleSelect',
      'onSelectionDeleted',
      'onSearch',
      'openDrawer'
    );
  }

  componentDidMount() {
    if (this.canUseInventoryBrowserMicroApp) {
      pubSub.subscribe('INVENTORY_BROWSER_MODAL_SHOW', this.showModal);
      pubSub.subscribe('INVENTORY_BROWSER_MODAL_HIDE', this.hideModal);
    }
  }

  // TODO: Remove this function when canUseInventoryBrowserMicroApp flag is removed (PP-12252)
  // This was created to make the current non PUB-SUB architecture of opening the modal work while development is in progress
  // for the PUB-SUB architecture
  static getDerivedStateFromProps(props, state) {
    if (state.isPubSub) {
      return {};
    }

    const newState = {};
    if (props.modalOpen !== state.modalOpen) {
      newState.modalOpen = props.modalOpen;
    }
    if (props.title !== state.title) {
      newState.title = props.title;
    }
    if (props.selectionType !== state.selectionType) {
      newState.selectionType = props.selectionType;
    }
    if (props.organizationId !== state.organizationId) {
      newState.organizationId = props.organizationId;
    }
    if (props.labId !== state.labId) {
      newState.labId = props.labId;
    }
    if (props.testMode !== state.testMode) {
      newState.testMode = props.testMode;
    }
    if (props.selectionMap !== state.selectionMap) {
      newState.selectionMap = props.selectionMap;
    }
    return newState;
  }

  canUseInventoryBrowserMicroApp = SessionStore.getOrg() && SessionStore.getOrg().get('feature_groups').includes('inventory_browser_microapp');

  showModal({ title, selectionType, organizationId, labId, testMode, pubSubKey, selectionMap, defaultFilters }) {
    let containerSelectionMap = Immutable.Map();
    let wellSelectionMap = Immutable.Map();

    if (this.isSelectingContainer(selectionType)) {
      containerSelectionMap = selectionMap;
    } else {
      wellSelectionMap = selectionMap;
    }

    this.setState({
      modalOpen: true,
      isPubSub: true,
      title,
      selectionType,
      organizationId,
      labId,
      testMode,
      pubSubKey,
      selectionMap,
      containerSelectionMap,
      wellSelectionMap,
      defaultFilters
    });
  }

  hideModal() {
    this.setState({ modalOpen: false });
  }

  isSelectingContainer(selectionType = this.state.selectionType) {
    return _.includes(selectionType, 'CONTAINER');
  }

  isSingleSelect() {
    return !_.includes(this.state.selectionType, '+');
  }

  getActions() {
    return this.isSelectingContainer() ? InventorySelectorModalContainerActions : InventorySelectorModalAliquotActions;
  }

  disableButton(status) {
    this.setState({ disableSelectButton: status });
  }

  onSelectedContainerChange(selectedContainers) {
    let newMap = Immutable.Map();
    if (this.canUseInventoryBrowserMicroApp) {
      newMap = this.state.containerSelectionMap;
    } else {
      newMap = this.state.selectionMap;
    }

    _.keys(selectedContainers).forEach(element => {
      switch (this.state.selectionType) {
        case 'CONTAINER':
          newMap = Immutable.fromJS({
            [element]: []
          });
          break;
        case 'CONTAINER+':
          newMap = newMap.set(element, Immutable.fromJS([]));
          break;
      }
    });
    const closeOnSelect = this.isSingleSelect();
    this.setState({ containerSelectionMap: newMap }, () => { closeOnSelect && this.onFinalSelect(); });
  }

  onSelectedWellsChange(containerId, wells) {
    let newMap = this.state.wellSelectionMap.merge(this.state.selectionMap);
    if (wells.size === 0) {
      newMap = newMap.delete(containerId);
    } else {
      switch (this.state.selectionType) {
        case 'ALIQUOT':
          newMap = Immutable.fromJS({
            [containerId]: wells
          });
          break;
        case 'ALIQUOT+':
          newMap = newMap.set(containerId, Immutable.fromJS(wells));
          break;
      }
    }
    this.setState({ wellSelectionMap: newMap });
  }

  checkNegativeVolumeOrMassContainers(selectedRows) {
    const negativeVolumeOrMassContainerIds = [];
    const negativeVolumeOrMassContainerLabels = [];
    if (_.isEmpty(selectedRows)) {
      this.setState({ showBanner: false, negativeVolumeOrMassContainerIds: [] });
    }
    selectedRows.forEach(element => {
      AliquotAPI.getByContainerId(element).done((response) => {
        const aliquots = response.data;
        const negativeVolumeOrMassAliquots = aliquots && aliquots.filter(aliquot => aliquot.attributes.volume_ul < 0 || aliquot.attributes.mass_mg < 0);
        if (!_.isEmpty(negativeVolumeOrMassAliquots) && !this.state.aliquotsSelectedContainer.includes(element)) {
          negativeVolumeOrMassContainerIds.push(element);
          negativeVolumeOrMassContainerLabels.push(ContainerStore.getById(element).get('label') || element);
        }
      }
      ).always(() => {
        if (_.isEmpty(negativeVolumeOrMassContainerIds)) {
          this.setState({ showBanner: false, negativeVolumeOrMassContainerIds: [], negativeVolumeOrMassContainerLabels: [] });
          this.disableButton(false);
        } else {
          this.setState({ showBanner: true, negativeVolumeOrMassContainerIds: negativeVolumeOrMassContainerIds, negativeVolumeOrMassContainerLabels: negativeVolumeOrMassContainerLabels });
          this.disableButton(true);
        }
      });
    });
  }

  onSelectRow(record, willBeChecked, selectedRows) {
    this.setState({ detailsMode: false });
    this.getActions().updateState({ selected: _.keys(selectedRows) });
    !this.state.testMode && this.checkNegativeVolumeOrMassContainers(_.keys(selectedRows));
    if (this.isSelectingContainer()) {
      this.onSelectedContainerChange(selectedRows);
    } else {
      this.onAllWellsSelected(record.get('id'), willBeChecked);
    }
  }

  onAllWellsSelected(containerId, willBeChecked) {
    // 'willBeChecked' indicates whether the clicked container(hence all wells of the container) is being selected or deselected.
    // if it is True: add the wells of that container to wellSelectionMap otherwise remove the wells from wellSelectionmap.
    if (willBeChecked) {
      AliquotActions.fetch_by_container(containerId)
        .done(() => {
          const aliquots = AliquotStore.getByContainer(containerId);
          const wells = this.state.testMode ? aliquots.map(aliquot => aliquot.get('well_idx'))
            : aliquots.filter(aliquot => aliquot.get('volume_ul') >= 0 && aliquot.get('mass_mg') >= 0).map(aliquot => aliquot.get('well_idx'));
          this.setState({ wellSelectionMap: this.state.wellSelectionMap.merge(this.state.selectionMap).set(containerId, Immutable.fromJS(wells)) });
        });
    } else {
      this.setState({ wellSelectionMap: this.state.wellSelectionMap.delete(containerId) });
    }
  }

  onSelectAll(selectedRows) {
    !this.state.testMode && this.checkNegativeVolumeOrMassContainers(_.keys(selectedRows));
    if (this.state.selectionType === 'CONTAINER+') {
      this.onSelectedContainerChange(selectedRows);
    } else if (_.isEmpty(selectedRows)) {
      this.setState({ wellSelectionMap: Immutable.Map() });
    } else {
      this.onAliquotsSelectedFromAllContainers(_.keys(selectedRows));
    }
  }

  getAliquotsCount(containerIds) {
    const containers = ContainerStore.getByIds(containerIds);
    return containers.reduce((count, container) => count + container.get('aliquot_count'), 0);
  }

  onAliquotsSelectedFromAllContainers(containers) {
    const options = {
      fields: { aliquots: ['id', 'well_idx', 'container_id', 'volume_ul'] },
      limit: this.getAliquotsCount(containers),
      doInjest: false
    };

    AliquotAPI.getByContainerId(containers.toString(), options)
      .done((resp) => {
        Dispatcher.dispatch({ type: 'ALIQUOT_LIST', aliquots: resp.data });
        containers.forEach((containerId) => {
          const aliquots = AliquotStore.getByContainer(containerId);
          const wells = aliquots.filter(aliquot => aliquot.get('volume_ul') > 0).map(aliquot => aliquot.get('well_idx'));
          this.setState({ wellSelectionMap: this.state.wellSelectionMap.merge(this.state.selectionMap).set(containerId, Immutable.fromJS(wells)) });
        });
      });
  }

  onDetailsDrawerButtonSelect() {
    const { containerId, selectedRows } = this.state;
    this.getActions().updateState({ selected: [...selectedRows, containerId] });
    const selectedContainers = {};
    selectedRows.map(element => selectedContainers[element] = true);
    switch (this.state.selectionType) {
      case 'CONTAINER':
      case 'CONTAINER+':
        !this.state.testMode && this.checkNegativeVolumeOrMassContainers([...selectedRows, containerId]);
        this.onSelectedContainerChange(Object.assign(selectedContainers, { [containerId]: true }));
        break;
      case 'ALIQUOT':
        this.onFinalSelect();
        break;
      case 'ALIQUOT+':
        this.state.wellSelectionMap.size === 0 ? this.onAllWellsSelected(containerId, true) : this.setState((prevState) => { return { aliquotsSelectedContainer: [...prevState.aliquotsSelectedContainer, containerId] }; });
        !this.state.testMode && this.checkNegativeVolumeOrMassContainers([...selectedRows, containerId]);
        break;
    }
    this.closeDrawer();
  }

  getDrawerFooterButtonLabel() {
    if (this.canUseInventoryBrowserMicroApp) {
      if (this.state.detailsMode) {
        return 'Select';
      } else if (this.state.selectionType === 'CONTAINER') {
        return 'Use Container';
      } else if (this.state.selectionType === 'CONTAINER+') {
        return 'Use Containers';
      } else if (this.state.selectionType === 'ALIQUOT') {
        return 'Use Aliquot';
      } else if (this.state.selectionType === 'ALIQUOT+') {
        return 'Use Aliquots';
      }
    }
    return this.state.selectionType === 'CONTAINER' ? 'Use Container' : 'Select';
  }

  getModalFooterButtonLabel() {
    if (this.canUseInventoryBrowserMicroApp) {
      return 'Save';
    }
    return this.state.selectionType === 'CONTAINER+' ? 'Use Containers' : 'Use Aliquots';
  }

  onRowClick(container, selectedRows) {
    const id = container.get('id');
    this.state.selectionType === 'ALIQUOT' ? this.disableButton(true) : this.disableButton(false);
    this.setState({
      drawerOpen: true,
      drawerChildren:
  <InventoryDetails
    containerId={id}
    selectionType={this.state.selectionType}
    onSelectedWellsChange={this.onSelectedWellsChange}
    isSingleSelect={this.isSingleSelect()}
    disableButton={this.disableButton}
    test_mode={this.state.testMode}
  />,
      drawerTitle: container.get('label'),
      selectedRows,
      containerId: id,
      detailsMode: true
    });
  }

  onClickDrawerFooterButton() {
    if (this.canUseInventoryBrowserMicroApp && !this.state.detailsMode) {
      return this.closeDrawer;
    }
    return this.onDetailsDrawerButtonSelect;
  }

  getDrawerFooter() {
    return (
      <ButtonGroup>
        <Button
          type="secondary"
          size="small"
          onClick={this.canUseInventoryBrowserMicroApp && this.state.detailsMode ? this.closeDetailDrawer : this.closeDrawer}
        >
          Close
        </Button>
        <Button
          type="primary"
          size="small"
          disabled={this.canUseInventoryBrowserMicroApp && !this.state.detailsMode ? this.acceptBtnDisabled() : this.state.disableSelectButton}
          onClick={this.onClickDrawerFooterButton()}
        >
          {this.getDrawerFooterButtonLabel()}
        </Button>
      </ButtonGroup>
    );
  }

  onFinalSelect() {
    const selectionMap = this.isSelectingContainer() ? this.state.containerSelectionMap : this.state.wellSelectionMap;
    const selectedContainers = ContainerStore.getByIds(selectionMap.keySeq().toJS());
    if (this.canUseInventoryBrowserMicroApp) {
      pubSub.publish(
        `INVENTORY_BROWSER_MODAL_ONSELECTIONCHANGE_${this.state.pubSubKey}`,
        {
          version: 'V1',
          selectionMap,
          selectedContainers
        });
    } else {
      this.props.onSelectionChange(selectionMap);
    }
    this.isSingleSelect() && this.beforeDismiss();
  }

  closeDrawer() {
    if (this.canUseInventoryBrowserMicroApp && this.state.detailsMode) {
      this.setState({ detailsMode: false, disableSelectButton: false });
    } else {
      this.getActions().updateState({ selected: [] });
      this.setState({ drawerOpen: false, disableSelectButton: false });
    }
  }

  openDrawer() {
    this.setState({ drawerOpen: true });
  }

  getZeroState() {
    return this.isSelectingContainer() ? InventorySelectorModalContainerDefaults : InventorySelectorModalAliquotDefaults;
  }

  beforeDismiss() {
    this.setState({
      disabled: true,
      containerSelectionMap: Immutable.Map(),
      wellSelectionMap: Immutable.Map(),
      showBanner: false,
      aliquotsSelectedContainer: [],
      negativeVolumeOrMassContainerIds: [],
      negativeVolumeOrMassContainerLabels: [],
      detailsMode: false
    });
    this.closeDrawer();
    this.getActions().updateState({
      ...this.getZeroState(),
      visibleColumns: InventoryUtil.getVisibleColumns(),
      selected: [],
      organization_id: this.state.organizationId || SessionStore.getOrg().get('id')
    });
    this.props.beforeDismiss();
  }

  saveBtnDisabled() {
    const containerOrWellSelectionMap = this.isSelectingContainer() ? this.state.containerSelectionMap : this.state.wellSelectionMap;
    const haveChangesBeenMade = containerOrWellSelectionMap.equals(this.state.selectionMap);
    return haveChangesBeenMade;
  }

  acceptBtnDisabled() {
    return (this.state.containerSelectionMap.size === 0 && this.state.wellSelectionMap.size === 0);
  }

  closeDetailDrawer() {
    this.setState({ detailsMode: false });
  }

  onSelectionDeleted(containerId) {
    if (this.isSelectingContainer()) {
      const newContainerSelectionMap = this.state.containerSelectionMap.delete(containerId);
      this.setState({ containerSelectionMap: newContainerSelectionMap });
    } else {
      const newWellSelectionMap = this.state.wellSelectionMap.delete(containerId);
      this.setState({ wellSelectionMap: newWellSelectionMap });
    }
  }

  onSearch(query) {
    const modalActions = this.isSelectingContainer() ? InventorySelectorModalContainerActions : InventorySelectorModalAliquotActions;
    modalActions.onSearchInputChange(() => {}, query, this.state.testMode);
    this.openDrawer();
  }

  renderHeader(title) {
    return (
      <div>
        <ModalHeader
          onDismiss={this.beforeDismiss}
          titleContent={title}
        />
      </div>
    );
  }

  renderInventorySelector() {
    return (
      <InventorySelector
        onSelectAll={this.onSelectAll}
        testMode={this.state.testMode}
        onSelectedContainerChange={this.onSelectedContainerChange}
        onAllWellsSelected={this.onAllWellsSelected}
        onRowClick={this.onRowClick}
        onSelectRow={this.onSelectRow}
        selectionType={this.state.selectionType}
        isSingleSelect={this.isSingleSelect()}
        organizationId={this.state.organizationId}
        labId={this.state.labId}
        defaultFilters={this.state.defaultFilters}
      />
    );
  }

  renderSelectorModal() {
    return (
      <SinglePaneModal
        modalId={InventorySelectorModal.MODAL_ID}
        title={this.state.title}
        modalOpen={this.state.modalOpen}
        renderFooter={!this.isSingleSelect()}
        acceptText={this.getModalFooterButtonLabel()}
        onAccept={this.onFinalSelect}
        acceptBtnDisabled={this.acceptBtnDisabled()}
        beforeDismiss={this.beforeDismiss}
        modalSize="xlg"
        hasDrawer
        drawerTitle={this.state.drawerTitle}
        drawerState={this.state.drawerOpen}
        onDrawerClose={this.closeDrawer}
        drawerChildren={this.state.drawerChildren}
        drawerFooterChildren={this.getDrawerFooter()}
        headerRenderer={() => this.renderHeader(this.state.title)}
      >
        {this.state.showBanner && (
          <div className="inventory-selector-modal__banner">
            <Banner
              bannerType="warning"
              bannerTitle="Negative Volume/Mass"
              bannerMessage={this.state.selectionType === 'ALIQUOT+' ? `Some aliquots in the container ${this.state.negativeVolumeOrMassContainerLabels} have negative volumes/masses, those aliquots will be ignored` : `Some of the aliquots in the container ${this.state.negativeVolumeOrMassContainerLabels} have negative volumes/masses. 
              These samples can still be used however, physical material may not be transferred from Aliquots with negative quantities`}
            />
          </div>
        )}
        { this.renderInventorySelector() }
      </SinglePaneModal>
    );
  }

  renderDrawer() {
    return this.state.drawerOpen && (
      <React.Fragment>
        <ModalDrawer
          title="Container inventory"
          drawerState={this.state.drawerOpen}
          onDrawerClose={this.closeDrawer}
          drawerChildren={this.renderInventorySelector()}
          drawerFooterChildren={this.isSingleSelect() ? null : this.getDrawerFooter()}
        />
        <ModalDrawer
          title={this.state.title}
          drawerState={this.state.detailsMode}
          onDrawerClose={this.closeDetailDrawer}
          drawerChildren={this.state.detailsMode ? this.state.drawerChildren : undefined}
          drawerFooterChildren={this.getDrawerFooter()}
          style={{ zIndex: 1000, position: 'fixed' }}
          sideTransition
        />
      </React.Fragment>
    );
  }

  renderConsolidatedSelectorModal() {
    return (
      <SinglePaneModal
        modalId={InventorySelectorModal.MODAL_ID}
        modalOpen={this.state.modalOpen}
        acceptText={this.getModalFooterButtonLabel()}
        onAccept={this.onFinalSelect}
        acceptBtnDisabled={this.saveBtnDisabled()}
        beforeDismiss={this.beforeDismiss}
        modalSize="xlg"
        headerRenderer={() => this.renderHeader(this.state.title)}
      >
        <SelectedInventory
          onClick={this.openDrawer}
          onSearch={this.onSearch}
          onSelectionDeleted={this.onSelectionDeleted}
          containerSelectionMap={this.state.containerSelectionMap}
          wellSelectionMap={this.state.wellSelectionMap}
        />
        {this.renderDrawer()}
      </SinglePaneModal>
    );
  }

  render() {
    if (this.canUseInventoryBrowserMicroApp) {
      return this.renderConsolidatedSelectorModal();
    }
    return this.renderSelectorModal();
  }
}

InventorySelectorModal.propTypes = {
  beforeDismiss: PropTypes.func.isRequired,
  labId: PropTypes.string,
  modalOpen: PropTypes.bool.isRequired,
  onSelectionChange: PropTypes.func,
  organizationId: PropTypes.string,
  selectionMap: PropTypes.instanceOf(Immutable.Map),
  selectionType: PropTypes.string,
  testMode: PropTypes.bool,
  title: PropTypes.string.isRequired
};

export default InventorySelectorModal;
