import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Checkbox,
  Tooltip
} from '@transcriptic/amino';

import Hazards from 'main/util/Hazards';

class LocationBlacklistForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = { formValue: this.props.blacklist };
  }

  render() {
    const { formValue } = this.state;

    return (
      <div>
        {
          Hazards.map(hazard => {
            const { queryTerm, display } = hazard;
            const required = this.props.ancestorBlacklist.includes(queryTerm);
            const checked = required || formValue.includes(queryTerm);

            const component = (
              <Checkbox
                id={queryTerm}
                name={queryTerm}
                label={display}
                checked={checked ? 'checked' : 'unchecked'}
                disabled={required}
                onChange={e => {
                  const newFormValue = e.target.checked ? [...formValue, queryTerm] : formValue.filter(val => val !== queryTerm);
                  this.setState({ formValue: newFormValue }, () => {
                    this.props.onChange(newFormValue);
                  });
                }}
              />
            );

            return (
              <div key={queryTerm}>
                {required ? (
                  <Tooltip title="Required by ancestor location" placement="top">
                    {component}
                  </Tooltip>
                ) : component}
              </div>
            );
          })
        }
      </div>
    );
  }
}

LocationBlacklistForm.propTypes = {
  ancestorBlacklist: PropTypes.arrayOf(PropTypes.string).isRequired,
  blacklist: PropTypes.arrayOf(PropTypes.string)
};

LocationBlacklistForm.defaultProps = {
  blacklist: []
};

export default LocationBlacklistForm;
