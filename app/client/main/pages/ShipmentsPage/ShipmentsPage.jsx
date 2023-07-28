import PropTypes               from 'prop-types';
import React                   from 'react';
import { Route, Switch, Link, NavLink } from 'react-router-dom';

import Urls from 'main/util/urls';

import {
  Page,
  TabRouter,
  Subtabs,
  Breadcrumbs,
  Button
} from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import RequestIntakeKitModal from 'main/inventory/inventory/RequestIntakeKitModal';
import ModalActions          from 'main/actions/ModalActions';
import IntakeKitsView from './views/IntakeKitsView';
import ReturnShipmentsView from './views/ReturnShipmentsView';

class ShipmentsPage extends React.Component {

  render() {
    return (
      <Page title="Shipments">
        <TabRouter
          basePath={
            `/${
              this.props.match.params.subdomain
            }/shipments`
          }
          defaultTabId="intake_kits"
        >
          {
            () => {
              return (
                <PageLayout
                  PageHeader={(
                    <PageHeader
                      titleArea={(
                        <Breadcrumbs>
                          <Link
                            key="breadcrumb-project"
                            to={Urls.projects()}
                          >Shipments
                          </Link>
                        </Breadcrumbs>
                      )}
                      primaryInfoArea={(FeatureStore.hasFeature(FeatureConstants.REQUEST_SAMPLE_CONTAINERS)) && (
                        <Button
                          type="primary"
                          size="medium"
                          onClick={() => ModalActions.open(RequestIntakeKitModal.MODAL_ID)}
                        >
                          Request intake kit
                        </Button>
                      )}
                    />
                  )}
                  Subtabs={(
                    <Subtabs>
                      {(FeatureStore.hasFeature(FeatureConstants.VIEW_IN_TRANSIT_SAMPLE_CONTAINERS_SHIPMENTS) || FeatureStore.hasFeature(FeatureConstants.VIEW_INTAKEKIT_SHIPMENTS)) &&
                        (
                        <NavLink to={Urls.shipments_intake_kits()} key="Intake Kits">
                          Intake kits
                        </NavLink>
                        )
                      }
                      {FeatureStore.hasFeature(FeatureConstants.VIEW_SAMPLE_RETURN_SHIPMENTS) &&
                        (
                        <NavLink to={Urls.return_shipments()} key="Return Shipments">
                          Return shipments
                        </NavLink>
                        )
                      }
                    </Subtabs>
                  )}
                >
                  <Switch>
                    <Route
                      exact
                      path="/:subdomain/shipments/intake_kits"
                      component={IntakeKitsView}
                    />
                    <Route
                      exact
                      path="/:subdomain/shipments/return_shipments/:status?"
                      component={ReturnShipmentsView}
                    />
                  </Switch>
                </PageLayout>
              );
            }
          }
        </TabRouter>
      </Page>
    );
  }
}

const matchPropTypes = PropTypes.shape({
  params: PropTypes.shape({
    subdomain: PropTypes.string.isRequired,
    viewId: PropTypes.oneOf(['intake_kits', 'return_shipments'])
  }).isRequired
}).isRequired;

ShipmentsPage.propTypes = {
  match: matchPropTypes
};

export default ShipmentsPage;
