import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';
import { Link }  from 'react-router-dom';

import LabConsumerActions from 'main/actions/LabConsumerActions';
import LabConsumerStore   from 'main/stores/LabConsumerStore';

import { Card, Button, Table, Column, Tooltip, Divider } from '@transcriptic/amino';
import AddressActions      from 'main/actions/AddressActions';
import ModalActions        from 'main/actions/ModalActions';
import { SinglePaneModal } from 'main/components/Modal';
import AddressUI           from 'main/components/address';
import ConnectToStores     from 'main/containers/ConnectToStoresHOC';
import AddressStore        from 'main/stores/AddressStore';
import SessionStore        from 'main/stores/SessionStore';
import Urls                from 'main/util/urls';
import AddressText         from 'main/components/addressLib/addressText';
import FeatureConstants    from '@strateos/features';
import FeatureStore        from 'main/stores/FeatureStore';

const { AddressCreator } = AddressUI;

class AddAddressModal extends React.Component {

  static get MODAL_ID() {
    return 'ADD_ADDRESS_MODAL';
  }

  constructor(props) {
    super(props);
    this.addressCreatorEle = React.createRef();
  }

  triggerAction() {
    return this.addressCreatorEle.current.saveOrUpdate();
  }

  render() {
    return (
      <SinglePaneModal
        modalId={AddAddressModal.MODAL_ID}
        title="Add Receiving Address"
        renderFooter
        acceptText="Save"
        onAccept={() => this.triggerAction()}
      >
        <AddressCreator
          ref={this.addressCreatorEle}
          customerOrganization={this.props.customerOrganization}
        />
      </SinglePaneModal>
    );
  }
}

class RemoveAddressModal extends React.Component {

  static get MODAL_ID() {
    return 'REMOVE_ADDRESS_MODAL';
  }

  static get propTypes() {
    return {
      address: PropTypes.instanceOf(Immutable.Iterable).isRequired
    };
  }

  constructor(props) {
    super(props);
    this.triggerAction = this.triggerAction.bind(this);
  }

  triggerAction() {
    const { customerOrganization, address } = this.props;
    const customerSubdomain = customerOrganization ? customerOrganization.get('subdomain') : undefined;
    const customerOrgId = customerOrganization ? customerOrganization.get('id') : undefined;
    return AddressActions.destroy(address.get('id'), customerOrgId, customerSubdomain);
  }

  render() {
    return (
      <SinglePaneModal
        modalId={RemoveAddressModal.MODAL_ID}
        title="Remove Receiving Address"
        renderFooter
        acceptText="Remove"
        onAccept={this.triggerAction}
      >
        <div className="tx-stack tx-stack--sm">
          <div>Are you sure you want to remove this Receiving Address?</div>
          <AddressText address={this.props.address} />
        </div>
      </SinglePaneModal>
    );
  }
}

class AddressesPane extends React.Component {

  static get propTypes() {
    return {
      addresses: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      windowData: PropTypes.object
    };
  }

  constructor(props) {
    super(props);
    this.state = { selectedAddress: undefined };
  }

  componentWillMount() {
    const { customerOrganization } = this.props;
    const customerOrgId = customerOrganization ? customerOrganization.get('id') : undefined;
    const customerSubdomain = customerOrganization ? customerOrganization.get('subdomain') : undefined;
    AddressActions.loadAll(customerOrgId, customerSubdomain);
  }

  componentDidMount() {
    const { customerOrganization } = this.props;
    const labConsumerAction =   customerOrganization ? LabConsumerActions.loadLabsByOrg(customerOrganization.get('id')) :
      LabConsumerActions.loadLabsForCurrentOrg();

    labConsumerAction.done(() => {
      const labConsumers = customerOrganization ? LabConsumerStore.getAllForOrg(customerOrganization.get('id'))
        : LabConsumerStore.getAllForCurrentOrg();
      const firstLabConsumer = labConsumers.first();
      if (firstLabConsumer) {
        this.setState({ labOperatorName: firstLabConsumer.getIn(['lab', 'operated_by_name']) });
      }
    });
  }

  prepareTableData(addresses, windowData) {
    let idCounter = 1;
    const data = [];
    const canAdmin = this.canAdmin();

    addresses.forEach((address) => {
      const element = {};
      element.id = idCounter++;
      element[1] = address.get('attention');
      element[2] = `${address.get('street')}, ${address.get('street_2') || ''}, ${address.get('city')}, ${address.get('state')} ${address.get('zipcode')}, ${(windowData || window.ISO3166)[address.get('country')].name}`;
      canAdmin && (element.actions = () => this.renderActions(address.get('id')));
      data.push(element);
    });

    return Immutable.fromJS(data);
  }

  getAddressData(id) {
    return this.props.addresses.find(obj => obj.get('id') === id);
  }

  canAdmin() {
    return this.props.customerOrganization ?
      SessionStore.canAdminCustomerOrg() :
      SessionStore.canAdminCurrentOrg();
  }

  renderActions(id) {
    return (
      <div>
        <a
          className="address__admin-action"
          onClick={() => {
            this.setState({ selectedAddress: this.getAddressData(id) });
            ModalActions.open(RemoveAddressModal.MODAL_ID);
          }}
        >
          <Tooltip
            placement="bottom"
            title="Remove"
          >
            <i className="fas fa-trash" />
          </Tooltip>
        </a>

        <a
          className="address__admin-action"
          onClick={() => ModalActions.openWithData(AddAddressModal.MODAL_ID, this.getAddressData(id))}
        >
          <Tooltip
            placement="bottom"
            title="Edit"
          >
            <i className="fas fa-edit" />
          </Tooltip>
        </a>
      </div>
    );
  }

  renderTableRecord(record, rowIndex, colIndex) {
    return <p>{record.get((colIndex + 1).toString())}</p>;
  }

  renderActionRecord(record) {
    return record.get('actions')();
  }

  renderTable(data) {
    return (
      this.canAdmin() ? (
        <Table
          data={data}
          loaded
          disabledSelection
          id="address-table"
        >
          <Column renderCellContent={this.renderTableRecord} header="Name" id="name-column" />
          <Column renderCellContent={this.renderTableRecord} header="Address" id="address-column" />
          <Column renderCellContent={this.renderActionRecord} header="Actions" id="action-column" />
        </Table>
      )
        : (
          <Table
            data={data}
            loaded
            disabledSelection
            id="address-table"
          >
            <Column renderCellContent={this.renderTableRecord} header="Name" id="name-column" />
            <Column renderCellContent={this.renderTableRecord} header="Address" id="address-column" />
          </Table>
        )
    );
  }

  render() {
    const { addresses, windowData, customerOrganization } = this.props;
    const labOperatorName = this.state.labOperatorName;
    const canAdmin = this.canAdmin();
    const data = this.prepareTableData(addresses, windowData);
    const canRequestSampleContainers = customerOrganization ? FeatureStore.hasFeature(FeatureConstants.REQUEST_SAMPLE_CONTAINERS) &&
    (SessionStore.getOrg().get('id') === customerOrganization.get('id')) : FeatureStore.hasFeature(FeatureConstants.REQUEST_SAMPLE_CONTAINERS);
    return (
      <Card className="tx-stack tx-stack--sm" allowOverflow>
        <h2 className="tx-type--heavy">Addresses</h2>
        <Divider />

        {canRequestSampleContainers && (
          <div>
            <h4>Sending To {labOperatorName}</h4>
            <p>
              To send samples to {labOperatorName},
              {' '}
              <Link to={Urls.shipments_intake_kits()}>
                request a shipping kit
              </Link>
            </p>
          </div>
        )}

        <AddAddressModal customerOrganization={customerOrganization} />
        {this.state.selectedAddress &&
          <RemoveAddressModal address={this.state.selectedAddress} customerOrganization={customerOrganization} />
        }

        {canAdmin && (addresses.isEmpty() ? (
          (
            <div className="tx-stack tx-stack--xxxs">
              <h4>Receiving from {labOperatorName}</h4>
              <Button
                size="large"
                type="action"
                heavy
                onClick={_e => ModalActions.open(AddAddressModal.MODAL_ID)}
              >Add Receiving Address
              </Button>
            </div>
          )
        ) : (
          <div>
            {(
              <h4>Receiving from {labOperatorName}
                <Button className="address__add" link type="primary" heavy icon="fas fa-plus" onClick={() => ModalActions.open(AddAddressModal.MODAL_ID)}>
                  ADD
                </Button>
              </h4>
            )}
          </div>
        )
        )}
        {
          this.renderTable(data)
        }
      </Card>
    );
  }
}

const getStateFromStores = () => {
  const addresses = AddressStore.getAll();

  return { addresses };
};

export default ConnectToStores(AddressesPane, getStateFromStores);
export { AddressesPane, RemoveAddressModal, AddAddressModal };
