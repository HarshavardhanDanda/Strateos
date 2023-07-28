import Immutable from 'immutable';
import _         from 'lodash';
import { isURL } from 'validator';

import ContainerStore     from 'main/stores/ContainerStore';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';

/* eslint-disable no-shadow */

function isInt(v) {
  return v != undefined &&
  (typeof v !== 'string' || v.trim().length > 0) &&
  (Number(v) === ~~Number(v)); // eslint-disable-line no-bitwise
}

function getBetweenMessage(start, end, unitNotation) {

  return unitNotation ? `Must be between ${start}${unitNotation} and ${end}${unitNotation}`
    : `Must be between ${start} and ${end}`;
}

// introducing some redundancy here in an attempt to make this cleaner,
// but I don't want to break other components
const validators = {
  non_null(value, message = 'Must be specified') {
    if (value == undefined) {
      return message;
    }

    return undefined;
  },

  non_empty(value, message = 'Must be specified') {
    if (value == undefined) {
      return message;
    }

    const valueStr = `${value}`;
    if (!valueStr || valueStr.trim().length === 0) {
      return message;
    }

    return undefined;
  },

  password_invalid(value, message = 'Password is invalid') {
    if (value == true) {
      return message;
    }

    return undefined;
  },

  alphanumeric(value, message = 'Must be alphanumeric') {
    if (value != undefined && value.match(/^[0-9a-z]+$/i)) {
      return undefined;
    }
    return message;
  },

  regex(pattern, message) {
    const regExp = new RegExp(pattern);
    const defaultMessage = `Must match with pattern ${pattern}`;
    return function(value) {
      if (value && regExp.test(value)) {
        return undefined;
      }
      return message || defaultMessage;
    };
  },

  no_white_space(value, message = 'No whitespaces') {
    if (/ /.test(value)) {
      return message;
    }

    return undefined;
  },

  no_special_characters(value, message = 'No special characters') {
    if (/[!@#$%^&*)(]+$/.test(value)) {
      return message;
    }

    return undefined;
  },

  no_slashes(value, message = "Character '/' not allowed") {
    if (/\//.test(value)) {
      return message;
    }

    return undefined;
  },

  no_commas(value, message = 'Comma not allowed') {
    if (/,/.test(value)) {
      return message;
    }

    return undefined;
  },

  not_too_long(value, max = 250) {
    if ((value != undefined ? value.length : undefined) > max) {
      return `Maximum ${max} characters`;
    }

    return undefined;
  },

  not_too_short(value, min = 6) {
    if ((value != undefined ? value.length : undefined) < 6) {
      return `Minimum ${min} characters`;
    }

    return undefined;
  },

  numeric(value, message = 'Must be numeric') {
    if (isNaN(value)) {
      return message;
    }

    return undefined;
  },

  between(start, end, unitNotation) {
    return function(value, message = getBetweenMessage(start, end, unitNotation)) {
      const num = Number(value);

      if (isNaN(num) || !(start <= num && num <= end)) {
        return message;
      }

      return undefined;
    };
  },

  at_least(minimum) {
    return function(value, message = `Must be at least ${minimum}`) {
      const num = Number(value);

      if (isNaN(num) || num < minimum) {
        return message;
      }

      return undefined;
    };
  },

  at_most(maximum) {
    return function(value, message = `Must be at most ${maximum}`) {
      const num = Number(value);

      if (isNaN(num) || num > maximum) {
        return message;
      }

      return undefined;
    };
  },

  digits(value, message = 'Must be numeric') {
    if (value != undefined && value.match(/^[0-9]+$/)) {
      return undefined;
    }

    return message;
  },

  positive_integer(value, message = 'Must be a positive whole number') {
    const num = parseInt(value, 10);

    if (isNaN(num) || num <= 0 || !isInt(value)) {
      return message;
    }

    return undefined;
  },

  non_negative_integer(value, message = 'Must be a non-negative whole number') {
    const num = parseInt(value, 10);

    if (isNaN(num) || num < 0 || !isInt(value)) {
      return message;
    }

    return undefined;
  },

  positive_float(value, message = 'Must be numeric and positive') {
    const num = Number(value);

    if (isNaN(num) || num < 0) {
      return message;
    }

    return undefined;
  },

  storage_condition(value, message = 'Must be valid storage type') {
    const validConditions = ContainerStore.validStorageConditions.map(c => c.value);

    if (Array.from(validConditions).includes(value)) {
      return undefined;
    }

    return message;
  },

  is_true(value, message = 'Must be true') {
    if (value === true) {
      return undefined;
    }

    return message;
  },

  barcode(value, message = 'Must be valid barcode') {
    // accepted characters: alphanumeric, underscore, and dash
    if (value !== undefined && value.match(/^[\w-]+$/)) {
      return undefined;
    }

    return message;
  },

  email(value, message = 'Must be valid email address') {
    if (!value || !value.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}/)) {
      return message;
    }

    return undefined;
  },

  url(value, message = 'Must be a valid URL of the format http(s)://www.domain.com') {
    if (!isURL(value, {
      protocols: ['http', 'https'],
      require_tld: true,
      require_protocol: true,
      require_host: true,
      require_valid_protocol: true,
      allow_underscores: true
    })) {
      return message;
    }

    return undefined;
  },

  uniqueness(currentList, message = 'Must choose a unique value') {
    return function(value) {
      if (Array.from(currentList).includes(value)) {
        return message;
      }

      return undefined;
    };
  },

  container_location(location, message = 'Must specify location') {
    if (location  && location.get('id')) {
      return undefined;
    }

    return message;
  },

  container_type(id, message = 'Must be a valid container type') {
    if (ContainerTypeStore.getById(id) != undefined) {
      return undefined;
    }

    return message;
  },

  retiredContainerTypeValidator(id) {
    const containerType = ContainerTypeStore.getById(id);
    if (containerType.get('retired_at')) {
      return 'container type ' + containerType.get('id') + ' is retired';
    }
    return undefined;
  },

  container_volume(containerTypeId) {
    return (volume, message = 'Must specify volume') => {
      const containerType = ContainerTypeStore.getById(containerTypeId);
      const maxVolume     = containerType ? containerType.get('well_volume_ul') : undefined;

      if (_.isEmpty(volume)) {
        return message;
      } else if (maxVolume != undefined) {
        return this.between(0, maxVolume)(volume);
      } else {
        return this.positive_float(volume);
      }
    };
  },

  protocol_name(name, reservedNames) {
    return this._protocol_or_package_name(name, reservedNames);
  },

  package_name(name, reservedNames) {
    return this._protocol_or_package_name(name, reservedNames);
  },

  _protocol_or_package_name(name, reservedNames) {
    const normalizedNames = reservedNames.map(n => n.toLowerCase());
    const normalizedName  = name != undefined ? name.toLowerCase() : undefined;

    return (
      this.non_empty(normalizedName) ||
      this.not_too_long(normalizedName, 100) ||
      this.no_white_space(normalizedName) ||
      this.no_special_characters(normalizedName) ||
      (normalizedNames.includes(normalizedName) ? 'Name already in use' : undefined) ||
      undefined
    );
  }
};

// Validates input fields
// Assumes that the dataNode is an ImmutableMap where
// the values are in the format {value, [error], edited}
const InputsValidator = function(dataNode, nameToValidator) {
  return {
    defaultValidator(_value) {
      return undefined;
    },

    errors(name, value) {
      const validator = nameToValidator[name] || this.defaultValidator;
      const error = validator(value);
      if (error) {
        return [error];
      } else {
        return [];
      }
    },

    validatedObj(name, value) {
      return Immutable.Map({
        value,
        errors: this.errors(name, value),
        edited: true
      });
    },

    validate() {
      const allErrors = [];

      _.keys(nameToValidator).forEach((name) => {
        const value = dataNode.getIn([name, 'value']);
        const errors = this.errors(name, value);

        dataNode.update(inputs =>
          inputs.set(name, Immutable.Map({ value, errors, edited: true }))
        );

        allErrors.push(errors);
      });

      return _.isEmpty(_.flattenDeep(allErrors));
    }
  };
};

const SimpleInputsValidator = function(nameToOptions) {
  return {
    errorMsg(value, validatorsSubset, optional = false) {
      if (optional && (value == undefined || value == '')) {
        return undefined;
      }

      for (const validator of validatorsSubset) { // eslint-disable-line no-restricted-syntax
        const msg = validator(value);

        if (msg) return msg;
      }

      return undefined;
    },

    errors(inputValues) {
      return _.mapValues(nameToOptions, (options, name) =>  {
        const value = inputValues.get(name);
        return this.errorMsg(value, options.validators, options.optional);
      });
    },

    isValid(inputValues) {
      const errors = this.errors(inputValues);
      return _.every(errors, v => v == undefined);
    }
  };
};

export {
  validators,
  InputsValidator,
  SimpleInputsValidator
};
