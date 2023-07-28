import PropTypes from 'prop-types';
import React     from 'react';
import Immutable from 'immutable';

class AddressEnvelope extends React.Component {
  render() {

    const { labOperatorName, address } = this.props;
    const { attention, street, street_2, city, state, zipcode } = address.toJS();
    return (
      <div className="address-envelope">
        <div className="envelope-text">
          <div>{labOperatorName}</div>
          <div>
            ATTN: {attention} Accessioning{' '}
            <strong className="intake-code">{this.props.intakeCode}</strong>
          </div>
          {!!street && (
            <div>
              {street}
            </div>
          )}
          {!!street && (
            <div>
              {street_2}
            </div>
          )}
          <div>{[city, state, zipcode].filter(val => !!val).join(', ')}</div>
        </div>
      </div>
    );
  }
}
AddressEnvelope.defaultProps = {
  address: Immutable.Map()
};

AddressEnvelope.propTypes = {
  intakeCode: PropTypes.string.isRequired,
  address: PropTypes.instanceOf(Immutable.Map),
  labOperatorName: PropTypes.string
};

export default AddressEnvelope;
