import _ from 'lodash';
import { inflect } from 'inflection';

const Units = {
  time: {
    millisecond: 1e-3,
    second: 1,
    minute: 60,
    hour: 3600,
    day: 86400
  },
  volume: {
    nanoliter: 1e-3,
    microliter: 1,
    milliliter: 1e3,
    liter: 1e6
  },
  length: {
    nanometer: 1e-9,
    micrometer: 1e-6,
    millimeter: 1e-3,
    meter: 1
  },
  temperature: {
    celsius: 1
  },
  acceleration: {
    g: 1
  },
  frequency: {
    hertz: 1,
    kilohertz: 1e3
  },
  power: {
    watt: 1
  },
  mass: {
    nanogram: 1e-3,
    microgram: 1,
    milligram: 1e3,
    gram: 1e6
  }
};

const DimensionForUnit = {};

Object.keys(Units).forEach((dimension) => {
  const units = Units[dimension];

  Object.keys(units).forEach((unit) => {
    DimensionForUnit[unit] = dimension;
  });
});

const DefaultUnit = {
  time: 'second',
  volume: 'microliter',
  length: 'nanometer',
  temperature: 'celsius',
  acceleration: 'g',
  frequency: 'hertz',
  power: 'watt',
  mass: 'microgram'
};

const UnitNames = {
  second: 'sec',
  minute: 'min',
  hour: 'hour',
  nanoliter: 'nL',
  microliter: 'μL',
  milliliter: 'mL',
  nanometer: 'nm',
  micrometer: 'μm',
  millimeter: 'mm',
  meter: 'm',
  celsius: '°C',
  g: 'g',
  volt: 'V',
  hertz: 'Hz',
  kilohertz: 'kHz',
  watt: 'W',
  bar: 'bar',
  nanogram: 'ng',
  microgram: 'μg',
  milligram: 'mg',
  gram: 'g',
  molar: 'M',
  nanomolar: 'nM',
  millimolar: 'mM',
  micromolar: 'μM',
};

const UnitShortNames = {
  nl: 'nanoliter',
  μl: 'microliter',
  ml: 'milliliter',
  l: 'liter',
  ng: 'nanogram',
  μg: 'microgram',
  mg: 'milligram',
  g: 'gram',
  M: 'molar',
  nM: 'nanomolar',
  mM: 'millimolar',
  μM: 'micromolar',
};

const convertUnitShorthandToName = function(initValue) {
  const updatedValue = initValue.replace(/µ/g, 'μ'); // Replace ASCII CODE 181 µ with 956 μ
  if (!/\d+:[μmn]?[lgLGmM]/.test(updatedValue)) {
    return undefined;
  }
  const [value, unit] = Array.from(updatedValue.split(/:/));
  const initialUnitName = unit.includes('M')
    ? UnitShortNames[unit]
    : UnitShortNames[unit.toLowerCase()];
  return initialUnitName ? `${value}:${initialUnitName}` : undefined;
};

const convertLongUnitToShortUnit = (valueWithLongUnitName) => {
  const [value, longUnit] = Array.from(valueWithLongUnitName.split(/:/));
  const shortHandUnitName = UnitNames[longUnit.toLowerCase()];

  return shortHandUnitName ? `${value}:${shortHandUnitName}` : undefined;
};

const toScalar = function(initValue, desiredUnit) {
  if (!/\d+:\w+/.test(initValue)) {
    return undefined;
  }

  const [value, unit] = Array.from(initValue.split(/:/));
  const dimension = Units[DimensionForUnit[unit]];

  return (value * dimension[unit]) / dimension[desiredUnit];
};

// chooses appropriate unit "1:second" to fit in range 1 <= value < 1000 and
const convertUnitForDisplay = function(value, type) {
  if (!/\d+:\w+/.test(value)) {
    return undefined;
  }

  // eslint-disable-next-line prefer-const
  let [initNum, initUnit] = value.split(/:/);

  const rangeMin = 1;
  const rangeMax = 1000;
  initNum = parseFloat(initNum);

  // return original value if it is within range
  if (rangeMin <= initNum && initNum < rangeMax) {
    return value;
  }

  let choices = _.map(Units[type], (factor, unit) => {
    const normalizedValue = initNum * Units[type][initUnit];
    const convertedValue = normalizedValue / factor;

    return {
      value: convertedValue,
      unit
    };
  });

  // sort ascending by value size
  choices = _.sortBy(choices, v => v.value);

  const choice = _.find(choices, v => rangeMin <= v.value && v.value < rangeMax);

  // return original value if no other choice is found
  if (!choice) {
    return value;
  }

  return `${choice.value}:${choice.unit}`;
};

const formatValue = (valueString) => {
  const [num, unit] = Array.from(valueString.split(/:/));

  return UnitNames[unit] ? `${num}${UnitNames[unit]}` : `${num}${unit}`;
};

const getValueAndUnit = (valueString) => {
  if (!/\d+:[\w-~!@#$%^&*()_+=]/.test(valueString)) {
    return [undefined, undefined];
  }

  return Array.from(valueString.split(/:/));
};

const formatForDisplay = (input) => {
  const [, inputUnit] = Array.from(input.split(/:/));
  const type = DimensionForUnit[inputUnit];
  const convertedForDisplay = convertUnitForDisplay(input, type);
  const [value, unit] = Array.from(convertedForDisplay.split(/:/));
  let roundedValue  = parseFloat(value);

  if (parseFloat(roundedValue) !== Math.floor(roundedValue)) {
    roundedValue = roundedValue.toFixed(2);
  }

  return `${roundedValue} ${inflect(unit, roundedValue)}`;
};

const convertValue = (value, type, from, to) => {
  // If the from and to units don't exist, exit
  if (!Units[type][from] || !Units[type][to]) {
    return undefined;
  }

  return value * (Units[type][from] / Units[type][to]);
};

export {
  Units,
  DefaultUnit,
  UnitNames,
  DimensionForUnit,
  UnitShortNames,
  toScalar,
  convertUnitForDisplay,
  formatForDisplay,
  formatValue,
  getValueAndUnit,
  convertUnitShorthandToName,
  convertLongUnitToShortUnit,
  convertValue
};
