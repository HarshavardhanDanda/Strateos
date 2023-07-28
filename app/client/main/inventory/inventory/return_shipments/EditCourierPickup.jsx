import PropTypes from 'prop-types';
import React     from 'react';

import { LabeledInput, TextInput } from '@transcriptic/amino';
import courierCopy from 'main/inventory/inventory/return_shipments/courierCopy';

function EditCourierPickup({ courierName, onChangeCourierName }) {
  return (
    <div className="vertical-spaced-list">
      <LabeledInput
        label="Courier Company Name"
      >
        <TextInput
          placeholder="Courier Company Name"
          value={courierName || ''}
          onChange={e => onChangeCourierName(e.target.value)}
          autoFocus // eslint-disable-line jsx-a11y/no-autofocus
        />
      </LabeledInput>
      <h3>{courierCopy}</h3>
    </div>
  );
}

EditCourierPickup.propTypes = {
  courierName:         PropTypes.string,
  onChangeCourierName: PropTypes.func.isRequired
};

export default EditCourierPickup;
