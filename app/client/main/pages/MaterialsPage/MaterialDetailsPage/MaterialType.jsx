import React from 'react';
import PropTypes from 'prop-types';
import { Button, LabeledInput, Select } from '@transcriptic/amino';

function MaterialType(props) {

  const getType = (value) => {
    return types.find((type) => type.value === value).name;
  };

  const types = [{ name: 'Individual', value: 'individual' }, { name: 'Group', value: 'group' }];

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-2">
          <LabeledInput label="TYPE">
            <Choose>
              <When condition={props.disabled}>
                <p className="tx-type--secondary">
                  {getType(props.type)}
                </p>
              </When>
              <Otherwise>
                <Select
                  options={types}
                  value={props.type}
                  onChange={e => props.onChange(e.target.value)}
                  placeholder="Select type"
                />
              </Otherwise>
            </Choose>
          </LabeledInput>
        </div>
        { props.showCheckIn  && <Button type="primary" disabled={props.disableCheckin} onClick={() => props.onCheckIn()}>Checkin</Button>}
      </div>
    </div>
  );
}

MaterialType.propTypes = {
  type: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  showCheckIn: PropTypes.bool,
  onCheckIn: PropTypes.func,
  disableCheckin: PropTypes.bool
};

export default MaterialType;
