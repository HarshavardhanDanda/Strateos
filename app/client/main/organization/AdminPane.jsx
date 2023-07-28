import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';

import AdminActions           from 'main/actions/AdminActions';
import CollaboratorActions    from 'main/actions/CollaboratorActions';
import ModalActions           from 'main/actions/ModalActions';
import OrganizationActions    from 'main/actions/OrganizationActions';
import PaymentMethodActions   from 'main/actions/PaymentMethodActions';
import ApplyCreditModal       from 'main/admin/components/ApplyCreditToInvoice/modal';
import CreateInvoiceItemModal from 'main/components/CreateInvoiceItemModal';
import AccountManagerEdit     from 'main/organization/admin_pane/AccountManagerEdit';
import InvoiceProviderIdEdit  from 'main/organization/admin_pane/InvoiceProviderIdEdit';
import GrantCredit            from 'main/organization/admin_pane/GrantCredit';
import SubscribersEdit        from 'main/organization/admin_pane/SubscribersEdit';
import TestAccountEdit        from 'main/organization/admin_pane/TestAccountEdit';
import AdminStore             from 'main/stores/AdminStore';
import AdminSubscriberStore   from 'main/stores/AdminSubscriberStore';
import OrganizationStore      from 'main/stores/OrganizationStore';
import PaymentMethodStore     from 'main/stores/PaymentMethodStore';
import OrganizationAPI from 'main/api/OrganizationAPI';
import { Button } from '@transcriptic/amino';
import SessionStore from 'main/stores/SessionStore';
import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';

const APPLY_CREDIT_MODAL_ID = 'ApplyCreditModal';

export class AdminPane extends React.Component {
  constructor(props) {
    super(props);
    this.saveOrganization = this.saveOrganization.bind(this);

    this.state = {
      saveErrorStr: undefined,
      saveInfoStr: undefined,
      selectedAdminId: ''
    };
  }

  componentDidMount() {
    if (this.props.customerOrgId) {
      PaymentMethodActions.loadByOrg(this.props.customerOrgId);
    } else {
      CollaboratorActions.loadAll();
      PaymentMethodActions.loadAll();
    }
    SessionStore.isAdmin() && AdminActions.loadAll();
    SessionStore.isAdmin() && AdminActions.loadAllSubscribers(this.props.subdomain);
  }

  saveOrganization(attrName, attrValue) {
    const data = {
      [attrName]: attrValue
    };

    return this.props.customerOrgId ? OrganizationAPI.update(this.props.customerOrgId, data)
      .done(() => {
        this.setState({
          saveInfoStr: `Successfully updated ${attrName}`,
          saveErrorStr: undefined
        });
      })
      .fail((xhr, status, text) => {
        this.setState({
          saveInfoStr: undefined,
          saveErrorStr: text
        });
      }) :
      OrganizationActions.update(this.props.subdomain, data)
        .done(() => {
          this.setState({
            saveInfoStr: `Successfully updated ${attrName}`,
            saveErrorStr: undefined
          });
        })
        .fail((xhr, status, text) => {
          this.setState({
            saveInfoStr: undefined,
            saveErrorStr: text
          });
        });
  }

  paymentMethods() {
    const org   = OrganizationStore.findBySubdomain(this.props.subdomain) || Immutable.Map();
    const orgId = org.get('id');

    return PaymentMethodStore.getAll().filter(x => x.get('organization_id') === orgId);
  }

  getAccountManager(org) {
    return org.getIn(['account_manager_or_default', 'id']);
  }

  getCandidateSubscribers(admins, subscribedAdmins) {
    return admins.filter((admin) => {
      const foundSubscriber = subscribedAdmins.find(subscribedAdmin => subscribedAdmin.get('id') === admin.get('id'));

      return foundSubscriber === undefined;
    }).toList();
  }

  getDefaultAdminId(admins, subscribedAdmins) {
    const candidateSubscribers = this.getCandidateSubscribers(admins, subscribedAdmins);
    const defaultSelectedAdmin = candidateSubscribers.size > 0 ? candidateSubscribers.first().get('id') : undefined;
    return defaultSelectedAdmin || '';
  }

  render() {
    const admins = AdminStore.getAll();
    const subscribedAdmins = AdminSubscriberStore.getAllBySubdomain(
      this.props.subdomain
    );
    const org = OrganizationStore.findBySubdomain(this.props.subdomain) || Immutable.Map();
    const customerId = org.get('netsuite_customer_id', '');
    const testAccount = org.get('test_account');

    return (
      <div className="organization-admin-page admin-panel">
        <div className="row">
          <div className="col-sm-6">
            {SessionStore.isAdmin() && (
              <AccountManagerEdit
                key={this.getAccountManager(org)}
                admins={admins
                  .filter(ad => ad.get('account_managerable'))
                  .sortBy(ad => ad.get('name'))}
                initialAccountManager={this.getAccountManager(org)}
                saveOrganization={this.saveOrganization}
              />
            )}
            <TestAccountEdit
              key={testAccount}
              initialTestAccount={testAccount}
              saveOrganization={this.saveOrganization}
            />
            <InvoiceProviderIdEdit
              key={customerId}
              initialValue={customerId}
              onSave={this.saveOrganization}
            />
            {this.state.saveErrorStr && (
              <div className="alert alert-danger">
                <button
                  className="close"
                  onClick={() =>
                    this.setState({
                      saveErrorStr: undefined
                    })}
                >
                  {'×'}
                </button>
                {this.state.saveErrorStr}
              </div>
            )}
            {this.state.saveInfoStr && (
              <div className="alert alert-success">
                <button
                  className="close"
                  onClick={() =>
                    this.setState({
                      saveInfoStr: undefined
                    })}
                >
                  {'\xD7'}
                </button>
                {this.state.saveInfoStr}
              </div>
            )}
          </div>
        </div>
        <div className="row">
          <div className="col-sm-6">
            {SessionStore.isAdmin() && (
              <SubscribersEdit
                onChangeSelectedAdminId={(selectedAdminId) => this.setState({ selectedAdminId })}
                candidateSubscribers={this.getCandidateSubscribers(admins, subscribedAdmins)}
                selectedAdminId={this.state.selectedAdminId || this.getDefaultAdminId(admins, subscribedAdmins)}
                subscribedAdmins={subscribedAdmins}
                subdomain={this.props.subdomain}
              />
            )}
          </div>
        </div>
        <div className="row">
          <div className="col-sm-12">
            <GrantCredit
              customerOrgId={this.props.customerOrgId}
              isAdmin={SessionStore.isAdmin()}
            />
          </div>
        </div>
        {(SessionStore.isAdmin() || FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_INVOICES_GLOBAL)) && !org.get('test_account') && (
          <React.Fragment>
            <div className="row">
              <div className="col-sm-12">
                <h3>Add a Charge</h3>
                <Button
                  type="default"
                  onClick={() => ModalActions.open(CreateInvoiceItemModal.modalId)}
                >
                  Add a Charge
                </Button>
              </div>
              <CreateInvoiceItemModal
                paymentMethods={this.paymentMethods()}
                customerSubdomain={this.props.subdomain}
                isAdmin={SessionStore.isAdmin()}
              />
            </div>
            <div className="row">
              <div className="col-sm-12">
                <h3>Apply a Credit</h3>
                <Button
                  type="default"
                  onClick={() => ModalActions.open(APPLY_CREDIT_MODAL_ID)}
                >
                  Apply a Credit
                </Button>
              </div>
              <ApplyCreditModal
                modalId={APPLY_CREDIT_MODAL_ID}
                customerOrgId={this.props.customerOrgId}
                orgId={org.get('id')}
                customerSubdomain={this.props.subdomain}
                isAdmin={SessionStore.isAdmin()}
              />
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }
}

AdminPane.propTypes = {
  subdomain: PropTypes.string.isRequired,
  customerOrgId: PropTypes.string
};

export default ConnectToStores(AdminPane, () => {});
