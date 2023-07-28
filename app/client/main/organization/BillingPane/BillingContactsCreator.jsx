import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { LabeledInput, Validated, TextInput } from '@transcriptic/amino';
import { validators, SimpleInputsValidator } from 'main/components/validation';
import BillingContactActions from 'main/actions/BillingContactActions';

class BillingContactsCreator extends React.Component {

  constructor(props) {
    super(props);
    const { data } = props;
    let id;
    let name;
    let email;
    if (data) {
      id = data.get('id');
      name = data.get('name');
      email = data.get('email');
    }

    this.state = { id: id, name: name, email: email, forceValidate: false, waitingOnSubmit: false };
  }

  billingEmails() {
    const { billingContacts, data } = this.props;
    const { id } = this.state;
    const billingEmails = billingContacts.map(contact => contact.get('email'));
    return (id ? billingEmails.filter(email => email !== data.get('email')) : billingEmails);
  }

  validator() {
    const duplicateEmailError = 'Email is in use by another billing contact in your organization';
    return SimpleInputsValidator({
      name:  { validators: [validators.non_empty] },
      email: {
        validators: [
          validators.email,
          validators.uniqueness(this.billingEmails().toJS(), duplicateEmailError)
        ]
      }
    });
  }

  saveOrUpdate() {
    const isValid = this.validator().isValid(Immutable.Map(this.state));

    if (isValid) {
      this.setState({ waitingOnSubmit: true });
      return this.state.id ? this.updateBillingContact() : this.addBillingContact();
    }

    return this.setState({ forceValidate: true });
  }

  updateBillingContact() {
    return BillingContactActions.updateBillingContact(this.state.id, {
      name: this.state.name,
      email: this.state.email
    }, this.props.subdomain, this.props.customerOrganizationId).always(() => this.setState({ id: undefined, name: undefined, email: undefined, waitingOnSubmit: false }));
  }

  addBillingContact() {
    return BillingContactActions.createBillingContact({
      name: this.state.name,
      email: this.state.email,
    }, this.props.subdomain, this.props.customerOrganizationId).always(() => this.setState({ name: undefined, email: undefined, waitingOnSubmit: false }));
  }

  render() {
    const errors = this.validator().errors(Immutable.Map(this.state));
    return (
      <div className="modal-dialog">
        <form>
          <Validated erorr={errors.name} force_validate={this.state.forceValidate}>
            <LabeledInput label="Name">
              <TextInput
                value={this.state.name}
                onChange={e => this.setState({ name: e.target.value })}
              />
            </LabeledInput>
          </Validated>
          <Validated error={errors.email} force_validate={this.state.forceValidate}>
            <LabeledInput label="Email">
              <TextInput
                value={this.state.email}
                onChange={e => this.setState({ email: e.target.value })}
              />
            </LabeledInput>
          </Validated>
        </form>
      </div>
    );
  }
}

BillingContactsCreator.propTypes = {
  billingContacts: PropTypes.instanceOf(Immutable.Iterable).isRequired
};

export default BillingContactsCreator;
