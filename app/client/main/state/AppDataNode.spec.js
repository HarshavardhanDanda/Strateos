import Immutable from 'immutable';
import { expect } from 'chai';

import { getState, updateState, rootKey, reset as resetAppState } from 'main/state';
import AppDataNode from 'main/state/AppDataNode';

describe('AppDataNode', () => {
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

  it('stores data', () => {
    const rootNode = new AppDataNode([rootKey]);
    rootNode.set('Foo');
    expect(getState().toJS()).to.deep.equal({ [rootKey]: 'Foo' });
  });

  it('returns data', () => {
    const initialState = Immutable.Map({ [rootKey]: 'Foo' });
    updateState(initialState);
    const rootNode = new AppDataNode([rootKey]);
    expect(rootNode.get()).to.deep.equal('Foo');
  });

  it('removes data', () => {
    const initialValues = Immutable.Map({ a: 'aval', b: 'bval' });
    const rootNode = new AppDataNode([rootKey]);
    rootNode.set(initialValues);
    rootNode.removeIn('a');
    expect(getState().toJS()).to.deep.equal({ root: { b: 'bval' } });
  });

  it('removes data that is not part of the state', () => {
    expect(rootKey).to.be.eq('root');

    const immState = Immutable.Map({ root: {} });
    expect(() => {
      immState.removeIn(['root', 'bim']);
    }).to.throw('invalid keyPath');

    const initialValues = { foo: 'bar' };
    const rootNode = new AppDataNode([rootKey]);
    rootNode.set(initialValues);

    const state = getState();
    expect(state.toJS()).to.deep.equal({
      root: { foo: 'bar' }
    });
    expect(Immutable.Map.isMap(state), 'state should be a map').to.be.true;
    expect(() => {
      rootNode.removeIn('unknow');
    }).to.not.throw('invalid keyPath');
  });

  it('can update subpath data', () => {
    const initialValues = Immutable.Map({ a: 'aval', b: 'bval' });
    const rootNode = new AppDataNode([rootKey]);
    rootNode.set(initialValues);
    rootNode.setIn('a', 'updatedA');
    const expected = { root: { a: 'updatedA', b: 'bval' } };
    expect(getState().toJS()).to.deep.equal(expected);
  });

  it('is recursive', () => {
    const rootNode = new AppDataNode([rootKey]);
    const childA   = rootNode.sub('childA');
    const childB   = rootNode.sub('childB');

    childA.set('Foo');
    childB.set({ foo: 'bar' });

    const expected = { [rootKey]: { childA: 'Foo', childB: { foo: 'bar' } } };
    expect(getState().toJS()).to.deep.equal(expected);
  });
});
