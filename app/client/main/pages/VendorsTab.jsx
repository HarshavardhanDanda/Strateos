import React from 'react';
import PropTypes from 'prop-types';
import Urls from 'main/util/urls';
import { NavLink, Link } from 'react-router-dom';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout } from 'main/components/TabLayout';
import { TabRouter, Subtabs, Breadcrumbs, Page, Button } from '@transcriptic/amino';
import VendorsPage from 'main/pages/VendorsPage/VendorPage.jsx';
import SuppliersPage from 'main/pages/SuppliersPage/SupplierPage.jsx';
import ResourcesPage from 'main/pages/ResourcesPage';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import MaterialsPage from './MaterialsPage/MaterialsPage';
import MaterialOrdersPage from './MaterialOrdersPage';

export function Tabs() {
  const canManageKits = AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES);
  return (
    <Subtabs>
      {AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KIT_ORDERS) && (
        <NavLink to={`${Urls.material_orders_page()}`}>
          Orders
        </NavLink>
      )}
      {(AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES) || AcsControls.isFeatureEnabled(FeatureConstants.VIEW_PUBLIC_MATERIALS)) && (
        <NavLink to={`${Urls.material_page()}`}>
          Materials
        </NavLink>
      )}
      {canManageKits && (
        <NavLink to={`${Urls.vendor_resources()}`}>
          Resources
        </NavLink>
      )}
      {canManageKits && (
        <NavLink to={`${Urls.vendors()}`}>
          Vendors
        </NavLink>
      )}
      {canManageKits && (
        <NavLink to={`${Urls.suppliers()}`}>
          Suppliers
        </NavLink>
      )}
    </Subtabs>
  );
}

const propTypes = {
  match: PropTypes.shape({
    path: PropTypes.string.isRequired
  })
};

class VendorsLayout extends React.Component {
  render() {
    const { match } = this.props;
    return (
      AcsControls.isFeatureEnabled(FeatureConstants.KIT_MGMT) && (
        <Page title="Vendors">
          <TabRouter basePath={Urls.vendor_page()} defaultTabId="resources">
            {
              () => {
                return (
                  <PageLayout
                    PageHeader={(
                      <PageHeader
                        titleArea={(
                          <Breadcrumbs>
                            <Link
                              to={Urls.vendor_page()}
                            >
                              Vendor supplies
                            </Link>
                          </Breadcrumbs>
                        )}
                        primaryInfoArea={(AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KIT_ORDERS) &&
                          AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES)) && (
                          (
                          <Button
                            type="primary"
                            size="medium"
                            to={Urls.new_material_order()}
                          >
                            New order
                          </Button>
                          )
                        )}
                      />
                    )}
                    Subtabs={<Tabs />}
                  >
                    {(match.path.includes('/vendor/materials') && (AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES) || AcsControls.isFeatureEnabled(FeatureConstants.VIEW_PUBLIC_MATERIALS))) && (
                      <MaterialsPage history={this.props.history} />
                    )}
                    {(match.path.includes('/vendor/resources') && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES)) && (
                      <ResourcesPage />
                    )}
                    {(match.path.includes('/vendor/vendors') && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES)) && (
                      <TabLayout>
                        <VendorsPage />
                      </TabLayout>
                    )}
                    {(match.path.includes('/vendor/suppliers') && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES)) && (
                      <TabLayout>
                        <SuppliersPage />
                      </TabLayout>
                    )}
                    {(match.path.includes('/vendor/orders') && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KIT_ORDERS)) && (
                      <MaterialOrdersPage {...this.props} history={this.props.history} />
                    )}
                  </PageLayout>
                );
              }}
          </TabRouter>
        </Page>
      )
    );

  }
}
VendorsLayout.propTypes = propTypes;

export default VendorsLayout;
