import _ from 'lodash';
import { configure, makeAutoObservable, reaction } from 'mobx';

import FeatureStore from 'main/stores/FeatureStore';
import UserPreference from 'main/util/UserPreferenceUtil';
import FeatureConstants from '@strateos/features';
import LabStore from 'main/stores/mobx/LabStore';
import { OptionsObject } from 'main/stores/mobx/types';
import { PAGE_SIZE_OPTION_1, PAGE_SIZE_OPTION_2, PAGE_SIZE_OPTION_3, PAGE_SIZE_OPTION_4,
  PAGE_SIZE_OPTIONS, getDefaultSearchPerPage } from 'main/util/List';

// Take a slight performance hit here, but helps support more browsers
configure({
  useProxies: 'never'
});

type SortDirection = ('asc'|'desc')

interface SearchObject {
  query: string;
  lab_id: Array<string>;
  organization_id: Array<string>;
  status: string;
  page: number;
  per_page: number;
  sort_by: string;
  direction: string;
  operator_id?: Array<string>;
  start_date?: Date;
  end_date?: Date;
  project_id?: string;
  submitter_id?: string;
  is_run_transfer?: boolean;
  internal_run?: boolean;
}

export default class RunsFilterStore {
  runStatus: RunStatuses = undefined;
  page: number = undefined;
  pageSize: number = undefined;
  sortById: string = undefined;
  sortDirection: SortDirection = undefined;
  search: string = undefined;
  labId: string = undefined;
  private manuallySelectedOperatorIds: Array<string> = undefined;
  private manuallySelectedSubmitterIds: string = undefined;
  selectedOrg: OptionsObject = undefined;
  startDate: Date = undefined;
  endDate: Date = undefined;
  projectId: string = undefined;
  viewType: ViewTypes = undefined;
  isRunTransfer: boolean = undefined;

  labStore: LabStore;

  // TODO: should be on a separate mobx store
  userId: string = undefined;
  runType: string = undefined;
  private readonly DEFAULTS = {
    pageSize: getDefaultSearchPerPage(),
    sortById: undefined,
    sortDirection: 'desc' as SortDirection,
    page: 1,
    search: '',
    labId: 'all',
    operatorIds: undefined,
    submitterIds: undefined,
    selectedOrg: undefined,
    startDate: null,
    endDate: null,
    projectId: undefined,
    isRunTransfer: false,
    runType: 'all',
  };

  constructor(labStore: LabStore) {
    makeAutoObservable(this);
    this.labStore = labStore;

    reaction(() => this.locallySavedFilters, this.saveFiltersLocally, {
      fireImmediately: false,
      delay: 250,
    });

    reaction(
      () => this.runStatus,
      () => this.resetSortBy(),
      { fireImmediately: false, delay: 250 }
    );

    this.loadFiltersFromLocal();
  }

  init = (userId: string) => {
    this.saveCopyOfUserId(userId);
    this.loadFiltersFromLocal();
  };

  resetFilters = () => {
    this.pageSize = this.DEFAULTS.pageSize;
    this.sortDirection = this.DEFAULTS.sortDirection;
    this.page = this.DEFAULTS.page;
    this.search = this.DEFAULTS.search;
    this.labId = this.DEFAULTS.labId;
    this.manuallySelectedOperatorIds = this.DEFAULTS.operatorIds;
    this.manuallySelectedSubmitterIds = this.DEFAULTS.submitterIds;
    this.projectId = this.DEFAULTS.projectId;
    this.selectedOrg = this.DEFAULTS.selectedOrg;
    this.startDate = this.DEFAULTS.startDate;
    this.endDate = this.DEFAULTS.endDate;
    this.isRunTransfer = this.DEFAULTS.isRunTransfer;
    this.runType = this.DEFAULTS.runType;
  };

  resetRunTransferModalFilters = () => {
    this.search = this.DEFAULTS.search;
    this.manuallySelectedSubmitterIds = this.DEFAULTS.submitterIds;
    this.runStatus = RunStatuses.AllWithRejectedAndCancelled;
  };

  // Updates on route change, either queue|approval
  updateRunStatus = (runStatus: RunStatuses) => {
    if (runStatus !== this.runStatus) {
      this.runStatus = runStatus;
      this.resetPage();
      this.resetSorts();
    }
  };

  updateViewType = (viewType: ViewTypes) => {
    this.viewType = viewType;
  };

  /**
   * Amino List component doesn't have 2 separate hooks for when the page changes
   * and when the page size changes, take care of this difference here for now
   *
   * Aim for more atomic updating in other methods and avoid these compound updates
   */
  updatePageSettings = (page: number, pageSize: number) => {
    if (page !== this.page) {
      this.page = page;
    }

    if (pageSize !== this.pageSize) {
      this.pageSize = pageSize;
    }
  };

  // These two often will be changed at same time, so compound setter makes sense here
  updateSort = (sortById: string, sortDirection: SortDirection) => {
    this.sortById = sortById;
    this.sortDirection = sortDirection;
    this.resetPage();
  };

  updateSearch = (search: string) => {
    this.search = search;
    this.resetPage();
    this.resetSortBy();
  };

  updateLabId = (labId: string) => {
    this.labId = labId;
    this.resetSelectedOperatorIds();
    this.resetSelectedOrg();
  };

  updateRuns = (runType: string) => {
    this.runType = runType;
    this.resetSelectedOperatorIds();
  };

  updateSelectedOrg = (selectedOrg?: OptionsObject) => {
    this.selectedOrg = selectedOrg;
  };

  updateProjectId = (projectId?: string) => {
    this.projectId = projectId;
  };

  updateSelectedOperators = (operators: Array<OptionsObject>) => {
    this.manuallySelectedOperatorIds = operators.map((o) => o.value);
  };

  updateSelectedSubmitters = (submitter: string) => {
    this.manuallySelectedSubmitterIds = submitter;
  };

  updateDates = (startDate: Date, endDate: Date) => {
    this.startDate = startDate;
    this.endDate = endDate;
    this.resetPage();
  };

  resetPage = () => {
    this.page = this.DEFAULTS.page;
  };

  // lab context changes could result in different operators, need to revert to default selection
  resetSelectedOperatorIds = () => {
    // There's a few different connections to external stores that might trigger this too often, only reset when changes
    this.manuallySelectedOperatorIds = this.DEFAULTS.operatorIds;
  };

  resetSelectedSubmitterIds = () => {
    this.manuallySelectedSubmitterIds = this.DEFAULTS.submitterIds;
  };

  resetSorts = () => {
    this.resetSortBy();
    this.resetSortDirection();
  };

  resetSelectedOrg = () => {
    this.selectedOrg = this.DEFAULTS.selectedOrg;
  };

  resetSortDirection = () => {
    this.sortDirection = this.DEFAULTS.sortDirection;
  };

  resetSearch = () => {
    this.updateSearch(this.DEFAULTS.search);
  };

  // making sortById always synced up with runStatus
  resetSortBy = () => {
    this.sortById = this.defaultSortBy.get(this.runStatus);
  };

  buildSearchObject = (includeOperators = false, isRunTransfer = false) => {
    const base: SearchObject = {
      query: this.search,
      lab_id: [this.labId],
      organization_id: [this.selectedOrgId || 'all'],
      status: this.formattedRunStatus,
      page: this.page,
      per_page: this.pageSize,
      sort_by: this.sortById,
      direction: this.sortDirection,
      project_id: this.projectId,
      submitter_id: this.selectedSubmitterIds,
      internal_run:
        this.runType == 'internal runs'
          ? true
          : this.runType == 'external runs'
            ? false
            : null,
    };
    if (this.startDate != null) {
      // TODO: this will need to be revisted once we deal with timezones
      base.start_date = formatDate(this.startDate, dayStartHours);
      base.end_date = formatDate(this.endDate || this.startDate, dayEndHours);
    }
    if (includeOperators) {
      base.operator_id = this.selectedOperatorIds;
    }

    if (isRunTransfer) {
      base.is_run_transfer = FeatureStore.hasFeature(
        FeatureConstants.CREATE_EDIT_PROJECT
      );
      base.sort_by = 'created_at';
    }
    return base;
  };

  get defaultSortBy() {
    return new Map([
      [RunStatuses.AllRuns, 'created_at'],
      [RunStatuses.Aborted, 'aborted_date'],
      [RunStatuses.Accepted, 'accepted_date'],
      [RunStatuses.Canceled, 'canceled_at'],
      [RunStatuses.Complete, 'completed_date'],
      [RunStatuses.InProgress, 'started_date'],
      [RunStatuses.Pending, 'created_at'],
      [RunStatuses.Rejected, 'rejected_at'],
    ]);
  }

  get queueSearchObject() {
    return this.buildSearchObject(true);
  }

  get approvalsSearchObject() {
    return this.buildSearchObject(false);
  }

  get runTransferModalSearchObject() {
    return this.buildSearchObject(false, true);
  }

  get formattedRunStatus() {
    if (this.runStatus === RunStatuses.AllRuns) {
      return `${RunStatuses.Aborted},${RunStatuses.Accepted},${RunStatuses.Complete},${RunStatuses.InProgress}`;
    } else if (
      this.runStatus === RunStatuses.AllWithRejectedAndCancelled ||
      _.isUndefined(this.runStatus)
    ) {
      return 'all';
    }
    return this.runStatus;
  }

  get resetDisabled() {
    return (
      this.search === this.DEFAULTS.search &&
      this.labId === this.DEFAULTS.labId &&
      this.manuallySelectedOperatorIds === this.DEFAULTS.operatorIds &&
      this.selectedOrg === this.DEFAULTS.selectedOrg &&
      this.startDate === this.DEFAULTS.startDate &&
      this.endDate === this.DEFAULTS.endDate &&
      this.runType === this.DEFAULTS.runType
    );
  }

  // Dependency of external legacy store here, hopefully is ok.
  get currentUserIsLabManager(): boolean {
    if (_.isEmpty(this.labStore.labsArray)) { return undefined; }
    if (this.labStore.labsArray.length && this.labId === 'all') {
      return this.managingLabs.length > 0;
    } else {
      return FeatureStore.canManageRunState(this.labId);
    }
  }

  get managingLabs(): Array<OptionsObject> {
    return this.labStore.labsArray.filter((lab) =>
      FeatureStore.canManageRunState(lab.value)
    );
  }

  // We filter operators to show either by selected labId, or by all of those labs which user is manager of
  get operatorLabs(): Array<string> {
    return this.labId === 'all'
      ? this.managingLabs.map((lab) => lab.value)
      : [this.labId];
  }

  // Expected to have different default selected ids depending on user's role
  get defaultOperatorIds() {
    return this.currentUserIsLabManager
      ? [SYSTEM_OPERATOR_IDS.UNASSIGNED, SYSTEM_OPERATOR_IDS.ALL_OPERATOR_IDS]
      : [
        SYSTEM_OPERATOR_IDS.UNASSIGNED,
        this.userId || SYSTEM_OPERATOR_IDS.ALL_OPERATOR_IDS,
      ];
  }

  get currentLabId() {
    const [defaultLabId] = this.managingLabs;
    return this.labId === 'all'
      ? (defaultLabId || {}).value
      : this.labId;
  }

  get defaultSubmitterIds() {
    return SYSTEM_SUBMITTER_IDS.ALL_SUBMITTER_IDS;
  }

  get selectedOperatorIds() {
    return this.manuallySelectedOperatorIds != undefined
      ? this.manuallySelectedOperatorIds
      : this.defaultOperatorIds;
  }

  get selectedSubmitterIds() {
    return this.manuallySelectedSubmitterIds != undefined
      ? this.manuallySelectedSubmitterIds
      : this.defaultSubmitterIds;
  }

  // Currently really only used for reset purposes on the non-controlled LabConsumersFilter component
  // feel free to refactor in conjunction with LabConsumersFilter and all parents
  get selectedOrgName() {
    return (this.selectedOrg || {}).name;
  }

  get selectedOrgId() {
    return (this.selectedOrg || {}).value;
  }

  saveCopyOfUserId = (userId: string) => {
    if (userId !== this.userId) {
      this.userId = userId;
      this.resetSelectedOperatorIds();
    }
  };

  get isValidLabId() {
    return ALL_LABS !== this.labId;
  }

  // Locally saved settings
  get locallySavedFilters() {
    return {
      search: this.search,
      labId: this.labId,
      selectedOrg: this.selectedOrg,
      page: this.page,
      pageSize: this.pageSize,
      manuallySelectedOperatorIds: this.manuallySelectedOperatorIds,
      manuallySelectedSubmitterIds: this.manuallySelectedSubmitterIds,
      runType: this.runType,
    };
  }

  saveFiltersLocally = () => {
    UserPreference.save({ [localKey]: this.locallySavedFilters });
  };

  loadFiltersFromLocal = () => {
    // Ensure all filters get at least default before loading local
    const filters = UserPreference.get(localKey);

    // This is temporary code to convert old saved values for page size in local filter
    // PP-12909 has been created to remove this code, once we feel that the values for all or majority of the users have been converted
    const getPageSize = (pageSize: number) : number => {
      if (PAGE_SIZE_OPTIONS.includes(pageSize)) {
        return pageSize;
      } else if (pageSize === 24) {
        return PAGE_SIZE_OPTION_2;
      } else if (pageSize === 48) {
        return PAGE_SIZE_OPTION_3;
      } else if (pageSize === 96) {
        return PAGE_SIZE_OPTION_4;
      }
      return PAGE_SIZE_OPTION_1;
    };

    this.resetFilters();
    if (filters) {
      this.search = filters.search;
      this.labId = filters.labId;
      this.selectedOrg = filters.selectedOrg;
      this.page = filters.page;
      this.pageSize = getPageSize(filters?.pageSize);
      this.manuallySelectedOperatorIds = filters.manuallySelectedOperatorIds;
      this.manuallySelectedSubmitterIds = filters.manuallySelectedSubmitterIds;
      this.runType = filters.runType;
    }
  };
}

type TimeSegments = [number, number, number, number];
const dayStartHours: TimeSegments = [0, 0, 0, 0];
const dayEndHours: TimeSegments = [23, 59, 59, 999];
const formatDate = (date: Date, hours: TimeSegments): Date => {
  if (date) {
    const newDate = new Date(date.toString());
    newDate.setHours(...hours);
    return newDate;
  }

  return null;
};

const localKey = 'runFilters';

export enum RunStatuses {
  AllRuns = 'all_runs',
  Aborted = 'aborted',
  Accepted = 'accepted',
  Canceled = 'canceled',
  Complete = 'complete',
  InProgress = 'in_progress',
  Pending = 'pending',
  Rejected = 'rejected',
  AllWithRejectedAndCancelled = 'all_with_rejected_and_cancelled'
}

enum ViewTypes {
  Queue,
  Approvals,
  Calendar,
}

export const SYSTEM_OPERATOR_IDS = {
  UNASSIGNED: 'unassigned',
  ALL_OPERATOR_IDS: 'all',
};

const SYSTEM_SUBMITTER_IDS = {
  ALL_SUBMITTER_IDS: 'all'
};

const ALL_LABS = 'all';
