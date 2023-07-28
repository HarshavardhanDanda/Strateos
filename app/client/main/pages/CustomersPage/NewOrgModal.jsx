import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import Immutable from 'immutable';
import { LabeledInput, Select, TextInput } from '@transcriptic/amino';
import { SinglePaneModal } from 'main/components/Modal';
import LabStore from 'main/stores/LabStore';
import LabAPI from 'main/api/LabAPI';
import Autocomplete from 'main/components/Autocomplete';
import ConnectToStoresHOC from 'main/containers/ConnectToStoresHOC';
import UserActions from 'main/actions/UserActions';
import OrganizationAPI from 'main/api/OrganizationAPI';
import SessionStore from 'main/stores/SessionStore';
import './NewOrgModal.scss';
import Urls from 'main/util/urls';

const propTypes = {
  modalId: PropTypes.string.isRequired
};

class NewOrgModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = this.getDefaultState();

    this.onNameChange                = this.onNameChange.bind(this);
    this.onSubdomainChange           = this.onSubdomainChange.bind(this);
    this.onUserChange                = this.onUserChange.bind(this);
    this.onKindChange                = this.onKindChange.bind(this);
    this.onCreate                    = this.onCreate.bind(this);
    this.setDefaults                 = this.setDefaults.bind(this);
    this.fetchLabs                   = this.fetchLabs.bind(this);
  }

  componentDidMount() {
    this.fetchLabs(this.state.cloudLabOperator);
  }

  getDefaultState() {
    const currentOrganization = SessionStore.getOrg();
    return {
      name: '',
      subdomain: '',
      kind: 'academic',
      creatingUserEmail: '',
      orgType: 'CL',
      customer: Immutable.Map(),
      cloudLabOperator: currentOrganization && currentOrganization.get('id'),
      customerSubdomain: undefined,
    };
  }

  onNameChange(e) {
    this.setState({ name: e.target.value });
  }

  onSubdomainChange(e) {
    this.setState({ subdomain: e.target.value });
  }

  onUserChange(email) {
    this.setState({ creatingUserEmail: email });
  }

  onSearch(value) {
    const options = {
      page: 0,
      per_page: 5,
      search: value
    };
    return UserActions.fetchUsers(options)
      .then(response => response.data.map(user => user.attributes.email));
  }

  onKindChange(e) {
    this.setState({ kind: e.target.value });
  }

  fetchLabs(operated_by) {
    LabAPI.index({
      filters: {
        operated_by_id: operated_by
      }
    }).done(response => {
      if (response.data.length > 0) {
        const [lab] = response.data;
        this.setState({
          lab_id: lab.id,
          cloudLabOperator: operated_by
        });
      }
    });
  }

  onCreate() {
    return OrganizationAPI.create({
      attributes: _.omit(this.state, 'customer', 'cloudLabOperator')
    })
      .done((response) => {
        window.location = Urls.customer_organization(response.data.id);
      });
  }

  setDefaults() {
    this.setState({ ...this.getDefaultState() });
  }

  render() {
    const labs = this.props.labs.filter((lab) => lab.get('operated_by_id') === this.state.cloudLabOperator);
    return (
      <SinglePaneModal
        modalId={this.props.modalId}
        title="New Organization"
        onAccept={this.onCreate}
        onDismissed={this.setDefaults}
        acceptText="Create Organization"
        acceptClass="btn btn-primary create-org"
        modalBodyClass="new-org-modal"
      >
        <div className="tx-stack tx-stack--xxxs">
          <LabeledInput label="Name">
            <TextInput
              id="name"
              value={this.state.name}
              placeholder="Smith Lab"
              onChange={this.onNameChange}
            />
          </LabeledInput>
          <LabeledInput label="URL">
            <div className="input-group">
              <span className="input-group-addon">{`${location.origin}/`}</span>
              <TextInput
                id="url"
                value={this.state.subdomain}
                placeholder="smith"
                onChange={this.onSubdomainChange}
              />
            </div>
          </LabeledInput>
          <LabeledInput label="Owning User (Must Be Existing)">
            <Autocomplete
              id="userEmail"
              value={this.state.creatingUserEmail}
              onChange={value => this.onUserChange(value)}
              onSearch={this.onSearch}
            />
          </LabeledInput>
          <LabeledInput label="Organization Type">
            <Select
              value={this.state.orgType}
              options={[
                { value: 'CL', name: 'Cloud lab' },
                { value: 'CCS', name: 'Command and control' }
              ]}
              onChange={e => this.setState({ orgType: e.target.value })}
            />
          </LabeledInput>

          { this.state.orgType === 'CL' && (
            <LabeledInput label="Lab">
              <Select
                value={this.state.lab_id}
                options={labs.map(lab => ({
                  name: lab.get('name'),
                  value: lab.get('id')
                }))}
                onChange={e => this.setState({ lab_id: e.target.value })}
              />
            </LabeledInput>
          )
          }

          <LabeledInput label="Sector">
            <Select
              value={this.state.kind}
              options={[
                { value: 'academic', name: 'Academia' },
                { value: 'pharma', name: 'Pharma' },
                { value: 'biotech', name: 'Biotechnology' },
                { value: 'other', name: 'Other' }
              ]}
              onChange={this.onKindChange}
            />
          </LabeledInput>
        </div>
      </SinglePaneModal>
    );
  }
}

NewOrgModal.propTypes = propTypes;

const getStateFromStores = () => ({
  labs: LabStore.getAll()
});

export default ConnectToStoresHOC(NewOrgModal, getStateFromStores);

export { NewOrgModal };
