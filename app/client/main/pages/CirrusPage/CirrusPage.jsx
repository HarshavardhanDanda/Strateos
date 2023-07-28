import React, { useEffect, useState, useMemo } from 'react';
import { StrateosSharedContextProvider } from '@strateos/micro-apps-utils';
import { Breadcrumbs, Page } from '@transcriptic/amino';
import { Link } from 'react-router-dom';
import Urls from 'main/util/urls';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import _ from 'lodash';
import { PageHeader, PageLayout } from 'main/components/PageLayout';
import { TabLayout } from 'main/components/TabLayout';
import FederatedWrapper from 'main/components/FederatedWrapper';
import WorkflowStore from 'main/stores/WorkflowStore';
import { WorkflowActions } from 'main/actions/WorkflowActions';
import FeatureStore from 'main/stores/FeatureStore';
import './CirrusPage.scss';

const WORKFLOWS = { header: 'Workflows', endpoint: '' };
const EXPERIMENTS = { header: 'Experiments', endpoint: 'experiments' };

/* eslint-disable import/no-unresolved */
const FederatedRouter = React.lazy(() => import('cirrus_frontend/FederatedRouter'));

function CirrusPage(props) {
  const [statusCode, setStatusCode] = useState(404);
  const [cirrusRoute, setCirrusRoute] = useState('');
  const [pageHeader, setPageHeader] = useState([{ name: WORKFLOWS.header, url: Urls.cirrus() }]);

  useEffect(() => {
    setStatusCode(AcsControls.isFeatureEnabled(FeatureConstants.CIRRUS) ? 200 : 404);
  }, []);

  const fetchWorkflowDefinition = (id, isExecution) => {
    return isExecution ? WorkflowActions.loadExecutions(id) : WorkflowActions.loadDefinitions(id);
  };

  const appendToHeader = (id) => {
    const label = WorkflowStore.getById(id).get('label');
    setPageHeader(prevState => [...prevState, { name: label, url: props.match.url }]);
  };

  const isValidId = (id) => !_.isUndefined(id) && !_.isEmpty(id);

  useEffect(() => {
    // note[yang]: with current react-router catch-all, remaining params are matched to 0
    const catchAllRoute = props.match.params[0];
    const isExperimentTab = _.includes(catchAllRoute, EXPERIMENTS.endpoint);
    if (isExperimentTab) {
      setPageHeader([{ name: EXPERIMENTS.header, url: Urls.cirrus() + `/${EXPERIMENTS.endpoint}` }]);
    } else {
      // setting header as Workflows when catchAllRoute is either : workflows, viewer, builder and index.
      setPageHeader([{ name: WORKFLOWS.header, url: Urls.cirrus() }]);
    }
    // ToDo: In future we may need to modify this if there are nested routes
    const id =  catchAllRoute && catchAllRoute.split('/')[1];

    if (isValidId(id)) {
      (_.isUndefined(WorkflowStore.getById(id)) || (props.location.state && props.location.state.isWorkflowEdited)) ?
        fetchWorkflowDefinition(id, isExperimentTab).then(() => {
          appendToHeader(id);
        })
        : appendToHeader(id);
    }
    setCirrusRoute(catchAllRoute || 'index');
  }, [props.match.params, props.location.state]);

  const CirrusSharedContext = useMemo(() => ({
    basePath: Urls.cirrus(),
    acsPermissions: FeatureStore.getACSPermissions(),
    features: FeatureConstants
  }), []);

  return (
    <StrateosSharedContextProvider.Provider value={CirrusSharedContext}>
      <Page title={'Workflow Builder'} statusCode={statusCode}>
        <PageLayout
          PageHeader={(
            <PageHeader
              titleArea={(
                <Breadcrumbs invert>
                  {pageHeader.map((element, index) => (
                    <Link to={element.url} key={index}>{element.name}</Link>
                  ))}
                </Breadcrumbs>
            )}
              primaryInfoArea={(
                <FederatedWrapper delayed={<div />}>
                  <FederatedRouter route={`${window.location.pathname}/infoArea`} />
                </FederatedWrapper>
            )}
              actionMenu={(
                <FederatedWrapper error={<div>Unable to load Workflow Builder.</div>} delayed={<div />}>
                  <FederatedRouter route={`${window.location.pathname}/actions`} />
                </FederatedWrapper>
            )}
            />
        )}
        >
          <div className="cirrus-page">
            <TabLayout>
              <FederatedWrapper error={<div>Unable to load Workflow Builder.</div>}>
                <FederatedRouter route={cirrusRoute} />
              </FederatedWrapper>
            </TabLayout>
          </div>
        </PageLayout>
      </Page>
    </StrateosSharedContextProvider.Provider>
  );
}

export default CirrusPage;
