import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import BillingPage from 'main/admin/pages/BillingPage';
import CustomersPage from 'main/admin/pages/CustomersPage';

describe('Admin Pages', () => {
  // dumb test to catch silly mistakes (bad imports, syntax errors, etc)
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

    const pages = [
      BillingPage,
      CustomersPage
    ];

    const nodes = pages.map(Page =>
      enzyme.mount(
        <MemoryRouter>
          <Page {...routeProps} />
        </MemoryRouter>
      )
    );

    // cleanup
    nodes.forEach(node => node.unmount());
  });
});
