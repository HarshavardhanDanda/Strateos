import sinon from 'sinon';

import ajax from 'main/util/ajax';
import ContainerTypeActions from './ContainerTypeActions';

describe('Container Type Actions', () => {
  const apiPath = '/api/container_types?page[offset]=0';
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully load all', () => {
    const get = sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb(
          { data: [{
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
          }],
          meta: {
            record_count: 1
          } });

        return { fail: () => ({}) };
      }
    });

    ContainerTypeActions.loadAll();
    sinon.assert.calledWith(get, apiPath);
  });
});
