import _ from 'lodash';
import Accounting from 'accounting';
import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import { Button, Table, Column, Popover } from '@transcriptic/amino';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import Urls from 'main/util/urls';
import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';
import PaymentMethodUtil from 'main/organization/util/PaymentMethodUtil';
import ajax from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';

const POStore = _.extend({}, CRUDStore('purchaseOrders'), {
  act(action) {
    switch (action.type) {
      case 'PURCHASE_ORDER_LIST':
        return this._receiveData(action.purchase_orders);

      default:
        return undefined;
    }
  },

  getAll() {
    return this._objects
      .get()
      .filter(x => x.get('po_approved_at') == undefined)
      .valueSeq();
  }
});

Dispatcher.register(POStore.act.bind(POStore));

const POActions = {
  initialize() {
    return ajax.get('/admin/billing/purchase_orders')
      .done((data) => {
        Dispatcher.dispatch({
          type: 'PURCHASE_ORDER_LIST',
          purchase_orders: data
        });
      });
  },

  approve(ids) {
    return ajax
      .post('/admin/billing/approve_purchase_orders', {
        purchase_order_ids: ids
      })
      .done(data =>
        Dispatcher.dispatch({
          type: 'PURCHASE_ORDER_LIST',
          purchase_orders: data
        })
      )
      .fail((...response) =>
        NotificationActions.handleError(response)
      );
  }
};

function Organization(po) {
  return (
    <a
      href={
        Urls.use(po.getIn(['organization', 'subdomain']))
          .organization_overview()
      }
    >
      { po.getIn(['organization', 'name']) }
    </a>
  );
}

function Reference(po) {
  return po.get('po_reference_number');
}

function Limit(po) {
  return Accounting.formatMoney(po.get('po_limit'));
}

function Address(po) {
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
}

function Expiration(po) {
  return (
    <Choose>
      <When condition={po.get('expiry') != undefined}>
        <span>{ po.get('expiry') }</span>
      </When>
      <Otherwise>
        <span>-</span>
      </Otherwise>
    </Choose>
  );
}

function Attachment(po) {
  const po_attachment_name = PaymentMethodUtil.poAttachmentName(po);
  return (
    <a href={Urls.s3_file(po.get('po_attachment_url'))}>
      <i className="fa fa-paperclip" />
      {po_attachment_name}
    </a>
  );
}

class POApprovals extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: {}
    };
  }

  componentDidMount() {
    POActions.initialize();
  }

  render() {
    const selectedPOs = Object.keys(this.state.selected);
    const num_selected = selectedPOs.length;
    return (
      <div className="purchase-orders">
        <Table
          data={this.props.POs}
          loaded={this.props.isLoaded}
          emptyMessage="No POs pending approval."
          onSelectRow={(record, willBeSelected, selectedRows) => { this.setState({ selected: selectedRows }); }}
          onSelectAll={(selectedRows) => { this.setState({ selected: selectedRows }); }}
          selected={this.state.selected}
          id="PO_Approvals"
        >
          <Column renderCellContent={Organization} header="Organization" id="organization" />
          <Column renderCellContent={Reference} header="Reference #" id="reference" />
          <Column renderCellContent={Limit} header="Limit" id="limit" />
          <Column renderCellContent={Address} header="Address" id="address" />
          <Column renderCellContent={Expiration} header="Expiration" id="expiration" />
          <Column renderCellContent={Attachment} header="Attachment" id="attachment" />
        </Table>
        <div className="actions">
          <Button
            type="success"
            disabled={!(num_selected > 0)}
            icon="fa fa-check"
            onClick={() =>
              POActions.approve(selectedPOs)
            }
          >
            Approve
            {' '}
            <If condition={num_selected > 0}>
              {`(${num_selected})`}
            </If>
          </Button>
        </div>
      </div>
    );
  }
}

POApprovals.propTypes = {
  isLoaded: PropTypes.bool,
  POs: PropTypes.instanceOf(Immutable.Iterable)
};

const getStateFromStores = () => {
  const isLoaded = POStore.isLoaded();
  const POs = POStore.getAll();

  return {
    isLoaded,
    POs
  };
};

const ConnectedPOApprovals = ConnectToStores(POApprovals, getStateFromStores);

export default ConnectedPOApprovals;
export { POApprovals };
