import { EventEmitter } from 'events';
import Immutable        from 'immutable';

import AnimationQueue from 'main/state/AnimationQueue';

// This is the application's global state. All state is stored under the "root" key, so
// that the system continues to work if the user runs `rootNode.set(3)`.
const rootKey = 'root';

const initialState = function() {
  const state = {};
  state[rootKey] = {};

  return Immutable.fromJS(state);
};

let state = initialState();

const eventEmitter = new EventEmitter();

const queue = new AnimationQueue((() => {
  eventEmitter.emit('change');
}));

const updateState = function(newState) {
  state = newState;
  queue.schedule();
};

const reset = () => updateState(initialState());

const getState = function() {
  return state;
};

export {
  getState,
  updateState,
  reset,
  eventEmitter,
  rootKey
};
