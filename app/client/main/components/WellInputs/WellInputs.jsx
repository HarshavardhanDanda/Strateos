import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import {
  PlateSelectLogic,
  PropertiesList,
  Button,
  LabeledInput,
  Validated,
  InputWithUnits,
  TextInput
} from '@transcriptic/amino';

import PlateCreateLogic from 'main/components/PlateCreate/PlateCreateLogic';

import './WellInputs.scss';

class WellInputs extends React.Component {
  inputValue(name) {
    if (PlateSelectLogic.allSelectedSame(this.props.selectedWells, name)) {
      return this.props.selectedWells.valueSeq().getIn([0, name]);
    } else {
      return '';
    }
  }

  renderProperties() {
    if (this.props.selectedWells.count() > 1) {
      return undefined;
    }

    const well = this.props.selectedWells.first();
    const properties = well.get('properties', Immutable.Map());

    if (properties.isEmpty()) {
      return undefined;
    }

    return (
      <div className="tx-stack">
        <h3 className="tx-stack__block--sm">Aliquot Properties</h3>
        <PropertiesList properties={properties} />
      </div>
    );
  }

  render() {
    let hasError;
    const name = this.inputValue('name') || '';
    const volume = this.inputValue('volume') || ':microliter'; // 10:microliter
    const mass = this.inputValue('mass') || ':milligram';
    const { volumeError, massError } = PlateCreateLogic.massVolumeError(mass, volume, this.props.maxVolume);

    return (
      <div className="well-inputs">
        <br />
        <div className="row row-height">
          <div className="col-xs-4">
            <LabeledInput label="Aliquot Name">
              <Validated error={PlateCreateLogic.nameError(name)} force_validate={this.props.forceValidate}>
                <TextInput
                  value={name}
                  onChange={(e) => {
                    const value = e.target.value;
                    hasError = PlateCreateLogic.nameError(value) != undefined;
                    this.props.onChange('name', value, hasError);
                  }}
                />
              </Validated>
            </LabeledInput>
          </div>
          <div className="col-xs-3">
            <Validated
              error={volumeError}
              force_validate={this.props.forceValidate}
            >
              <LabeledInput label="Volume">
                <InputWithUnits
                  dimension="volume"
                  value={volume}
                  onChange={(e) => {
                    const { volumeError, massError } = PlateCreateLogic.massVolumeError(mass, e.target.value, this.props.maxVolume);
                    hasError = volumeError !== undefined || massError !== undefined;
                    return this.props.onChange('volume', e.target.value, hasError);
                  }}
                />
              </LabeledInput>
            </Validated>
          </div>
          <div className="col-xs-3">
            <Validated
              error={massError}
              force_validate={this.props.forceValidate}
            >
              <LabeledInput label="Mass">
                <InputWithUnits
                  dimension="mass"
                  value={mass}
                  onChange={(e) => {
                    const { volumeError, massError } = PlateCreateLogic.massVolumeError(e.target.value, volume, this.props.maxVolume);
                    hasError = massError !== undefined || volumeError !== undefined;
                    return this.props.onChange('mass', e.target.value, hasError);
                  }}
                />
              </LabeledInput>
            </Validated>
          </div>
        </div>
        <div className="clear-wells">
          <Button
            type="danger"
            invert
            icon="fa-times"
            onClick={this.props.onClear}
          >
            Clear selected wells
          </Button>
        </div>
        {this.renderProperties()}
      </div>
    );
  }
}

WellInputs.propTypes = {
  selectedWells: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  maxVolume: PropTypes.string,
  forceValidate: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired
};

export default WellInputs;
