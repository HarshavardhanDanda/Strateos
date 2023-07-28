import { expect } from 'chai';
import Immutable from 'immutable';

import { CompoundSearchStore } from 'main/stores/search';

describe('SearchStore', () => {

  it('getResultsFromSearch should return empty list when there are no results', () => {
    const search = Immutable.Map();
    const result = CompoundSearchStore.getResultsFromSearch(search);
    expect(result.size).to.equal(0);
  });
});
