import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';
import _ from 'lodash';
import { Button, Table, Column } from '@transcriptic/amino';

import BillingContactActions from 'main/actions/BillingContactActions';
import ModalActions from 'main/actions/ModalActions';
import BillingContactsModal from './AddBillingContactModal';

class BillingContacts extends React.Component {

  static removeContact(contact, subdomain, orgId) {
    return BillingContactActions.destroy(contact.get('id'), subdomain, orgId);
  }

  getBillingContactRecords(contacts) {
    const records = [];
    if (!contacts.isEmpty()) {
      contacts.forEach(contact => {
        const record = {};
        record.id = contact.get('id');
        record[1] = contact.get('name');
        record[2] = contact.get('email');
        record.actions = () => this.renderActions(contact);
        records.push(record);
      });
      return Immutable.fromJS(records);
    }
    return records;
  }

  renderTableRecord(record, rowIndex, colIndex) {
    return <p>{record.get((colIndex + 1).toString())}</p>;
  }

  renderActions(contact) {
    return (
      <div className="billing__action tx-inline tx-inline--xs">
        <Button
          type="secondary"
          link
          icon="fa fa-trash"
          label="Delete"
          onClick={() => {
            if (confirm('Are you sure you want to delete this billing contact?')) {
              return BillingContacts.removeContact(contact, this.props.subdomain, this.props.customerOrganizationId);
            }
            return undefined;
          }}
        />
        <Button
          type="secondary"
          link
          icon="fa fa-edit"
          label="Edit"
          onClick={() => ModalActions.openWithData('AddBillingContactModal', contact)}
        />
      </div>
    );
  }

  renderActionRecord(record) {
    return record.get('actions')();
  }

  renderBillingContactsTable(billingRecords) {
    if (_.isEmpty(billingRecords)) {
      return (
        <p className="tx-type--secondary">No billing contacts added.</p>
      );
    } else {
      return (
        <Table
          data={billingRecords}
          loaded
          disabledSelection
          id="billing-contacts-table"
        >
          <Column renderCellContent={this.renderTableRecord} header="Name" id="name-column" />
          <Column renderCellContent={this.renderTableRecord} header="Email" id="email-column" />
          <Column renderCellContent={this.renderActionRecord} header="Actions" id="actions-column" />
        </Table>
      );
    }
  }

  render() {
    const billingRecords = this.getBillingContactRecords(this.props.billingContacts);
    return (
      <div>
        <h4>
          Billing Contacts
          <Button
            className="billing__add"
            type="primary"
            link
            heavy
            icon="fas fa-plus"
            onClick={() => ModalActions.open('AddBillingContactModal')}
          >
            ADD
          </Button>
        </h4>
        <BillingContactsModal subdomain={this.props.subdomain} customerOrganizationId={this.props.customerOrganizationId} />
        <p className="tx-type--secondary">
          Billing contacts with confirmed email addresses will be emailed all organization invoices.
          If no billing contacts are on file or no emails have been confirmed,
          the organization owner will receive all invoices.
        </p>
        <div className="billing-contacts-table">
          {this.renderBillingContactsTable(billingRecords)}
        </div>
      </div>
    );
  }
}

BillingContacts.propTypes = {
  billingContacts: PropTypes.instanceOf(Immutable.Iterable).isRequired
};

export default BillingContacts;
