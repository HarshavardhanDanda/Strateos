import React from 'react';
import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import { StaticRouter } from 'react-router-dom';
import sinon from 'sinon';
import Immutable from 'immutable';
import _ from 'lodash';
import RefAPI from 'main/api/RefAPI';

import ResultsView from './index';

describe('Run page - ResultsView', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const routeProps = {
    match: {
      path: '/:subdomain/runspage/:runView/:runStatus/runs/:runId/data/:dataRef?',
      url: '/transcriptic/runspage/queue/complete/runs/r1apdqdvhbwgyytgm/data/dataRef1',
      isExact: true,
      params: {
        subdomain: 'transcriptic',
        runView: 'queue',
        runStatus: 'complete',
        runId: 'r1apdqdvhbwgyytgm',
        projectId: 'proj123',
        dataRef: 'dataRef1'
      }
    },
    history: {
      replace: () => { }
    },
    location: {}
  };

  const emptyRouteProps = {
    match: {
      isExact: true,
      params: {
        projectId: '',
        runId: '',
        subdomain: '',
        path: '',
        url: ''
      }
    },
    history: {
      replace: () => { }
    },
    location: {}
  };

  const sharedProps = {
    runId: 'r1apdqdvhbwgyytgm',
    projectId: 'proj123',
    subdomain: 'transcriptic',
  };

  const generateFakeRun = ({ loadRun, loadInstructions, loadRefs }) => {
    if (!loadRun) return undefined;

    return Immutable.fromJS({
      id: '',
      request_type: 'protocol',
      datasets: [
        {
          id: 'dataset1',
          instruction_id: 'Instruction1'
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
          warps: []
        },
        {
          id: 'Instruction2',
          operation: { dataref: 'dataRef2' },
          warps: []
        }
      ] : undefined,
      refs: loadRefs ? [
        { name: 'ref1' },
        { name: 'ref2' }
      ] : undefined
    });
  };

  const generateRunResultsPageRootWrapper = (extraProps, routeProps) => {
    const RunResultsComponent = mount(
      <StaticRouter
        location="/transcriptic/runspage/queue/complete/runs/r1apdqdvhbwgyytgm/data/dataRef1"
        context={{
          context: {
            router: {
              route: {
                location: {
                  pathname: '/transcriptic/runspage/queue/complete/runs/r1apdqdvhbwgyytgm/data/dataRef1'
                }
              }
            }
          }
        }}
      >
        <ResultsView
          {...sharedProps}
          {...routeProps}
          {...extraProps}
        />
      </StaticRouter>
    );

    return RunResultsComponent;
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    if (sandbox) {
      sandbox.restore();
    }
  });

  it('should render ResultsView with throwing', () => {
    shallow(<ResultsView {...routeProps} />);
  });

  it('should show <PageLoading /> if run is not present', () => {
    wrapper = generateRunResultsPageRootWrapper({
      hasLoadedRun: false,
      hasLoadedInstructions: false,
      hasLoadedRefs: false
    }, emptyRouteProps);

    expect(wrapper.find('PageLoading')).to.have.length(1);
  });

  it('should render <ZeroState/> if reference api returns no records', () => {
    sandbox.stub(RefAPI, 'fetchWithContainersOmcs')
      .returns({
        then: cb => {
          return { data: cb([{ meta: { record_count: 0 } }]), fail: () => ({}) };
        }
      });
    const fakeRun = generateFakeRun({
      loadRun: true,
      loadInstructions: true,
      loadRefs: false
    });
    wrapper = generateRunResultsPageRootWrapper({ run: fakeRun }, emptyRouteProps);

    expect(wrapper.find('ZeroState')).to.have.lengthOf(1);
  });

  it('should show <ResultsViewContent />', () => {
    const fakeRun = generateFakeRun({
      loadRun: true,
      loadInstructions: true,
      loadRefs: true
    });
    wrapper = generateRunResultsPageRootWrapper({ run: fakeRun }, routeProps);

    expect(wrapper.find('ResultsViewContent')).to.have.length(1);
  });
});
