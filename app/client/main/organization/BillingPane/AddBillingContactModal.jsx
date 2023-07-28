import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { SinglePaneModal } from 'main/components/Modal';
import connectToStoresHOC from 'main/containers/ConnectToStoresHOC';
import BillingContactStore from 'main/stores/BillingContactStore';
import OrganizationActions from 'main/actions/OrganizationActions';
import BillingContactsCreator from './BillingContactsCreator';

class AddBillingContactModal extends React.Component {
  constructor(props) {
    super(props);
    OrganizationActions.loadAllForCurrentUser();
    this.contactCreatorRef = React.createRef();
  }

  triggerAction() {
    this.contactCreatorRef.current.saveOrUpdate();
  }

  render() {
    return (
      <SinglePaneModal
        modalId="AddBillingContactModal"
        title="Billing Contact"
        acceptText="Save"
        onAccept={() => this.triggerAction()}
      >
        <BillingContactsCreator ref={this.contactCreatorRef} billingContacts={this.props.billingContacts} subdomain={this.props.subdomain} customerOrganizationId={this.props.customerOrganizationId} />
      </SinglePaneModal>
    );
  }
}

const getStateFromStores = (props) => {
  return {
    billingContacts: props.customerOrganizationId ? BillingContactStore.getAllByOrganizationId(
      props.customerOrganizationId
    ) : BillingContactStore.getAllByOrganizationId(
      Transcriptic.organization.id
    )
  };
};

// hack: Since Transcriptic.organization is unreliable, we're instead using the global Urls object,
// which is set by the BillingPage component
const connectedBillingContactsModal = connectToStoresHOC(
  AddBillingContactModal,
  getStateFromStores
);
AddBillingContactModal.propTypes = {
  billingContacts: PropTypes.instanceOf(Immutable.Iterable).isRequired
};
export default connectedBillingContactsModal;
export { AddBillingContactModal };
