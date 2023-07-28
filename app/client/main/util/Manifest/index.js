// Utilities for dealing with protocol manifests.
//
// A 'type description' can be either a string or an object with more type
// parameters. The "inputs" section of a protocol manifest is a key/value
// mapping of input name -> type description.
//
// Some example type descriptions:
//
//     "volume"
//
//     { "type": "volume" }  // equivalent to just "volume"
//
//     {
//       "type": "volume",
//       "default": "30:microliter"
//     }
//
//     {
//       "type": "group+",
//       "inputs": {
//         "samples": { "type": "aliquot+" },
//         "total reaction volume": "volume",
//         "primers": {
//           "type": "group+",
//           "inputs": {
//             "primer": { "type": "aliquot" },
//             "volume": { "type": "volume", "required": false }
//           }
//         }
//       }
//     }
//
import _ from 'lodash';
import Immutable from 'immutable';
import ArrayUtil from 'main/util/ArrayUtil';

// thermocycle would look like this if we didn't want to have special display logic for it
// adding the correct structure allows errorFor to recursively process the data
const ThermocycleGroupSchema = {
  cycles: {
    type: 'integer'
  },
  steps: {
    type: 'group+', // add type to allow recursive walk
    inputs: {
      duration: {
        type: 'time'
      },
      temperature: {
        type: 'temperature',
        required: false
      },
      gradient: {
        type: 'group', // add type to allow recursive walk
        required: false,
        inputs: {
          top: {
            type: 'temperature',
            required: false
          },
          bottom: {
            type: 'temperature',
            required: false
          }
        }
      }
    }
  }
};

// eslint-disable-next-line no-underscore-dangle
const _filterInputs = function(v, typeDesc) {
  if (v == undefined) return undefined;

  if (typeof typeDesc === 'string') {
    // eslint-disable-next-line no-param-reassign
    typeDesc = { type: typeDesc };
  }

  if (v == undefined) {
    // eslint-disable-next-line no-param-reassign
    v = typeDesc.default;
  }

  switch (typeDesc.type) {
    case 'integer':
      return v;
    case 'decimal':
      return v;
    case 'aliquot+':
      return v.map(aliquot => _filterInputs.call(this, aliquot, 'aliquot'));
    case 'aliquot++':
      return v.map(x => _filterInputs.call(this, x, 'aliquot+'));
    case 'group':
      return _.fromPairs(_.map(v, (val, key) => {
        return [key, _filterInputs.call(this, val, typeDesc.inputs[key])];
      }));
    case 'group+':
      return v.map((val) => {
        return _filterInputs.call(this, val, _.extend({}, typeDesc, {
          type: 'group'
        }));
      });
    case 'group-choice': {
      // allowed choices from the manifest.
      const optionChoices = typeDesc.options.map(o => o.value);

      const selectedOption = v.value;

      const group_inputs = {};

      optionChoices.forEach((option) => {
        const group_type_desc = _.extend({}, {
          type: 'group'
        }, _.find(typeDesc.options, o => o.value === option));

        if (option === selectedOption) {
          const selected_group = v.inputs[selectedOption];

          // for the currently selected option recursively filter
          group_inputs[option] = _filterInputs.call(this, selected_group, group_type_desc);
        } else {
          // otherwise create default values.
          // default fn, requires a map from name to type_desc
          group_inputs[option] = this.defaults({
            tmpname: group_type_desc
          }).get('tmpname').toJS();
        }
      });

      return {
        value: selectedOption,
        inputs: group_inputs
      };
    }
    case 'thermocycle':
      return v.map(g => ({
        cycles: g.cycles,
        steps: g.steps
      }));
    case 'csv-table':
      return typeDesc.default;
    default:
      return v;
  }
};

// filter out csv-table
//
// This method is used when cloning a run and converting parameters
// into the format that the UI requires.
//
// TODO: tate -- this will be removed once csv-table is supported
const filterInputs = function(inputs, manifestInputs) {
  const res = {};

  Object.keys(manifestInputs).forEach((key) => {
    // we call `this._filterInputs` because filterInputs needs access to the defaults method.
    res[key] = _filterInputs.call(this, inputs[key], manifestInputs[key]);
  });

  return res;
};

export default {
  normalizeTypeDesc(typeDesc) {
    if (typeof typeDesc === 'string') {
      return Immutable.Map({ type: typeDesc });
    } else {
      return Immutable.fromJS(typeDesc);
    }
  },

  // filter out csv-table
  filterInputs,

  // Given a type description, return the default value. Obeys the "default"
  // parameter if it exists, otherwise returns a "natural" default.
  defaultForType(typeDesc) {
    const normTypeDesc = this.normalizeTypeDesc(typeDesc);
    const defaultValue = normTypeDesc.get('default');

    if (defaultValue != undefined) {
      return defaultValue;
    } else {
      return this.naturalDefaultForType(normTypeDesc.get('type'));
    }
  },

  naturalDefaultForType(type) {
    switch (type) {
      case 'group':
        return Immutable.Map();
      case 'group+':
        return Immutable.List.of(Immutable.Map());
      case 'container+':
        return Immutable.List();
      case 'compound+':
        return Immutable.List();
      case 'aliquot+':
        return Immutable.List();
      case 'aliquot++':
        return Immutable.List.of(Immutable.List());
      case 'string':
        return '';
      case 'thermocycle':
        return Immutable.fromJS([{
          cycles: '1',
          steps: [{}]
        }]);
      case 'bool':
        return false;
      case 'multi-select':
        return Immutable.List();
      default:
        return undefined;
    }
  },

  // Recursively compute the default values for a given input type structure.
  defaults(inputTypesJS, csvUpload = false) {
    const inputTypes = Immutable.fromJS(inputTypesJS);

    return inputTypes.map((typeDescP, _name) => {
      const typeDesc = this.normalizeTypeDesc(typeDescP);

      switch (typeDesc.get('type')) {
        case 'group': {
          const parentDefaults = this.defaultForType(typeDesc);
          const childDefaults = this.defaults(typeDesc.get('inputs'));
          return childDefaults.mergeDeep(parentDefaults);
        }
        case 'group+': {
          const parentDefaults = this.defaultForType(typeDesc);
          const childDefaults = this.defaults(typeDesc.get('inputs'));
          return parentDefaults.map(x => childDefaults.mergeDeep(x));
        }
        case 'group-choice': {
          const defaultValue = typeDesc.get('default');
          const defaultInputs = {};

          typeDesc.get('options').forEach((opt) => {
            const inputs = opt.get('inputs');

            if (inputs) {
              defaultInputs[opt.get('value')] = this.defaults(inputs);
            }
          });

          return Immutable.fromJS({
            ...(csvUpload ? undefined : { value: defaultValue }),
            inputs: defaultInputs
          });
        }
        default:
          if (csvUpload) {
            return undefined;
          }
          return this.defaultForType(typeDesc);
      }
    });
  },

  // Recursively pick the inputs of type `csv` or `csv-table`
  csvInputs(inputTypesJS) {

    const csvFields = ['csv', 'csv-table'];

    _.forEach(inputTypesJS, (typeDesc, k) => {
      switch (typeDesc.type) {
        case 'group':
        case 'group+': {
          const csvInputs = this.csvInputs(typeDesc.inputs);
          if (!_.size(csvInputs)) {
            delete inputTypesJS[k];
          }

          break;
        }
        case 'group-choice': {
          const removeIndices = [];
          _.forEach(typeDesc.options, (opt, pos) => {
            const inputs = opt.inputs;
            if (inputs) {
              const optCsvInputs = this.csvInputs(inputs);
              if (!_.size(optCsvInputs)) {
                removeIndices.push(pos);
              }
            }
          });

          _.pullAt(typeDesc.options, removeIndices);

          if (!_.size(typeDesc.options)) {
            delete inputTypesJS[k];
          }

          break;
        }
        default: {
          let type_desc = typeDesc;
          if (typeof typeDesc === 'string') {
            type_desc = { type: typeDesc };
          }
          if (!_.includes(csvFields, type_desc.type)) {
            delete inputTypesJS[k];
          }
        }
      }
    });

    return inputTypesJS;
  },

  // Recursively compute the errors in `inputs` against the schema `inputTypes`.
  // Returns a nested error object of { <name>: <errors> }, where <errors> is a
  // string if there's an error directly on <name>, or an object/array if <name>
  // is a nested field.
  errors(inputTypesP, inputsP) {
    const inputTypes = Immutable.fromJS(inputTypesP);
    const inputs     = Immutable.fromJS(inputsP);

    return inputTypes.map((typeDesc, name) => {
      return this.errorFor(typeDesc, inputs.get(name));
    });
  },

  isEmpty(typeDesc, value) {
    if (value == undefined) {
      return true;
    }

    const supported_units = [
      'amount_concentration',
      'length',
      'mass',
      'mass_concentration',
      'temperature',
      'time',
      'volume'
    ];

    if (ArrayUtil.includes(supported_units, typeDesc.get('type'))) {
      // Hack: the united inputs append ":<unit>" to their value, so an empty
      // united field comes back as ":microliter", for example.
      return value.split(/:/)[0].trim().length === 0;
    } else if (ArrayUtil.includes(['string'], typeDesc.get('type'))) {
      return value.trim().length === 0;
    } else if (ArrayUtil.includes(['integer'], typeDesc.get('type'))) {
      if (typeof value === 'string') {
        return value.trim().length === 0;
      } else {
        return isNaN(value);
      }
    } else if (ArrayUtil.includes(['aliquot+', 'aliquot++', 'container+', 'thermocycle', 'compound+'], typeDesc.get('type'))) {
      return value.isEmpty();
    } else if (ArrayUtil.includes(['group-choice'], typeDesc.get('type'))) {
      return !!value.value;
    } else {
      return false;
    }
  },

  isRequired(typeDesc) {
    const required = typeDesc.get('required');

    if (required != undefined) {
      return required;
    } else {
      // required is default
      return true;
    }
  },

  errorFor(typeDescP, valueP) {
    const typeDesc = this.normalizeTypeDesc(typeDescP);
    const value    = Immutable.fromJS(valueP);
    const required = this.isRequired(typeDesc);
    const exists   = value != undefined;

    switch (typeDesc.get('type')) {
      case 'group': {
        const v = (exists) ? value : Immutable.Map();
        return this.errors(typeDesc.get('inputs'), v);
      }
      case 'group+':
        if (required && (!exists || value.size === 0)) {
          return 'Required Field';
        } else if (!exists) {
          return undefined;
        } else {
          return value.map((v) => {
            return this.errorFor({
              type: 'group',
              inputs: typeDesc.get('inputs')
            }, v);
          });
        }
      case 'group-choice': {
        const v = (exists) ? value.get('value') : undefined;

        if (v !== undefined) {
          const selectedOption = typeDesc.get('options').find(x => x.get('value') === v);
          return this.errorFor({
            type: 'group',
            inputs: selectedOption ? selectedOption.get('inputs', Immutable.Map()) : Immutable.Map()
          }, value.getIn(['inputs', v]));
        } else if (required) {
          return 'Required Field';
        } else {
          return undefined;
        }
      }
      case 'thermocycle': {
        const v = (exists) ? value : Immutable.List();

        return this.errorFor({
          type: 'group+',
          required: required,
          inputs: ThermocycleGroupSchema
        }, v);
      }
      case 'integer':
        if (this.isEmpty(typeDesc, value)) {
          if (required) {
            return 'Required Field';
          } else {
            return undefined;
          }
        // eslint-disable-next-line no-bitwise
        } else if (Number(value) !== ~~Number(value)) {
          return 'Must be an integer';
        } else {
          return undefined;
        }
      case 'acceleration':
      case 'amount_concentration':
      case 'frequency':
      case 'length':
      case 'mass':
      case 'mass_concentration':
      case 'temperature':
      case 'time':
      case 'volume':
        // from main/util/unit
        if (required && this.isEmpty(typeDesc, value)) {
          return 'Required Field';
        }

        if (!this.isEmpty(typeDesc, value) && !/^\d+(?:\.\d+)?:[A-Za-z0-9/]+$/.test(value)) {
          return 'Must be a number';
        }

        return undefined;
      default:
        if (this.isRequired(typeDesc) && this.isEmpty(typeDesc, value)) {
          return 'Required Field';
        } else {
          return undefined;
        }
    }
  },

  // True if `inputs` is not a valid value given the schema `inputTypes`.
  hasErrors(inputTypes, inputs) {
    const errorExists = function(errors) {
      if (errors == undefined) {
        return false;
      }
      return errors.some((x) => {
        return typeof x === 'string' || errorExists(x);
      });
    };

    const errs = this.errors(inputTypes, inputs);
    return errorExists(errs);
  },

  // calculates aliquot and container input names
  sampleInputNames(inputTypesP) {
    const inputTypes = Immutable.fromJS(inputTypesP);

    let names = Immutable.Set();

    inputTypes.forEach((_typeDesc, _name) => {
      const typeDesc = this.normalizeTypeDesc(_typeDesc);
      const label    = typeDesc.get('label');
      const name     = (label != undefined) ? label : _name;

      if (ArrayUtil.includes(['aliquot', 'aliquot+', 'aliquot++'], typeDesc.get('type'))) {
        names = names.add(name);
      } else if (ArrayUtil.includes(['container', 'container+'], typeDesc.get('type'))) {
        names = names.add(name);
      } else if (ArrayUtil.includes(['compound', 'compound+'], typeDesc.get('type'))) {
        names = names.add(name);
      } else if (ArrayUtil.includes(['group', 'group+'], typeDesc.get('type'))) {
        names = names.union(this.sampleInputNames(typeDesc.get('inputs')));
      } else if (typeDesc.get('type') === 'group-choice') {
        typeDesc.get('options').forEach((option) => {
          const inputs = option.get('inputs');
          if (inputs != undefined) {
            names = names.union(this.sampleInputNames(inputs));
          }
        });
      } else if (typeDesc.get('type') === 'csv' && typeDesc.get('samples_required')) {
        names = names.add(name);
      }
    });

    return names;
  },

  dataTypes(preview) {
    if (!preview) return Immutable.Set();

    return Immutable.fromJS(preview)
      .get('instructions')
      .filter(ins => ins.get('dataref') != undefined)
      .map(ins => ins.get('op'))
      .toSet();
  },

  _internalIdsForManifestTransform(typeDescP, value) {
    const typeDesc = this.normalizeTypeDesc(typeDescP);

    switch (typeDesc.get('type')) {
      case 'container':
        return value;
      case 'container+': {
        const mInputs = typeDesc.set('type', 'container');
        return (value || []).map(containerId => this._internalIdsForManifestTransform(mInputs, containerId));
      }
      case 'compound':
        return value;
      case 'compound+': {
        const mInputs = typeDesc.set('type', 'compound');
        return (value || []).map(compoundId => this._internalIdsForManifestTransform(mInputs, compoundId));
      }
      case 'aliquot':
        return value != undefined ? value.containerId : undefined;
      case 'aliquot+': {
        const mInputs = typeDesc.set('type', 'aliquot');
        return (value || []).map(aliquot => this._internalIdsForManifestTransform(mInputs, aliquot));
      }
      case 'aliquot++': {
        const mInputs = typeDesc.set('type', 'aliquot+');
        return (value || []).map(aliquotPlus => this._internalIdsForManifestTransform(mInputs, aliquotPlus));
      }
      case 'group':
        return _.map(value, (val, key) => this._internalIdsForManifestTransform(typeDesc.getIn(['inputs', key]), val));
      case 'group+': {
        const mInputs = typeDesc.set('type', 'group');
        return (value || []).map(group => this._internalIdsForManifestTransform(mInputs, group));
      }
      case 'group-choice': {
        const selectedOption = typeDesc.get('options').find(x => x.get('value') === value.value);

        if (selectedOption != undefined) {
          return this._internalIdsForManifestTransform({
            type: 'group',
            inputs: selectedOption.get('inputs')
          }, value.inputs[value.value]);
        }

        return undefined;
      }
      default:
        return undefined;
    }
  },

  internalIdsForManifest(manifest, inputs) {
    const containerIds = Object.keys(manifest.inputs).map((name) => {
      const typeDesc = manifest.inputs[name];
      const value    = inputs[name];

      return this._internalIdsForManifestTransform(typeDesc, value);
    });

    return Immutable.List(_.uniq(_.compact(_.flattenDeep(containerIds))));
  }
};
