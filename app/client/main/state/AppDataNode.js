import Immutable from 'immutable';
import { getState, updateState } from 'main/state';

/*
param path         The unique path managed by this node within the global data store
param defaultValue The default value of this node
*/
class AppDataNode {
  constructor(path, defaultValue) {
    this.path         = path;
    this.defaultValue = defaultValue;
  }

  has(key) {
    return getState().hasIn(this.path.concat([key]));
  }

  size() {
    return this.get().size;
  }

  get(key = [], defaultValue = this.defaultValue) {
    const path = this.path.concat(key);
    return getState().getIn(path, defaultValue);
  }

  getIn(subPath, defaultValue) {
    const path = this.path.concat(subPath);
    return getState().getIn(path, defaultValue);
  }

  removeIn(path) {
    const state = getState();
    const key = this.path.concat(path);

    if (!state.hasIn(key)) {
      console.warn('Trying to access unknow key:', key);
      console.warn('State has been set using a javascript object instead of Immutable.fromJS({ ... }).');
      return;
    }

    const newState = state.removeIn(key);
    return updateState(newState);
  }

  set(newValue) {
    const newState = getState().setIn(this.path, newValue);
    return updateState(newState);
  }

  setIn(subPath, newValue) {
    const path = this.path.concat(subPath);
    const newState = getState().setIn(path, newValue);
    return updateState(newState);
  }

  update(updater) {
    const newState = getState().updateIn(this.path, this.defaultValue, updater);
    return updateState(newState);
  }

  updateIn(path, defaultValue, updater) {
    const newState = getState().updateIn(this.path.concat(path), defaultValue, updater);
    return updateState(newState);
  }

  empty() {
    const newState = getState().removeIn(this.path);
    return updateState(newState);
  }

  keys() {
    if (this.size()) {
      return getState().getIn(this.path).keySeq();
    } else {
      return Immutable.Map().keySeq();
    }
  }

  sub(subPath, defaultValue) {
    const path = this.path.concat(subPath);
    return new AppDataNode(path, defaultValue);
  }
}

export default AppDataNode;
