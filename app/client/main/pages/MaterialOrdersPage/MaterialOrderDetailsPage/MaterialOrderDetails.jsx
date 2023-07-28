import React from 'react';
import PropTypes from 'prop-types';

import { LabeledInput, Select } from '@transcriptic/amino';

function MaterialOrderDetails(props) {

  const types = [{ name: 'Group', value: 'group' }, { name: 'Individual', value: 'individual' }];

  const getType = (value) => {
    const type = types.find(type => type.value === value);
    return type && type.name;
  };

  const getLab = (value) => {
    const lab = props.labs.find(lab => lab.id === value);
    return lab && lab.attributes.name;
  };
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
                  onChange={e => props.onChange('materialType', e.target.value)}
                  placeholder="Select type"
                />
              </Otherwise>
            </Choose>
          </LabeledInput>
        </div>
        <div className="col-sm-2">
          <LabeledInput label="LAB">
            <Choose>
              <When condition={props.disabled}>
                <p className="tx-type--secondary">
                  {getLab(props.labId)}
                </p>
              </When>
              <Otherwise>
                <Select
                  options={props.labs && props.labs.map(lab => ({ value: lab.id, name: lab.attributes.name }))}
                  value={props.labId}
                  onChange={e => props.onChange('labId', e.target.value)}
                  placeholder="Select region"
                />
              </Otherwise>
            </Choose>
          </LabeledInput>
        </div>
      </div>
    </div>
  );
}

MaterialOrderDetails.propTypes = {
  type: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default MaterialOrderDetails;
