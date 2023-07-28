import { expect } from 'chai';
import Immutable from 'immutable';

import * as InventoryState from './InventoryState';

describe('InventoryState', () => {
  it('should have correct values for inventory state defaults', () => {
    const inventoryStateDefaults = {
      createdContainers: Immutable.Map(),
      currentPane: 'SEARCH',
      currentContainer: undefined,
      isSearching: false,
      selected: [],
      defaultFilters: {
        containerTypes: []
      }
    };
    expect(InventoryState.InventoryStateDefaults).to.deep.equal(inventoryStateDefaults);
  });
});
