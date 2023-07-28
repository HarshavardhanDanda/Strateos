import React     from 'react';

import Immutable from 'immutable';
import PropTypes from 'prop-types';
import Accounting from 'accounting';
import { Loading } from 'main/components/page';
import connectToStoresHOC from 'main/containers/ConnectToStoresHOC';
import { Table, Column, DateTime } from '@transcriptic/amino';

import CreditStore from 'main/stores/CreditStore';

function Credits(props) {

  if (!CreditStore.isLoaded()) {
    return <Loading />;
  }

  if (props.credits.size === 0) {
    return <em>No account credit.</em>;
  }

  const  renderIdRecord = (record) => {
    return <p>{record.get('id')}</p>;
  };

  const  renderNameRecord = (record) => {
    return <p>{record.get('name')}</p>;
  };

  const  renderCreditRecord = (record) => {
    return <p>{record.get('credit_type')}</p>;
  };

  const  renderGrantedRecord = (record) => {
    return <DateTime timestamp={(record.get('created_at'))} />;
  };

  const  renderExpiryRecord = (record) => {
    const expiryDate = record.get('expires_at');
    return  expiryDate ? <DateTime timestamp={(expiryDate)} /> : <div>&mdash;</div>;
  };

  const  renderAmountRecord = (record) => {
    return Accounting.formatMoney(record.get('amount_remaining'));
  };

  return (
    <Table
      data={props.credits}
      loaded
      disabledSelection
      id="organization-credit-table"
    >
      <Column renderCellContent={renderIdRecord} header="ID" id="id-column" disableFormatHeader />
      <Column renderCellContent={renderNameRecord} header="Name" id="name-column" />
      <Column renderCellContent={renderCreditRecord} header="Credit" id="credit-column" />
      <Column renderCellContent={renderGrantedRecord} header="Granted" id="granted-column" />
      <Column renderCellContent={renderExpiryRecord} header="Expires" id="expiry-column" />
      <Column renderCellContent={renderAmountRecord} header="Amount Remaining" id="amount-column" />
    </Table>
  );
}

Credits.propTypes = {
  credits: PropTypes.instanceOf(Immutable.Iterable).isRequired
};

const getStateFromStores = (props) => {
  return {
    credits: props.customerOrganizationId ? CreditStore.getAllByOrgId(
      props.customerOrganizationId
    ) : CreditStore.getAllByOrgId(
      Transcriptic.organization.id
    )
  };
};

export default connectToStoresHOC(Credits, getStateFromStores);
export { Credits };
