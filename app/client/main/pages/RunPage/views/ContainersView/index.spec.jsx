import React from 'react';
import { expect } from 'chai';
import { StaticRouter } from 'react-router-dom';
import sinon from 'sinon';
import Immutable from 'immutable';
import _ from 'lodash';
import Urls from 'main/util/urls';
import ContainersView from './index';

const routeProps = {
  match: {
    isExact: true,
    url: '/refs',
    params: {
      projectId: 'p1aq788k7ybjt',
      runId: 'r1aq78jspqgdn',
      refName: 'refName2',
      subdomain: 'transcriptic',
      path: '/:subdomain/:projectId/runs/:runId/refs/:dataRef?',
      url: '/transcriptic/p1aq788k7ybjt/runs/r1aq78jspqgdn/refs/dataRef1'
    }
  },
  history: {
    replace: () => {}
  },
  location: {}
};

const generateRunPageRouterShallowWrapper = (props) => {
  const RunDataPageComponent = enzyme.shallow(
    <StaticRouter
      location="/transcriptic/p1aq788k7ybjt/runs/r1aq78jspqgdn/refs/refName2"
      context={{
        context: {
          router: {
            route: {
              location: {
                pathname: '/transcriptic/p1aq788k7ybjt/runs/r1aq78jspqgdn/refs/refName2'
              }
            }
          }
        }
      }
      }
    >
      <ContainersView
        {...routeProps}
        {...props}
      />
    </StaticRouter>
  ).dive(
    {
      context: {
        router: {
          route: {
            location: {
              pathname: '/transcriptic/p1aq788k7ybjt/runs/r1aq78jspqgdn/data/dataRef1'
            }
          }
        }
      }
    }
  );
  return RunDataPageComponent;
};

const generateRunRefsPageRootWrapper = (props, runView = false) => {
  const addRunViewAndStatus = _.cloneDeep(routeProps);
  addRunViewAndStatus.match.params.runView = 'queue';
  addRunViewAndStatus.match.params.runStatus = 'all_runs';
  const runDetailsRouteProps = !runView ? routeProps : addRunViewAndStatus;
  const path = !runView ? '/transcriptic/p1aq788k7ybjt/runs/r1aq78jspqgdn/refs/refName2' : '/transcriptic/runspage/queue/all_runs/runs/r1aq78jspqgdn/refs/refName1';
  const RunRefsPageComponent = enzyme.mount(
    <StaticRouter
      location={path}
      context={{
        context: {
          router: {
            route: {
              location: {
                pathname: path
              }
            }
          }
        }
      }
      }
    >
      <ContainersView
        {...runDetailsRouteProps}
        {...props}
      />
    </StaticRouter>
  );

  return RunRefsPageComponent;
};

const generateFakeRun = ({ loadRun, loadInstructions, loadRefs }) => {
  if (!loadRun) return undefined;

  return Immutable.fromJS({
    id: '',
    request_type: 'protocol',
    datasets: [
      {
        id: 'dataset1',
        instruction_id: 'Instruction1',
        is_analysis: true
      },
      {
        id: 'dataset2',
        instruction_id: 'Instruction2'
      }
    ],
    dependents: [],
    status: '',
    bsl: 1,
    instructions: loadInstructions ? [
      {
        id: 'Instruction1',
        operation: { dataref: 'dataRef1' },
        generated_containers: [
          { id: 'ct1cwf6qzd54vgf', label: 'demo-96-flat-2' }
        ]
      },
      {
        id: 'Instruction2',
        operation: { dataref: 'dataRef2' },
        generated_containers: [
          { id: 'ct17h2pav37h38', label: null }
        ]
      },
      {
        id: 'Instruction3',
        operation: { dataref: undefined },
        generated_containers: []
      }
    ] : undefined,
    refs: loadRefs ? [
      { name: 'ref1' },
      { name: 'ref2' }
    ] : undefined
  });
};

const fakeRefs = [
  { name: 'refName1', container_type: { id: '96-deep-kf', well_volume_ul: '1000', col_count: 1, well_count: 2 } },
  { name: 'refName2', container_type: { id: '96-deep-kf', well_volume_ul: '1000', col_count: 1, well_count: 2 } }
];

describe('ContainersView', () => {
  const sandbox = sinon.createSandbox();
  let component;

  afterEach(() => {
    sandbox.restore();
    component.unmount();
  });

  it('should render without throwing', () => {
    component = generateRunRefsPageRootWrapper();
  });

  it('should render PageLoading when page is not loaded', () => {
    component = generateRunRefsPageRootWrapper({
      run: Immutable.fromJS({})
    });

    expect(component.find('PageLoading')).to.have.length(1);
    expect(component.find('RunHeader')).to.have.length(0);
  });

  it('should render empty results when run has 0 refs', () => {
    component = generateRunRefsPageRootWrapper({
      run: Immutable.fromJS({
        id: '',
        datasets: [],
        dependents: [],
        refs: []
      })
    });

    expect(component.find('PageLoading')).to.have.length(0);
    expect(component.find('.fa-life-ring')).to.have.length(1);
  });

  it('should render a Route with a pathname that matches the provided context', () => {

    const fakeRun = generateFakeRun({
      loadRun: true,
      loadInstructions: true,
      loadRefs: true
    });

    component = generateRunPageRouterShallowWrapper({
      run: fakeRun
    });

    const path = component
      .dive()
      .dive()
      .dive()
      .shallow(
        {
          context: {
            router: {
              route: {
                location: {
                  pathname: '/transcriptic/p1aq788k7ybjt/runs/r1aq78jspqgdn/refs/refName2'
                }
              }
            }
          }
        }
      )
      .props().location.pathname;

    expect(path).to.not.be.undefined;
    expect(path).to.equal('/transcriptic/p1aq788k7ybjt/runs/r1aq78jspqgdn/refs/refName2');
  });

  it('navigation container should exist', () => {
    component = generateRunRefsPageRootWrapper({
      run: Immutable.fromJS({
        id: '',
        datasets: [],
        dependents: [],
        refs: [
          { name: 'refName1' },
          { name: 'refName2' },
          { name: 'refName3' },
          { name: 'refName4' },
          { name: 'refName5' }
        ]
      })
    });
    const verticalNav = component.find('VerticalNavBar');

    expect(verticalNav).to.exist;
  });

  it('should show generated containers navbar when instructions have generated containers', () => {
    let fakeRun = generateFakeRun({
      loadRun: true,
      loadInstructions: true,
      loadRefs: false
    });

    fakeRun = fakeRun.set('refs', Immutable.fromJS(fakeRefs));

    component = generateRunRefsPageRootWrapper({
      run: fakeRun
    });

    const verticalNav = component.find('VerticalNavBar');
    expect(verticalNav.length).to.equal(2);

    const header = verticalNav.at(1).find('.vertical-nav-bar__header');
    expect(header.text()).to.equal('Generated Containers');

    const navItems = verticalNav.at(1).find('VerticalNavItem');
    expect(navItems.length).to.equal(2);
  });

  it('should list generated containers in sorted order', () => {
    let fakeRun = generateFakeRun({
      loadRun: true,
      loadInstructions: true,
      loadRefs: false
    });

    fakeRun = fakeRun.set('refs', Immutable.fromJS(fakeRefs));

    component = generateRunRefsPageRootWrapper({
      run: fakeRun
    });

    const verticalNav = component.find('VerticalNavBar');
    expect(verticalNav.length).to.equal(2);

    const navItems = verticalNav.at(1).find('VerticalNavItem');
    expect(navItems.at(0).find('span').text()).to.equal('ct17h2pav37h38');
    expect(navItems.at(1).find('span').text()).to.equal('demo-96-flat-2');
  });

  it('should not show generated containers navbar when there are no generated containers', () => {
    component = generateRunRefsPageRootWrapper({
      run: Immutable.fromJS({
        id: '',
        datasets: [],
        dependents: [],
        refs: [
          { name: 'refName1' },
          { name: 'refName2' },
          { name: 'refName3' },
          { name: 'refName4' },
          { name: 'refName5' }
        ]
      })
    });

    const verticalNav = component.find('VerticalNavBar');
    expect(verticalNav.length).to.equal(1);
    expect(verticalNav.at(0).find('.vertical-nav-bar__header').text()).to.equal('Used In Run');
  });

  it('clicking on generated containers navItems should change url', () => {
    const redirect = sandbox.spy(Urls, 'run_generated_container');
    let fakeRun = generateFakeRun({
      loadRun: true,
      loadInstructions: true,
      loadRefs: false
    });

    fakeRun = fakeRun.set('refs', Immutable.fromJS(fakeRefs));

    component = generateRunRefsPageRootWrapper({
      run: fakeRun
    });

    const verticalNav = component.find('VerticalNavBar');
    expect(verticalNav.length).to.equal(2);
    const container = verticalNav.at(1).find('span').at(0);
    container.simulate('click');
    expect(redirect.calledWith('p1aq788k7ybjt', 'r1aq78jspqgdn', 'ct17h2pav37h38')).to.be.true;
  });

  it('clicking on generated containers navItems should change to runspage_generated_container url when runView prop exist', () => {
    const redirect = sandbox.spy(Urls, 'runspage_generated_container');
    let fakeRun = generateFakeRun({
      loadRun: true,
      loadInstructions: true,
      loadRefs: false
    });

    fakeRun = fakeRun.set('refs', Immutable.fromJS(fakeRefs));

    component = generateRunRefsPageRootWrapper({
      run: fakeRun
    }, true);
    const verticalNav = component.find('VerticalNavBar');
    expect(verticalNav.length).to.equal(2);
    const container = verticalNav.at(1).find('span').at(0);
    container.simulate('click');
    expect(redirect.calledWithExactly('r1aq78jspqgdn', 'ct17h2pav37h38', 'queue', 'all_runs')).to.be.true;
  });
});
