import Immutable from 'immutable';

// split on last / in a string (to allow slashes in container names)
export const splitRefObject = (object) => {
  return object.split(/\/(?=[^\/]+$)/);
};

// Finds a container given ref name, expects an Immutable.JS run
export const containerForRef = (refName, run) => {
  const foundRef = run.get('refs', Immutable.List())
    .find(ref => ref.get('name') === refName);

  if (!foundRef) {
    return undefined;
  }

  if (!foundRef.getIn(['container', 'container_type'])) {
    return { container_type: foundRef.get('container_type').toJS() };
  }

  return foundRef.get('container').toJS();
};

export default splitRefObject;
