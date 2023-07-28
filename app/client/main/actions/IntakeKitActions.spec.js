import sinon from 'sinon';
import ajax from 'main/util/ajax';
import IntakeKitActions from './IntakeKitActions';

describe('Intake Kit Actions', () => {
  const apiPath = '/api/intake_kits';
  const sandbox = sinon.createSandbox();
  const intakeKits = [
    {
      id: 'kit1'
    },
    {
      id: 'kit2'
    }
  ];

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully load kit', () => {
    const get = sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb(intakeKits[0]);
        return { fail: () => ({}) };
      }
    });
    IntakeKitActions.load('kit1');
    sinon.assert.calledWith(get, `${apiPath}/kit1`);
  });

  it('should successfully load all kits', () => {
    const get = sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb(intakeKits);
        return { fail: () => ({}) };
      }
    });
    IntakeKitActions.loadAll();
    sinon.assert.called(get);
  });
});
