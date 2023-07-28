import _ from 'lodash';

// Remove from an Object the k/v pairs that are present in a list of columns to delete, or are empty.
const reduceCSVRow = (csvRowHash, columnsToDelete = []) => {

  const badKeys = new Set(columnsToDelete);
  return _.omitBy(csvRowHash, (v, k) => badKeys.has(k) || _.isEmpty(v));
};

export default reduceCSVRow;
