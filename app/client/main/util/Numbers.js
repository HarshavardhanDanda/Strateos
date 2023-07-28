import _ from 'lodash';

// INPUT: an array of numbers
// OUTPUT: A single number representing the average value of the input values
function average(lst) {
  if (!isNaN(parseFloat(lst)) && isFinite(lst)) {
    // check if number
    // use parseFloat to extract the number from a single value array
    return parseFloat(lst);
  } else if (lst) {
    // check if array
    return _.reduce(lst, ((acc, cur) => acc + cur), 0) / lst.length;
  }
  return undefined;
}

function* range(start, end) {
  for (let i = start; i < end; i += 1) yield i;
}

const compare = (a, b) => a - b;

function standardDeviation(values) {
  const avg           = average(values);
  const squareDiffs   = values.map(value => (value - avg) ** 2);
  const avgSquareDiff = average(squareDiffs);

  return Math.sqrt(avgSquareDiff);
}

// Create our number formatter.
const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

const countDecimals = (value) => {
  if (Math.floor(value) === value) return 0;
  return value.toString().split('.')[1].length || 0;
};

const toPrecision = (value, precision) => {
  // to handle the case when value is a string
  const n = parseFloat(value);

  return parseFloat(n.toFixed(precision));
};

export {
  average,
  compare,
  countDecimals,
  moneyFormatter,
  range,
  standardDeviation,
  toPrecision
};
