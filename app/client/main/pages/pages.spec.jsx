import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import sinon from 'sinon';
import Imm from 'immutable';

import ContainerPage from 'main/pages/ContainerPage';
import ContainerTypesPage from 'main/pages/ContainerTypesPage';
import OrganizationPageHOC from 'main/pages/OrganizationPage';
import { PackageOverviewPage } from 'main/pages/PackageOverviewPage';
import PackageProtocolPage from 'main/pages/PackageProtocolPage';
import PackagesPage from 'main/pages/PackagesPage';
import ProjectPage from 'main/pages/ProjectPage';
import ProjectsPage from 'main/pages/ProjectsPage';
import QuickLaunchPage from 'main/pages/QuickLaunchPage';
import ReleasePage from 'main/pages/ReleasePage';
import RunClonePage from 'main/pages/RunClonePage';
import ShipmentsPage from 'main/pages/ShipmentsPage';
import StaticNotebookPage from 'main/pages/StaticNotebookPage';
import UserPage from 'main/pages/UserPage';
import AdminView from 'main/pages/RunPage/views/AdminView';
import ContainersView from 'main/pages/RunPage/views/ContainersView';
import InstructionsView from 'main/pages/RunPage/views/InstructionsView';
import QuoteView from 'main/pages/RunPage/views/QuoteView';
import ResultsView from 'main/pages/RunPage/views/ResultsView';
import SupportView from 'main/pages/RunPage/views/SupportView';
import IntakeKitsView from 'main/pages/ShipmentsPage/views/IntakeKitsView';
import ReturnShipmentsView from 'main/pages/ShipmentsPage/views/ReturnShipmentsView';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import SessionStore from 'main/stores/SessionStore';

describe('Pages', () => {
  // dumb test to catch silly mistakes (bad imports, syntax errors, etc)
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });

  it('should render', () => {
    // React Router
    const routeProps = {
      match: {
        params: {
          containerId: '',
          subdomain: '',
          packageId: '',
          projectId: '',
          datasetId: '',
          runId: '',
          quickLaunchId: ''
        },
        url: '',
        path: ''
      },
      history: {
        action: 'PUSH',
        block: () => {},
        createHref: () => {},
        go: () => {},
        goBack: () => {},
        goForward: () => {},
        length: 0,
        location: {
          pathname: '',
          search: '',
          hash: '',
          key: ''
        },
        listen: () => {},
        push: () => {},
        replace: () => {}
      },
      location: {
        pathname: '',
        search: '',
        hash: '',
        key: ''
      }
    };

    sandbox.stub(LabConsumerActions, 'loadLabsForCurrentOrg').returns({ done: () => {} });
    sandbox.stub(SessionStore, 'getOrg').returns(Imm.Map({ id: 'org13', subdomain: 'transcriptic' }));

    // TODO: Add InventoryPage
    const pages = [
      ContainerPage,
      ContainerTypesPage,
      UserPage,
      OrganizationPageHOC,
      ShipmentsPage,
      PackagesPage,
      PackageOverviewPage,
      PackageProtocolPage,
      ReleasePage,
      ProjectsPage,
      QuickLaunchPage,
      ProjectPage,
      RunClonePage,
      StaticNotebookPage
    ];

    let nodes = pages.map(Page =>
      enzyme.mount(
        <MemoryRouter>
          <Page {...routeProps} />
        </MemoryRouter>
      )
    );

    // cleanup
    nodes.forEach(node => node.unmount());

    const tabs = [
      InstructionsView,
      QuoteView,
      SupportView,
      AdminView,
      ContainersView,
      ResultsView,
      IntakeKitsView,
      ReturnShipmentsView
    ];

    nodes = tabs.map(Tab =>
      enzyme.mount(
        <MemoryRouter>
          <Tab {...routeProps} />
        </MemoryRouter>
      )
    );

    nodes.forEach(node => node.unmount());
  });
});
