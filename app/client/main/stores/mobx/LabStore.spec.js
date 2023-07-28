import { expect } from 'chai';
import LabStore from 'main/stores/mobx/LabStore';
import sinon from 'sinon';
import HTTPUtil from 'main/util/HTTPUtil';
import WorkUnitActions from 'main/actions/WorkUnitActions';
import WorkcellAPI from 'main/api/WorkcellAPI';

const makeLab = (id, name) => ({
  data: {
    id,
    attributes: {
      name,
      operated_by_id: '123',
      operated_by_name: 'user123',
    }
  }
});

describe('LabStore (mobx)', () => {
  let store;
  let labIds;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    store = new LabStore();
    labIds = [1, 2, 4];
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('labOptions', () => {
    it('should sort labs by name', async () => {
      const getStub = sandbox.stub(HTTPUtil, 'get');
      const labNumbers = [1, 4, 5, 3, 2].map(n => `${n}`);
      labNumbers.forEach((n, i) => getStub.onCall(i).resolves(makeLab(`lab${n}`, `lab ${n}`)));
      await store.fetchLabs(labNumbers);
      expect(store.labOptions.map(l => l.name)).to.have.ordered.members([
        'All labs',
        'lab 1',
        'lab 2',
        'lab 3',
        'lab 4',
        'lab 5',
      ]);
    });

    it('should load workcells and work_units if user can load them', () => {
      const canLoadWorkcellsAndWorkUnits = true;
      const stubWorkcellApiCall = sandbox.spy(WorkcellAPI, 'index');
      const stubWorkUnitActions  = sandbox.spy(WorkUnitActions, 'loadWorkUnitsByLabId');
      store.fetchRelatedObjects(labIds, canLoadWorkcellsAndWorkUnits);
      expect(stubWorkUnitActions.calledOnce).to.be.true;
      expect(stubWorkcellApiCall.calledThrice).to.be.true;
    });

    it('should not load workcells and work_units if user cannot load them', () => {
      const canLoadWorkcellsAndWorkUnits = false;
      const stubWorkcellApiCall = sandbox.spy(WorkcellAPI, 'index');
      const stubWorkUnitActions  = sandbox.spy(WorkUnitActions, 'loadWorkUnitsByLabId');
      store.fetchRelatedObjects(labIds, canLoadWorkcellsAndWorkUnits);
      expect(stubWorkUnitActions.notCalled).to.be.true;
      expect(stubWorkcellApiCall.notCalled).to.be.true;
    });
  });
});
