import _           from 'lodash';
import PropTypes   from 'prop-types';
import React       from 'react';
import { NavLink } from 'react-router-dom';

import {
  ZeroState,
  TextInput,
  Subtabs,
  TabRouter
} from '@transcriptic/amino';

import AddressActions        from 'main/actions/AddressActions';
import { TabLayout }         from 'main/components/TabLayout';
import ConnectToStores       from 'main/containers/ConnectToStoresHOC';
import AddressStore          from 'main/stores/AddressStore';
import ContainerTypeStore    from 'main/stores/ContainerTypeStore';
import ReturnShipmentStore   from 'main/stores/ReturnShipmentStore';
import ajax                  from 'main/util/ajax';
import Urls                  from 'main/util/urls';
import ReturnShipmentAPI     from 'main/api/ReturnShipmentAPI';
import ContainerStore        from 'main/stores/ContainerStore';
import SessionStore          from 'main/stores/SessionStore';
import RequestIntakeKitModal from 'main/inventory/inventory/RequestIntakeKitModal';
import ReturnShipmentCard    from './components';

import './ReturnShipmentsView.scss';

const propTypes = {
  match:           PropTypes.shape({
    params:          PropTypes.shape({
      status:         PropTypes.string
    })
  }),
  returnShipments: PropTypes.arrayOf(PropTypes.shape({
    id:              PropTypes.string.isRequired,
    created_at:      PropTypes.string.isRequired,
    temp:            PropTypes.string.isRequired,
    address:         PropTypes.object,
    tracking_number: PropTypes.string,
    carrier:         PropTypes.string,
    containers:      PropTypes.arrayOf(PropTypes.object),
    delivery_date:   PropTypes.string
  }))
};

class ReturnShipmentsView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      search: '',
      statusCode: undefined
    };
  }

  componentDidMount() {
    ajax.when(
      ReturnShipmentAPI.indexAll({
        filters: { status: 'purchased,authorized,shipped', organization_id: SessionStore.getOrg().get('id') },
        limit: 50,
        includes: ['containers']
      })
    )
      .fail(() => this.setState({ statusCode: 400 }));

    ajax.when(
      AddressActions.loadAll()
    )
      .fail(() => this.setState({ statusCode: 400 }));
  }

  getShipments() {
    const filter = this.props.match.params.status || 'delivered';
    const search = RegExp(this.state.search, 'i');

    return _.chain(this.props.returnShipments)
      .sortBy('created_at')
      .reverse()
      .filter(rs => (filter === 'delivered' ? rs.delivery_date : !rs.delivery_date))
      .filter((rs) => {
        return _.some(rs.containers, ({ label = '', barcode = '' }) => {
          return (label && label.match(search)) || (barcode && barcode.match(search));
        });
      })
      .value();
  }

  render() {
    const shipments = this.getShipments();
    return (
      <TabRouter basePath={Urls.return_shipments()} defaultTabId="Open">
        {
          () => {
            return (
              <TabLayout>
                <div className="return-shipment-page">
                  <div className="return-shipment-page__head">
                    <h2>Your Return Shipments</h2>
                    <TextInput
                      placeholder="Name or Barcode..."
                      value={this.state.search}
                      onChange={e => this.setState({ search: e.target.value })}
                    />
                    <Subtabs>
                      <NavLink to={`${Urls.return_shipments()}/delivered`} key="Delivered">
                        Delivered
                      </NavLink>
                      <NavLink to={`${Urls.return_shipments()}/open`} key="Open">
                        Open
                      </NavLink>
                    </Subtabs>
                  </div>
                  <div className="return-shipment-page__body">
                    {shipments.length === 0 ?
                      <ZeroState title="No return shipments found." hasBorder />
                      : shipments.map(s => <ReturnShipmentCard key={s.id} returnShipment={s} />)
                    }
                  </div>
                </div>
                <RequestIntakeKitModal  {...this.props} />
              </TabLayout>
            );
          }
        }
      </TabRouter>
    );
  }
}
ReturnShipmentsView.propTypes = propTypes;

const getStateFromStores = () => {
  const returnShipments = ReturnShipmentStore.getAll().map((rs) => {
    let shipment = rs;
    // hydrate shipment's containers with isTube
    const containerIds = rs.get('containers') ? rs.get('containers').map((c) => c.get('id')) : rs.get('container_ids');
    const containers = ContainerStore.getByIds(containerIds).map((c) => {
      const type = ContainerTypeStore.getById(c.get('container_type_id'));
      const isTube = type && type.get('is_tube');
      return c.set('is_tube', isTube);
    });
    shipment = shipment.set('containers', containers);

    // hydrate shipment's address
    const address = AddressStore.getById(shipment.get('address_id'));
    shipment = shipment.set('address', address);

    return shipment;
  }).toJS();

  return { returnShipments };
};

export default ConnectToStores(ReturnShipmentsView, getStateFromStores);
