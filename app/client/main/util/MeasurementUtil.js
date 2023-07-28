import _ from 'lodash';

import { toScalar } from './unit';
import { countDecimals } from './Numbers';

const getScalarInDefaultUnits = function(object, mode) {
  switch (mode) {
    case 'mass': {
      return toScalar(object.get('mass') || object.get('mass_mg'), 'milligram');
    }
    default: {
      return toScalar(object.get('volume') || object.get('volume_ul'), 'microliter');
    }
  }
};

const getQuantity = function(object, mode) {
  switch (mode) {
    case 'mass': {
      return object.get('mass') || object.get('mass_mg');
    }
    default: {
      return object.get('volume') || object.get('volume_ul');
    }
  }
};

const getQuantityInDefaultUnits = function(object, mode) {
  switch (mode) {
    case 'mass': {
      return `${object.get('mass_mg')}:milligram`;
    }
    default: {
      return `${object.get('volume_ul')}:microliter`;
    }
  }
};

const getRepresentationalQuantity = function(scalarInDefaultUnits, mode) {
  switch (mode) {
    case 'mass': {
      const mass = `${scalarInDefaultUnits}:milligram`;
      const mass_grams = toScalar(mass, 'gram');
      // It's hard to visualize >= 10 grams in milligrams and precision is less important at that scale
      const repr_in_gm = mass_grams >= 10 || countDecimals(mass_grams) === 0;
      return repr_in_gm ?
        `${mass_grams}:gram` :
        `${toScalar(mass, 'milligram')}:milligram`;
    }
    default: {
      const volume = `${scalarInDefaultUnits}:microliter`;
      const volume_ml = toScalar(volume, 'milliliter');
      // It's hard to visualize >= 10mL in microliters and precision is less important at that scale
      const repr_in_ml = volume_ml >= 10 || countDecimals(volume_ml) === 0;
      return  repr_in_ml ?
        `${volume_ml}:milliliter` :
        `${toScalar(volume, 'microliter')}:microliter`;
    }
  }
};

const appendDefaultUnits = function(quantity, mode) {
  switch (mode) {
    case 'mass': {
      return `${quantity}:milligram`;
    }
    default: {
      return `${quantity}:microliter`;
    }
  }
};

const appendDefaultShortUnits = function(quantity, mode) {
  switch (mode) {
    case 'mass': {
      return `${quantity} mg`;
    }
    default: {
      return `${quantity} μL`;
    }
  }
};

const getMeasurementMode = function(object) {
  const volume = object.get('volume_per_container');
  if (volume && volume > 0) {
    return 'volume';
  }
  return 'mass';
};

const getMeasurementUnitFromMode = function(mode) {
  switch (mode) {
    case 'mass': {
      return 'mass_mg';
    }
    default: {
      return 'volume_ul';
    }
  }
};

const getNumericRangeText = (range = {}, placeholder = 'Any') => {
  const { min, max } = range;

  const isNilValue = (value) => _.isNil(value) || value === '';

  if (isNilValue(min) && isNilValue(max)) {
    return placeholder;
  }

  return `${isNilValue(min) ? '' : min}-${isNilValue(max) ? '' : max}`;
};

export {
  getScalarInDefaultUnits,
  getQuantity,
  getQuantityInDefaultUnits,
  appendDefaultUnits,
  getRepresentationalQuantity,
  appendDefaultShortUnits,
  getMeasurementMode,
  getMeasurementUnitFromMode,
  getNumericRangeText
};
