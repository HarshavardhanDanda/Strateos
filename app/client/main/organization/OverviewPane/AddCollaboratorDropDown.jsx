import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { Select, Validated, TextInput, Button, DropDown, Banner } from '@transcriptic/amino';
import { validators, SimpleInputsValidator } from 'main/components/validation';
import AccessControlActions from 'main/actions/AccessControlActions';
import LabStore       from 'main/stores/LabStore';
import ConnectToStoresHOC from 'main/containers/ConnectToStoresHOC';
import { fromXHR } from 'main/util/ajax/Errors/Errors';
import './AddCollaboratorDropDown.scss';

class AddCollaboratorDropDown extends React.Component {

  static get propTypes() {
    return {
      onCreate: PropTypes.func.isRequired,
      emails:   PropTypes.instanceOf(Immutable.Iterable)
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      showForm: false,
      name: undefined,
      featureGroups: [],
      featureGroupId: undefined,
      labId: undefined,
      email: '',
      privilege: undefined,
      forceValidate: false,
      addCollaboratorError: undefined
    };

    this.onCreate = this.onCreate.bind(this);
    this.makeValidationMap = this.makeValidationMap.bind(this);
    this.validator = this.validator.bind(this);
    this.resetFormFields = this.resetFormFields.bind(this);
    this.showDismissable = this.showDismissable.bind(this);
    this.hideDismissable = this.hideDismissable.bind(this);
    this.setFeatureGroupId = this.setFeatureGroupId.bind(this);
    this.setDropDownRef = element => {
      this.parentNode = element;
    };
  }

  componentDidMount() {
    const { customerOrganizationId } = this.props;
    const action = customerOrganizationId ? AccessControlActions.loadFeatureGroupsByOrgId(customerOrganizationId) :
      AccessControlActions.loadFeatureGroups();
    action.done((response) => {
      const featureGroups = response.content;
      const { labs } = this.props;
      const privilege = featureGroups[0].label.toLowerCase();
      const featureGroupId = featureGroups[0].id;
      this.setState({ featureGroups, featureGroupId, privilege, labId: this.isLabContext(featureGroupId) ? labs.getIn([0, 'id']) : undefined });
    });
  }

  hideDismissable() {
    this.setState({ showForm: false });
    this.resetFormFields();
  }

  showDismissable() {
    this.setState({ showForm: true });
  }

  onCreate() {
    const { name, email, featureGroupId, labId } = this.state;
    const valid = this.validator().isValid(this.makeValidationMap());
    if (valid) {
      return this.props.onCreate(name, email, featureGroupId, labId)
        .fail((xhr, status, text) => {
          this.setState({ addCollaboratorError: fromXHR(xhr, status, text)[0] });
        })
        .done(() => {
          this.resetFormFields();
          AccessControlActions.loadUser_acl();
        });
    } else {
      return this.setState({ forceValidate: true });
    }
  }

  setFeatureGroupId(e) {
    const { value } = e.target;
    const { featureGroups } = this.state;
    const { labs } = this.props;

    const privilege = featureGroups.filter(group => group.id === value)[0].label.toLowerCase();

    this.setState({ featureGroupId: value, labId: this.isLabContext(value) ? labs.getIn([0, 'id']) : undefined, privilege });
  }

  isLabContext(featureGroupId) {
    const { featureGroups } = this.state;
    return featureGroups.filter(group => group.context === 'LAB').map(group => group.id).includes(featureGroupId);
  }

  resetFormFields() {
    const { featureGroups } = this.state;
    const { labs } = this.props;
    const featureGroupsDependant = {};
    if (featureGroups.length) {
      featureGroupsDependant.privilege = featureGroups[0].label.toLowerCase();
      featureGroupsDependant.featureGroupId = featureGroups[0].id;
      featureGroupsDependant.labId = this.isLabContext(featureGroups[0].id) ? labs.getIn([0, 'id']) : undefined;
    }
    this.setState({
      ...featureGroupsDependant,
      name: undefined,
      email: '',
      forceValidate: false,
      showForm: false,
      addCollaboratorError: undefined
    });
  }

  makeValidationMap() {
    const { labId } = this.state;
    const labName = labId ? this.props.labs.find((l) => l.get('id') === labId).get('name') : undefined;
    return Immutable.Map({ email: `${this.state.email.toLowerCase()}_${_.startCase(_.camelCase(this.state.privilege))}_${labName}` });
  }

  validator() {
    const duplicateEmailError = 'Collaborator already exists in your organization';

    return SimpleInputsValidator({
      email: {
        validators: [
          validators.non_empty,
          validators.email,
          validators.uniqueness(this.props.existingCollaborators.toJS(), duplicateEmailError)
        ]
      }
    });
  }

  render() {
    const { labs } = this.props;
    const { featureGroups, featureGroupId, labId } = this.state;
    const errors = this.validator().errors(this.makeValidationMap());
    return (
      <div className="add-collaborator-form" ref={this.setDropDownRef}>
        <Button
          type="default"
          size="small"
          height="tall"
          heavy
          link
          onClick={() => this.setState({ showForm: true })}
        >
          <span>Add Collaborator <i className="fa fa-angle-down" /></span>
        </Button>
        <DropDown
          isOpen={this.state.showForm}
          excludedParentNode={this.parentNode}
          hideDismissable={this.hideDismissable}
        >
          <div className="tx-stack tx-stack--sm tx-inset--xxs tx-inset--square">
            <p className="tx-type--secondary tx-type--default">
              Enter your collaborator’s email address to invite them to this organization.
            </p>
            <div className="add-row tx-inline tx-inline--md">
              <div className="add-row__mail">
                <Validated
                  error={errors.email}
                  force_validate={this.state.forceValidate}
                >
                  <TextInput
                    name="email"
                    value={this.state.email}
                    placeholder="Email"
                    onChange={e => this.setState({ email: e.target.value })}
                  />
                </Validated>
              </div>
              <div className="add-row__feature-group">
                <Select
                  value={featureGroupId}
                  options={featureGroups.map(group => ({ name: group.label, value: group.id }))}
                  onChange={this.setFeatureGroupId}
                />
              </div>
              <If condition={this.isLabContext(featureGroupId)}>
                <div className="add-row__lab">
                  <Select
                    value={labId}
                    options={labs.map(lab => ({ name: lab.get('name'), value: lab.get('id') }))}
                    onChange={e => this.setState({ labId: e.target.value })}
                  />
                </div>
              </If>
            </div>
            {
              (this.state.addCollaboratorError !== undefined) && (
                <Banner
                  bannerType="error"
                  bannerMessage={this.state.addCollaboratorError}
                  onClose={(event) => {
                    event.stopPropagation();
                    this.setState({ addCollaboratorError: undefined });
                  }}
                />
              )
            }
            <div className="add-collaborator-form__button">
              <Button
                type="action"
                size="small"
                height="standard"
                heavy
                icon="fa-plus"
                onClick={this.onCreate}
              >
                Invite
              </Button>
            </div>
          </div>
        </DropDown>
      </div>
    );
  }
}

AddCollaboratorDropDown.defaultProps = {
  labs: Immutable.Map({})
};

const getStateFromStores = () => {

  const labs = LabStore.getAll();
  return { labs };
};

export default ConnectToStoresHOC(AddCollaboratorDropDown, getStateFromStores);
export  { AddCollaboratorDropDown };
