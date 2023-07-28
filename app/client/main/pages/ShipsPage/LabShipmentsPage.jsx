import React       from 'react';
import _           from 'lodash';
import PropTypes   from 'prop-types';
import { NavLink, Link } from 'react-router-dom';

import { Page, TabRouter, Subtabs, Breadcrumbs } from '@transcriptic/amino';
import { PageLayout, PageHeader }   from 'main/components/PageLayout';
import Urls                         from 'main/util/urls';
import { TabLayout }                from 'main/components/TabLayout';
import IntakeKitsPageContainer      from 'main/pages/ShipsPage';
import ReturnShipmentsPage          from 'main/pages/ShipsPage/ReturnShipments/ReturnShipmentsPage';
import AcsControls                  from 'main/util/AcsControls';
import FeatureConstants             from '@strateos/features';
import ShipmentCheckinPage          from 'main/pages/ShipmentsCheckin';
import ImplementationShipmentsPage  from 'main/pages/ShipsPage/ImplementationShipmentsPage';

export function Tabs() {
  return (
    <Subtabs>
      <If condition={AcsControls.isFeatureEnabled(FeatureConstants.INTAKE_KITS_SHIPMENTS)}>
        <NavLink
          to={Urls.lab_intake_kits()}
        >
          Intake kits
        </NavLink>
      </If>
      <If condition={AcsControls.isFeatureEnabled(FeatureConstants.CHECKIN_SAMPLE_SHIPMENTS)}>
        <NavLink
          to={Urls.lab_check_in()}
        >
          CheckIn
        </NavLink>
      </If>
      <If condition={AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_SAMPLE_RETURN_SHIPMENTS)}>
        <NavLink
          to={Urls.return_lab_shipments()}
        >
          Return
        </NavLink>
      </If>
      <If condition={AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_IMPLEMENTATION_SHIPMENTS)}>
        <NavLink
          to={Urls.implementation_shipments()}
        >
          Implementation shipments
        </NavLink>
      </If>
    </Subtabs>
  );
}

const propTypes = {
  match: PropTypes.shape({
    path: PropTypes.string.isRequired
  })
};

const getLandingPage = () => {
  if (AcsControls.isFeatureEnabled(FeatureConstants.INTAKE_KITS_SHIPMENTS)) {
    return 'intake_kits';
  } if (AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_IMPLEMENTATION_SHIPMENTS)) {
    return 'implementation';
  } if (AcsControls.isFeatureEnabled(FeatureConstants.CHECKIN_SAMPLE_SHIPMENTS)) {
    return 'check_in';
  } if (AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_SAMPLE_RETURN_SHIPMENTS)) {
    return 'return';
  }
};

class LabShipmentsPage extends React.Component {

  render() {
    const { match } = this.props;
    return (
      <Page title="Lab Shipments">
        <TabRouter basePath={Urls.lab_shipments()} defaultTabId={getLandingPage()}>
          {
            () => {
              return (
                <PageLayout
                  PageHeader={(
                    <PageHeader
                      titleArea={(
                        <Breadcrumbs>
                          <Link
                            to={`${Urls.lab_shipments()}/${getLandingPage()}`}
                          >
                            Lab shipments
                          </Link>
                        </Breadcrumbs>
                      )}
                    />
                  )}
                  Subtabs={<Tabs />}
                >
                  <TabLayout>
                    { match.path === '/:subdomain/lab_shipments/implementation' &&
                    <ImplementationShipmentsPage />
                    }
                    { match.path === '/:subdomain/lab_shipments/intake_kits' &&
                    <IntakeKitsPageContainer {...this.props} />
                    }
                    { match.path === '/:subdomain/lab_shipments/return' &&
                    <ReturnShipmentsPage />
                    }
                    { match.path === '/:subdomain/lab_shipments/check_in' &&
                    <ShipmentCheckinPage {...this.props} />
                    }
                  </TabLayout>
                </PageLayout>
              );
            }}
        </TabRouter>
      </Page>
    );
  }
}

LabShipmentsPage.propTypes = propTypes;

export default LabShipmentsPage;
