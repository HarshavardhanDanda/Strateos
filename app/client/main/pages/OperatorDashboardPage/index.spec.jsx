import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect }  from 'chai';
import Immutable from 'immutable';
import LabStore from 'main/stores/LabStore';
import FeatureStore from 'main/stores/FeatureStore';
import WorkcellStore from 'main/stores/WorkcellStore';
import OperatorDashboardPage from './index';

const lab1 = {
  id: 'lab1',
  name: 'haven',
  operated_by_id: 'org1'
};

const lab1Workcells = [
  {
    name: 'wc0',
    backend_address: 'localhost:8080',
    id: 'workcell0',
    workcell_type: 'mcx',
    node_id: 'wc0-mcx1'
  },
  {
    name: 'wc1',
    backend_address: 'localhost:8081',
    id: 'workcell1',
    workcell_type: 'metamcx',
    node_id: 'wc0-mcx1',
    is_test: true
  }
];

describe('OperatorDashboardPage', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(FeatureStore, 'getLabIdsWithFeatures').returns(Immutable.fromJS([lab1.id]));
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should compute the right prop from store when not all labs are loaded', () => {
    sandbox.stub(LabStore, 'getByIds').returns(Immutable.fromJS([]));
    wrapper = shallow(<OperatorDashboardPage />);

    const internalComponent = wrapper.find('OperatorDashboardPage');
    expect(internalComponent).to.be.not.null;

    expect(internalComponent.props().areLabsLoaded).to.be.false;
    expect(internalComponent.props().labIds).to.eql([lab1.id]);
    expect(internalComponent.props().manifest).to.eql({ });
  });

  it('should compute the right prop from store when one lab is loaded', () => {
    sandbox.stub(LabStore, 'getByIds').returns(Immutable.fromJS([lab1]));
    sandbox.stub(WorkcellStore, 'getByLabId').withArgs(lab1.id).returns(Immutable.fromJS([]));
    wrapper = shallow(<OperatorDashboardPage />);

    const internalComponent = wrapper.find('OperatorDashboardPage');
    expect(internalComponent).to.be.not.null;

    expect(internalComponent.props().areLabsLoaded).to.be.true;
    expect(internalComponent.props().labIds).to.eql([lab1.id]);
    expect(internalComponent.props().manifest).to.eql({ [lab1.name]: { labId: lab1.id, workcells: {} } });
  });

  it('should compute the right prop from store when one lab is loaded and its workcells', () => {
    sandbox.stub(LabStore, 'getByIds').returns(Immutable.fromJS([lab1]));
    sandbox.stub(WorkcellStore, 'getByLabId').withArgs(lab1.id).returns(Immutable.fromJS(lab1Workcells));
    wrapper = shallow(<OperatorDashboardPage />);

    const internalComponent = wrapper.find('OperatorDashboardPage');
    expect(internalComponent).to.be.not.null;

    expect(internalComponent.props().areLabsLoaded).to.be.true;
    expect(internalComponent.props().labIds).to.eql([lab1.id]);
    expect(internalComponent.props().manifest).to.eql({
      [lab1.name]: {
        labId: lab1.id,
        workcells: {
          [lab1Workcells[0].name]: {
            url: lab1Workcells[0].backend_address,
            type: lab1Workcells[0].workcell_type,
            workcellId: lab1Workcells[0].id,
            nodeId:  lab1Workcells[0].node_id,
            isTest: false
          },
          [lab1Workcells[1].name]: {
            url: lab1Workcells[1].backend_address,
            type: lab1Workcells[1].workcell_type,
            workcellId: lab1Workcells[1].id,
            nodeId:  lab1Workcells[1].node_id,
            isTest: true
          },
        }
      }
    });
  });
});
