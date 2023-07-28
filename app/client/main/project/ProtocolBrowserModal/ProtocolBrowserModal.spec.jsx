import React from 'react';
import { expect } from 'chai';
import Immutable from 'immutable';
import sinon from 'sinon';
import ajax from 'main/util/ajax';

import ModalActions from 'main/actions/ModalActions';
import testRun from 'main/test/run-json/everyInstructionAdminRun.json';
import testProtocol from 'main/test/protocol.json';
import FeatureStore from 'main/stores/FeatureStore';
import ProtocolStore from 'main/stores/ProtocolStore';
import FavoriteAPI from 'main/api/FavoriteAPI';
import ProtocolBrowserModal from './index';
import ProtocolCard from './ProtocolCard';

const rawProject = testRun.project;
const immutableProject = Immutable.fromJS(rawProject);

describe('ProtocolBrowserModal', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;
  const protocols = [{
    id: 'pr1brhxyphxvgm',
    name: 'Pipetting',
    description: 'Pipetting tools including Single Dilute, Resuspend, Full plate stamping and partial plate stamping',
    package_name: 'com.transcriptic.autoprotocol-core3',
    release_id: 're1brhxyhgdfxt',
    license: 'MIT',
    published: true,
    display_name: 'Pipetting Tools',
    package: {
      public: true,
      organization_id: 'org13'
    }
  },
  {
    id: 'pr194h3m632zww',
    name: 'Dilute',
    description: 'Dilute single drugs to appropriate concentrations (1x, .2x, .1x, .02x, .01x, .002x)',
    package_name: 'com.avatar-project-cpmcri.Avatar',
    release_id: 're194h3fp7j7ys',
    license: 'MIT',
    published: true,
    display_name: 'Dilute Drugs (Single Drug or EC50 Combination)',
    package: {
      public: false,
      organization_id: 'org13'
    },
  },
  {
    id: 'pr1bwphhg2ekjs',
    name: 'tiso',
    description: 'Takes plates to and from tiso/image plate. Inputs must match production tiso configs or errors/incorrect schedules will occur.',
    package_name: 'com.transcriptic.tiso-stress-test',
    release_id: 're1bwphhbxxvwa',
    license: 'MIT',
    published: true,
    display_name: 'tiso stress test',
    package: {
      public: false,
      organization_id: 'orgimpl123'
    }
  }
  ];

  beforeEach(() => {
    wrapper = enzyme.mount(
      <ProtocolBrowserModal
        project={immutableProject}
        onSelectProtocol={() => sandbox.stub()}
      />
    );
    ModalActions.open('PROTOCOL_BROWSER_MODAL');
  });

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should mount, open and unmount without throwing', () => {
    expect(wrapper).to.not.be.undefined;
  });

  it('should be able to set a query', () => {
    wrapper.children().instance().setQuery('test');
    expect(wrapper.children().instance().state.query).to.equal('test');
  });

  it('should revert back to previous query on clear', () => {
    wrapper.children().instance().setQuery('');
    expect(wrapper.children().instance().state.currentProtocolFilter).to.equal('all');
  });

  it('should list only the public and implementation org protocols if it is an implementation project', () => {
    const apiResponse = [protocols];
    sandbox.stub(FeatureStore, 'hasFeature').withArgs('MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB').returns(true);
    sandbox.stub(ProtocolStore, 'isLoaded').returns(true);
    sandbox.stub(FavoriteAPI, 'index');
    sandbox.stub(ajax, 'when').returns({
      then: (cb) => {
        cb('', apiResponse);
      }
    });
    const protocolStorefilterForOrgSpy = sandbox.spy(ProtocolStore, 'filterForOrg');
    sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb(protocols);
      }
    });
    const projectProp = Immutable.fromJS({
      id: 'p195denmhm9wn',
      name: 'huan',
      archived_at: null,
      bsl: 1,
      visibility_in_words: 'Organization-wide',
      organization_id: 'orgimpl123', // implementation_org
      is_implementation: true
    });
    wrapper = enzyme.mount(
      <ProtocolBrowserModal
        project={projectProp}
        onSelectProtocol={() => sandbox.stub()}
      />);
    wrapper.find('SinglePaneModal').at(0).prop('onOpen')();
    wrapper.update();

    expect(protocolStorefilterForOrgSpy.called).to.be.true;
    const renderedProtocols = wrapper.find('span').findWhere(span => span.props().className === 'highlighted');
    expect(renderedProtocols.length).to.equal(4); // out of 4 remaining 2 are the descriptions
    expect(renderedProtocols.at(0).text()).to.equal('Pipetting Tools');
    expect(renderedProtocols.at(2).text()).to.equal('tiso stress test');
  });

  it('should list only the public and current org protocols if it is not an implementation project', () => {
    const apiResponse = [protocols];
    sandbox.stub(ProtocolStore, 'isLoaded').returns(true);
    sandbox.stub(FavoriteAPI, 'index');
    sandbox.stub(ajax, 'when').returns({
      then: (cb) => {
        cb('', apiResponse);
      }
    });
    const protocolStorefilterForOrgSpy = sandbox.spy(ProtocolStore, 'filterForOrg');
    sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb(protocols);
      }
    });
    const projectProp = Immutable.fromJS({
      id: 'p195denmhm9wn',
      name: 'huan',
      archived_at: null,
      bsl: 1,
      visibility_in_words: 'Organization-wide',
      organization_id: 'org13',
      is_implementation: false
    });
    wrapper = enzyme.mount(
      <ProtocolBrowserModal
        project={projectProp}
        onSelectProtocol={() => sandbox.stub()}
      />);
    wrapper.find('SinglePaneModal').at(0).prop('onOpen')();
    wrapper.update();

    expect(protocolStorefilterForOrgSpy.called).to.be.true;
    const renderedProtocols = wrapper.find('span').findWhere(span => span.props().className === 'highlighted');
    expect(renderedProtocols.length).to.equal(4); // out of 4 remaining 2 are the descriptions
    expect(renderedProtocols.at(0).text()).to.equal('Pipetting Tools');
    expect(renderedProtocols.at(2).text()).to.equal('Dilute Drugs (Single Drug or EC50 Combination)');
  });
});

describe('ProtocolCard', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  beforeEach(() => {
    wrapper = enzyme.mount(
      <ProtocolCard
        key={testProtocol.id}
        protocol={testProtocol}
        onClick={() => sandbox.stub()}
      />
    );
  });

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should mount and render', () => {
    expect(wrapper).to.not.be.undefined;
  });

  it('should render the name and description', () => {
    const name = wrapper.find('.protocol-name h3').text();
    expect(name).to.equal('Epibiome Compose');

    const desc = wrapper.find('.protocol-description p').text();
    expect(desc).to.equal('Compose 96-well plate');
  });
});
