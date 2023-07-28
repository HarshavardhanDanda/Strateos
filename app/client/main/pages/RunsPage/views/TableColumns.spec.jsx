import ReactTestUtils from 'react-dom/test-utils';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import AcsControls from 'main/util/AcsControls';
import UserStore from 'main/stores/UserStore';
import { gatherQueueColumns, makeQueueColumns, gatherApprovalsColumns, makeRunTransferModalColumns  } from 'main/pages/RunsPage/views/TableColumns';
import { Popover, Tooltip } from '@transcriptic/amino';

const allRuns = 'all_runs';
const rejectedRuns = 'rejected';
const pending = 'pending';
const emptyRecord = { get: () => 'a', getIn: () => 'b', has: () => true };

describe('TableColumns', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  describe('gatherQueueColumns', () => {
    // Seems like a kind of pointless test
    it('has a priority column', () => {
      const [columns] = gatherQueueColumns(allRuns, false, () => emptyRecord, false);
      expect(columns.map(c => c.columnHeader)).to.include('time in queue');
    });

    it('should include organization column only when requested', () => {
      const [columnsNoOrg] = gatherQueueColumns(allRuns, false, () => emptyRecord, false);
      expect(columnsNoOrg.map(c => c.columnHeader)).to.not.include('organization');
      const [columnsWithOrg] = gatherQueueColumns(allRuns, true, () => emptyRecord, false);
      expect(columnsWithOrg.map(c => c.columnHeader)).to.include('organization');
    });

    it('should include href for name and id columns', () => {
      sandbox.stub(AcsControls, 'isFeatureEnabled').returns(true);
      const [columns] = gatherQueueColumns(allRuns, false, () => emptyRecord, false);
      const columnIds = columns.map(c => c.id);
      expect(columnIds).to.include('title');
      expect(columns.find(c => c.id === 'title').columnRenderFunction(emptyRecord)).to.include({ type: 'a' });
      expect(columnIds).to.include('id');
      expect(columns.find(c => c.id === 'id').columnRenderFunction(emptyRecord)).to.include({ type: 'a' });
    });

    it('should set popovers for status column', () => {
      const getStub = sandbox.stub(emptyRecord, 'get').returns('');
      getStub.withArgs('status').returns('accepted');
      getStub.withArgs('unrealized_input_containers_count').returns(0);
      getStub.withArgs('billing_valid?').returns(true);
      const columns = makeQueueColumns('accepted', false, () => emptyRecord, false);
      const statusColumn = columns.find(c => c.props.id === 'status');
      const statusCell = statusColumn.props.renderCellContent(emptyRecord);
      expect(ReactTestUtils.isElementOfType(statusCell, Popover)).to.be.true;
    });

    it('should add tooltip for cells', () => {
      // Amino tooltip is added to cells in a column based on the "popover" prop, yeah it's confusing
      const columns = makeQueueColumns('accepted', false, () => emptyRecord, false);
      expect(columns.filter(c => c.props.popOver).map(c => c.props.id)).to.have.members([
        'title',
        'protocol_name',
        'id',
        'scheduled_to_start_at',
        'created_date',
        'accepted_date',
        'estimated_run_time_cache',
        'priority',
        'lab_id',
        'scheduled_workcell',
        'scheduled_to_start_at',
        'est_end_time',
        'can_start_at',
        'canceled_at',
        'canceled_reason'
      ]);
    });

    it('should have five columns for RunSelectionModel', () => {
      const columns = makeRunTransferModalColumns();
      expect(columns.map(c => c.props.id)).to.have.members([
        'title',
        'protocol_name',
        'created_at',
        'status',
        'owner'
      ]);
    });

    it('cost column should have alignHeaderRight prop value as true in queue view', () => {
      const [columns] = gatherQueueColumns(allRuns, true, () => emptyRecord, true);
      expect(columns.find(c => c.id === 'total_cost').alignHeaderRight).to.equal(true);
    });

    it('cost column should have alignHeaderRight prop value as true in approval view', () => {
      const [columns] = gatherApprovalsColumns(rejectedRuns, true, () => emptyRecord, true);
      expect(columns.find(c => c.id === 'total_cost').alignHeaderRight).to.equal(true);
    });

    it('should not render popover for Profile', () => {
      sandbox.stub(UserStore, 'getById').returns(Immutable.Map({ name: 'Some name' }));
      const [columns] = gatherQueueColumns(allRuns, true, () => emptyRecord, true);
      const profileCell = columns.find(c => c.id === 'assigned_to_id').columnRenderFunction(emptyRecord);
      expect(ReactTestUtils.isElementOfType(profileCell, Tooltip)).to.be.true;
      expect(profileCell.props.children.props.showPopover).to.be.false;
    });
  });

  describe('gatherApprovalsColumns', () => {
    it('should have appropriate Ids for approval sortable columns', () => {
      sandbox.stub(AcsControls, 'isFeatureEnabled').returns(true);
      const [columns] = gatherApprovalsColumns(pending, true, () => emptyRecord);
      const columnIds = columns.map(c => c.id);
      expect(columnIds).to.include('title');
      expect(columnIds).to.include('status');
      expect(columnIds).to.include('created_at');
      expect(columnIds).to.include('requested_date');
      expect(columnIds).to.include('estimated_run_time_cache');
      expect(columnIds).to.include('total_cost');
      expect(columnIds).to.include('organization_name');
      expect(columnIds).to.include('lab_id');
      expect(columnIds).to.include('scheduled_workcell');
    });
  });
});
