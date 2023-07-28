import React from 'react';
import PropTypes from 'prop-types';
import { NavLink, Link } from 'react-router-dom';
import { TabRouter, Subtabs, Breadcrumbs, Button } from '@transcriptic/amino';

import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout } from 'main/components/TabLayout';
import LocationsPage from 'main/pages/InventoryPage/LocationsPage';
import IdtOrdersPage from 'main/pages/InventoryPage/IdtOrdersPage/IdtOrdersPage';
import ContainerDestructionPage from 'main/pages/ContainerDestructionPage';
import Urls from 'main/util/urls';
import StaleContainersPage from 'main/pages/InventoryPage/StaleContainersPage/StaleContainersPage';
import ModalActions from 'main/actions/ModalActions';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';
import AddContainerModal from './AddContainerModal';
import ConnectedInventoryPage from './ConnectedInventoryPage';

class InventoryLayout extends React.Component {
  static get propTypes() {
    return {
      match: PropTypes.shape({
        path: PropTypes.string.isRequired
      })
    };
  }

  render() {
    const { match } = this.props;
    const hasCreatePermission = () => {
      return (AcsControls.isFeatureEnabled(FeatureConstants.CREATE_SAMPLE_SHIPMENTS) || AcsControls.isFeatureEnabled(FeatureConstants.CREATE_TEST_CONTAINERS));
    };
    return (
      <TabRouter basePath={Urls.inventory()}>
        {
          () => {
            return (
              <PageLayout
                PageHeader={(
                  <PageHeader
                    titleArea={(
                      <Breadcrumbs>
                        <Link
                          to={Urls.inventory()}
                        >
                          Inventory
                        </Link>
                      </Breadcrumbs>
                    )}
                    primaryInfoArea={match.path === '/:subdomain/inventory/samples' && !this.canUseInventoryBrowserMicroApp && hasCreatePermission() && (
                      <Button
                        type="primary"
                        size="medium"
                        icon="fa-plus"
                        onClick={() => {
                          ModalActions.open(AddContainerModal.MODAL_ID);
                        }}
                      >
                        Add container
                      </Button>
                    )}
                  />
                )}
                Subtabs={<Tabs match={match} />}
              >
                <Choose>
                  <When condition={match.path === '/:subdomain/inventory/samples'}>
                    <ConnectedInventoryPage history={this.props.history} />
                  </When>
                  <Otherwise>
                    <TabLayout>
                      <Choose>
                        <When condition={
                          match.path === '/:subdomain/inventory/locations/:locationId?' ||
                            match.path === '/:subdomain/inventory/container_location/:containerId/:wellIndex?'
                          }
                        >
                          <LocationsPage {...this.props} />
                        </When>
                        <When condition={match.path === '/:subdomain/inventory/stale_containers'}>
                          <StaleContainersPage {...this.props} />
                        </When>
                        <When condition={match.path === '/:subdomain/inventory/idt_orders'}>
                          <IdtOrdersPage {...this.props} />
                        </When>
                        <When condition={match.path === '/:subdomain/inventory/container_destruction_requests'}>
                          <ContainerDestructionPage />
                        </When>
                      </Choose>
                    </TabLayout>
                  </Otherwise>
                </Choose>
              </PageLayout>
            );
          }}
      </TabRouter>
    );
  }
}

function Tabs(location) {
  return (
    <Subtabs>
      <If condition={FeatureStore.hasFeature(FeatureConstants.MANAGE_CONTAINER_LOCATIONS)}>
        <NavLink
          to={`${Urls.locations()}`}
          isActive={() => {
            return location.match.path === '/:subdomain/inventory/locations/:locationId?' ||
              location.match.path === '/:subdomain/inventory/container_location/:containerId/:wellIndex?';
          }}
        >
          Locations
        </NavLink>
      </If>
      <If condition={AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_CONTAINER_DESTRUCTION_REQUESTS)}>
        <NavLink
          to={`${Urls.container_destruction_requests()}`}
        >
          Destruction requests
        </NavLink>
      </If>
      <If condition={FeatureStore.hasFeature(FeatureConstants.MANAGE_STALE_CONTAINERS)}>
        <NavLink
          to={`${Urls.stale_containers()}`}
        >
          Stale
        </NavLink>
      </If>
      <If condition={FeatureStore.hasFeature(FeatureConstants.MANAGE_IDT_ORDERS)}>
        <NavLink
          to={`${Urls.idt_orders()}`}
        >
          IDT orders
        </NavLink>
      </If>
      <If condition={AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_CONTAINERS_IN_LAB) || AcsControls.isFeatureEnabled(FeatureConstants.VIEW_SAMPLE_CONTAINERS)}>
        <NavLink
          to={`${Urls.samples()}`}
        >
          Containers
        </NavLink>
      </If>
    </Subtabs>
  );
}

export default InventoryLayout;
