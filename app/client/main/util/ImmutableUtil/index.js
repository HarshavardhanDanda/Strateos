import Immutable from 'immutable';

const ImmutableUtil = {
  indexBy(iterable, searchKey) {
    // Takes a list/iterable of elements where each
    // element has a specific key and generates a map
    // key -> element.
    return iterable.reduce(
      (lookup, item) => lookup.set(item.get(searchKey), item),
      Immutable.Map()
    );
  },

  keyIn(...args) {
    // Useful for implementing Pick and Omit:
    //
    // data.filter(keyIn('a', 'b', 'c'))
    // data.filterNot(keyIn('a', 'b', 'c'))
    const keySet = Immutable.Set(args);

    return (v, k) => keySet.has(k);
  },

  not(predicate) {
    return (...args) => !predicate.apply(this, args);
  },

  uniqBy(iterable, uniqueKeyFn) {
    let alreadySeen = Immutable.Set();
    let results     = Immutable.List();

    iterable.forEach((item) => {
      const key = uniqueKeyFn(item);

      if (!alreadySeen.has(key)) {
        results = results.push(item);
        alreadySeen = alreadySeen.add(item);
      }
    });

    return results;
  },

  partition(iterable, predicate) {
    // Group by predicate.  We return `t` and `f` to unify the type of the group keys
    // Immutable doesn't needs more than just truthiness.
    const groups = iterable.groupBy((member) => {
      return (predicate(member)) ? 't' : 'f';
    });

    return [
      groups.get('t') || Immutable.Seq(),
      groups.get('f') || Immutable.Seq()
    ];
  },

  stringSorter(field, asc = true) {
    return (obj1, obj2) => {
      const t1 = obj1.get(field);
      const t2 = obj2.get(field);

      return asc ? t1.localeCompare(t2) : t2.localeCompare(t1);
    };
  }
};

export default ImmutableUtil;
