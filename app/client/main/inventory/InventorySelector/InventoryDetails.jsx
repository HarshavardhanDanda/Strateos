import React                      from 'react';
import _                          from 'lodash';
import Immutable                  from 'immutable';
import classnames                 from 'classnames';
import { PlateSelectLogic, Banner, Divider, CollapsiblePanel }       from '@transcriptic/amino';
import ContainerAPI               from 'main/api/ContainerAPI';
import AliquotAPI                 from 'main/api/AliquotAPI';
import InteractivePlate           from 'main/components/InteractivePlate';
import ConnectToStores            from 'main/containers/ConnectToStoresHOC';
import ContainerTypeHelper        from 'main/helpers/ContainerType';
import AliquotsTablePanel         from 'main/pages/ContainerPage/AliquotsTablePanel';
import AliquotMetaData            from 'main/pages/ContainerPage/AliquotMetadata';
import AliquotComposition         from 'main/pages/ContainerPage/AliquotComposition';
import ContainerMetadata          from 'main/pages/ContainerPage/ContainerMetadata';
import CustomPropertyTable        from 'main/pages/ContainerPage/CustomPropertyTable';
import ContextualCustomPropertiesConfigActions from 'main/actions/ContextualCustomPropertiesConfigActions';
import ContextualCustomPropertyStore from 'main/stores/ContextualCustomPropertyStore';
import AliquotStore               from 'main/stores/AliquotStore';
import ContainerStore             from 'main/stores/ContainerStore';
import ContainerTypeStore         from 'main/stores/ContainerTypeStore';
import ResourceStore              from 'main/stores/ResourceStore';
import SessionStore               from 'main/stores/SessionStore';
import { ShipmentStore }          from 'main/stores/ShipmentStore';
import ShippingCartStore          from 'main/stores/ShippingCartStore';
import StaleContainerStore        from 'main/stores/StaleContainerStore';
import { InventoryPageState }     from 'main/inventory/inventory/InventoryState';
import memoize from 'memoize-one';
import ContextualCustomPropertyUtil from 'main/util/ContextualCustomPropertyUtil';

import './InventoryDetails.scss';

const BANNER_MSG_NEG_VOL_MASS = 'Some Aliquots have negative Volume/Mass. These samples can still be used however, physical material may not be transferred from Aliquots with negative quantities.';

class InventoryDetails extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      mouseHoverWellIndex: undefined,
      statusCode: undefined,
      loading: true,
      aliquot: Immutable.Map(),
      selectedAliquots: Immutable.List(),
      wellMap: Immutable.Map(),
      selectedAliquotIndex: undefined,
      hasNegativeVolumeOrMass: false,
      bannerMessage: '',
      showBanner: false
    };
    this.memoizedWellMapFromAliquots = memoize(this.wellMapFromAliquots).bind(this);
    _.bindAll(
      this,
      'selectSingleAliquotAutomatically',
      'selectedAliquotsFromWellmap',
      'onMouseHoverWellIndexChange',
      'renderContainerPlateDetails',
      'renderAliquotsTablePanel',
      'renderAliquotsInfo',
      'onAliquotClick',
      'onSelectAllClicked',
      'wellMapFromAliquots',
      'getWellData',
      'onWellClicked',
      'resetSelection',
      'onRowClicked',
      'onColClicked',
      'updateAliquotData',
      'onSaveContainerCustomProperty',
      'onSaveAliquotCustomProperty',
    );
  }

  componentDidMount() {
    ContainerAPI.get(this.props.containerId, {
      includes: ['aliquots', 'aliquots.resource', 'container_type', 'stale_container', 'contextual_custom_properties']
    })
      .done((response) => {
        this.setState({ wellMap: this.memoizedWellMapFromAliquots() });
        const aliquots  = AliquotStore.getByContainer(this.props.containerId);
        const negativeVolumeOrMassAliquots = aliquots && aliquots.find(aliquot => Number(aliquot.get('volume_ul')) < 0 || Number(aliquot.get('mass_mg')) < 0);
        if (!_.isEmpty(negativeVolumeOrMassAliquots) && !this.props.test_mode) {
          this.setState({ hasNegativeVolumeOrMass: true });
          if (this.props.selectionType !== 'ALIQUOT') {
            this.setState({ bannerMessage: BANNER_MSG_NEG_VOL_MASS, showBanner: true });
          }
        }
        const orgId = response.data.attributes.organization_id || SessionStore.getOrg().get('id');
        ContextualCustomPropertiesConfigActions.loadConfig(orgId, 'Container,Aliquot');
      })
      .always(() => this.setState({ loading: false }));
  }

  componentDidUpdate(prevProps) {
    if (this.props.aliquots !== prevProps.aliquots) {
      this.selectSingleAliquotAutomatically();
    }
  }

  updateAliquotData(wellIndex) {
    if (wellIndex !== null && wellIndex !== undefined) {
      this.resetSelection();
      const aliquots = this.props.aliquots.toJS();
      aliquots.forEach((aliquot, idx) => {
        if (aliquot.well_idx === wellIndex) {
          this.setState({ selectedAliquotIndex: idx });
        }
      });
    }
  }

  wellMapFromAliquots() {
    const aliquots = AliquotStore.getByContainer(this.props.containerId);
    return aliquots.toMap().mapEntries(([, aliquot]) => {
      const aliquotVolume = aliquot.get('volume_ul');
      const aliquotMass = aliquot.get('mass_mg');
      const hasMass = !isNaN(parseFloat(aliquotMass)) && (parseFloat(aliquotMass) !== 0);
      const hasVolume = !isNaN(parseFloat(aliquotVolume)) && (parseFloat(aliquotVolume) !== 0);
      return [aliquot.get('well_idx'), Immutable.Map({ hasVolume: hasMass || hasVolume, selected: false })];
    });
  }

  setStateOnType() {
    if (['CONTAINER+', 'CONTAINER'].includes(this.props.selectionType) && this.state.hasNegativeVolumeOrMass) {
      this.setState({ bannerMessage: BANNER_MSG_NEG_VOL_MASS, showBanner: true });
    } else {
      this.props.disableButton(false);
      this.setState({ showBanner: false });
    }
  }

  selectedAliquotsFromWellmap() {
    const wellmap = this.state.wellMap;
    var selectedAliquots = Immutable.List();
    var selectedWells = Immutable.List();

    wellmap.filter((value) => value.get('selected') === true)
      .forEach((ele, index) => {
        const aliquot = AliquotStore.getByContainer(this.props.containerId).find(aq => aq.get('well_idx') === index);
        selectedAliquots = selectedAliquots.push(aliquot);
        selectedWells = selectedWells.push(index);
      });

    !selectedAliquots.isEmpty() && this.setState({ selectedAliquots: selectedAliquots }, () => {
      if (this.props.test_mode) {
        this.props.disableButton(false);
      } else if (_.isEmpty(this.state.selectedAliquots.find(aliquot => aliquot.get('volume_ul') < 0 || aliquot.get('mass_mg') < 0))) {
        this.setStateOnType();
      } else {
        this.setState({ bannerMessage: 'This aliquot has negative volume/mass. These samples can still be used however, physical material may not be transferred from Aliquots with negative quantities.', showBanner: true });
      }
    });
    this.props.onSelectedWellsChange(this.props.containerId, selectedWells);
  }

  getWellData(index) {
    const aliquots = AliquotStore.getByContainer(this.props.containerId);
    const aliquot = aliquots.find(aq => aq.get('well_idx') === index);
    return this.getAliquotVolume(aliquot) || this.getAliquotMass(aliquot);
  }

  getAliquotVolume(aliquot) {
    return aliquot ? parseFloat(aliquot.get('volume_ul')) : undefined;
  }

  getAliquotMass(aliquot) {
    return aliquot ? parseFloat(aliquot.get('mass_mg')) : undefined;
  }

  onMouseHoverWellIndexChange(wellIndex) {
    this.setState({ mouseHoverWellIndex: wellIndex });
  }

  selectSingleAliquotAutomatically() {
    const aliquot = this.props.aliquots;
    if (aliquot && aliquot.size === 1) {
      this.onAliquotClick(aliquot.get(0));
    } else if (this.state.selectedAliquotIndex !== undefined) {
      this.onAliquotClick(aliquot.get(this.state.selectedAliquotIndex));
    }
  }

  onAliquotClick(aliquot) {
    if (this.state.selectedAliquots.size === 0) {
      var wellMap = PlateSelectLogic.wellClicked(
        this.state.wellMap,
        aliquot.get('well_idx'),
        false,
        true,
        false
      );
      this.setState({ wellMap, aliquot }, () => {
        this.selectedAliquotsFromWellmap();
      });
    }
  }

  resetSelection() {
    this.setState({
      aliquot: Immutable.Map(),
      selectedAliquots: Immutable.List(),
      wellMap: this.memoizedWellMapFromAliquots(),
      selectedAliquotIndex: undefined
    });
    if (this.state.hasNegativeVolumeOrMass && this.props.selectionType != 'ALIQUOT' && !this.props.test_mode) {
      this.setState({ bannerMessage: BANNER_MSG_NEG_VOL_MASS, showBanner: true });
    }
    if (this.props.selectionType == 'ALIQUOT') {
      this.setState({ showBanner: false });
    }
  }

  onWellClicked(wellIndex, e) {
    this.onMouseHoverWellIndexChange();
    const withCtrl = (e.ctrlKey || e.metaKey) && !this.props.isSingleSelect;
    const aliquot = this.props.aliquots.filter(aliquot => aliquot.get('well_idx') === wellIndex).first();
    this.setState({ aliquot });
    let wellMap = Immutable.Map();
    wellMap = PlateSelectLogic.wellClicked(
      this.state.wellMap,
      wellIndex,
      withCtrl,
      true,
      false
    );
    this.setState({
      wellMap: wellMap
    }, () => {
      this.selectedAliquotsFromWellmap();
    });
  }

  onRowClicked(row, e, wellMap) {
    const [rows, cols] = Array.from(this.rowCols());
    const withCtrl = (e.ctrlKey || e.metaKey) && !this.props.isSingleSelect;
    const result = PlateSelectLogic.rowClicked(
      wellMap,
      row,
      rows,
      cols,
      withCtrl
    );
    this.setState({
      wellMap: result
    }, () => {
      this.selectedAliquotsFromWellmap();
    });
  }

  onColClicked(col, e, wellMap) {
    const [rows, cols] = Array.from(this.rowCols());
    const withCtrl = (e.ctrlKey || e.metaKey) && !this.props.isSingleSelect;
    const result = PlateSelectLogic.colClicked(
      wellMap,
      col,
      rows,
      cols,
      withCtrl
    );
    this.setState({
      wellMap: result
    }, () => {
      this.selectedAliquotsFromWellmap();
    });
  }

  onSelectAllClicked() {
    if (!this.props.isSingleSelect) {
      const [rows, cols] = Array.from(this.rowCols());
      this.setState({
        wellMap: PlateSelectLogic.selectAllClicked(
          this.state.wellMap,
          rows,
          cols,
          true,
          false
        )
      }, () => this.selectedAliquotsFromWellmap());
    }
  }

  rowCols() {
    const wellCount = this.props.containerType.get('well_count');
    const cols = this.props.containerType.get('col_count');
    const rows = wellCount / cols;
    return [rows, cols];
  }

  selectedRobotIndex() {
    if (this.props.wellIndex == undefined) {
      return undefined;
    }
    return this.containerTypeHelper().robotWell(this.props.wellIndex);
  }

  containerTypeHelper() {
    return new ContainerTypeHelper({
      col_count: this.props.containerType.get('col_count')
    });
  }

  onSaveContainerCustomProperty(key, value) {
    const { container } = this.props;
    return ContainerAPI.updateCustomProperty(
      container.get('id'),
      key,
      value);
  }

  onSaveAliquotCustomProperty(key, value) {
    return AliquotAPI.updateCustomProperty(
      this.state.aliquot.get('id'),
      key,
      value);
  }

  renderContainerPlateDetails() {
    const {
      container,
      aliquots,
      containerType,
      containerCustomProperties
    } = this.props;

    const customPropertiesConfigs = ContextualCustomPropertyUtil.getCustomPropertyConfigs(container, 'Container');
    const showCustomPropertyTable = ContextualCustomPropertyUtil.showCPTable(customPropertiesConfigs);
    return (
      <div>
        <InteractivePlate
          containerType={containerType}
          aliquots={aliquots}
          emptyWellsClickable={false}
          selectedIndex={this.selectedRobotIndex() || this.state.mouseHoverWellIndex}
          onWellClick={this.onWellClicked}
          showSelectAll
          wellMap={this.state.wellMap}
          getWellData={this.getWellData}
          onRowClick={(row, e) => this.onRowClicked(row, e, this.state.wellMap)}
          onColClick={(col, e) => this.onColClicked(col, e, this.state.wellMap)}
          onSelectAllClick={this.onSelectAllClicked}
        />
        <h3>
          Metadata
        </h3>
        <ContainerMetadata container={container} containerType={containerType} />
        {showCustomPropertyTable &&
          (
            <React.Fragment>
              <Divider isDark />
              <h3 className="container-page__metadata-header">
                Organization specific properties
              </h3>
              <CustomPropertyTable
                customPropertiesConfigs={customPropertiesConfigs}
                customProperties={containerCustomProperties}
                onSaveCustomProperty={(key, value) => this.onSaveContainerCustomProperty(key, value)}
              />
            </React.Fragment>
          )
        }
      </div>
    );
  }

  renderAliquotsTablePanel() {
    const aliquots = this.state.selectedAliquots.size <= 1 ? this.props.aliquots : this.state.selectedAliquots;
    const negativeAliquots = aliquots.filter(aliquot => aliquot.get('volume_ul') < 0 || aliquot.get('mass_mg') < 0);

    const rowColorMap = {};
    !this.props.test_mode && negativeAliquots.forEach((negativeAliquot) => {
      rowColorMap[negativeAliquot.get('id')] = 'danger';
    });

    return (
      <AliquotsTablePanel
        aliquots={this.state.selectedAliquots.size < 2  ? this.props.aliquots : this.state.selectedAliquots}
        containerType={this.props.containerType}
        containerId={this.props.containerId}
        resources={this.props.resources}
        onMouseEnterRow={this.onMouseHoverWellIndexChange}
        onMouseLeaveRow={this.onMouseHoverWellIndexChange}
        loading={this.state.loading}
        onModal
        onAliquotClick={this.onAliquotClick}
        rowColorMap={rowColorMap}
      />
    );
  }

  renderAliquotsInfo() {
    const { container } = this.props;
    const helper       = new ContainerTypeHelper({ col_count: this.props.containerType.get('col_count') });
    const wellIndex    = this.state.aliquot.get('well_idx');
    const aliquotIndex = helper.humanWell(wellIndex);

    const aliquotCustomProperties = ContextualCustomPropertyStore.getCustomProperties(this.state.aliquot.get('id'), 'Aliquot');
    const customPropertiesConfigs = ContextualCustomPropertyUtil.getCustomPropertyConfigs(container, 'Aliquot');
    const showCustomPropertyTable = ContextualCustomPropertyUtil.showCPTable(customPropertiesConfigs);

    return (
      <div>
        <div className="inventory-drawer-details__panel-heading">
          <span onClick={() => this.resetSelection()} className="inventory-drawer-details__navback">
            <i className="fa fa-chevron-left inventory-drawer-details__navback-icon" />
            <span>
              <h3 className="inventory-drawer-details__navback-title">Aliquots / </h3>
            </span>
          </span>
          <span>
            <h3 className="inventory-drawer-details__navback-wellname tx-type--secondary tx-type--heavy">
              {aliquotIndex}
            </h3>
          </span>
        </div>
        <AliquotMetaData
          aliquot={this.state.aliquot}
          containerType={this.props.containerType}
          editable={this.props.editable}
          container={this.props.container}
          updateAliquotData={this.updateAliquotData}
        />
        {showCustomPropertyTable && (
        <div>
          <Divider isDark />
          <CollapsiblePanel wide title="Organization specific properties" initiallyCollapsed={false}>
            <CustomPropertyTable
              customProperties={aliquotCustomProperties}
              customPropertiesConfigs={customPropertiesConfigs}
              onSaveCustomProperty={(key, value) => this.onSaveAliquotCustomProperty(key, value)}
            />
          </CollapsiblePanel>
        </div>
        )}
        <Divider isDark />
        <h3>Compounds</h3>
        <AliquotComposition
          id={this.state.aliquot.get('id')}
          container={this.props.container}
          aliquotIndex={aliquotIndex}
          editable={this.props.editable}
        />
      </div>
    );
  }

  render() {
    return (
      <div className="inventory-drawer-details__drawer-scroll">
        <div className="inventory-drawer-details__banner">
          {this.state.hasNegativeVolumeOrMass && this.state.showBanner && (
          <Banner
            bannerType="warning"
            bannerTitle="Negative Volume/Mass"
            bannerMessage={this.state.bannerMessage}
          />
          )}
        </div>
        <div  className={classnames('inventory-drawer-details__drawer-body',
          { 'inventory-drawer-details__drawer-body--with-footer': this.props.isSingleSelect })}
        >
          <div className="inventory-drawer-details__interactive-plate col-xs-12 col-sm-6">
            {this.renderContainerPlateDetails()}
          </div>
          <div className="inventory-drawer-details__aliquot-panel col-xs-12 col-sm-6">
            <Choose>
              <When condition={this.state.selectedAliquots.size === 1 || this.props.containerType === 'tube'}>
                { this.renderAliquotsInfo()}
              </When>
              <Otherwise>
                {this.renderAliquotsTablePanel()}
              </Otherwise>
            </Choose>
          </div>
        </div>
      </div>
    );
  }
}

InventoryDetails.defaultProps = {
  editable: true
};

const getStateFromStores = (props) => {
  const {
    createdContainers
  } = InventoryPageState.get();

  const containerId = props.containerId;
  const wellIndex   = props.wellIndex;

  const container         = ContainerStore.getById(containerId);
  const aliquots          = AliquotStore.getByContainer(containerId);
  const containerCustomProperties = ContextualCustomPropertyStore.getCustomProperties(containerId, 'Container');
  const resources         = ResourceStore.getAll().toList();
  const staleContainer    = StaleContainerStore.getByContainerId(containerId);
  const inShippingCart    = ShippingCartStore.has(containerId);
  const canAddTestSamples = SessionStore.isDeveloper();

  let containerType;
  let shipment;

  if (container) {
    containerType = ContainerTypeStore.getById(container.get('container_type_id'));
    shipment      = ShipmentStore.shipmentModelForId(container.get('shipment_id'));
  }
  return {
    containerId,
    createdContainers,
    canAddTestSamples,
    container,
    containerCustomProperties,
    containerType,
    aliquots,
    resources,
    wellIndex,
    inShippingCart,
    shipment,
    staleContainer
  };
};
const InventoryDetailsHOC = ConnectToStores(InventoryDetails, getStateFromStores);
export default InventoryDetailsHOC;
export { InventoryDetails };
