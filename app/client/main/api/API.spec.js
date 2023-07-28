import { expect } from 'chai';
import sinon from 'sinon';

import ajax from 'main/util/ajax';
import { getDefaultSearchPerPage } from 'main/util/List';
import API from './API';

describe('API', () => {
  const api = new API('resource');
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  let options = {
    filters: {}
  };

  it('should create url with 1-D filters', () => {
    options = {
      filters: {
        entity: 'foo'
      }
    };
    expect(api.createUrl('', options)).to.deep.equal('/api/resource?filter[entity]=foo');
  });

  it('should create url with 2-D filters', () => {
    options = {
      filters: {
        entity: {
          low: 'foo',
          high: 'bar'
        }
      }
    };
    expect(api.createUrl('', options)).to.deep
      .equal('/api/resource?filter[entity][low]=foo&filter[entity][high]=bar');
  });

  it('should set version if exist', () => {
    options = {
      version: 'v2'
    };
    expect(api.createUrl('/id', options)).to.equal('/api/v2/resource/id');
    expect(api.createUrl('/id', {})).to.equal('/api/resource/id');
  });

  it('should set proper page params', () => {
    options = {
      page: 2,
      offset: 23,
      limit: 15
    };
    expect(api.createUrl('', options)).to.deep.equal('/api/resource?page[number]=2&page[limit]=15&page[offset]=23');
  });

  it('should auto-fill offset if page is passed but not offset', () => {
    options = {
      page: 2,
      limit: getDefaultSearchPerPage()
    };
    expect(api.createUrl('', options)).to.deep.equal('/api/resource?page[number]=2&page[limit]=10&page[offset]=10');
  });

  it('should make Put api call by default when update is called without a type', () => {
    const putRequest = sandbox.stub(ajax, 'put').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      },
    });
    api.update('', {});
    expect(putRequest.calledOnce);
  });

  it('should make Patch api call when update is called with type patch', () => {
    const patchRequest = sandbox.stub(ajax, 'patch').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      },
    });
    api.update('', {}, {}, {}, 'PATCH');
    expect(patchRequest.calledOnce);
  });
});
