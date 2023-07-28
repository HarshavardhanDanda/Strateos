import {
  makeAutoObservable,
  reaction,
  toJS,
  runInAction
} from 'mobx';
import RunScheduleActions from 'main/actions/RunScheduleActions';
import { getColorMap } from 'main/util/ColorMap.js';
import Immutable from 'immutable';
import RunFilterStore from 'main/stores/mobx/RunFilterStore';
import UserStore from 'main/stores/UserStore';
import { Styles } from '@transcriptic/amino';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';
import _ from 'lodash';
import LabStore from './LabStore';

interface Status {
    id: string;
    name: string;
    color: string;
    enabled: boolean;
}

interface SearchObject {
  lab_id: string;
  organization_id?: string;
  operator_ids?: Array<string>;
  start_date?: Date;
  end_date?: Date;
  loading?: boolean;
  run_date?: boolean;
  org_name?: string;
}
interface RunSchedule {
  created_by: string;
  end_date_time: string;
  id: string;
  run_id: string;
  run_operator_id: string | null;
  run_priority: string;
  run_status: string;
  run_title: string;
  start_date_time: string;
  type: string;
  updated_by: string;
  work_unit_id: string;
}

export default class CalendarViewStore {
  statuses: Array<Status> = DEFAULT_STATUSES;
  isLoaded = false;
  runDate: Date = new Date();
  runSchedules: Array<RunSchedule> = undefined;
  disabledWorkUnits: Array<string> = [];
  disabledStatuses: Array<string> = [COMPLETED_ID];

  labStore: LabStore;
  runFilterStore: RunFilterStore;

  constructor(labStore: LabStore, runFilterStore: RunFilterStore) {
    makeAutoObservable(this);
    this.labStore  = labStore;
    this.runFilterStore = runFilterStore;

    reaction(() => this.searchOptions, this.onSearchOptionChange, {
      fireImmediately: false,
      delay: 250,
    });
  }

  fetchRunSchedules = async (options) => {
    const operatorIds = options.operator_ids;
    const organizationId = options.organization_id;
    if (organizationId === ALL_ORGANIZATIONS) {
      options.organization_id = null;
    }
    if (operatorIds && operatorIds.length > 0) {
      options.operator_ids = operatorIds.join();
    }
    const results = await RunScheduleActions.loadRunSchedules(options);
    const schedules = [];
    results.forEach((element) => {
      const runSchedules = JsonAPIIngestor.getGroupedEntities(element).run_schedules;
      if (runSchedules) {
        schedules.push(...runSchedules);
      }
    });
    return schedules;
  };

  onSearchOptionChange = async (value) => {
    const options:SearchObject = {
      lab_id: this.runFilterStore.currentLabId,
      operator_ids: value.manuallySelectedOperatorIds
    };
    if (value.selectedOrg && value.selectedOrg.value) {
      options.organization_id = value.selectedOrg.value;
    }
    const runSchedules = await this.fetchRunSchedules(options);
    runInAction(() => {
      this.isLoaded = true;
      this.runSchedules = runSchedules;
    });
  };

  get searchOptions() {
    return {
      run_date: this.runDate,
      selectedOrg: this.runFilterStore.selectedOrg,
      manuallySelectedOperatorIds: this.runFilterStore.selectedOperatorIds,
      labId: this.runFilterStore.currentLabId
    };
  }

  get workUnitList() {
    return toJS(this.labStore.workunitsByLabId.get(this.runFilterStore.currentLabId) || []);
  }

  get statusList() {
    return toJS(this.statuses || []);
  }

  get runScheduleList() {
    return toJS(this.runSchedules);
  }

  get getRunDate() {
    return this.runDate;
  }

  updateRunDate = (runDate: Date) => {
    this.runDate = runDate;
  };

  updateStatuses = (statuses) => {
    this.statuses = statuses;
  };

  resetStatuses = () => {
    this.statuses = DEFAULT_STATUSES;
  };

  updateSelectedWorkUnits = (workunitId) => {
    if (this.disabledWorkUnits.includes(workunitId)) {
      const index = this.disabledWorkUnits.indexOf(workunitId);
      this.disabledWorkUnits.splice(index, 1);
    } else {
      this.disabledWorkUnits.push(workunitId);
    }
  };

  updateSelectedStatuses = (statusId) => {
    if (this.disabledStatuses.includes(statusId)) {
      const index = this.disabledStatuses.indexOf(statusId);
      this.disabledStatuses.splice(index, 1);
    } else {
      this.disabledStatuses.push(statusId);
    }
  };

  get coloredWorkUnits() {
    const colorMap = getColorMap(Immutable.fromJS(this.workUnitList.map((wu) => wu.id)));
    const workUnits = this.workUnitList.map((workunit) => ({ ...workunit, color: colorMap.get(workunit.id) }));
    return workUnits;
  }

  get sortedColoredWorkUnits() {
    return _.sortBy(this.coloredWorkUnits, workunit => workunit.name);
  }

  get selectedStatuses() {
    return this.statusList.map(status => ({ ...status, enabled: !this.disabledStatuses.includes(status.id) }));
  }

  get selectedWorkUnits() {
    return this.coloredWorkUnits.map(workUnit => ({ ...workUnit, enabled: !this.disabledWorkUnits.includes(workUnit.id) }));
  }

  get eventList() {
    const events = [];
    if (this.runSchedules && this.runSchedules.length > 0) {
      this.runSchedules.forEach((runSchedule) => {
        if (this.getProperty(this.selectedWorkUnits, runSchedule.work_unit_id, PROPERTY_ENABLED) &&
          this.getProperty(this.selectedStatuses, runSchedule.run_status, PROPERTY_ENABLED)
        ) {
          events.push({
            id: runSchedule.id,
            title: runSchedule.run_title || runSchedule.run_id,
            start: new Date(runSchedule.start_date_time),
            end: new Date(runSchedule.end_date_time),
            priority: runSchedule.run_priority,
            color: this.getProperty(this.coloredWorkUnits, runSchedule.work_unit_id, PROPERTY_COLOR),
            topColor: this.getProperty(this.statuses, runSchedule.run_status, PROPERTY_COLOR),
            entity_id: runSchedule.run_id,
            entity_status: runSchedule.run_status,
            entity_operator_name: this.getOperatorProperty(runSchedule.run_operator_id, PROPERTY_NAME),
            entity_operator_profile_img: this.getOperatorProperty(runSchedule.run_operator_id, PROPERTY_PROFILE),
            runSchedule,
          });
        }
      });
    }
    return events;
  }

  private getProperty = (properties, propertyId, propertyType) => {
    if (!properties) return null;
    const currentData = properties.filter((data) => data.id === propertyId);
    if (currentData && currentData.length > 0) {
      return currentData[0][propertyType];
    }
    return null;
  };

  private getOperatorProperty = (operatorId, propertyType) => {
    if (operatorId === null) {
      return null;
    }
    const operator = UserStore.getById(operatorId);
    return operator ? operator.get(propertyType) : null;
  };
}

const ALL_ORGANIZATIONS = 'all';
const ACCEPTED_ID = 'accepted';
const IN_PROGRESS_ID = 'in_progress';
const COMPLETED_ID = 'complete';
const ACCEPTED_NAME = 'Waiting';
const IN_PROGRESS_NAME = 'Executing';
const COMPLETED_NAME = 'Completed';

const PROPERTY_NAME = 'name';
const PROPERTY_COLOR = 'color';
const PROPERTY_PROFILE = 'profile_img_url';
const PROPERTY_ENABLED  = 'enabled';

const DEFAULT_STATUSES =  [
  {
    id: ACCEPTED_ID,
    name: ACCEPTED_NAME,
    color: Styles.Colors.blue70,
    enabled: true,
  },
  {
    id: IN_PROGRESS_ID,
    name: IN_PROGRESS_NAME,
    color: Styles.Colors.orange90,
    enabled: true,
  },
  {
    id: COMPLETED_ID,
    name: COMPLETED_NAME,
    color: Styles.Colors.strGreenMedium,
    enabled: false,
  },
];
