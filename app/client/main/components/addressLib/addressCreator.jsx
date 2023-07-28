import _              from 'lodash';
import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

import { Button, Checkbox } from '@transcriptic/amino';

import { sentencesFromRailsError } from 'main/util/errors';
import AddressCreateFormLogic from './addressCreateFormLogic';
import AddressCreateForm from './addressCreateForm';
import AddressCreateFormNew from './addressCreateFormNew';

class AddressCreator extends React.Component {
  static get propTypes() {
    return {
      onAddressCreated: PropTypes.func,
      createAddress: PropTypes.func.isRequired,
      updateAddress: PropTypes.func.isRequired,
      newAddressForm: PropTypes.bool,
      customerOrganization: PropTypes.instanceOf(Immutable.Map)
    };
  }

  constructor(props) {
    super(props);
    const { data } = props;
    let inputValues = AddressCreateFormLogic.initialInputValues();
    let id;
    if (data) {
      id = data.get('id');
      inputValues = Immutable.Map({
        attention: data.get('attention'),
        street1: data.get('street'),
        street2: data.get('street_2'),
        city: data.get('city'),
        zip: data.get('zipcode'),
        country: data.get('country'),
        state: data.get('state'),
        force_validate: false
      });
    }

    this.state = {
      inputValues: inputValues,
      id: id,
      error: undefined,
      defaultAddress: false
    };
    this.onInputValuesChanged = this.onInputValuesChanged.bind(this);
    this.saveOrUpdate = this.saveOrUpdate.bind(this);
  }

  onInputValuesChanged(values) {
    this.setState({ inputValues: this.state.inputValues.merge(Immutable.Map(values)) });
  }

  saveOrUpdate(next) {
    const { customerOrganization } = this.props;
    const customerOrgId = customerOrganization ? customerOrganization.get('id') : undefined;
    const customerSubdomain = customerOrganization ? customerOrganization.get('subdomain') : undefined;
    if (AddressCreateFormLogic.isValid(this.state.inputValues)) {
      const values = AddressCreateFormLogic.toAddress(this.state.inputValues);
      const promise = this.state.id ?
        this.props.updateAddress(this.state.id, values, customerOrgId, customerSubdomain) :
        this.props.createAddress(values, customerOrgId, customerSubdomain);

      return promise
        .then(address => {
          this.props.onAddressCreated && this.props.onAddressCreated(new Map(Object.entries(address)));
          next && next();
        }).fail(xhr => {
          this.setState({ error: sentencesFromRailsError(xhr) });
          next && next();
        });
    } else {
      this.setState({ inputValues: this.state.inputValues.set('force_validate', true) });
      next && next();
      return Promise.reject();
    }
  }

  render() {
    return (
      <div>
        <p className="tx-type--secondary">We can only ship to commercial addresses.</p>
        {this.props.newAddressForm ?
          (
            <React.Fragment>
              <AddressCreateFormNew
                inputValues={this.state.inputValues}
                error={this.state.error}
                onInputValuesChanged={this.onInputValuesChanged}
              />
              <div className="row">
                <div className="col-md-12">
                  <Checkbox
                    checked={this.state.defaultAddress ? 'checked' : 'unchecked'}
                    size="small"
                    label="Make this my default address"
                    id="defaultAddress"
                    name="defaultAddress"
                    onChange={() => {
                      this.setState({ defaultAddress: !this.state.defaultAddress });
                      this.onInputValuesChanged({ is_default:  !this.state.inputValues.get('is_default') });
                    }}
                  />
                </div>
              </div>
            </React.Fragment>
          )
          :
          (
            <React.Fragment>
              <AddressCreateForm
                inputValues={this.state.inputValues}
                error={this.state.error}
                onInputValuesChanged={this.onInputValuesChanged}
              />
              <Button type="primary" size="small" waitForAction onClick={this.saveOrUpdate}>
                <span>Ship to this Address</span>
              </Button>
            </React.Fragment>
          )
        }
      </div>
    );
  }
}

AddressCreator.defaultProps = {
  newAddressForm: false
};

export default AddressCreator;
