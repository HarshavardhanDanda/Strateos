import { SubMenu, Subtabs } from '@transcriptic/amino';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { NavLink } from 'react-router-dom';

import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';
import ContainerTypeActions from 'main/actions/ContainerTypeActions';
import UserActions from 'main/actions/UserActions';
import ImplementationStore from 'main/admin/stores/ImplementationStore';
import OrganizationSelector from 'main/components/OrganizationSelector';
import Toaster from 'main/components/Toaster';
import UserNavBar from 'main/components/UserNavBar';
import ConnectToStoresHOC from 'main/containers/ConnectToStoresHOC';
import ShippingCart from 'main/inventory/components/ShippingCart';
import DrawerStore from 'main/stores/DrawerStore';
import SessionStore from 'main/stores/SessionStore';
import ShippingCartStore from 'main/stores/ShippingCartStore';
import AcsControls from 'main/util/AcsControls';
import Urls from 'main/util/urls';
import InventorySelectorModal from 'main/inventory/InventorySelector/InventorySelectorModal';
import { getLandingPage } from 'main/router';
import { pubSub } from '@strateos/micro-apps-utils';

// Import App CSS
import '../../assets/stylesheets/webpackCssRoot.scss';
import './App.scss';

const propTypes = {
  children: PropTypes.node,
  drawerOpen: PropTypes.bool,
  drawerHeight: PropTypes.number,
  user: PropTypes.instanceOf(Immutable.Map),
  isAdmin: PropTypes.bool,
  isMasquerading: PropTypes.bool,
  subdomain: PropTypes.string
};

const landingPage = () => {
  return `${Urls.org}/${getLandingPage()}`;
};

const defaultSubMenuText = 'More';

class App extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = { subMenuText: defaultSubMenuText, tabCount: this.getTabCount() };
    this.updateTabCount = this.updateTabCount.bind(this);
  }

  componentDidMount() {
    ImplementationStore.initialize();
    ShippingCartStore.initialize();
    ContainerTypeActions.loadAll();
    window.addEventListener('resize', this.updateTabCount);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateTabCount);
  }

  canUseInventoryBrowserMicroApp = SessionStore.getOrg() && SessionStore.getOrg().get('feature_groups').includes('inventory_browser_microapp');

  updateTabCount = () => {
    this.setState({ tabCount: this.getTabCount(), subMenuText: defaultSubMenuText });
  };

  getTabCount = () => {
    const minWindowWidth = 1240;
    return window.innerWidth > minWindowWidth ? 6 : 4;
  };

  render() {
    const { user, isAdmin, isMasquerading, subdomain } = this.props;

    const navItems = [
      AcsControls.isFeatureEnabled(FeatureConstants.RUN_MGMT) && (
        {
          key: 'runspage',
          name: 'Runs',
          url: Urls.runspage()
        }
      ),
      subdomain && AcsControls.isFeatureEnabled(FeatureConstants.PROTOCOL_MGMT) && (
        {
          key: 'projects',
          name: 'Projects',
          url: Urls.projects()
        }
      ),
      AcsControls.isFeatureEnabled(FeatureConstants.INVENTORY_MGMT) && (
        {
          key: 'inventory',
          name: 'Inventory',
          url: Urls.inventory()
        }
      ),
      AcsControls.isFeatureEnabled(FeatureConstants.COMPOUND_MGMT) && (
        {
          key: 'compounds',
          name: 'Compounds',
          url: Urls.compounds()
        }
      ),
      AcsControls.isFeatureEnabled(FeatureConstants.VIEW_REACTION_TEMPLATE) && (
        {
          key: 'chemical_reactions',
          name: 'Reactions',
          url: Urls.chemicalReactions()
        }
      ),
      AcsControls.isFeatureEnabled(FeatureConstants.CIRRUS) && (
        {
          key: 'workflows',
          name: 'Workflow Builder',
          url: Urls.cirrus()
        }
      ),
      (AcsControls.isFeatureEnabled(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE)) && (
        {
          key: 'operator_dashboard',
          name: 'Operator Dashboard',
          url: Urls.operator_dashboard()
        }
      ),
      AcsControls.isFeatureEnabled(FeatureConstants.DEVICE_MGMT) && (
        {
          key: 'devices',
          name: 'Devices',
          url: Urls.devices()
        }
      ),
      AcsControls.isFeatureEnabled(FeatureConstants.KIT_MGMT) && (
        {
          key: 'vendor',
          name: 'Vendors',
          url: Urls.vendor_page()
        }
      ),
      AcsControls.isFeatureEnabled(FeatureConstants.LAB_SHIPMENTS_MGMT) && (
        {
          key: 'lab_shipments',
          name: 'Ship',
          url: Urls.lab_shipments()
        }
      ),
      AcsControls.isFeatureEnabled(FeatureConstants.SHIPMENTS_MGMT) && (
        {
          key: 'shipments',
          name: 'Shipments',
          url: Urls.shipments()
        }
      ),
      AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_TISOS) && (
        {
          key: 'tisos',
          name: 'Tisos',
          url: Urls.tisosPage()
        }
      ),
      AcsControls.isFeatureEnabled(FeatureConstants.VIEW_PACKAGE_PROTOCOLS) && (
        {
          key: 'packages',
          name: 'Packages',
          url: Urls.packages()
        }
      ),
      AcsControls.isFeatureEnabled(FeatureConstants.DOCUMENTATION) && (
        {
          key: 'documentation',
          name: 'Documentation',
          url: 'https://support.strateos.com/en/',
          absoluteUrl: true
        }
      ),
      (FeatureStore.hasPlatformFeature(FeatureConstants.VIEW_INVOICES_GLOBAL)
        || FeatureStore.hasPlatformFeature(FeatureConstants.APPROVE_PURCHASE_ORDER)) && (
        {
          key: 'bills',
          name: 'Billing',
          url: Urls.billing()
        }
      ),
      (FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_ORGS_GLOBAL)
        || FeatureStore.hasPlatformFeature(FeatureConstants.VIEW_USERS_GLOBAL)) && (
        {
          key: 'customers',
          name: 'Customers',
          url: Urls.customers(),
        }
      )
    ].filter(item => item);

    const onSubMenuItemSelect = (item) => {
      const currentSubMenuItem = navItems.find(element => item.key.toString().includes(element.key));
      if (!currentSubMenuItem.absoluteUrl) {
        this.setState({ subMenuText: (currentSubMenuText && currentSubMenuItem.name) || defaultSubMenuText });
      }
    };

    const resetSubMenuText = () => {
      this.setState({ subMenuText: defaultSubMenuText });
    };

    const marginBottom = this.props.drawerOpen ? this.props.drawerHeight : 0;
    const currentSubMenuText = navItems.slice(this.state.tabCount).find(item => window.location.pathname.split('/').includes(item.key));

    return (
      <div
        style={{ marginBottom }}
        className="main-app tx-two-element-layout"
      >
        <div className="main-app__header tx-two-element-layout__header">
          <UserNavBar
            isAdmin={isAdmin}
            landingPage={landingPage}
          >
            <Subtabs inverted isNavTab>
              {navItems.slice(0, this.state.tabCount).map((item) => {
                return (
                  !item.absoluteUrl ? (
                    <NavLink key={item.key} to={item.url} onClick={resetSubMenuText}>
                      {item.name}
                    </NavLink>
                  ) : (
                    <a key={item.key} href={item.url} rel="noopener noreferrer" target="_blank">
                      {item.name}
                    </a>
                  )
                );
              })}
              {navItems.length > this.state.tabCount && (
              <SubMenu
                subMenuText={(currentSubMenuText && currentSubMenuText.name) || this.state.subMenuText}
                onSubMenuItemSelect={(item) => onSubMenuItemSelect(item)}
                defaultSubMenuText={defaultSubMenuText}
              >
                {navItems.slice(this.state.tabCount).map((item) => {
                  return (
                    !item.absoluteUrl ? (
                      <NavLink key={item.key} to={item.url}>
                        {item.name}
                      </NavLink>
                    ) : (
                      <a key={item.key} href={item.url} rel="noopener noreferrer" target="_blank">
                        {item.name}
                      </a>
                    )
                  );
                })}
              </SubMenu>
              )}
              {isMasquerading && (
                <a key="unmasquerade" onClick={UserActions.unmasquerade}>End masquerade</a>
              )}
            </Subtabs>
            {isMasquerading && (
              <div className="navigation-inner">
                <a className="element" onClick={UserActions.signOut}>Sign out</a>
              </div>
            )}
            {!isMasquerading && (
              <div className="profile">
                <div className="context">
                  {isAdmin ?
                    <a href="/admin">Admin <i className="fa fa-lock" /></a> :
                    <OrganizationSelector subdomain={subdomain} user={user} />
                  }
                </div>
              </div>
            )}
          </UserNavBar>
        </div>
        <div className="main-page-content main-app__body tx-two-element-layout__body">
          {this.props.children}
        </div>
        <Toaster />
        <ShippingCart />
        {this.canUseInventoryBrowserMicroApp && (
          <InventorySelectorModal
            modalOpen={false}
            beforeDismiss={() => pubSub.publish('INVENTORY_BROWSER_MODAL_HIDE', { version: 'V1' })}
            title=""
          />
        )}
      </div>
    );
  }
}
App.propTypes = propTypes;

const getStateFromStores = () => ({
  drawerOpen: DrawerStore.isOpen(),
  drawerHeight: DrawerStore.getHeight(),
  user: SessionStore.getUser(),
  isAdmin: SessionStore.isAdmin(),
  isMasquerading: SessionStore.isMasquerading(),
  subdomain: SessionStore.getOrg() && SessionStore.getOrg().get('subdomain')
});

export default ConnectToStoresHOC(App, getStateFromStores);
