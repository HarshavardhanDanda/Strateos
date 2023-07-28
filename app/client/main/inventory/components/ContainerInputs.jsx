import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import LocationSelectInput from 'main/inventory/components/LocationSelectInput';
import { validators }      from 'main/components/validation';
import ContainerTypeSelector from 'main/components/ContainerTypeSelector';
import ContainerStore      from 'main/stores/ContainerStore';
import SelectStorage       from 'main/components/Input';

import {
  Select,
  DateSelector,
  LabeledInput,
  Validated,
  InputWithUnits,
  TextInput
} from '@transcriptic/amino';

// Add logic here instead of view above to allow both
// the view and the parent view to get errors.
const ContainerInputsLogic = {
  injectDefaults(inputs) {
    return inputs.map((inputInfo, name) => {
      const type = inputInfo.get('type') || name;
      const [defaultValue, defaultValidators, defaultOptional] = this._defaults(type, inputs);

      return Immutable.fromJS({
        type,
        value:         inputInfo.get('value', defaultValue),
        validators:    inputInfo.get('validators', defaultValidators),
        gValidators:   inputInfo.get('gValidators', []),
        optional:      inputInfo.get('optional', defaultOptional),
        disabled:      inputInfo.get('disabled', false),
        forceValidate: inputInfo.get('forceValidate', false)
      });
    });
  },

  // Calculate [defaultValue, defaultValidators, defaultOptional] values.
  // We require passing in the current inputs, as some defaults, namely volume,
  // depend on the state of other fields than their own.
  _defaults(type, inputs) {
    switch (type) {
      case 'label':
        return [undefined, [validators.non_empty, validators.not_too_long], true];
      case 'barcode':
        return [
          undefined,
          [validators.non_empty, validators.not_too_long, validators.digits],
          true
        ];
      case 'storage_condition':
        return [
          ContainerStore.defaultStorageCondition,
          [validators.storage_condition],
          false
        ];
      case 'container_type_id':
        return ['micro-1.5', [validators.container_type], false];
      case 'volume': {
        const container_typeInput = inputs.find((inputInfo, name) => {
          const t = inputInfo.get('type') || name;
          return t === 'container_type_id';
        });

        const container_typeId = container_typeInput ? container_typeInput.get('value') : 'micro-1.5';
        return [undefined, [validators.container_volume(container_typeId)], true];
      }
      case 'location': {
        const location = Immutable.Map({ id: undefined });
        return [location, [], false];
      }
      case 'expires_at':
        return [undefined, [validators.non_null], true];
      default:
        return [undefined, [validators.non_empty, validators.not_too_long], true];
    }
  },

  get(inputs, name) {
    return this.injectDefaults(inputs).getIn([name, 'value']);
  },

  set(inputs, name, value) {
    return this.injectDefaults(inputs).setIn([name, 'value'], value);
  },

  errors(inputs) {
    const inputsWithDefaults = this.injectDefaults(inputs);

    return inputsWithDefaults.map((inputInfo, name) => {
      const value       = inputInfo.get('value');
      const vvalidators = inputInfo.get('validators').toJS(); // name collision
      const gvalidators = inputInfo.get('gValidators').toJS();
      const optional    = inputInfo.get('optional');

      const isEmpty = function() {
        if (Immutable.Iterable.isIterable(value)) {
          return value.isEmpty();
        } else {
          return _.isEmpty(value);
        }
      };

      if (!isEmpty() || !optional) {
        for (const validator of vvalidators) { // eslint-disable-line no-restricted-syntax
          const msg = validator(value);

          if (msg != undefined) {
            return msg;
          }
        }

        for (const validator of gvalidators) { // eslint-disable-line no-restricted-syntax
          const msg = validator(inputsWithDefaults, value, name);

          if (msg != undefined) {
            return msg;
          }
        }
      }

      return undefined;
    });
  },

  isValid(inputs) {
    // inputs are valid when no errors exist
    return this.errors(inputs)
      .valueSeq()
      .every(error => error == undefined);
  },

  toDBContainers(inputs) {
    let values = this.injectDefaults(inputs).map(inputInfo =>
      inputInfo.get('value')
    );

    const location = values.get('location');

    values = values.delete('location');
    values = values.delete('resource_id');
    values = values.delete('lot_no');
    values = values.delete('volume');
    values = values.delete('mass');
    values = values.delete('omcId');

    if (location != undefined) {
      values = values.set('location_id', location.get('id'));
    }

    return values;
  }
};

// A View that displays an input element for each value specified
// in the inputValues. The container fields label, barcode, location, etc
// are known and have both default values and default validators, but
// this can be overriden.
//
// Inputs:
// {
//   label:    {},
//   barcode:  {type: 'barcode'},
//   lot_no:   {value: '123'},
//   storage:  {validators: [fn1, fn2]},
//   location: {required: true},
// }
//
// Fields:
//   value:           The input's value.
//   type:            All validation defaults are determined from the type.
//   validators:      List of fns to use for validation.
//   gValidators:     List of fns to use for validation that will be passed in all the inputs.
//   disabled:        If this input is disabled from changing.
//   forceValidate:   Should force showing errors.
//   optional:        When true the validators will not be applied.
class ContainerInputs extends React.PureComponent {

  static get propTypes() {
    return {
      inputs:              PropTypes.instanceOf(Immutable.OrderedMap).isRequired,
      onInputsChange:      PropTypes.func.isRequired,
      disabled:            PropTypes.bool,
      forceValidate:       PropTypes.bool,
      prohibitedLocations: PropTypes.instanceOf(Immutable.Set),
      defaultLocationId:   PropTypes.string
    };
  }

  inputChange(name, value) {
    return this.props.onInputsChange(
      this.props.inputs.setIn([name, 'value'], value)
    );
  }

  render() {
    const inputs = ContainerInputsLogic.injectDefaults(this.props.inputs);
    const errors = ContainerInputsLogic.errors(inputs);

    return (
      <div className="container-inputs">
        {inputs.entrySeq().map(([name, inputInfo]) => {
          const type = inputInfo.get('type') || name;

          return (
            <Validated
              key={name}
              error={errors.get(name)}
              className={`container-${name}`}
              force_validate={this.props.forceValidate || inputInfo.get('forceValidate')}
            >
              <LabeledInput label={name}>
                {(() => {
                  switch (type) {
                    case 'storage_condition':
                      return (
                        <SelectStorage
                          disabled={this.props.disabled || inputInfo.get('disabled')}
                          value={inputInfo.get('value')}
                          onChange={e => this.inputChange(name, e.target.value)}
                        />
                      );
                    case 'container_type_id': {
                      return (
                        <ContainerTypeSelector
                          value={inputInfo.get('value')}
                          disabled={this.props.disabled || inputInfo.get('disabled')}
                          onChange={e => this.inputChange(name, e.target.value)}
                        />
                      );
                    }
                    case 'volume': {
                      const value = inputInfo.get('value');
                      return (
                        <InputWithUnits
                          dimension="volume"
                          disabled={this.props.disabled || inputInfo.get('disabled')}
                          value={value}
                          onChange={(e) => {
                            return this.inputChange(name, e.target.value);
                          }}
                        />
                      );
                    }
                    case 'mass': {
                      const value = inputInfo.get('value');
                      return (
                        <InputWithUnits
                          dimension="mass"
                          disabled={this.props.disabled || inputInfo.get('disabled')}
                          value={value}
                          onChange={(e) => {
                            return this.inputChange(name, e.target.value);
                          }}
                        />
                      );
                    }
                    case 'location': {
                      const location = inputInfo.get('value', Immutable.Map());

                      return (
                        <LocationSelectInput
                          locationId={location.get('id')}
                          prohibitedLocations={this.props.prohibitedLocations}
                          defaultLocationId={this.props.defaultLocationId}
                          onLocationSelected={(id) => {
                            return this.inputChange(name, Immutable.Map({ id }));
                          }}
                        />
                      );
                    }
                    case 'expires_at': {
                      const expires_at = inputInfo.get('value');

                      return (
                        <DateSelector
                          date={expires_at}
                          showDay
                          showAutoSelect
                          canReset
                          onChange={e => this.inputChange(name, e.target.value)}
                        />
                      );
                    }
                    case 'choice': {
                      const choices = inputInfo.get('choices', Immutable.List());

                      return (
                        <Select
                          options={choices.map(c => ({ value: c })).toJS()}
                          value={inputInfo.get('value')}
                          disabled={this.props.disabled || inputInfo.get('disabled')}
                          onChange={e => this.inputChange(name, e.target.value)}
                        />
                      );
                    }
                    default:
                      return (
                        <TextInput
                          disabled={
                            this.props.disabled || inputInfo.get('disabled')
                          }
                          value={inputInfo.get('value')}
                          onChange={e => this.inputChange(name, e.target.value)}
                        />
                      );
                  }
                })()}
              </LabeledInput>
            </Validated>
          );
        })}
      </div>
    );
  }
}

export { ContainerInputs, ContainerInputsLogic };
