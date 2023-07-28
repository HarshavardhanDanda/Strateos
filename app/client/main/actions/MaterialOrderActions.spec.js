import sinon from 'sinon';
import { expect } from 'chai';

import HTTPUtil from 'main/util/HTTPUtil';
import Urls from 'main/util/urls';
import Dispatcher from 'main/dispatcher';
import { getDefaultSearchPerPage } from 'main/util/List';
import MaterialOrderActions from './MaterialOrderActions';

describe('MaterialOrderActions', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should search material orders', () => {
    const data = {
      sort: '-created_at',
      q: '*',
      page: 1,
      per_page: getDefaultSearchPerPage(),
      filter: {
        lab: 'all'
      }
    };
    const dispatchResponse = {
      type: 'MATERIAL_ORDER_LIST',
      results: [],
      num_pages: 5,
      per_page: getDefaultSearchPerPage(),
      page: 1,
      query: '*'
    };
    const dispatch = sandbox.stub(Dispatcher, 'dispatch');
    const getStub = sandbox.stub(HTTPUtil, 'get')
      .returns({
        done: () => {
          Dispatcher.dispatch(dispatchResponse);
          return { fail: () => ({}) };
        }
      });

    MaterialOrderActions.search(data);
    expect(getStub.calledWithExactly(`${Urls.orders()}/search`, { data, options: undefined })).to.be.true;
    expect(dispatch.calledWithExactly(dispatchResponse)).to.be.true;
  });
});
