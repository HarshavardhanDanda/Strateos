const mapObject = (object, fn) => {
  return Object.keys(object)
    .map(key => fn(key, object[key], object))
    .reduce((acc, [key, value]) => Object.assign(acc, { [key]: value }), {});
};

const deepMap = (object, fn) => {
  if (!object || typeof object !== 'object') { return object; }
  return mapObject(object, (key, value) => {
    if (Array.isArray(value)) {
      return fn(key, value.map(item => deepMap(item, fn)), object);
    } else if (value && typeof value === 'object') {
      return fn(key, deepMap(value, fn), object);
    }
    return fn(key, value, object);
  });
};

const mapKeys = (object, fn) => mapObject(object, (key, value) => [fn(key), value]);
const deepMapKeys = (object, fn) => deepMap(object, (key, value) => [fn(key), value]);

export {
  deepMap,
  mapKeys,
  deepMapKeys
};
