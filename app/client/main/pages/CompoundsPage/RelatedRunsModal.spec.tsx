import React from 'react';
import { mount, shallow } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';
import sinon from 'sinon';
import { Table, Column, TextBody } from '@transcriptic/amino';
import BatchRunsActions from 'main/pages/CompoundsPage/BatchRunsActions';
import ModalStore from 'main/stores/ModalStore';
import SessionStore from 'main/stores/SessionStore';
import RelatedRunsModal from 'main/pages/CompoundsPage/RelatedRunsModal';

const data =
  {
    data: [
      {
        id: 'r1ebjazaruke25',
        attributes: {
          completed_at: '2021-04-16T10:19:54.615-07:00',
          owner_id: 'u1dy3m5avan3mg',
          project_id: 'p1dqzdvrqgwx9v',
          status: 'canceled',
          success_notes: 'sample notes',
          title: 'SPE_Feb_09_2020',
          id: 'r1ebjazaruke25',
          organization_id: 'org1cytx5sk6tvss'
        }
      },
      {
        id: 'r1eaw9nhkry2pa',
        attributes: {
          status: 'complete',
          completed_at: '2020-04-10T14:03:30.741-07:00',
          title: 'Chemical Synthesis on 2020-04-10',
          project_id: 'p1e9c8yk7pcf8b',
          success_notes: 'success',
          owner_id: 'u1dffycuxmnb2n',
          id: 'r1eaw9nhkry2pa',
          organization_id: 'org1cytx5sk6tvss'
        }
      }
    ],
    meta: {
      record_count: 3 }
  };

const dataInAscOrder =
  {
    data: [
      {
        id: 'r1eaw9nhkry2pa',
        attributes: {
          status: 'complete',
          completed_at: '2020-04-10T14:03:30.741-07:00',
          title: 'Chemical Synthesis on 2020-04-10',
          project_id: 'p1e9c8yk7pcf8b',
          success_notes: 'success',
          owner_id: 'u1dffycuxmnb2n',
          id: 'r1eaw9nhkry2pa',
          organization_id: 'org1cytx5sk6tvss'
        }
      },
      {
        id: 'r1ebjazaruke25',
        attributes: {
          completed_at: '2021-04-16T10:19:54.615-07:00',
          owner_id: 'u1dy3m5avan3mg',
          project_id: 'p1dqzdvrqgwx9v',
          status: 'canceled',
          success_notes: 'sample notes',
          title: 'SPE_Feb_09_2020',
          id: 'r1ebjazaruke25',
          organization_id: 'org1cytx5sk6tvss'
        }
      }
    ],
    meta: {
      record_count: 3 }
  };

describe('RelatedRunsModal', () => {
  let relatedRunsModal;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    relatedRunsModal = shallow(<RelatedRunsModal
      modalId={'RELATED_RUNS_MODAL_bat1h59f8bf7nngu}'}
      batchId={'bat1h59f8bf7nngu'}
    />);
  });

  afterEach(() => {
    sandbox.restore();
    relatedRunsModal.unmount();
  });

  it('should render description with batch id', () => {
    expect(relatedRunsModal.find(TextBody)).to.have.length(1);
    expect(relatedRunsModal.find(TextBody).dive()
      .find('Text')
      .dive()
      .find('p')
      .text())
      .to.equal('Displaying Runs related to batch bat1h59f8bf7nngu');
  });

  it('should have seven table columns in Related Runs Table and one is sortable', () => {
    expect(relatedRunsModal.find(Table)).to.have.length(1);
    expect(relatedRunsModal.find(Table).find('Column').length).to.equal(7);
    const col1 = relatedRunsModal.find(Table).find(Column).at(0);
    expect(col1.props().header).to.equal('Run Name');
    const col2 = relatedRunsModal.find(Table).find(Column).at(1);
    expect(col2.props().header).to.equal('Run ID');
    const col3 = relatedRunsModal.find(Table).find(Column).at(2);
    expect(col3.props().header).to.equal('Status');
    const col4 = relatedRunsModal.find(Table).find(Column).at(3);
    expect(col4.props().header).to.equal('Completed');
    const col5 = relatedRunsModal.find(Table).find(Column).at(4);
    expect(col5.props().header).to.equal('Results');
    const col6 = relatedRunsModal.find(Table).find(Column).at(5);
    expect(col6.props().header).to.equal('Run Comments');
    const col7 = relatedRunsModal.find(Table).find(Column).at(6);
    expect(col7.props().header).to.equal('Creator');
    expect(col4.props().sortable).to.equal(true);
  });

  it('should render empty table', () => {
    expect(relatedRunsModal.find(Table)).to.have.length(1);
    expect(relatedRunsModal.find(Table).first().prop('data').size).to.equal(0);
  });
  // Temporarily disable this test until we find and fix the root cause of this failure
  xit('should render related runs table', () => {
    const fetchBatchRelatedRuns = sandbox.stub(BatchRunsActions, 'fetchBatchRelatedRuns');
    sandbox.stub(ModalStore, 'getById').returns({ get: () => true });
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org123', subdomain: 'l2s2dev' }));
    fetchBatchRelatedRuns.returns({
      done: (cb) => {
        cb(data);
        return { fail: () => ({}) };
      }
    });
    const wrapper = mount(<RelatedRunsModal
      modalId={'RELATED_RUNS_MODAL_bat1h59f8bf7nngu}'}
      batchId={'bat1h59f8bf7nngu'}
    />);
    expect(wrapper.find(Table)).to.have.length(1);
    expect(wrapper.find(Table).find('BodyCell').at(0).childAt(0)
      .text()).to.equal('SPE_Feb_09_2020');
    expect(wrapper.find(Table).find('BodyCell').at(1).childAt(0)
      .text()).to.equal('r1ebjazaruke25');
    expect(wrapper.find(Table).find('BodyCell').at(2).childAt(0)
      .text()).to.equal('Canceled');
    expect(wrapper.find(Table).find('BodyCell').at(3).childAt(0)
      .text()).to.equal('2021-04-16T10:19:54.615-07:00');
    expect(wrapper.find(Table).find('BodyCell').at(4).childAt(0)
      .text()).to.equal('View Results');
    expect(wrapper.find(Table).find('BodyCell').at(5).childAt(0)
      .text()).to.equal('sample notes');
  });

  xit('should make fetchBatchRelatedRuns API call again when scroll reaches the bottom', () => {
    const fetchBatchRelatedRuns = sandbox.stub(BatchRunsActions, 'fetchBatchRelatedRuns');
    sandbox.stub(ModalStore, 'getById').returns({ get: () => true });
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org123', subdomain: 'l2s2dev' }));
    fetchBatchRelatedRuns.returns({
      done: (cb) => {
        cb(data);
        return { fail: () => ({}) };
      }
    });
    const wrapper = mount(<RelatedRunsModal
      modalId={'RELATED_RUNS_MODAL_bat1h59f8bf7nngu}'}
      batchId={'bat1h59f8bf7nngu'}
    />);
    const targetEvent = {
      target: { scrollTop: 100, scrollHeight: 50, clientHeight: 50 },
    };
    wrapper.find('.related-runs-modal__table').simulate('scroll', targetEvent);
    expect(fetchBatchRelatedRuns.calledTwice).to.be.true;
  });
  // Temporarily disable this test until we find and fix the root cause of this failure
  xit('should sort related runs based on completed at column', () => {
    const fetchBatchRelatedRuns = sandbox.stub(BatchRunsActions, 'fetchBatchRelatedRuns');
    sandbox.stub(ModalStore, 'getById').returns({ get: () => true });
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org123', subdomain: 'l2s2dev' }));
    fetchBatchRelatedRuns.withArgs('bat1h59f8bf7nngu', 'completed_at', 'desc', 12, 0).returns({
      done: (cb) => {
        cb(data);
        return { fail: () => ({}) };
      }
    });

    fetchBatchRelatedRuns.withArgs('bat1h59f8bf7nngu', 'completed_at', 'asc', 12, 0).returns({
      done: (cb) => {
        cb(dataInAscOrder);
        return { fail: () => ({}) };
      }
    });
    const wrapper = mount(<RelatedRunsModal
      modalId={'RELATED_RUNS_MODAL_bat1h59f8bf7nngu}'}
      batchId={'bat1h59f8bf7nngu'}
    />);

    expect(wrapper.find(Table).find('Row').at(1).find('BodyCell')
      .at(3)
      .childAt(0)
      .text()).to.equal('2021-04-16T10:19:54.615-07:00');
    expect(wrapper.find(Table).find('Row').at(2).find('BodyCell')
      .at(3)
      .childAt(0)
      .text()).to.equal('2020-04-10T14:03:30.741-07:00');

    wrapper.find(Table).find('SortableHeader').at(0).find('div')
      .at(0)
      .simulate('click');

    expect(wrapper.find(Table).find('Row').at(1).find('BodyCell')
      .at(3)
      .childAt(0)
      .text()).to.equal('2020-04-10T14:03:30.741-07:00');
    expect(wrapper.find(Table).find('Row').at(2).find('BodyCell')
      .at(3)
      .childAt(0)
      .text()).to.equal('2021-04-16T10:19:54.615-07:00');
  });
});
