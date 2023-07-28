import React from 'react';

import ModalActions from 'main/actions/ModalActions';
import Immutable from 'immutable';
import XeroReconciliationModal from 'main/admin/pages/BillingPage/XeroReconciliationModal';
import mockData from './Mocks/XeroReconcile.json';

const reconcileModalId = (month) => {
  return `${XeroReconciliationModal.MODAL_ID}_${month}`;
};
const data = Immutable.fromJS(mockData);

class XeroReconciliationModalWithData extends React.Component {
  xeroReconcileData() {
    const promise = new Promise((resolve) => { resolve(data); });
    return promise;
  }

  render() {
    return (
      <XeroReconciliationModal
        modalId={reconcileModalId('2017-06-01')}
        date={'2017-06-01'}
        dataFetch={this.xeroReconcileData}
      />
    );
  }
}

export default {
  title: 'Xero Reconciliation Modal'
};

export function ReconcileModal() {
  return (
    <span>
      <a onClick={() => ModalActions.open(reconcileModalId('2017-06-01'))}>Reconcile with Xero</a>
      <XeroReconciliationModalWithData />
    </span>
  );
}

ReconcileModal.story = {
  name: 'Reconcile modal',

  parameters: {
    chromatic: {
      diffThreshold: 0.2,
      pauseAnimationAtEnd: true,
      delay: 1500
    }
  }
};
