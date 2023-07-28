import Immutable from 'immutable';
import _ from 'lodash';
import Urls from 'main/util/urls';
import PropTypes from 'prop-types';
import Querystring from 'query-string';
import React from 'react';
import { Link, Switch, Route, Redirect } from 'react-router-dom';
import { Page, Button, Breadcrumbs, Spinner, Label, Subtabs, Divider, CollapsiblePanel, ImmutablePureComponent } from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';

import ContainerActions from 'main/actions/ContainerActions';
import ModalActions from 'main/actions/ModalActions';
import ShipmentActions from 'main/actions/ShipmentActions';
import ShippingCartActions from 'main/actions/ShippingCartActions';
import UserActions from 'main/actions/UserActions';
import StaleContainerActions from 'main/actions/StaleContainerActions';
import ContainerAPI from 'main/api/ContainerAPI';
import InteractivePlate from 'main/components/InteractivePlate';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout } from 'main/components/TabLayout';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import ContainerTypeHelper from 'main/helpers/ContainerType';
import { InventoryPageActions } from 'main/inventory/inventory/InventoryActions';
import { InventoryPageState } from 'main/inventory/inventory/InventoryState';
import AdminPanel from 'main/pages/ContainerPage/AdminPanel';
import AliquotInfoPanel from 'main/pages/ContainerPage/AliquotInfoPanel';
import AliquotsTablePanel from 'main/pages/ContainerPage/AliquotsTablePanel';
import ContainerMetadata from 'main/pages/ContainerPage/ContainerMetadata';
import CustomPropertyTable from 'main/pages/ContainerPage/CustomPropertyTable';
import RelatedRuns from 'main/pages/ContainerPage/RelatedRuns';
import AddContainerModal from 'main/pages/InventoryPage/AddContainerModal';
import AliquotStore from 'main/stores/AliquotStore';
import ContainerStore from 'main/stores/ContainerStore';
import ContextualCustomPropertiesConfigActions from 'main/actions/ContextualCustomPropertiesConfigActions';
import ContextualCustomPropertyStore from 'main/stores/ContextualCustomPropertyStore';
import ContextualCustomPropertyUtil from 'main/util/ContextualCustomPropertyUtil';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import ResourceStore from 'main/stores/ResourceStore';
import SessionStore from 'main/stores/SessionStore';
import UserStore from 'main/stores/UserStore';
import { ShipmentStore } from 'main/stores/ShipmentStore';
import ShippingCartStore from 'main/stores/ShippingCartStore';
import StaleContainerStore from 'main/stores/StaleContainerStore';
import { ContainerSearchStore } from 'main/stores/search';
import AcsControls from 'main/util/AcsControls';
import ContainerBadge from './ContainerBadge';
import ContainerSettingsModal from './ContainerSettingsModal';
import ContainerCode from './ContainerCode';

import './ContainerPage.scss';

export class ContainerPage extends ImmutablePureComponent {

  static get propTypes() {
    return {
      history: PropTypes.any.isRequired,
      location: PropTypes.any.isRequired,
      match: PropTypes.any.isRequired,
      containerId: PropTypes.string.isRequired,
      container: PropTypes.instanceOf(Immutable.Map),
      containerType: PropTypes.instanceOf(Immutable.Map),
      customProperties: PropTypes.instanceOf(Immutable.List),
      aliquots: PropTypes.instanceOf(Immutable.List),
      resources: PropTypes.instanceOf(Immutable.List),
      wellIndex: PropTypes.string,
      atEffectId: PropTypes.string,
      inShippingCart: PropTypes.bool.isRequired,
      shipment: PropTypes.object,
      staleContainer: PropTypes.instanceOf(Immutable.Map),
      canAddTestSamples: PropTypes.bool,
      createdContainers: PropTypes.instanceOf(Immutable.Map)
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      mouseHoverWellIndex: undefined,
      statusCode: undefined,
      loading: true,
      selectedTab: 'Sample Details'
    };

    _.bindAll(
      this,
      'onClickAliquot',
      'onMouseHoverWellIndexChange',
      'onContainerCreation',
      'renderAliquotsTablePanel',
      'renderAliquotsInfoPanel',
      'renderContainerPlateDetails',
      'renderRelatedRuns',
      'onCompoundClick',
      'onSaveCustomProperty',
    );
  }

  componentDidMount() {
    if (window.intercomSettings) {
      window.intercomSettings.container_id = this.props.match.params.containerId;
    }

    ContainerAPI.get(this.props.match.params.containerId, {
      includes: ['aliquots', 'aliquots.resource', 'container_type', 'stale_container', 'contextual_custom_properties']
    })
      .done((response) => {
        const { shipment_id: shipmentId, created_by } = response.data.attributes;

        if (created_by && !UserStore.getById(created_by)) {
          UserActions.load(created_by);
        }

        if (shipmentId && !this.isOrgLessPage()) {
          ShipmentActions.load(shipmentId);
        }
        const orgId = response.data.attributes.organization_id || SessionStore.getOrg().get('id');
        ContextualCustomPropertiesConfigActions.loadConfig(orgId, 'Container,Aliquot');
      })
      .fail(xhr => this.setState({ statusCode: xhr.status }))
      .always(() => this.setState({ loading: false }));
  }

  componentWillUnmount() {
    if (window.intercomSettings) {
      window.intercomSettings.container_id = undefined;
    }
  }

  onCompoundClick(linkId, tab) {
    const state = tab && { state: {
      tab
    } };

    this.props.history.push({
      pathname: Urls.compound(linkId),
      ...state
    });
  }

  onClickAliquot(wellIndex) {
    const helper      = this.containerTypeHelper();
    const containerId = this.props.container.get('id');
    const humanIndex  = helper.humanWell(wellIndex);

    let path;

    if (this.isOrgLessPage()) {
      path = Urls.orglessAliquot(containerId, humanIndex);
    } else {
      path = Urls.aliquot(containerId, humanIndex);
    }

    // remove hover well index.
    this.onMouseHoverWellIndexChange();

    this.props.history.push(path);
  }

  onMouseHoverWellIndexChange(wellIndex) {
    this.setState({ mouseHoverWellIndex: wellIndex });
  }

  onContainerCreation(containers) {
    // create an id -> container mapping and merge into current state.
    const currentCreatedContainers = this.props.createdContainers;
    const newCreatedContainers = containers
      .toMap()
      .mapKeys((k, container) => container.get('id'));

    InventoryPageActions.updateState({
      createdContainers: currentCreatedContainers.merge(newCreatedContainers)
    });

    return containers.forEach(container =>
      ContainerSearchStore.prependResult(container)
    );
  }

  canDestroyContainer(container) {
    return (AcsControls.isFeatureEnabled(FeatureConstants.DESTROY_CONTAINER) ||
      AcsControls.isFeatureEnabled(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS)) &&
       _.includes(['inbound', 'available', 'consumable'], container.get('status'));

  }

  getActionOptions() {
    const container = this.props.container;
    const staleInfo = this.props.staleContainer;
    const options = [];

    const hasLabPermissions = container && container.get('lab') && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_CONTAINERS_IN_LAB);
    const hasEditPermissions = AcsControls.isFeatureEnabled(FeatureConstants.EDIT_CONTAINER);
    if (!container) {
      return options;
    }

    if (hasEditPermissions || hasLabPermissions) {
      options.push({
        text: 'Container Settings',
        onClick: () => { ModalActions.open('ContainerSettingsModal'); },
        icon: 'fa fa-cogs'
      });
    }

    const isShippingAllowed = _.includes(['consumable', 'available'], container.get('status'));

    const shippable = isShippingAllowed && ShippingCartActions.canContainersBeShipped([container]);
    const canShipContainer = AcsControls.isFeatureEnabled(FeatureConstants.REQUEST_SAMPLE_RETURN);

    if (!this.props.inShippingCart && shippable && canShipContainer) {
      options.push({
        text: 'Ship container',
        icon: 'fa fa-truck',
        onClick: () => ShippingCartActions.add(container)
      });
    }

    if (this.canDestroyContainer(container)) {
      options.push({
        text: 'Destroy container',
        icon: 'fa fa-trash-alt',
        onClick: () => { ContainerActions.destroy(container.get('id')); }
      });
    }

    if (_.includes(['consumable', 'available'], container.get('status')) && staleInfo && staleInfo.get('willBeDestroyedAt')) {
      options.push({
        text: 'Request Extension',
        icon: 'fa fa-sync',
        onClick: () => StaleContainerActions.flagForExtension(staleInfo.get('id'))
      });
    }

    return options;
  }

  isOrgLessPage() {
    // In our tests we don't pass the location
    // TODO: please pass react information to method
    if (this.props.location == undefined) {
      return false;
    }
    // are we viewing '/containers/:id' vs '/:subdomain/inventory.../containers/:id'
    return this.props.location.pathname.startsWith('/containers/');
  }

  hasCreatePermission() {
    return (AcsControls.isFeatureEnabled(FeatureConstants.CREATE_SAMPLE_SHIPMENTS) || AcsControls.isFeatureEnabled(FeatureConstants.CREATE_TEST_CONTAINERS));
  }

  selectedRobotIndex() {
    if (this.props.wellIndex == undefined) {
      return undefined;
    }

    return this.containerTypeHelper().robotWell(this.props.wellIndex);
  }

  selectedAliquot() {
    const robotIndex = this.selectedRobotIndex();

    if (robotIndex == undefined) {
      return undefined;
    }

    return this.props.aliquots.find(a => a.get('well_idx') === robotIndex);
  }

  containerTypeHelper() {
    return new ContainerTypeHelper({
      col_count: this.props.containerType.get('col_count')
    });
  }

  getSelectedIndex() {
    const selectedRobotIndex = this.selectedRobotIndex();

    if (selectedRobotIndex === undefined) return this.state.mouseHoverWellIndex;
    return selectedRobotIndex;
  }

  getContainerDetailPath() {
    let path;
    if (this.isOrgLessPage()) {
      path = Urls.orglessContainer(this.props.containerId);
    } else {
      path = Urls.container(this.props.containerId);
    }
    return path;
  }

  onSaveCustomProperty(key, value) {
    const { container } = this.props;
    return ContainerAPI.updateCustomProperty(
      container.get('id'),
      key,
      value);
  }

  renderPrimaryInfo() {
    return ([
      <ContainerCode
        container={this.props.container}
        containerType={this.props.containerType}
        key="container-code"
      />,
      <ContainerBadge
        key="container-badge"
        container={this.props.container}
        shipment={this.props.shipment}
        staleContainer={this.props.staleContainer}
        inShippingCart={this.props.inShippingCart}
      />,
      !this.isOrgLessPage() && this.hasCreatePermission() && (
        <Button
          key="add-container-button"
          type="primary"
          size="medium"
          icon="fa-plus"
          onClick={() => { ModalActions.open(AddContainerModal.MODAL_ID); }}
        >Add Container
        </Button>
      )
    ]);
  }

  renderAliquotsTablePanel() {
    return (
      <div className="container-page__border-line container-page__aliquot-panel">
        <AliquotsTablePanel
          aliquots={this.props.aliquots}
          containerType={this.props.containerType}
          containerId={this.props.containerId}
          resources={this.props.resources}
          onMouseEnterRow={this.onMouseHoverWellIndexChange}
          onMouseLeaveRow={this.onMouseHoverWellIndexChange}
          loading={this.state.loading}
          isOrgless={this.isOrgLessPage()}
          onCompoundClick={this.onCompoundClick}
        />
      </div>
    );
  }

  renderAliquotsInfoPanel() {
    return (
      <AliquotInfoPanel
        aliquot={this.selectedAliquot()}
        containerType={this.props.containerType}
        container={this.props.container}
        atEffectId={this.props.atEffectId}
        returnUrl={
          this.getContainerDetailPath()
        }
        onCompoundClick={this.onCompoundClick}
      />
    );
  }

  renderContainerPlateDetails() {
    const {
      container,
      aliquots,
      containerType,
      customProperties
    } = this.props;
    const customPropertiesConfigs = ContextualCustomPropertyUtil.getCustomPropertyConfigs(container, 'Container');
    const showCustomPropertyTable = ContextualCustomPropertyUtil.showCPTable(customPropertiesConfigs);

    return (
      <div>
        <InteractivePlate
          containerType={containerType}
          aliquots={aliquots}
          emptyWellsClickable={false}
          selectedIndex={this.getSelectedIndex()}
          onWellClick={this.onClickAliquot}
        />
        <Divider isDark />
        <CollapsiblePanel title="Properties" wide initiallyCollapsed={false}>
          <ContainerMetadata container={container} containerType={containerType} />
        </CollapsiblePanel>
        {showCustomPropertyTable &&
          (
            <React.Fragment>
              <Divider isDark />
              <h3 className="container-page__metadata-header">
                Organization specific properties
              </h3>
              <CustomPropertyTable
                customPropertiesConfigs={customPropertiesConfigs}
                customProperties={customProperties}
                onSaveCustomProperty={(key, value) => this.onSaveCustomProperty(key, value)}
              />
            </React.Fragment>
          )
        }
      </div>
    );
  }

  renderRelatedRuns() {
    const { containerId } = this.props;
    return (
      <RelatedRuns containerId={containerId} />
    );
  }

  renderTabHeader() {
    return (
      <Subtabs activeItemKey={this.state.selectedTab}>
        <span key="Sample Details" onClick={() => this.setState({ selectedTab: 'Sample Details' })}>
          Sample details
        </span>
        <span key="Related Runs" onClick={() => this.setState({ selectedTab: 'Related Runs' })}>
          Related runs
        </span>
      </Subtabs>
    );
  }

  renderTabContent() {
    const activeKey = this.state.selectedTab;
    switch (activeKey) {
      case 'Related Runs':
        return this.renderRelatedRuns();
      default:
        return this.renderContainerPlateDetails();
    }
  }

  render() {
    const {
      containerId,
      container,
      containerType
    } = this.props;

    const title = container ? (container.get('label') || container.get('id')) : containerId;
    return (
      <Page title={title} statusCode={this.state.statusCode}>
        <Choose>
          <When condition={!container || !containerType}>
            <Spinner />
          </When>
          <Otherwise>
            <PageLayout
              PageHeader={(
                <PageHeader
                  titleArea={(
                    <Breadcrumbs>
                      <If condition={!this.isOrgLessPage()}>
                        <Link to={Urls.inventory()}>Inventory</Link>
                      </If>
                      <Link to={Urls.samples()}>
                        Containers
                      </Link>
                      <Link to={Urls.container(containerId)}>
                        {container.get('label') || containerId}
                      </Link>
                    </Breadcrumbs>
                  )}
                  primaryInfoArea={this.renderPrimaryInfo()}
                  actions={this.getActionOptions()}
                />
                  )}
              Subtabs={this.renderTabHeader()}
              Modals={[
                !this.isOrgLessPage() && (
                  <AddContainerModal
                    key="add-container-modal"
                    onContainerCreation={this.onContainerCreation}
                    canAddTestMode={this.props.canAddTestSamples}
                    subdomain={SessionStore.getOrg().get('subdomain')}
                    closeOnClickOut={false}
                  />
                ),
                <ContainerSettingsModal key="container-settings-modal" container={container} />
              ]}
            >
              <TabLayout>
                <Choose>
                  <When condition={container.get('status') === 'pending_destroy'}>
                    <Label
                      title="This container is in the destruction pipeline and is no longer accessible."
                      type="warning"
                      icon="fa fa-trash-alt"
                      className="alert"
                    />
                  </When>
                  <When condition={container.get('status') === 'destroyed'}>
                    <Label
                      title="This container has been destroyed and is no longer accessible."
                      type="warning"
                      icon="fa fa-trash-alt"
                      className="alert"
                    />
                  </When>
                </Choose>
                <div className="row">
                  <div className="col-xs-12 col-md-6">
                    <div className="container-page__border-line">
                      <div className="container-page__tab-content">
                        {this.renderTabContent()}
                      </div>
                    </div>
                  </div>
                  <div className="col-xs-12 col-md-6">
                    <If condition={(container.get('lab') && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_CONTAINERS_IN_LAB))}>
                      <div className="container-page__border-line container-page__admin-panel">
                        <CollapsiblePanel title="Admin panel" wide>
                          <AdminPanel container={container} containerType={containerType} />
                        </CollapsiblePanel>
                      </div>
                    </If>
                    <Switch>
                      <Route
                        exact
                        path="/:subdomain/inventory/samples/:containerId"
                        render={this.renderAliquotsTablePanel}
                      />
                      <Route
                        exact
                        path="/containers/:containerId"
                        render={this.renderAliquotsTablePanel}
                      />
                      {
                          this.props.aliquots && this.props.aliquots.size === 0 && (
                          <Route exact path={`${this.getContainerDetailPath()}/:wellIndex`}>
                            <Redirect to={this.getContainerDetailPath()} />
                          </Route>
                          )
                      }
                      <Route
                        exact
                        path="/:subdomain/inventory/samples/:containerId/:wellIndex"
                        render={this.renderAliquotsInfoPanel}
                      />
                      <Route
                        exact
                        path="/containers/:containerId/:wellIndex"
                        render={this.renderAliquotsInfoPanel}
                      />
                    </Switch>
                  </div>
                </div>
              </TabLayout>
            </PageLayout>
          </Otherwise>
        </Choose>
      </Page>
    );
  }
}

const getStateFromStores = (props) => {
  const {
    createdContainers
  } = InventoryPageState.get();

  const containerId = props.match.params.containerId;
  const wellIndex = props.match.params.wellIndex;

  const qs = window.location.search.substr(1);
  const atEffectId = Querystring.parse(qs).at_effect;

  const container = ContainerStore.getById(containerId);
  const customProperties = ContextualCustomPropertyStore.getCustomProperties(containerId, 'Container');
  const aliquots = AliquotStore.getByContainer(containerId);
  const resources = ResourceStore.getAll().toList();
  const staleContainer = StaleContainerStore.getByContainerId(containerId);
  const inShippingCart = ShippingCartStore.has(containerId);
  const canAddTestSamples = SessionStore.isDeveloper();

  let containerType;
  let shipment;

  if (container) {
    containerType = ContainerTypeStore.getById(container.get('container_type_id'));
    shipment = ShipmentStore.shipmentModelForId(container.get('shipment_id'));
  }

  return {
    containerId,
    createdContainers,
    canAddTestSamples,
    container,
    customProperties,
    containerType,
    aliquots,
    resources,
    wellIndex,
    atEffectId,
    inShippingCart,
    shipment,
    staleContainer
  };
};

export default ConnectToStores(ContainerPage, getStateFromStores);
