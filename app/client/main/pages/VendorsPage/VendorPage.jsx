import PropTypes from 'prop-types';
import React     from 'react';
import { LabeledInput, Button, TextInput, Column, Spinner, List } from '@transcriptic/amino';
import ModalActions        from 'main/actions/ModalActions';
import ConnectToStores     from 'main/containers/ConnectToStoresHOC';
import { SinglePaneModal } from 'main/components/Modal';
import VendorActions       from 'main/actions/VendorActions';
import VendorStore         from 'main/stores/VendorStore';

class CreateVendorModal extends React.Component {

  static get MODAL_ID() {
    return 'CREATE_VENDOR_MODAL';
  }

  constructor(props, context) {
    super(props, context);
    this.state = { vendorName: '' };
    this.save = this.save.bind(this);
  }

  save() {
    VendorActions.create(this.state.vendorName).done(() => {
      this.setState({ vendorName: '' });
    });
  }

  render() {
    return (
      <SinglePaneModal
        modalSize="large"
        title="Create Vendor"
        modalId={CreateVendorModal.MODAL_ID}
        onAccept={this.save}
        postDismiss={() => { this.setState({ vendorName: '' }); }}
        acceptText="Create Vendor"
      >
        <LabeledInput label="Vendor Name">
          <TextInput
            placeholder="Vendor Name"
            value={this.state.vendorName}
            onChange={e => this.setState({ vendorName: e.target.value })}
          />
        </LabeledInput>
      </SinglePaneModal>
    );
  }
}

class DeleteVendorModal extends React.Component {

  static get propTypes() {
    return {
      modalId: PropTypes.string.isRequired,
      vendor:  PropTypes.object.isRequired
    };
  }

  static get MODAL_ID_BASE() {
    return 'DELETE_VENDOR_MODAL';
  }

  constructor(props, context) {
    super(props, context);
    this.destroy = this.destroy.bind(this);
  }

  destroy() {
    VendorActions.destroy(this.props.vendor.get('id'));
  }

  render() {
    return (
      <SinglePaneModal
        modalId={this.props.modalId}
        title="Destroy Vendor"
        renderFooter
        onAccept={this.destroy}
        acceptText="Destroy"
      >
        <h3>{`Are you sure you want to delete vendor ${this.props.vendor.get('name')}?`}</h3>
        <p>You won&apos;t be able to recover it.</p>
      </SinglePaneModal>
    );
  }
}

class Vendor extends React.Component {

  static get propTypes() {
    return {
      modalId: PropTypes.string.isRequired,
      vendor:  PropTypes.object.isRequired
    };
  }

  static get MODAL_ID_BASE() {
    return 'VENDOR_MODAL';
  }

  render() {
    return (
      <SinglePaneModal
        modalId={this.props.modalId}
        modalSize="large"
        title={this.props.vendor.get('name')}
      >
        <p>{"We don't actually track any properties of vendors right now. If we did, they would be here."}</p>
      </SinglePaneModal>
    );
  }
}

class VendorPage extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.showCreateVendor = this.showCreateVendor.bind(this);
    this.renderVendorName = this.renderVendorName.bind(this);
    this.renderDeleteAction = this.renderDeleteAction.bind(this);
    this.getVendorRecords = this.getVendorRecords.bind(this);
    this.state = {
      isLoaded: false
    };
  }

  componentDidMount() {
    VendorActions.loadAll().done(() => this.setState({ isLoaded: true }));
  }

  showCreateVendor() {
    return ModalActions.open(CreateVendorModal.MODAL_ID);
  }

  deleteVendorModalId(vendor) {
    return `${DeleteVendorModal.MODAL_ID_BASE}_${vendor.get('id')}`;
  }

  vendorModalId(vendor) {
    return `${Vendor.MODAL_ID_BASE}_${vendor.get('id')}`;
  }

  getVendorRecords() {
    return this.props.vendors
      .sortBy(vendor => vendor.get('created_at')).reverse();
  }

  renderVendorName(vendor) {
    return (
      <div>
        <Vendor vendor={vendor} modalId={this.vendorModalId(vendor)} />
        <a onClick={_evt => ModalActions.open(this.vendorModalId(vendor))}>
          {vendor.get('name')}
        </a>
      </div>
    );
  }

  renderDeleteAction(vendor) {
    const vendorHasMaterials = vendor.get('vendor_has_materials');
    return (
      <div>
        <DeleteVendorModal vendor={vendor} modalId={this.deleteVendorModalId(vendor)} />
        <Button
          link
          type="default"
          icon="fa fa-trash-alt"
          onClick={_evt => ModalActions.open(this.deleteVendorModalId(vendor))}
          label={vendorHasMaterials ? 'There are materials registered for this vendor' : 'Delete'}
          disabled={vendorHasMaterials}
        />
      </div>
    );
  }

  render() {
    return (this.state.isLoaded ? (
      <div className="vendors">
        <CreateVendorModal />
        <List
          data={this.getVendorRecords()}
          loaded
          id="vendors-page-table"
          disabledSelection
          defaultActions={[
            {
              title: 'Add vendor',
              action: this.showCreateVendor
            }
          ]}
        >
          <Column renderCellContent={this.renderVendorName} header="Name" id="name" />
          <Column renderCellContent={this.renderDeleteAction} header="Actions" id="actions" />
        </List>
      </div>
    ) :
      <Spinner />
    );
  }
}

const getStateFromStores = () => {
  const vendors = VendorStore.getAll();

  return {
    vendors
  };
};

export default ConnectToStores(VendorPage, getStateFromStores);
