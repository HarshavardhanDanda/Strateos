import { expect } from 'chai';
import sinon from 'sinon';

import { makeNewContext } from 'main/stores/mobx/StoresContext';
import UserPreference from 'main/util/UserPreferenceUtil';
import HTTPUtil from 'main/util/HTTPUtil';
import { PAGE_SIZE_OPTION_1, PAGE_SIZE_OPTION_2, PAGE_SIZE_OPTION_3, PAGE_SIZE_OPTION_4 } from 'main/util/List';
import RunScheduleActions from 'main/actions/RunScheduleActions';
import { RunStatuses } from './RunFilterStore';
import FeatureStore from '../FeatureStore';

const makeLab = (id) => ({
  data: {
    id: `${id}`,
    attributes: {
      name: `lab ${id}`,
      operated_by_id: `operator ${id}`,
      operated_by_name: `operator${id}`,
    }
  }
});

const isEven = id => parseInt(id, 10) % 2 === 0;

describe('RunFilterStore', () => {
  const sandbox = sinon.createSandbox();
  sinon.stub(RunScheduleActions, 'loadRunSchedules').returns([]);

  afterEach(() => {
    sandbox.restore();
  });

  describe('loadFiltersFromLocal', () => {
    it('should load filters from local storage', () => {
      const { runFilterStore } = makeNewContext();
      const filterOptions = {
        search: 'search1',
        labId: 'lab1',
        selectedOrg: { name: 'org 1', value: 'org1' },
        page: 2,
        pageSize: 10,
        manuallySelectedOperatorIds: ['op1', 'op4434'],
      };
      sandbox.stub(UserPreference, 'get').returns(filterOptions);
      runFilterStore.loadFiltersFromLocal();
      expect(runFilterStore.search).to.equal(filterOptions.search);
      expect(runFilterStore.labId).to.equal(filterOptions.labId);
      expect(runFilterStore.selectedOrg).to.include(filterOptions.selectedOrg);
      expect(runFilterStore.page).to.equal(filterOptions.page);
      expect(runFilterStore.pageSize).to.equal(filterOptions.pageSize);
      expect(runFilterStore.selectedOperatorIds).to.have.ordered.members(filterOptions.manuallySelectedOperatorIds);
    });

    it('should convert locally stored old page size value of 12 to 10', () => {
      const { runFilterStore } = makeNewContext();
      const filterOptions = {
        pageSize: 12
      };
      sandbox.stub(UserPreference, 'get').returns(filterOptions);
      runFilterStore.loadFiltersFromLocal();
      expect(runFilterStore.pageSize).to.equal(PAGE_SIZE_OPTION_1);
    });

    it('should convert locally stored old page size value of 24 to 25', () => {
      const { runFilterStore } = makeNewContext();
      const filterOptions = {
        pageSize: 24
      };
      sandbox.stub(UserPreference, 'get').returns(filterOptions);
      runFilterStore.loadFiltersFromLocal();
      expect(runFilterStore.pageSize).to.equal(PAGE_SIZE_OPTION_2);
    });

    it('should convert locally stored old page size value of 48 to 50', () => {
      const { runFilterStore } = makeNewContext();
      const filterOptions = {
        pageSize: 48
      };
      sandbox.stub(UserPreference, 'get').returns(filterOptions);
      runFilterStore.loadFiltersFromLocal();
      expect(runFilterStore.pageSize).to.equal(PAGE_SIZE_OPTION_3);
    });

    it('should convert locally stored old page size value of 96 to 100', () => {
      const { runFilterStore } = makeNewContext();
      const filterOptions = {
        pageSize: 96
      };
      sandbox.stub(UserPreference, 'get').returns(filterOptions);
      runFilterStore.loadFiltersFromLocal();
      expect(runFilterStore.pageSize).to.equal(PAGE_SIZE_OPTION_4);
    });

    it('should convert locally stored old non-standard page size value to 10', () => {
      const { runFilterStore } = makeNewContext();
      const filterOptions = {
        pageSize: 500
      };
      sandbox.stub(UserPreference, 'get').returns(filterOptions);
      runFilterStore.loadFiltersFromLocal();
      expect(runFilterStore.pageSize).to.equal(PAGE_SIZE_OPTION_1);
    });
  });

  describe('operatorLabs', () => {
    it('should return selected lab if not "all" selected', async () => {
      const { labStore, runFilterStore } = makeNewContext();
      sandbox.stub(FeatureStore, 'canManageRunState').returns(true);
      const getStub = sandbox.stub(HTTPUtil, 'get');
      const labIds = [...Array(5).keys()];
      labIds.forEach(i => getStub.onCall(i).resolves(makeLab(i)));
      const targetLabId = '2';
      await labStore.fetchLabs(labIds);
      expect(runFilterStore.labId).to.be.equal('all');
      expect(runFilterStore.operatorLabs).to.not.have.members([targetLabId]);
      runFilterStore.updateLabId(targetLabId);
      expect(runFilterStore.labId).to.be.equal(targetLabId);
      expect(runFilterStore.operatorLabs).to.have.members([targetLabId]);
    });

    it('should return only managing labs when "all" labId selected', async () => {
      const { labStore, runFilterStore } = makeNewContext();
      const getStub = sandbox.stub(HTTPUtil, 'get');
      const labIds = [...Array(5).keys()];
      labIds.forEach(i => getStub.onCall(i).resolves(makeLab(i)));
      sandbox.stub(FeatureStore, 'canManageRunState').callsFake(isEven);
      await labStore.fetchLabs(labIds);
      expect(runFilterStore.labId).to.be.equal('all');
      expect(runFilterStore.operatorLabs).to.have.members(labIds.filter(isEven).map(i => i.toString()));
    });
  });

  describe('buildSearchObject', () => {
    it('should use end of startDate if no endDate is selected', () => {
      // Assigns an end date even if the user only clicks once in the date selector for easy selection of a single day
      const { runFilterStore } = makeNewContext();
      sandbox.stub(HTTPUtil, 'get');
      expect(runFilterStore.startDate).to.be.null;
      expect(runFilterStore.endDate).to.be.null;
      const newDate = new Date();
      newDate.setDate(newDate - 5);
      const start = new Date(newDate.getTime());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime());
      end.setHours(23, 59, 59, 999);
      runFilterStore.updateDates(newDate, null);
      const searchObject = runFilterStore.buildSearchObject();
      expect(searchObject).to.haveOwnProperty('start_date');
      expect(searchObject).to.haveOwnProperty('end_date');
      expect(searchObject.start_date).to.deep.equal(start);
      expect(searchObject.end_date).to.deep.equal(end);
    });
  });

  describe('sortBy', () => {
    it('should give appropriate sort_by when runSchedule', () => {
      const { runFilterStore } = makeNewContext();
      runFilterStore.updateRunStatus(RunStatuses.AllRuns);
      runFilterStore.resetSortBy();
      expect(runFilterStore.sortById).to.equal('created_at');
      runFilterStore.updateRunStatus(RunStatuses.Aborted);
      runFilterStore.resetSortBy();
      expect(runFilterStore.sortById).to.equal('aborted_date');
      runFilterStore.updateRunStatus(RunStatuses.Accepted);
      runFilterStore.resetSortBy();
      expect(runFilterStore.sortById).to.equal('accepted_date');
      runFilterStore.updateRunStatus(RunStatuses.Canceled);
      runFilterStore.resetSortBy();
      expect(runFilterStore.sortById).to.equal('canceled_at');
      runFilterStore.updateRunStatus(RunStatuses.Complete);
      runFilterStore.resetSortBy();
      expect(runFilterStore.sortById).to.equal('completed_date');
      runFilterStore.updateRunStatus(RunStatuses.InProgress);
      runFilterStore.resetSortBy();
      expect(runFilterStore.sortById).to.equal('started_date');
      runFilterStore.updateRunStatus(RunStatuses.Pending);
      runFilterStore.resetSortBy();
      expect(runFilterStore.sortById).to.equal('created_at');
      runFilterStore.updateRunStatus(RunStatuses.Rejected);
      runFilterStore.resetSortBy();
      expect(runFilterStore.sortById).to.equal('rejected_at');
    });
  });
});
