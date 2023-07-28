import { expect } from 'chai';

import { getState, updateState, reset as resetAppState } from 'main/state';
import CRUDStore from 'main/util/CRUDStore';

const makeStore = () => CRUDStore('test');

const makeObjects = () => {
  return [
    { id: '1', name: 'Bob' },
    { id: '2', name: 'Sarah' }
  ];
};

describe('CRUDStore', () => {
  // Leave the global app state untouched after our tests
  // and reset to the original before each test.
  let originalState;
  before(() => {
    originalState = getState();
  });
  after(() => {
    updateState(originalState);
  });
  beforeEach(() => {
    resetAppState();
  });

  it('initializes with an empty collection', () => {
    const store = makeStore();
    expect(store.getAll().count()).to.equal(0);
  });

  it('receives data', () => {
    const store   = makeStore();
    const objects = makeObjects();
    const count   = objects.length;

    store._receiveData(objects);
    const all = store.getAll();

    expect(all.count()).to.equal(count);
    expect(all.toJS()).to.deep.equal(makeObjects());
  });

  it('can remove objects', () => {
    const store   = makeStore();
    const objects = makeObjects();
    const count   = objects.length;

    store._receiveData(objects);
    expect(store.getAll().count()).to.equal(count);

    // remove the first one
    store._remove(objects[0].id);
    const all = store.getAll();

    expect(all.count()).to.equal(count - 1);

    // remove the first one
    objects.shift();
    expect(all.toJS()).to.deep.equal(objects);
  });

  it('stringifys keys', () => {
    const store  = makeStore();
    const id     = 1;
    const object = { id, name: 'Foo' };

    store._receiveData([object]);

    // The store should hash by the stringified id so this will be undefined
    expect(store.getById(id)).to.equal(undefined);

    const stored = store.getById(id.toString());
    expect(stored.toJS()).to.deep.equal({ id: '1', name: 'Foo' });
  });

  it('merges objects by default', () => {
    const store = makeStore();
    const id    = '1';

    store._receiveData([{ id, firstName: 'Bob' }]);
    store._receiveData([{ id, lastName: 'Smith' }]);

    expect(store.getById(id).toJS()).to.deep.equal(
      { id, firstName: 'Bob', lastName: 'Smith' }
    );
  });

  it('can replace objects entirely', () => {
    const store = makeStore();
    const id    = '1';

    store._receiveData([{ id, firstName: 'Bob' }]);
    store._receiveData([{ id, lastName: 'Smith' }], true);

    expect(store.getById(id).toJS()).to.deep.equal(
      { id, lastName: 'Smith' }
    );
  });

});
