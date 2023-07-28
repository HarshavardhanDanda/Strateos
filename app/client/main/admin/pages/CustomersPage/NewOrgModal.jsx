import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';
import Immutable from 'immutable';
import Dispatcher            from 'main/dispatcher';
import Urls                  from 'main/util/urls';
import { SinglePaneModal }   from 'main/components/Modal';
import OrganizationActions   from 'main/admin/actions/OrganizationActions';
import OrganizationStore     from 'main/stores/OrganizationStore';
import LabStore              from 'main/stores/LabStore';
import LabAPI                from 'main/api/LabAPI';
import AdminUserActions      from 'main/admin/actions/UserActions';
import Autocomplete          from 'main/components/Autocomplete';
import ConnectToStoresHOC    from 'main/containers/ConnectToStoresHOC';
import { LabeledInput, Select, TextInput, Checkbox } from '@transcriptic/amino';
import { tour } from 'main/tours/create-implementation';
import './NewOrgModal.scss';

const propTypes = {
  modalId:           PropTypes.string.isRequired
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
    this.onToggleImplementation      = this.onToggleImplementation.bind(this);
    this.fetchLabs                   = this.fetchLabs.bind(this);
  }

  componentDidMount() {
    this.fetchLabs(this.state.cloudLabOperator);
  }

  getDefaultState() {
    return {
      name: '',
      subdomain: '',
      kind: 'academic',
      creatingUserEmail: '',
      orgType: 'CL',
      customer: Immutable.Map(),
      cloudLabOperator:  'org13',
      customerSubdomain: undefined,
      isImplementation: false
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

  onKindChange(e) {
    this.setState({ kind: e.target.value });
  }

  onToggleImplementation() {

    this.setState(prevState => ({
      ...this.getDefaultState(),
      isImplementation: !prevState.isImplementation,
      creatingUserEmail: prevState.isImplementation ? '' : Transcriptic.current_user.email
    }));
  }

  onCustomerChange(customerSubdomain) {
    this.setState({ customerSubdomain });

    const customer = OrganizationStore.findBySubdomain(customerSubdomain);

    if (customer) {
      this.setState({
        name: `${customer.get('name')} Implementation`,
        subdomain: `${customer.get('subdomain')}-implementation`,
        customer
      }, () => this.fetchLabs(customer.get('id')));
    }
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
    if (this.state.isImplementation) {
      return OrganizationActions.create({ organization: _.omit(this.state, 'cloudLabOperator', 'customer') })
        .done(({ implementation }) => {
          const { customer } = this.state;
          Dispatcher.dispatch({ type: 'IMPLEMENTATION_DATA', implementation: { implementation, customer } });
          tour.start();
          window.location = Urls.use(implementation.subdomain).projects() + '?continueTour=true&step=2';
        });
    } else {
      const newOrg = { organization: _.omit(this.state, 'customer', 'isImplementation', 'cloudLabOperator') };
      return OrganizationActions.create(newOrg)
        .done((org) => {
          window.location = Urls.use(org.subdomain).projects();
        });
    }
  }

  setDefaults() {
    this.setState({ ...this.getDefaultState() });
  }

  render() {
    const labs = this.props.labs.filter((lab) => lab.get('operated_by_id') === this.state.cloudLabOperator);
    return (
      <SinglePaneModal
        modalId={this.props.modalId}
        title={`New ${this.state.isImplementation ? 'Implementation' : 'Organization'}`}
        onAccept={this.onCreate}
        onDismissed={this.setDefaults}
        acceptText="Create Organization"
        acceptClass="btn btn-primary create-org"
        modalBodyClass="new-org-modal"
      >
        <div className="tx-stack tx-stack--xxxs">
          <div className="new-org-modal__checkbox">
            <Checkbox
              id="check-box"
              type="checkbox"
              value={this.state.isImplementation}
              checked={this.state.isImplementation ? 'checked' : 'unchecked'}
              onChange={this.onToggleImplementation}
            />
            <LabeledInput label="Implementation Organization" />
          </div>
          <If condition={this.state.isImplementation}>
            <LabeledInput label="Customer">
              <Autocomplete
                id="customer"
                placeholder="Search for a customer"
                value={this.state.customerSubdomain}
                onChange={value => this.onCustomerChange(value)}
                onSearch={(value) => {
                  return OrganizationActions.search(1, 5, {
                    search: value,
                    orderBy: 'name',
                    customers_without_implementation: true
                  })
                    .then(response =>  response.results.map(org => org.subdomain));
                }}
                zeroResultsMessage="No organization found or implementation organization already exists"
              />
            </LabeledInput>
          </If>
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
                disabled={this.state.isImplementation}
              />
            </div>
          </LabeledInput>
          <LabeledInput label="Owning User (Must Be Existing)">
            <Autocomplete
              id="userEmail"
              value={this.state.creatingUserEmail}
              onChange={value => this.onUserChange(value)}
              onSearch={(value) => {
                return AdminUserActions.search(0, 5, { search: value })
                  .then(response => response.results.map(user => user.email));
              }}
            />
          </LabeledInput>
          <LabeledInput label="Organization Type">
            <Select
              value={this.state.orgType}
              disabled={this.state.isImplementation}
              options={[
                { value: 'CL', name: 'Cloud lab' },
                { value: 'CCS', name: 'Command and control' }
              ]}
              onChange={e => this.setState({ orgType: e.target.value })}
            />
          </LabeledInput>

          { this.state.orgType === 'CL' ? (
            <LabeledInput label="Lab">
              <Select
                value={this.state.lab_id}
                options={labs.map(lab => ({ name: lab.get('name'), value: lab.get('id') }))}
                onChange={e => this.setState({ lab_id: e.target.value })}
              />
            </LabeledInput>
          ) : undefined
          }

          {!this.state.isImplementation ? (
            <LabeledInput label="Sector">
              <Select
                value={this.state.kind}
                options={[
                  { value: 'academic',       name: 'Academia' },
                  { value: 'pharma',         name: 'Pharma' },
                  { value: 'biotech',        name: 'Biotechnology' },
                  { value: 'other',          name: 'Other' }
                ]}
                onChange={this.onKindChange}
              />
            </LabeledInput>
          ) : undefined}
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
