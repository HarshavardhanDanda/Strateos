import _ from 'lodash';

const includes = (arr, value) => {
  return _.indexOf(arr, value) != -1;
};

const firstNonEmptyValue = (arr) => {
  return arr.find(item => item !== '' && !_.isNil(item));
};

export default {
  includes,
  firstNonEmptyValue
};
