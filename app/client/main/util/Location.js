import { compare as numberCompare } from 'main/util/Numbers';

const ancestorNames = (location) => {
  return location
    .get('ancestors')
    .map(a => a.get('name'));
};

const ancestorsPath = location => ancestorNames(location).join('-');

const ancestorCompare = (a, b) => {
  return ancestorsPath(a).localeCompare(ancestorsPath(b));
};

const sort = (a, b) => {
  return ancestorCompare(a, b) ||
         numberCompare(a.get('row'), b.get('row')) ||
         numberCompare(a.get('col'), b.get('col'));
};

export default sort;
