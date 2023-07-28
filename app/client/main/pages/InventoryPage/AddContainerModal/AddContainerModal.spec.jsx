import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import ModalActions from 'main/actions/ModalActions';
import ajax from 'main/util/ajax';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import labConsumerData from 'main/test/labconsumer/testData.json';

import AddContainerModal from './AddContainerModal';

describe('AddContainerModal', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  let onCreateSpy;

  const mockLabConsumers = Immutable.fromJS([labConsumerData[0]]);

  beforeEach(() => {
    sandbox.stub(ajax, 'get').returns({
      done: cb => {
        cb({
          data: [
            {
              id: 'flask-250',
              attributes: {
                is_tube: true,
                name: '250mL Flask',
                shortname: 'flask-250',
                vendor: 'not_applicable',
                well_count: 1,
                well_depth_mm: '0.0',
                well_volume_ul: '250000.0'
              },
              type: 'container_types'
            }
          ],
          meta: {
            record_count: 1
          }
        });

        return { fail: () => ({}) };
      }
    });

    sandbox.stub(LabConsumerActions, 'loadLabsForCurrentOrg').returns({ done: (cb) => cb() });
    sandbox.stub(LabConsumerStore, 'getAllForCurrentOrg').returns(mockLabConsumers);

    onCreateSpy = sandbox.spy();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  it('should render like... at all', () => {
    wrapper = shallow(
      <AddContainerModal onContainerCreation={onCreateSpy} subdomain="org13" />
    );
  });

  it('should have labOperatorName, lab_id, labAddress in state on initial mount', () => {
    wrapper = shallow(
      <AddContainerModal onContainerCreation={onCreateSpy} subdomain="org13" />
    );
    expect(wrapper.state().labOperatorName).to.equal('Strateos');
    expect(wrapper.state().lab_id).to.equal('lab1');
    expect(wrapper.state().labAddress).to.deep.equal(mockLabConsumers.first().getIn(['lab', 'address']));

  });

  it('Modal title', () => {
    wrapper = shallow(
      <AddContainerModal onContainerCreation={onCreateSpy} subdomain="org13" />
    );
    expect(wrapper.props().title).to.equal('Add New Samples');
  });

  it('reset state should be called on close', () => {
    const resetSpy = sandbox.spy(AddContainerModal.prototype, 'resetState');
    wrapper = shallow(
      <AddContainerModal onContainerCreation={onCreateSpy} subdomain="org13" />
    );
    ModalActions.close(AddContainerModal.MODAL_ID);
    expect(resetSpy.calledOnce);
  });

  it('navigation should have three panes', () => {
    wrapper = shallow(
      <AddContainerModal onContainerCreation={onCreateSpy} subdomain="org13" />
    );
    const panes = wrapper.instance().navigation();
    expect(panes).to.have.length(3);
    expect(panes).to.eql(['Setup', 'Create', 'Success']);
  });

  it('CreateContainerPane should be called with correct props', () => {
    wrapper = shallow(
      <AddContainerModal onContainerCreation={onCreateSpy} subdomain="org13" />
    );
    wrapper.setState({ testMode: true });
    let createContainerPane = wrapper.instance().renderCreateContainers();
    expect(createContainerPane.props.testMode).to.be.true;
    expect(createContainerPane.props.onContainerCreation).to.be.not.undefined;

    wrapper.setState({ testMode: false });
    createContainerPane = wrapper.instance().renderCreateContainers();
    expect(createContainerPane.props.testMode).to.be.false;
  });
});
