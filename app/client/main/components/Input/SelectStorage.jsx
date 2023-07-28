import React from 'react';
import PropTypes from 'prop-types';

import ContainerStore  from 'main/stores/ContainerStore';

import { Select } from '@transcriptic/amino';

function SelectStorage(props) {
  return (
    <Select
      name={props.name}
      className={props.className}
      onChange={props.onChange}
      value={props.value}
      disabled={props.disabled}
      options={ContainerStore.validStorageConditions}
    />
  );
}

SelectStorage.propTypes = {
  name: PropTypes.string,
  className: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  disabled: PropTypes.bool
};

export default SelectStorage;
