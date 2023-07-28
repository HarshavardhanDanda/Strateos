import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import Urls from 'main/util/urls';
import SessionStore from 'main/stores/SessionStore';
import { LabeledInput, Button, TextInput } from '@transcriptic/amino';
import { validators } from 'main/components/validation';
import PackageActions from 'main/actions/PackageActions';

class CreateNewPackage extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.onSubmit = this.onSubmit.bind(this);
    this.calcNameError = this.calcNameError.bind(this);
    this.calcDescriptionError = this.calcDescriptionError.bind(this);

    this.state = {
      name: undefined,
      description: '',
      submitting: false
    };
  }

  onSubmit(doneCallback) {
    this.setState({
      submitting: true
    });
    return PackageActions.create({
      name: `${SessionStore.getOrg().get('group')}.${this.state.name}`,
      description: this.state.description
    })
      .done((_package) => {
        return this.context.router.history.push(Urls.package(_package.id));
      })
      .fail(() => {
        doneCallback();
        return this.setState({
          submitting: false
        });
      });
  }

  calcNameError() {
    return validators.package_name(this.state.name, this.props.reservedNames);
  }

  calcDescriptionError() {
    return validators.not_too_long(this.state.description);
  }

  render() {
    const nameError = this.calcNameError();
    const descriptionError = this.calcDescriptionError();

    return (
      <div className="vertical-spaced-list">
        <LabeledInput
          label="Package Name"
          tip="Give a unique keyword name for the package with no spaces or special characters like autoprotocol-core."
          error={this.state.name != undefined ? nameError : undefined}
        >
          <TextInput
            placeholder="autoprotocol-core"
            value={this.state.name}
            autoFocus // eslint-disable-line jsx-a11y/no-autofocus
            onChange={(e) => {
              return this.setState({
                name: e.target.value,
                validateName: true
              });
            }}
          />
        </LabeledInput>
        <LabeledInput
          label="Package Description (Optional)"
          error={this.state.description ? descriptionError : undefined}
        >
          <TextInput
            value={this.state.description}
            onChange={(e) => {
              return this.setState({
                description: e.target.value,
                shouldValidate: true
              });
            }}
          />
        </LabeledInput>
        <Button
          waitForAction
          type="primary"
          onClick={this.onSubmit}
          disabled={
            nameError != undefined ||
            descriptionError != undefined ||
            this.state.submitting
          }
        >
          Create Package
        </Button>
      </div>
    );
  }
}

CreateNewPackage.contextTypes = {
  router: PropTypes.object.isRequired
};

CreateNewPackage.propTypes = {
  reservedNames: PropTypes.instanceOf(Immutable.Iterable).isRequired
};

export default CreateNewPackage;
