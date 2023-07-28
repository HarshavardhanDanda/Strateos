import { makeAutoObservable, observable, runInAction, ObservableMap } from 'mobx';
import HTTPUtil from 'main/util/HTTPUtil';
import LabConsumerAPI from 'main/api/LabConsumerAPI';
import WorkcellAPI from 'main/api/WorkcellAPI';
import { OptionsObject } from 'main/stores/mobx/types';
import WorkUnitActions from 'main/actions/WorkUnitActions';
import WorkcellActions from 'main/actions/WorkcellActions';
import SessionStore    from 'main/stores/SessionStore';
import LabConsumerStore from 'main/stores/LabConsumerStore';

import _ from 'lodash';

export interface LabObject {
  name: string;
  id: string;
  address?: object;
  operated_by_id: string;
  operated_by_name: string;
}

export interface ConsumerObject {
  id: string;
  lab_id: string;
  organization_id: string;
  organization_name: string;
  organization_group: string;
}

export interface WorkcellObject {
  id: string;
  name: string;
  node_id: string;
  test_workcell: string;
  workcell_id: string;
  workcell_type: string;
  is_test: boolean;
  region: string;
  uri_base: string;
}

interface WorkUnit {
  id: string;
  name: string;
  color: string;
}

export enum WorkcellType {
  Meta = 'metamcx',
  Mcx = 'mcx',
}

class LabStore {
  labs: ObservableMap<string, LabObject> = observable.map({});
  labConsumers: ObservableMap<string, ConsumerObject> = observable.map({});
  workcellsByLabId: ObservableMap<string, Array<WorkcellObject>> = observable.map({}); // May contain duplicates, need to clean up rails workcell model relations
  workunitsByLabId: ObservableMap<string, Array<WorkUnit>> = observable.map({});

  constructor() {
    makeAutoObservable(this);
  }

  // TODO: Why do we only grab a lab at a time? Backend should already be performing object access restrictions
  fetchLabs = async (ids: Array<string>, options = {}) => {
    const promises = ids.map(id => this.fetchLab(id, options));
    const results = await Promise.all(promises);
    const validLabs = results.filter(isValidTuple);
    runInAction(() => {
      this.labs.merge(validLabs);
    });
  };

  private fetchLab = async (id: string, options): Promise<[string, LabObject]> => {
    const result = await HTTPUtil.get(`/api/labs/${id}`, { options });
    const { data } = result;
    const [labId, lab] = flattenJsonApi(data);
    return [labId, lab];
  };

  fetchRelatedObjects = async (labIds: Array<string>, canLoadWorkcellsAndWorkUnits = false) => {
    const requests = [this.fetchLabConsumers(labIds)];

    if (canLoadWorkcellsAndWorkUnits === true) {
      requests.push(this.fetchWorkUnits(labIds));
      requests.push(this.fetchWorkcells(labIds));
    }

    return Promise.all(requests);
  };

  fetchLabConsumers = async (labIds: Array<string>) => {
    this.labConsumers.clear();
    // TODO: this doesn't seem correct to just join with no delimiter, ask Vyas why this was done so
    const filters = { lab_id: labIds.join() };
    const { data } = await LabConsumerAPI.index({
      filters,
      includes: ['organization', 'lab'],
      fields: { organizations: ['id', 'name', 'subdomain'] }
    });
    if (data && data.length) {
      runInAction(() => {
        this.labConsumers.merge(data.map((consumer) => {
          const consumerFromStore = LabConsumerStore.getById(consumer.id);
          return [consumer.id, parseLabConsumer(consumerFromStore)];
        }));
      });
    }
  };

  // TODO: Current rails workcell objects aren't automatically associated with specific lab ids, need to query on each lab individuall and manually map
  fetchWorkcells = async (labIds: Array<string>) => {
    if (labIds.length) {
      const results = await Promise.all(labIds.map(this.fetchLabWorkcells));
      const nonEmptyWorkcells = results.filter(isValidTuple);
      runInAction(() => {
        this.workcellsByLabId.merge(nonEmptyWorkcells);
      });
    }
  };

  fetchWorkcellsFromAMS = async () => {
    const isAMSWorkcellsFetchable = SessionStore.hasFeature('AMS_enabled');
    if (isAMSWorkcellsFetchable) {
      const workcellsFromAMS = {};
      const workcells = await WorkcellActions.fetchWorkcellsFromAMS();
      workcells && workcells.content && workcells.content.forEach((workcell) => {
        const labId = workcell.labId;
        if (_.has(workcellsFromAMS, labId)) {
          workcellsFromAMS[labId].push(workcell);
        } else {
          workcellsFromAMS[labId] = [workcell];
        }
      });
      return workcellsFromAMS;
    }
  };

  fetchWorkUnits = async (labIds: Array<string>) => {
    if (labIds.length) {
      const result = await WorkUnitActions.loadWorkUnitsByLabId(labIds.join());
      const workunits = result[0].data
        .map(workunit => flattenJsonApi(workunit))
        .filter(isValidTuple)
        .map(([_, workunit]) => workunit);

      const workunitByLabIds = {};
      workunits.forEach((workunit) => {
        const labId = workunit.lab_id;
        if (workunitByLabIds[labId]) {
          workunitByLabIds[labId].push(workunit);
        } else {
          workunitByLabIds[labId] = [workunit];
        }
      });
      const workcellsFromAMS = await this.fetchWorkcellsFromAMS();
      Object.keys(workunitByLabIds).forEach(key => {
        if (_.has(workcellsFromAMS, key)) {
          workunitByLabIds[key].push(...workcellsFromAMS[key]);
        }
      });
      runInAction(() => {
        this.workunitsByLabId.merge(Object.entries(workunitByLabIds));
      });
    }
  };

  private fetchLabWorkcells = async (lab_id: string): Promise<[string, Array<WorkcellObject>]> => {
    const filters = { lab_id };
    const { data } = await WorkcellAPI.index({ filters });
    const workcells = data
      .map(workcell => flattenJsonApi(workcell))
      .filter(isValidTuple)
      .map(([_, workcell]) => workcell);

    if (workcells.length) {
      return [lab_id, workcells];
    } else {
      return [null, null];
    }
  };

  get labsArray(): Array<OptionsObject> {
    if (_.isEmpty(this.labs)) {
      return [];
    }
    return this.labs
      .toJSON()
      .map(([_, lab]) => ({
        name: lab.name,
        value: lab.id,
      }));
  }

  get labIds(): Array<string> {
    return this.labs
      .toJSON()
      .map(([id, _]) => id);
  }

  get sortedLabOptions(): Array<OptionsObject> {
    return (this.labsArray || [])
      .sort((labA, labB) => ((labA.name > labB.name) ? 1 : -1));
  }

  get labOptions(): Array<OptionsObject> {
    return [
      { value: 'all', name: 'All labs' },
      ...this.sortedLabOptions,
    ];
  }

  hasAccessToOtherOrgs = (orgId: string) => {
    if (this.labConsumers.size === 0) { return undefined; }
    return this.labConsumers.toJSON().some(([_, consumer]) => consumer.organization_id !== orgId);
  };
}

const flattenJsonApi = (resource, objectParser = obj => obj) => {
  if (resource) {
    return [resource.id, objectParser({ id: resource.id, ...resource.attributes })];
  }

  return [null, null];
};

const parseLabConsumer = (consumer): ConsumerObject => {
  return ({
    id: consumer.get('id'),
    lab_id: consumer.getIn(['lab', 'id']),
    organization_id: consumer.getIn(['organization', 'id']),
    organization_name: consumer.getIn(['organization', 'name']),
    organization_group: consumer.getIn(['organization', 'group']),
  });
};

const isValidTuple = ([id, _]) => !!id;

export default LabStore;
