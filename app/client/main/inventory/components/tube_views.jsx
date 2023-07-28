import Immutable from 'immutable';
import _         from 'lodash';
import { inflect } from 'inflection';
import PropTypes from 'prop-types';
import React     from 'react';

import {
  LabeledInput,
  Validated,
  Button,
  InputWithUnits,
  Card,
  Banner,
  KeyValueList,
  TextInput
} from '@transcriptic/amino';

import CharControllableInput from 'main/components/CharControllableInput';
import PlateCreateLogic      from 'main/components/PlateCreate/PlateCreateLogic';
import SelectStorage         from 'main/components/Input';
import { validators }        from 'main/components/validation';
import ContainerStore        from 'main/stores/ContainerStore';
import * as Unit             from 'main/util/unit';

import TubeCompoundView from './TubeCompoundView';

class TubeView extends React.Component {
  static get propTypes() {
    return {
      container: PropTypes.instanceOf(Immutable.Map).isRequired,
      aliquots: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      onContainerSelected: PropTypes.func.isRequired,
      selectionMap: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  isSelected() {
    return this.props.selectionMap.get(this.props.container.get('id'));
  }

  render() {
    return (
      <Card>
        <div className="tube-view">
          <div className="tube-details-container">
            <img
              alt="large-tube"
              src="/images/icons/inventory_browser_icons/tube-large.svg"
            />
            <div className="tube-details">
              <LabeledInput label="Tube Name">
                <div className="text">
                  {this.props.container.get('label') ||
                    this.props.container.get('id')}
                </div>
              </LabeledInput>
              <LabeledInput label="Tube Type">
                <div className="text">
                  {this.props.container.getIn(['container_type', 'id'])}
                </div>
              </LabeledInput>
              <LabeledInput label="Storage Temp">
                <div className="text">
                  {this.props.container.get('storage_condition')}
                </div>
              </LabeledInput>
              <LabeledInput label="Volume">
                <div className="text">
                  {this.props.aliquots.getIn([0, 'volume_ul'])}
                </div>
              </LabeledInput>
              <Button
                type="primary"
                size="medium"
                className="select-well"
                disabled={this.isSelected()}
                onClick={() => {
                  const isSelected = true;
                  return this.props.onContainerSelected(
                    this.props.container.get('id'),
                    isSelected
                  );
                }}
              >
                {this.isSelected() ? 'Tube Selected' : 'Use Tube'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }
}

function filterCompoundIds(inputValues, filterIds = []) {
  return _.chain(inputValues.get('compoundIds') || [])
    .split(' ')
    .filter(e => !_.isEmpty(e) && !filterIds.includes(e))
    .each(e => _.trim(e))
    .uniq()
    .join(' ')
    .value();
}

function getCompoundIds(inputValues) {
  return _.chain(inputValues.get('compoundIds') || [])
    .split(' ')
    .filter(e => !_.isEmpty(e))
    .each(e => _.trim(e))
    .uniq()
    .value();
}

function constructCompoundLinkErrorMsg(errorIds) {
  return `The following Compound ${inflect('ID', errorIds.length)} you attempted to \
          link to this container ${inflect('do', errorIds.length, 'do', 'does')} not exist: ${_.join(errorIds, ',')}`;
}

const TubeCreateLogic = {
  // Defaults and validation logic so that TubeCreate's parents can own state.

  initialInputValues(containerTypeId, testMode) {
    return Immutable.fromJS({
      name: undefined,
      storage: ContainerStore.defaultStorageCondition,
      volume: undefined,
      force_validate: false,
      containerType: containerTypeId || 'micro-1.5',
      test_mode: testMode == true,
      emptyMassMg: undefined
    });
  },

  errorMsg(value, validatorsSubset, optional) {
    if (optional && value == undefined) {
      return undefined;
    }

    for (const validator of Array.from(validatorsSubset)) { // eslint-disable-line no-restricted-syntax
      const msg = validator(value);
      if (msg != undefined) {
        return msg;
      }
    }
    return undefined;
  },

  errors(inputValues, containerType, minMass, minVolume) {
    const volume = inputValues.get('volume');
    const mass = inputValues.get('mass');
    const { volumeError, massError } = PlateCreateLogic.massVolumeError(mass, volume, containerType.get('well_volume_ul'), minMass, minVolume);
    return Immutable.fromJS({
      name: this.nameError(inputValues.get('name')),
      volume: volumeError,
      mass: massError,
      storage: this.storageError(inputValues.get('storage')),
      linkError: this.onCompoundLinkError(inputValues.get('linkError')),
      emptyMassMg: this.emptyMassMgError(inputValues.get('emptyMassMg')),
      containerType: this.retiredContainerTypeError(containerType)
    });
  },

  emptyMassMgError(emptyMass) {
    const isEmpty = PlateCreateLogic.isEmptyMassOrVolume(emptyMass);

    if (!isEmpty) {
      return PlateCreateLogic.isEmptyMassMgPositive(emptyMass);
    }
    return undefined;
  },

  nameError(name) {
    return this.errorMsg(name, [
      validators.non_empty,
      validators.not_too_long,
      validators.no_slashes,
      validators.no_commas
    ]);
  },

  retiredContainerTypeError(containerType) {
    return containerType.get('retired_at') !== null ? 'is not usable' : undefined;
  },

  storageError(storage) {
    return this.errorMsg(storage, [validators.storage_condition]);
  },

  onCompoundLinkError(compoundLinkFailedIds = []) {
    return compoundLinkFailedIds.length ? constructCompoundLinkErrorMsg(compoundLinkFailedIds) : undefined;
  },

  containerTypeError(containerType) {
    return this.errorMsg(containerType, [validators.container_type]);
  },

  isValid(inputValues, containerType) {
    const errors = this.errors(inputValues, containerType);
    return errors.get('name') == undefined && errors.get('volume') == undefined;
  },

  forceErrors(inputValues) {
    return inputValues.set('force_validate', true);
  },

  buildContainer(inputValues) {
    const volume = Unit.toScalar(inputValues.get('volume'), 'microliter');
    const mass = Unit.toScalar(inputValues.get('mass'), 'milligram');
    const emptyMassMg = Unit.toScalar(inputValues.get('emptyMassMg'), 'milligram');
    return {
      label: inputValues.get('name'),
      container_type: inputValues.get('containerType'),
      storage_condition: inputValues.get('storage'),
      lab_id: inputValues.get('lab_id'),
      compound_ids: getCompoundIds(inputValues),
      empty_mass_mg: emptyMassMg,
      aliquots: {
        0: {
          name: inputValues.get('name'),
          well_idx: 0,
          volume_ul: volume,
          mass_mg: mass,
          properties: inputValues.get('properties', Immutable.Map())
        }
      },
      test_mode: inputValues.get('test_mode')
    };
  },

  buildContainerWithBulkCreateContainerPayLoad(inputValues) {
    const volume = Unit.toScalar(inputValues.get('volume'), 'microliter');
    const mass = Unit.toScalar(inputValues.get('mass'), 'milligram');
    const emptyMassMg = Unit.toScalar(inputValues.get('emptyMassMg'), 'milligram');
    const properties = inputValues.get('properties', Immutable.Map()).toJS();
    const internalSuggestedBarcode = properties.InternalSuggestedBarcode;
    return {
      label: inputValues.get('name'),
      container_type: inputValues.get('containerType'),
      storage_condition: inputValues.get('storage'),
      lab_id: inputValues.get('lab_id'),
      compound_ids: getCompoundIds(inputValues),
      empty_mass_mg: emptyMassMg,
      suggested_barcode: internalSuggestedBarcode && internalSuggestedBarcode.toString(),
      aliquots: [
        {
          name: inputValues.get('name'),
          well_idx: 'A01',
          volume_ul: volume,
          mass_mg: mass,
          properties: Immutable.fromJS(_.omit(properties, 'InternalSuggestedBarcode'))
        }
      ],
      test_mode: inputValues.get('test_mode')
    };
  },

  containerToInputValues(container) {
    const left = container.getIn(['aliquots', 0, 'volume_ul']);
    const volume = left != undefined ? left : '';

    return Immutable.fromJS({
      name: container.get('label'),
      containerType: container.get('container_type_id'),
      storage: container.get('storage_condition'),
      volume: `${volume}:microliter`
    });
  }
};

class TubeCreate extends React.Component {

  constructor(props, context) {
    super(props, context);
    this.removeError = this.removeError.bind(this);
    this.state = {
      showBarcode: undefined
    };
  }

  componentDidMount() {
    const properties = this.props.inputValues.get(
      'properties',
      Immutable.Map()
    );
    const barcode = properties.get('InternalSuggestedBarcode');
    if (barcode) {
      this.setState({ showBarcode: true });
    }
  }

  componentDidUpdate(_) {
    const properties = this.props.inputValues.get(
      'properties',
      Immutable.Map()
    );
    const barcode = properties.get('InternalSuggestedBarcode');
    if (barcode && !this.state.showBarcode) {
      this.viewBarcode(true);
    }
  }

  viewBarcode(value) {
    this.setState({ showBarcode: value });
  }

  inputChange(name, value) {
    name = _.flattenDeep([name]);
    return this.props.onInputValuesChange(
      this.props.inputValues.setIn(name, value)
    );
  }

  removeError() {
    const errorIds = this.props.inputValues.get('linkError');
    return this.props.onInputValuesChange(
      this.props.inputValues.set('linkError', [])
        .set('compoundIds', filterCompoundIds(this.props.inputValues, errorIds))
    );
  }

  onCompoundsChange(ids) {
    return this.props.onInputValuesChange(
      this.props.inputValues.set('linkError', []).set('compoundIds', ids)
    );
  }

  getAliquotProperties(properties) {
    const propEntries = [];
    properties.forEach((value, key) => {
      propEntries.push({ key, value });
    });
    return propEntries;
  }

  renderPropertiesSection() {
    let properties = this.props.inputValues.get(
      'properties',
      Immutable.Map()
    );
    properties = properties.delete('InternalSuggestedBarcode');
    if (properties.isEmpty()) {
      return undefined;
    }

    const entries = this.getAliquotProperties(properties);
    return (
      <div className="tx-stack">
        <h3 className="tx-stack__block--sm">Aliquot Properties</h3>
        <KeyValueList entries={entries} />
      </div>
    );
  }

  render() {
    const properties = this.props.inputValues.get(
      'properties',
      Immutable.Map()
    );
    const { showBarcode } = this.state;
    const internalSuggestedBarcode = properties.get('InternalSuggestedBarcode');

    const errors = TubeCreateLogic.errors(
      this.props.inputValues,
      this.props.containerType,
      this.props.mass,
      this.props.volume
    );
    return (
      <div>
        <div className="tube-create">
          <If condition={this.props.inputValues.get('linkError') && this.props.inputValues.get('linkError').length}>
            <Banner
              bannerType="error"
              bannerMessage={constructCompoundLinkErrorMsg(this.props.inputValues.get('linkError'))}
              onClose={this.removeError}
            />
          </If>
          <div className="tube-details-container">
            <img
              alt="large-tube"
              src="/images/icons/inventory_browser_icons/tube-large.svg"
            />
            <div className="tube-details">
              <Validated
                error={errors.get('name')}
                force_validate={this.props.inputValues.get('force_validate')}
              >
                <LabeledInput label="Tube Name">
                  <CharControllableInput
                    disabled={this.props.disabled}
                    value={this.props.inputValues.get('name')}
                    illegalChars={['/']}
                    onChange={value => this.inputChange('name', value)}
                  />
                </LabeledInput>
              </Validated>
              <Validated
                error={errors.get('containerType')}
                force_validate={this.props.inputValues.get('force_validate')}
              >
                <LabeledInput label="Container Type">
                  <CharControllableInput
                    disabled
                    value={this.props.inputValues.get('containerType')}
                    onChange={value => this.inputChange('containerType', value)}
                  />
                </LabeledInput>
              </Validated>
              <Validated
                error={errors.get('storage')}
                force_validate={this.props.inputValues.get('force_validate')}
              >
                <LabeledInput label="Storage Temp">
                  <SelectStorage
                    disabled={this.props.disabled}
                    value={this.props.inputValues.get('storage')}
                    onChange={e => this.inputChange('storage', e.target.value)}
                  />
                </LabeledInput>
              </Validated>
              <Validated
                error={errors.get('volume')}
                force_validate={this.props.inputValues.get('force_validate')}
              >
                <LabeledInput label="Volume">
                  <InputWithUnits
                    dimension="volume"
                    disabled={this.props.disabled}
                    value={this.props.inputValues.get('volume')}
                    onChange={e => this.inputChange('volume', e.target.value)}
                  />
                </LabeledInput>
              </Validated>
              <Validated
                error={errors.get('mass')}
                force_validate={this.props.inputValues.get('force_validate')}
              >
                <LabeledInput label="Mass">
                  <InputWithUnits
                    dimension="mass"
                    disabled={this.props.disabled}
                    value={this.props.inputValues.get('mass') || ':milligram'}
                    onChange={e => this.inputChange('mass', e.target.value)}
                  />
                </LabeledInput>
              </Validated>
              {showBarcode && internalSuggestedBarcode && (
                <Validated
                  force_validate={internalSuggestedBarcode}
                >
                  <LabeledInput label="Suggested Barcode">
                    <TextInput  disabled type="text" value={internalSuggestedBarcode} />
                  </LabeledInput>
                </Validated>
              )}
              {this.renderPropertiesSection()}
            </div>
          </div>
        </div>
        <TubeCompoundView
          existingCompoundIds={getCompoundIds(this.props.inputValues)}
          onError={ids => this.inputChange('linkError', ids)}
          onCompoundsChange={ids => { this.onCompoundsChange(ids); }}
          key={this.props.inputValues.get('uniq-key')}
          hideCompoundLink={this.props.hideCompoundLink}
          compoundLinkId={this.props.compoundLinkId}
          getLinkedCompoundArray={this.props.getLinkedCompoundArray}
          linkedCompoundsArray={this.props.linkedCompoundsArray}
          containerArray={this.props.containerArray}
          containerIndex={this.props.containerIndex}
          deletedIndex={this.props.deletedIndex}
        />
      </div>
    );
  }
}

TubeCreate.propTypes = {
  inputValues: PropTypes.instanceOf(Immutable.Map).isRequired,
  onInputValuesChange: PropTypes.func,
  disabled: PropTypes.bool,
  containerType: PropTypes.instanceOf(Immutable.Map).isRequired,
  mass: PropTypes.number,
  volume: PropTypes.number,
  hideCompoundLink: PropTypes.bool,
  compoundLinkId: PropTypes.arrayOf(PropTypes.string),
  containerArray: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  containerIndex: PropTypes.number.isRequired,
  deletedIndex: PropTypes.number,
  getLinkedCompoundArray: PropTypes.func.isRequired,
  linkedCompoundsArray: PropTypes.arrayOf(PropTypes.instanceOf(Object))
};

export { TubeView, TubeCreate, TubeCreateLogic };
