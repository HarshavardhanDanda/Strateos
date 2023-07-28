/* eslint-disable max-len, react/jsx-first-prop-new-line, react/jsx-closing-bracket-location, react/jsx-space-before-closing */
import React from 'react';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';
import { Page } from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';

import App from 'main/App';
import AuthorizeHOC from 'main/containers/AuthorizeHOC';
import SessionStore from 'main/stores/SessionStore';
import RootNodeDebugger from 'main/state/RootNodeDebugger';
import FeatureStore from 'main/stores/FeatureStore';

import { CompoundDetailPage } from 'main/pages/CompoundsPage';
import MaterialOrderDetailsPage from 'main/pages/MaterialOrdersPage/MaterialOrderDetailsPage/MaterialOrderDetailsPage';
import MaterialOrdersCheckinPage from 'main/pages/MaterialOrdersPage/MaterialOrdersCheckinPage';
import MaterialOrdersCheckinCSVPage from 'main/pages/MaterialOrdersPage/MaterialOrdersCheckinCSVPage';
import EditMaterialOrderPage from 'main/pages/MaterialOrdersPage/EditMaterialOrderPage/EditMaterialOrderPage';
import ContainerPage from 'main/pages/ContainerPage';
import ContainerTypesPage from 'main/pages/ContainerTypesPage';
import VendorsTab from 'main/pages/VendorsTab';
import MaterialDetailsPage from 'main/pages/MaterialsPage/MaterialDetailsPage';
import OrganizationPageHOC from 'main/pages/OrganizationPage';
import { PackageOverviewPage } from 'main/pages/PackageOverviewPage';
import PackageProtocolPage from 'main/pages/PackageProtocolPage';
import PackagesPage from 'main/pages/PackagesPage';
import ProjectPage from 'main/pages/ProjectPage';
import ProjectsPage from 'main/pages/ProjectsPage';
import QuickLaunchPage from 'main/pages/QuickLaunchPage';
import ReleasePage from 'main/pages/ReleasePage';
import RunClonePage from 'main/pages/RunClonePage';
import { RunDatumPage } from 'main/components/RunDatum';
import RunLaunchPage from 'main/pages/RunLaunchPage';
import RunPage from 'main/pages/RunPage';
import RunPreviewPage from 'main/pages/RunPreviewPage';
import StaticNotebookPage from 'main/pages/StaticNotebookPage';
import UserHasNoOrgPage from 'main/pages/UserHasNoOrgPage';
import UserPage from 'main/pages/UserPage';
import ShipmentsPage from 'main/pages/ShipmentsPage';
import ShipmentCheckinPage from 'main/pages/ShipmentsCheckin';
import AcsControls from 'main/util/AcsControls';
import LabShipmentsPage from 'main/pages/ShipsPage/LabShipmentsPage';
import RunsPage from 'main/pages/RunsPage';
import PrimeDirectivePage from 'main/pages/PrimeDirectivePage';
import DevicesPage from 'main/pages/DevicesPage';
import ReactionsPage from 'main/pages/ReactionsPage';
import ReactionPage from 'main/pages/ReactionPage';
import ConfigureReaction from 'main/pages/ConfigureReaction';
import TisosPage from 'main/pages/TisosPage';
import IntakeKitDetailsPage from 'main/pages/ShipsPage/IntakeKitDetailsPage/IntakeKitDetailsPage';
import { CirrusPage } from 'main/pages/CirrusPage';
import InventoryLayout from 'main/pages/InventoryPage/InventoryLayout';
import CustomersPage from 'main/pages/CustomersPage';
import { CustomerOrganizationPage } from 'main/pages/CustomerOrganizationPage';

// Embedded routes
import { RunRequestPage }  from 'main/project/RunRequest';

import InstructionCardPage from 'main/run/InstructionCardPage';

import NotebookDrawer from 'main/apps/notebook/NotebookDrawer';
import Urls from 'main/util/urls';
import UserDetailPage from 'main/pages/CustomersPage/UserDetailPage';
import BillingPage from 'main/pages/BillingPage';
import OperatorDashboardPage from 'main/pages/OperatorDashboardPage';
import CompoundsLayout from 'main/pages/CompoundsPage/CompoundsLayout';
import * as AuditTrailUtil from 'main/util/AuditTrailUtil';

const isValidSubdomain = () => {
  const subdomain = window.location.pathname.split('/')[1];
  const organization = SessionStore.getOrg();
  return organization && organization.get('subdomain') === subdomain;
};

const isAdmin     = () => SessionStore.isAdmin();
const canAdminOrg = () => SessionStore.canAdminCurrentOrg();

const getLandingPage = () => {
  if (AcsControls.isFeatureEnabled(FeatureConstants.RUN_MGMT)) {
    return 'runspage';
  } else if (AcsControls.isFeatureEnabled(FeatureConstants.PROTOCOL_MGMT)) {
    return 'projects';
  } else if (AcsControls.isFeatureEnabled(FeatureConstants.INVENTORY_MGMT)) {
    return 'inventory';
  } else if (AcsControls.isFeatureEnabled(FeatureConstants.CIRRUS)) {
    return 'cirrus';
  } else if (AcsControls.isFeatureEnabled(FeatureConstants.COMPOUND_MGMT)) {
    return 'compounds';
  } else if (AcsControls.isFeatureEnabled(FeatureConstants.DEVICE_MGMT)) {
    return 'devices';
  } else if (AcsControls.isFeatureEnabled(FeatureConstants.VIEW_REACTION_TEMPLATE)) {
    return 'chemical_reactions';
  } else if (AcsControls.isFeatureEnabled(FeatureConstants.KIT_MGMT)) {
    return 'vendor';
  } else if (AcsControls.isFeatureEnabled(FeatureConstants.SHIPMENTS_MGMT)) {
    return 'shipments';
  } else if (AcsControls.isFeatureEnabled(FeatureConstants.LAB_SHIPMENTS_MGMT)) {
    return 'lab_shipments';
  } else if (AcsControls.isFeatureEnabled(FeatureConstants.PACKAGE_MGMT)) {
    return 'packages';
  } else if (AcsControls.isFeatureEnabled(FeatureConstants.VIEW_PROVISIONED_DEVICES)) {
    return 'device_manager';
  } else if (FeatureStore.hasPlatformFeature(FeatureConstants.VIEW_INVOICES_GLOBAL)
  || FeatureStore.hasPlatformFeature(FeatureConstants.APPROVE_PURCHASE_ORDER)) {
    return 'bills';
  } else {
    return 'overview';
  }
};

function MainApp() {
  return (
    <Route render={() => (
      <App>
        { process.env.NODE_ENV !== 'production' && <RootNodeDebugger /> }

        { /* TODO: Consider each relevant page importing this directly */ }
        <Route path="/:subdomain/:projectId/runs" component={NotebookDrawer} />

        <Switch>
          <Redirect exact
            from="/:subdomain/inventory"
            to={FeatureStore.hasFeature(FeatureConstants.MANAGE_CONTAINER_LOCATIONS) ? '/:subdomain/inventory/locations' :
              '/:subdomain/inventory/samples'} />

          { /* Organizationless routes */ }
          <Route exact path="/container_types"                      component={ContainerTypesPage} />
          <Route exact path="/containers/:containerId/:wellIndex?"  component={ContainerPage} />
          <Route exact path="/no-organization-warning"              component={UserHasNoOrgPage} />
          <Route exact path="/users/(edit)?/:subtabId"              component={UserPage} />
          {
          /* HACK: Catch bad subdomains. Any path that begins with something
           * other than /$VALID_ORG_SUBDOMAIN is invalid past here.
           *
           * TODO: Having naked :subdomains as the initial path component makes
           * it difficult to catch bad paths like /commercial/projects. We
           * really should namespace so this isn't necessary
           */
          !isValidSubdomain() && <Route render={() => <Page statusCode={404} />} />
        }

          <Route
            exact
            path="/:subdomain/configure-reaction/:launchRequestId"
            component={ConfigureReaction}
        />

          <Route
            exact
            path="/:subdomain/reactions/:reactionId"
            component={ReactionPage}
        />

          {/* landing page: the first tab user has permission to access */}
          <Route
            exact
            path="/:subdomain"
            render={({ match }) => <Redirect to={`/${match.params.subdomain}/${getLandingPage()}`} />}
        />

          { (AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_CONTAINERS_IN_LAB) || AcsControls.isFeatureEnabled(FeatureConstants.VIEW_SAMPLE_CONTAINERS)) && (
          <Route
            exact
            path="/:subdomain/inventory"
            render={({ match }) => <Redirect to={`/${match.params.subdomain}/inventory/samples`} />}
          />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.LAB_SHIPMENTS_MGMT) && (
          <Route
            exact
            path="/:subdomain/lab_shipments"
            component={LabShipmentsPage}
          />
          )}
          { (FeatureStore.hasPlatformFeature(FeatureConstants.VIEW_INVOICES_GLOBAL)
        || FeatureStore.hasPlatformFeature(FeatureConstants.APPROVE_PURCHASE_ORDER)) &&
              (<Route exact path={Urls.billing()} component={BillingPage} />
              )}
          { FeatureStore.hasPlatformFeature(FeatureConstants.VIEW_INVOICES_GLOBAL) &&
            (<Route exact path={Urls.quality_control()} component={BillingPage} />)
          }
          { FeatureStore.hasPlatformFeature(FeatureConstants.VIEW_INVOICES_GLOBAL) &&
              (<Route exact path={Urls.history()} component={BillingPage} />
              )}
          { FeatureStore.hasPlatformFeature(FeatureConstants.APPROVE_PURCHASE_ORDER) &&
            (<Route exact path={Urls.po_approval()} component={BillingPage} />)
          }
          { FeatureStore.hasPlatformFeature(FeatureConstants.VIEW_INVOICES_GLOBAL) &&
            (<Route exact path={Urls.pending_invoices()} component={BillingPage} />)
          }
          { /* Redirects for backwards compatibility following creation of Shipments tab */ }
          { AcsControls.isFeatureEnabled(FeatureConstants.SHIPMENTS_MGMT) && (AcsControls.isFeatureEnabled(FeatureConstants.VIEW_IN_TRANSIT_SAMPLE_CONTAINERS_SHIPMENTS) || AcsControls.isFeatureEnabled(FeatureConstants.VIEW_INTAKEKIT_SHIPMENTS))  && (
          <Route
            exact
            path="/:subdomain/inventory/intake_kits"
            render={({ match }) => <Redirect to={`/${match.params.subdomain}/shipments/intake_kits`} />}
        />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.SHIPMENTS_MGMT) && AcsControls.isFeatureEnabled(FeatureConstants.VIEW_SAMPLE_RETURN_SHIPMENTS) && (
          <Route
            exact
            path="/:subdomain/inventory/return_shipments/:status?"
            render={({ match }) => <Redirect to={`/${match.params.subdomain}/shipments/return_shipments/:status?`} />}
        />
          )}

          {AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KIT_ORDERS) && (
          <Redirect exact from="/:subdomain/vendor" to="/:subdomain/vendor/orders" />
          )}
          {(AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES) || AcsControls.isFeatureEnabled(FeatureConstants.VIEW_PUBLIC_MATERIALS)) && (
          <Redirect exact from="/:subdomain/vendor" to="/:subdomain/vendor/materials" />
          )}
          {(AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES)) && (
          <Redirect exact from="/:subdomain/vendor" to="/:subdomain/vendor/resources" />
          )}

          <Redirect exact from="/:subdomain/vendor" to="/:subdomain/vendor/kits" />
          <Redirect exact from="/:subdomain/runspage/approvals" to="/:subdomain/runspage/approvals/pending" />
          <Redirect exact from="/:subdomain/runspage/queue" to="/:subdomain/runspage/queue/accepted" />

          { /* Organization Routes */ }
          { AcsControls.isFeatureEnabled(FeatureConstants.VIEW_RUNS_IN_LABS) &&
          <Route exact path="/:subdomain/runspage/:subTab/:runStatus/runs/:runId/prime"                                        component={PrimeDirectivePage} />}

          <Route exact path="/:subdomain/addresses"                                          component={OrganizationPageHOC} />
          <Route exact path="/:subdomain/security"                                           component={OrganizationPageHOC} />
          <Route exact path="/:subdomain/admin"                                              component={AuthorizeHOC(OrganizationPageHOC, isAdmin)} />
          <Route exact path="/:subdomain/billing"                                            component={AuthorizeHOC(OrganizationPageHOC, canAdminOrg)} />
          <Route exact path="/:subdomain/overview"                                           component={OrganizationPageHOC} />
          { AcsControls.isFeatureEnabled(FeatureConstants.VIEW_AUDIT_TRAIL) && AuditTrailUtil.auditTrailEnabledAtleastOnce() &&
          <Route exact path="/:subdomain/audit"                                              component={OrganizationPageHOC} />}
          { AcsControls.isFeatureEnabled(FeatureConstants.DEVICE_MGMT) &&
          <Route exact path={Urls.devices()}                                               component={DevicesPage} />}
          { AcsControls.isFeatureEnabled(FeatureConstants.DEVICE_MGMT) &&
          <Route path={`${Urls.devices()}/manager`}                                        component={DevicesPage} />}
          { AcsControls.isFeatureEnabled(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE) &&
          <Route path={Urls.operator_dashboard()}                                          component={OperatorDashboardPage} />}

          { AcsControls.isFeatureEnabled(FeatureConstants.KIT_MGMT) && (
          <Route exact path={Urls.material_page()}                                         component={VendorsTab} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.KIT_MGMT) && (
          <Route exact path={Urls.new_material()}                                          component={MaterialDetailsPage} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.KIT_MGMT) && (
          <Route exact path={Urls.material_page() + '/:materialId/:mode?'}                 component={MaterialDetailsPage} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.KIT_MGMT) && (
          <Route exact path={Urls.vendors()}                                               component={VendorsTab} />
          )}
          { AcsControls.isFeatureEnabled(FeatureConstants.KIT_MGMT) && (
          <Route exact path={Urls.suppliers()}                                             component={VendorsTab} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.KIT_MGMT) && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES) && (
          <Route exact path={Urls.vendor_resources()}                                      component={VendorsTab} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.KIT_MGMT) && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KIT_ORDERS) && (
          <Route exact path={Urls.material_orders_page()}                                  component={VendorsTab} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.KIT_MGMT) && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KIT_ORDERS) && (
          <Route exact path={Urls.new_material_order()}                                    component={MaterialOrderDetailsPage} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.KIT_MGMT) && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KIT_ORDERS) && (
          <Route exact path={Urls.material_orders_checkin_page()}                          component={MaterialOrdersCheckinPage} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.KIT_MGMT) && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KIT_ORDERS) && (
            <Route exact path={Urls.material_orders_checkin_csv_page()}            component={MaterialOrdersCheckinCSVPage} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.KIT_MGMT) && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KIT_ORDERS) && (
          <Route exact path={Urls.material_orders_page() + '/:materialOrderId/:mode?'}     component={EditMaterialOrderPage} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.COMPOUND_MGMT) && (
          <Route exact path={Urls.compounds()}                                     component={CompoundsLayout} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.COMPOUND_MGMT) && (
          <Route exact path={Urls.compounds_page()}                                       component={CompoundsLayout} />
          )}

          { (AcsControls.isFeatureEnabled(FeatureConstants.VIEW_BATCHES) || AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_BATCHES_IN_LAB)) && (
          <Route exact path={Urls.batches_page()}                                    component={CompoundsLayout} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.COMPOUND_MGMT) && (
          <Route exact path="/:subdomain/compounds/:compoundId"                            component={CompoundDetailPage} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.CIRRUS) && (
          <Route exact path="/:subdomain/workflows/*"  component={CirrusPage} />
          )}
          { AcsControls.isFeatureEnabled(FeatureConstants.CIRRUS) && (
          <Route exact path="/:subdomain/workflows"  component={CirrusPage} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.INVENTORY_MGMT) && (
          <Route exact path="/:subdomain/inventory/samples"                                  component={InventoryLayout} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.INVENTORY_MGMT) && (
          <Route exact path="/:subdomain/inventory/locations/:locationId?"                   component={InventoryLayout} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.INVENTORY_MGMT) && (
          <Route exact path="/:subdomain/inventory/samples/:containerId/:wellIndex?"         component={ContainerPage} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.INVENTORY_MGMT) && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_STALE_CONTAINERS) && (
          <Route exact path="/:subdomain/inventory/stale_containers"                        component={InventoryLayout} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.INVENTORY_MGMT) &&  AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_IDT_ORDERS) && (
          <Route exact path="/:subdomain/inventory/idt_orders"                               component={InventoryLayout} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.INVENTORY_MGMT) && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_CONTAINER_DESTRUCTION_REQUESTS) && (
          <Route exact path="/:subdomain/inventory/container_destruction_requests"         component={InventoryLayout} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.INVENTORY_MGMT) && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_CONTAINER_LOCATIONS) && (
          <Route exact path="/:subdomain/inventory/container_location/:containerId/:wellIndex?"      component={InventoryLayout} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.SHIPMENTS_MGMT) &&
          <Route exact path="/:subdomain/shipments/:viewId?/:status?"                        component={ShipmentsPage} />}

          { AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_SAMPLE_RETURN_SHIPMENTS) &&
          <Route exact path="/:subdomain/lab_shipments/return"                               component={LabShipmentsPage} />}

          { AcsControls.isFeatureEnabled(FeatureConstants.INTAKE_KITS_SHIPMENTS) &&
          <Route exact path="/:subdomain/lab_shipments/intake_kits"                          component={LabShipmentsPage} />}

          { AcsControls.isFeatureEnabled(FeatureConstants.INTAKE_KITS_SHIPMENTS) &&
          <Route exact path="/:subdomain/lab_shipments/intake_kits/:intakeKitId"                       component={IntakeKitDetailsPage} />}

          { AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_IMPLEMENTATION_SHIPMENTS) &&
          <Route exact path="/:subdomain/lab_shipments/implementation"                       component={LabShipmentsPage} />}

          { AcsControls.isFeatureEnabled(FeatureConstants.CHECKIN_SAMPLE_SHIPMENTS) &&
          <Route exact path="/:subdomain/lab_shipments/check_in"                             component={LabShipmentsPage} />}

          { AcsControls.isFeatureEnabled(FeatureConstants.CHECKIN_SAMPLE_SHIPMENTS) &&
          <Route exact path="/:subdomain/lab_shipments/:shipmentId"                          component={ShipmentCheckinPage} />}

          <Route exact path="/:subdomain/packages"                                           component={PackagesPage} />
          <Route exact path="/:subdomain/packages/:packageId"                                component={PackageOverviewPage} />
          <Route exact path="/:subdomain/packages/:packageId/protocols/:protocolName"        component={PackageProtocolPage} />
          <Route exact path="/:subdomain/packages/:packageId/releases/:releaseId"            component={ReleasePage} />

          {(FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_ORGS_GLOBAL) || FeatureStore.hasPlatformFeature(FeatureConstants.VIEW_USERS_GLOBAL)) &&
          <Route exact path="/:subdomain/customers"                                          component={CustomersPage} /> }
          { FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_ORGS_GLOBAL) &&
          <Route exact path="/:subdomain/customers/organizations"                            component={CustomersPage} /> }
          { FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_ORGS_GLOBAL) &&
          <Route exact path="/:subdomain/customers/organization/:orgId" component={CustomerOrganizationPage} /> }
          { FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_ORGS_GLOBAL) &&
          <Route exact path="/:subdomain/customers/organization/:orgId/overview" component={CustomerOrganizationPage} /> }

          { FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_ORGS_GLOBAL) &&
          <Route exact path="/:subdomain/customers/organization/:orgId/addresses" component={CustomerOrganizationPage} />}
          { FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_ORGS_GLOBAL) &&
          <Route exact path="/:subdomain/customers/organization/:orgId/billing" component={CustomerOrganizationPage} /> }
          { FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_ORGS_GLOBAL) &&
          <Route exact path="/:subdomain/customers/organization/:orgId/security" component={CustomerOrganizationPage} /> }
          { FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_ORGS_GLOBAL) &&
          <Route exact path="/:subdomain/customers/organization/:orgId/admin" component={CustomerOrganizationPage} /> }
          { FeatureStore.hasPlatformFeature(FeatureConstants.VIEW_USERS_GLOBAL) &&
          <Route exact path="/:subdomain/customers/users"                                    component={CustomersPage} /> }
          { FeatureStore.hasPlatformFeature(FeatureConstants.VIEW_USERS_GLOBAL) &&
          <Route exact path="/:subdomain/customers/users/:userId"                            component={UserDetailPage} /> }
          { AcsControls.isFeatureEnabled(FeatureConstants.PROTOCOL_MGMT) &&
          <Route exact path="/:subdomain/projects"                                         component={ProjectsPage} />}

          { AcsControls.isFeatureEnabled(FeatureConstants.RUN_MGMT) && (
          <Route exact path="/:subdomain/runspage"                                           component={RunsPage} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.RUN_MGMT) && (
          <Route exact path="/:subdomain/runspage/:runView/:runStatus"                       component={RunsPage} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.RUN_MGMT) && (
          <Route exact
            path="/:subdomain/runspage/:runView/:runStatus/runs/:runId/:viewId?/:subtabId?"
            component={RunPage} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.RUN_MGMT) && (
          <Route exact
            path="/:subdomain/runspage/:runView/:runStatus/runs/:runId/data/analysis/:subtabId?"
            component={RunPage} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_TISOS) && (
          <Route exact path="/:subdomain/tisos"                                                           component={TisosPage} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_TISOS) && (
          <Route exact path="/:subdomain/tisos/containers_table"                                          component={TisosPage} />
          )}

          { AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_TISOS) && (
          <Route exact path="/:subdomain/tisos/tiso_table"                                                component={TisosPage} />
          )}

          {AcsControls.isFeatureEnabled(FeatureConstants.VIEW_REACTION_TEMPLATE) && (
            <Route exact
              path={Urls.chemicalReactions()}
              component={ReactionsPage} />
          )}

          <Route exact path="/:subdomain/:projectId/runs/quick_launch/:quickLaunchId"        component={QuickLaunchPage} />
          <Route exact path="/:subdomain/:projectId/runs/:cloneId/clone/:runSubtab?"                     component={RunClonePage} />
          <Route exact path="/:subdomain/:projectId/runs/:runId/data/analysis/:subtabId?"    component={RunPage} />

          <Route exact path="/:subdomain/:projectId/runs/:runId/:viewId?/:subtabId?"         component={RunPage} />
          <Route exact path="/:subdomain/:projectId/launch/:protocolId"                      component={RunLaunchPage} />
          <Route exact path="/:subdomain/:projectId/notebooks/:notebookId"                   component={StaticNotebookPage} />
          <Route exact path="/:subdomain/:projectId/:viewId?/:queryId?"                      component={ProjectPage} />
          { /* Catchall for bad matches */ }
          <Route render={() => <Page statusCode={404} />} />

        </Switch>
      </App>
    )} />
  );
}

// TODO:
// The embed routes are rendered here because they should not include the
// NavBar and App logic. The embed routes are brittle and should be handled
// differently. Preferably server-side rendered by an AWS lambda or tiny server.
function Root() {
  return (
    <BrowserRouter>
      <Switch>
        {
        // YEAR IN REVIEW
        // Routing is redirected to Year in Review Page to prevent rendering of NavBar or global stores.
      }
        { /* Embed grossness */ }
        <Route exact path="/runs/preview/:previewId.embed"                                       component={RunPreviewPage} />
        <Route exact path="/:subdomain/:projectId/runs/:runId.embed"                             component={RunRequestPage} />
        <Route exact path="/:subdomain/:projectId/runs/:runId/instructions/:instructionId.embed" component={InstructionCardPage} />
        <Route exact path="/datasets/:datasetId.embed"                                           component={RunDatumPage} />

        { /* Main app */ }
        <Route component={MainApp} />

      </Switch>
    </BrowserRouter>
  );
}

export default Root;
export { getLandingPage };
