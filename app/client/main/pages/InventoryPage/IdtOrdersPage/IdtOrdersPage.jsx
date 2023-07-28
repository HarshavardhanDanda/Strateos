import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import { Table, Card, Column, DateTime }  from '@transcriptic/amino';
import IdtOrderActions from 'main/actions/IdtOrderActions';
import IdtOrderStore from 'main/stores/IdtOrderStore';

export class IdtOrdersTable extends React.Component {

  constructor(props, context) {
    super(props, context);

    this.state = {
      loaded: false,
      orders: []
    };
  }

  componentDidMount() {
    this.setState({ loaded: false });
    IdtOrderActions.loadAll().done(() => {
      this.setState({
        loaded: true
      });
    });
  }

  render() {
    return (
      <Card>
        <Table
          data={Immutable.fromJS(this.props.orders)}
          loaded={this.state.loaded}
          id="admin-destruction-requests-table"
          disabledSelection
        >
          <Column renderCellContent={order => order.get('id')} header="ID" id="id" disableFormatHeader />
          <Column renderCellContent={order => order.get('order_number')} sortable autoSort header="Order number" id="order_number" />
          <Column renderCellContent={order => order.get('purchase_order')} sortable autoSort header="Purchase Order" id="purchase_order" />
          <Column renderCellContent={order => (order.get('lab') ? order.get('lab').get('name') : '')} sortable autoSort header="Lab" id="lab" />
          <Column renderCellContent={order => <DateTime format="absolute-date-time" timestamp={order.get('order_placed_at')} />}  sortable autoSort header="Order Placed At" id="order_placed_at" />
          <Column renderCellContent={order => <DateTime format="absolute-date-time" timestamp={order.get('created_at')} />}  sortable autoSort header="created At" id="created_at" />
        </Table>
      </Card>
    );
  }
}

IdtOrdersTable.propTypes = {
  orders: PropTypes.instanceOf(Immutable.Iterable)
};

const getStateFromStores = function() {
  const orders = IdtOrderStore.getAll()
    .sortBy(order => order.get('created_at'))
    .reverse();

  return {
    orders
  };
};

export default ConnectToStores(IdtOrdersTable, getStateFromStores);
