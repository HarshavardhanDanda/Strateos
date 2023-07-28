import React from 'react';
import { observer } from 'mobx-react';
import { Route, Switch, NavLink, Link } from 'react-router-dom';
import { Breadcrumbs, Page, TabRouter, Subtabs } from '@transcriptic/amino';
import Urls from 'main/util/urls';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import OrganizationStore from 'main/stores/OrganizationStore';
import SessionStore from 'main/stores/SessionStore';
import FeatureStore from 'main/stores/FeatureStore';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import FeatureConstants from '@strateos/features';
import AcsControls from 'main/util/AcsControls';
import StoresContext from 'main/stores/mobx/StoresContext';
import ApprovalsView from './views/ApprovalsView';
import QueueView from './views/QueueView';

import './CardStyle.scss';

class RunsPage extends React.Component {

  componentDidMount() {
    const { labIds, userId } = this.props; // Labs user can view runs for
    const { runFilterStore, labStore } = this.context;
    const allLabIds = FeatureStore.getLabIds().toJS(); // Not just viewable, to grab all related lab consumers
    runFilterStore.init(userId);
    labStore.fetchLabs(labIds);
    const canViewWorkcellsAndWorkUnits = AcsControls.isFeatureEnabled(FeatureConstants.VIEW_DEVICES);
    labStore.fetchRelatedObjects(allLabIds, canViewWorkcellsAndWorkUnits);
  }

  renderBreadcrumbs() {
    return (
      <Breadcrumbs>
        <Link to={Urls.runspage()}>Runs</Link>
      </Breadcrumbs>
    );
  }

  render() {
    const { runView } = this.props.match.params;
    const basePath = `/${this.props.match.params.subdomain}/runspage`;
    const isApprovalTabAccessible =
      AcsControls.isFeatureEnabled(FeatureConstants.RUN_STATE_MGMT);
    const isQueueTabAccessible =
      AcsControls.isFeatureEnabled(FeatureConstants.VIEW_RUNS_IN_LABS);
    const { userId, labIds, orgId, org } = this.props;

    return (
      <Page title={'Runs'}>
        <TabRouter
          basePath={basePath}
          defaultTabId={isQueueTabAccessible ? 'queue'
            : (isApprovalTabAccessible ? 'approvals' : '')}
        >
          {() => {
            return (
              <PageLayout
                PageHeader={(
                  <PageHeader titleArea={this.renderBreadcrumbs()} />
                )}
                Subtabs={(
                  <Subtabs>
                    { isQueueTabAccessible
                      ? <NavLink to={Urls.runspage('queue')} key="queue" isActive={() => runView === 'queue'}>Queue</NavLink>
                      : ''
                    }
                    { isApprovalTabAccessible
                      ? <NavLink to={Urls.runspage('approvals')} key="approvals" isActive={() => runView === 'approvals'}>Approvals</NavLink>
                      : ''
                    }
                  </Subtabs>
                )}
              >
                <Switch>
                  { isQueueTabAccessible ? (
                    <Route
                      exact
                      path="/:subdomain/runspage/queue/:runStatus?"
                      render={routeProps => (
                        <QueueView
                          userId={userId}
                          labIds={labIds}
                          orgId={orgId}
                          org={org}
                          {...routeProps}
                        />
                      )}
                    />
                  ) : '' }
                  { isApprovalTabAccessible ? (
                    <Route
                      exact
                      path="/:subdomain/runspage/approvals/:runStatus?"
                      render={routeProps => (
                        <ApprovalsView
                          userId={userId}
                          labIds={labIds}
                          orgId={orgId}
                          {...routeProps}
                        />
                      )}
                    />
                  ) : '' }
                </Switch>
              </PageLayout>
            );
          }}
        </TabRouter>
      </Page>
    );
  }
}
RunsPage.contextType = StoresContext;

const getStateFromStores = (props) => {
  const { subdomain } = props.match.params;
  const org           = OrganizationStore.findBySubdomain(subdomain);
  const orgId         = org ? org.get('id') : undefined;
  const userId        = SessionStore.getUser('id');
  const labIds        = FeatureStore.getLabIdsWithFeatures(FeatureConstants.VIEW_RUNS_IN_LABS) || [];

  return {
    orgId,
    org,
    userId,
    labIds,
  };
};

export default ConnectToStores(observer(RunsPage), getStateFromStores);
export { RunsPage };
