import * as Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import { LabeledInput, Validated, Select, TextInput } from '@transcriptic/amino';

import AddressCreateFormLogic from './addressCreateFormLogic';

function AddressCreateFormNew(props) {

  function countryOptions() {
    const countries = Object.keys(window.ISO3166)
      .map(countryCode => window.ISO3166[countryCode])
      .sort((a, b) => {
        if (a.name < b.name) return -1;
        if (b.name < a.name) return 1;
        return 0;
      });
    countries.unshift({ value: undefined, name: '', disabled: true });
    return countries;
  }

  function stateOptions(country) {
    const states = country ? window.ISO3166[country]
      .subdivisions
      .map(state => ({ value: state, name: state })) : [];
    states.unshift({ value: undefined, name: '', disabled: true });
    return states;
  }

  function onInputValuesChanged(scope) {
    return e => props.onInputValuesChanged({ [scope]: e.target.value });
  }

  function onCountryChanged(e) {
    props.onInputValuesChanged({ country: e.target.value, state: undefined });
  }

  const errorBanner = props.error ?
    (<div className="alert alert-danger">{props.error}</div>) : undefined;
  const errors = AddressCreateFormLogic.validator.errors(props.inputValues);
  const forceValidate = props.inputValues.get('force_validate');

  return (
    <div className="address-create-form tx-stack tx-stack--xxs">
      {errorBanner}
      <div className="row">
        <div className="col-md-8">
          <Validated force_validate={forceValidate} error={errors.attention}>
            <LabeledInput label="Full name">
              <TextInput
                placeholder="First and Last name"
                value={props.inputValues.get('attention')}
                onChange={onInputValuesChanged('attention')}
              />
            </LabeledInput>
          </Validated>
        </div>
      </div>
      <div className="row">
        <div className="col-md-8">
          <Validated force_validate={forceValidate} error={errors.street1}>
            <LabeledInput label="Address">
              <TextInput
                placeholder="Street address or PO box"
                value={props.inputValues.get('street1')}
                onChange={onInputValuesChanged('street1')}
              />
            </LabeledInput>
          </Validated>
        </div>
      </div>
      <div className="row">
        <div className="col-md-8">
          <LabeledInput label="">
            <TextInput
              placeholder="Apt, suite, unit, building, floor, etc."
              value={props.inputValues.get('street2')}
              onChange={onInputValuesChanged('street2')}
            />
          </LabeledInput>
        </div>
      </div>
      <div className="row">
        <div className="col-md-3">
          <Validated className="city" force_validate={forceValidate} error={errors.city}>
            <LabeledInput label="City">
              <TextInput
                placeholder=""
                value={props.inputValues.get('city')}
                onChange={onInputValuesChanged('city')}
              />
            </LabeledInput>
          </Validated>
        </div>
        <div className="col-md-2">
          <Validated className="state" force_validate={forceValidate} error={errors.state}>
            <LabeledInput label="State">
              <Select
                value={props.inputValues.get('state')}
                options={stateOptions(props.inputValues.get('country'))}
                onChange={onInputValuesChanged('state')}
              />
            </LabeledInput>
          </Validated>
        </div>
        <div className="col-md-3">
          <Validated className="zip" force_validate={forceValidate} error={errors.zip}>
            <LabeledInput label="ZIP Code">
              <TextInput
                placeholder=""
                value={props.inputValues.get('zip')}
                onChange={onInputValuesChanged('zip')}
              />
            </LabeledInput>
          </Validated>
        </div>
      </div>
      <div className="row">
        <div className="col-md-3">
          <LabeledInput className="county" label="Country">
            <Select
              value={props.inputValues.get('country')}
              options={countryOptions()}
              onChange={onCountryChanged}
              disabled
            />
          </LabeledInput>
        </div>
      </div>
    </div>
  );
}

AddressCreateFormNew.propTypes = {
  inputValues:          PropTypes.instanceOf(Immutable.Map).isRequired,
  error:                PropTypes.string,
  onInputValuesChanged: PropTypes.func.isRequired
};

export default AddressCreateFormNew;
