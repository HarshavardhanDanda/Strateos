import sinon from 'sinon';
import { expect } from 'chai';

import VendorCatalogActions from 'main/actions/VendorCatalogActions';
import { VendorCatalogPageActions } from './VendorCatalogActions';

describe('VendorCatalogPageActions', () => {
  let search;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    search = sandbox.stub(VendorCatalogActions, 'search').returns({
      done: () => { },
      always: () => { },
      fail: () => { }
    });

    sandbox.stub(VendorCatalogPageActions, 'search_queue').callsFake(fn => fn());
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should filter by smiles', () => {
    VendorCatalogPageActions.doSearch({
      searchSmiles: 'CC'
    }, () => {}, () => {});

    expect(search.args[0][0]).to.deep.equal({
      filter: {
        smiles: 'CC'
      }
    });
  });

  it('should filter by similarity', () => {
    VendorCatalogPageActions.doSearch({
      searchSimilarity: 'all'
    }, () => {}, () => {});

    expect(search.args[0][0]).to.deep.equal({
      filter: {
        similarity: 'all'
      }
    });
  });

});
