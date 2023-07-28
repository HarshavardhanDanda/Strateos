import * as Immutable from 'immutable';

import { validators, SimpleInputsValidator } from 'main/components/validation';

const AddressCreateFormLogic = {
  initialInputValues: () =>
    Immutable.Map({
      attention: '',
      street1: '',
      street2: '',
      city: '',
      zip: '',
      country: 'US', // Sets the default country to United States of America
      state: '',
      force_validate: false,
      is_default: false
    }),
  validator:
    SimpleInputsValidator({
      attention: { validators: [validators.non_empty] },
      street1:   { validators: [validators.non_empty] },
      street2:   { validators: [] },
      city:      { validators: [validators.non_empty] },
      zip:       { validators: [validators.non_empty] },
      country:   { validators: [validators.non_empty] },
      state:     { validators: [validators.non_empty] }
    }),
  isValid: inputValues => AddressCreateFormLogic.validator.isValid(inputValues),
  toAddress: inputValues =>
    Immutable.Map({
      attention:    inputValues.get('attention'),
      street:       inputValues.get('street1'),
      street_2:     inputValues.get('street2'),
      city:         inputValues.get('city'),
      state:        inputValues.get('state'),
      zipcode:      inputValues.get('zip'),
      country:      inputValues.get('country'),
      is_default:   inputValues.get('is_default')
    })
};

export default AddressCreateFormLogic;
