import _ from 'lodash';
import Accounting from 'accounting';
import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import { Column, Popover, List } from '@transcriptic/amino';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import Urls from 'main/util/urls';
import PurchaseOrderActions from 'main/actions/PurchaseOrderActions';
import PaymentMethodUtil from 'main/organization/util/PaymentMethodUtil';
import BaseTableTypes from 'main/components/BaseTableTypes';
import PaymentMethodStore from 'main/stores/PaymentMethodStore';

class POApprovals extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: {}
    };
  }

  componentDidMount() {
    PurchaseOrderActions.loadAll();
  }

  onApprove = (selectedPOs) => {
    PurchaseOrderActions.approve(selectedPOs).done(
      this.setState({ selected: {} }));
  };

  renderOrganization  = (po) =>  {
    return <BaseTableTypes.CustomerOrganizationUrl org={po.get('organization')} />;
  };

  renderReference = (po) => {
    return po.get('po_reference_number');
  };

  renderLimit = (po) => {
    return Accounting.formatMoney(po.get('po_limit'));
  };

  renderAddress = (po) => {
    const address = po.get('address');
    const po_address = address ? `${address.get('attention')}, ${address.get('street')}, 
    ${address.get('street_2') ? `${address.get('street_2')}, ` : ''} 
    ${address.get('city')}, ${address.get('country')}` : '--';
    return (
      <Popover
        content={<span>{po_address}</span>}
        placement="bottom"
        trigger="hover"
        showWhenOverflow
      >
        { po_address }
      </Popover>
    );
  };

  renderExpiration = (po) => {
    return (
      po.get('expiry') ? <span>{ po.get('expiry') }</span> : <span>-</span>
    );
  };

  renderAttachment = (po) => {
    const po_attachment_name = PaymentMethodUtil.poAttachmentName(po);
    return (
      <a href={Urls.s3_file(po.get('po_attachment_url'))}>
        <i className="fa fa-paperclip" />
        {po_attachment_name}
      </a>
    );
  };

  render() {
    const selectedPOs = Object.keys(this.state.selected);
    const num_selected = selectedPOs.length;
    let approveActionTitle = 'Approve';
    if (num_selected > 0) {
      approveActionTitle += ` (${num_selected}) PO's`;
    }
    return (
      <div className="purchase-orders tx-stack tx-stack--xs">
        <List
          data={this.props.POs}
          loaded={this.props.isLoaded}
          emptyMessage="No POs pending approval."
          onSelectRow={(record, willBeSelected, selectedRows) => { this.setState({ selected: selectedRows }); }}
          onSelectAll={(selectedRows) => { this.setState({ selected: selectedRows }); }}
          selected={this.state.selected}
          id="PO_Approvals"
          disableCard
          actions={[
            {
              title: approveActionTitle,
              icon: 'fa fa-check',
              action: () => this.onApprove(selectedPOs)
            }
          ]}
        >
          <Column renderCellContent={this.renderOrganization} header="Organization" id="organization" />
          <Column renderCellContent={this.renderReference} header="Reference #" id="reference" />
          <Column renderCellContent={this.renderLimit} header="Limit" id="limit" />
          <Column renderCellContent={this.renderAddress} header="Address" id="address" />
          <Column renderCellContent={this.renderExpiration} header="Expiration" id="expiration" />
          <Column renderCellContent={this.renderAttachment} header="Attachment" id="attachment" />
        </List>
      </div>
    );
  }
}

POApprovals.propTypes = {
  isLoaded: PropTypes.bool.isRequired,
  POs: PropTypes.instanceOf(Immutable.Iterable).isRequired
};

const getStateFromStores = () => {
  const isLoaded = PaymentMethodStore.isLoaded();
  const data = PaymentMethodStore.getPurchaseOrders();
  return {
    isLoaded,
    POs: data
  };
};

const ConnectedPOApprovals = ConnectToStores(POApprovals, getStateFromStores);

export default ConnectedPOApprovals;
export { POApprovals };
