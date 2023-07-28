import PropTypes from 'prop-types';
import React     from 'react';
import { LabeledInput, Button, TextInput, Column, Spinner, List } from '@transcriptic/amino';
import ModalActions        from 'main/actions/ModalActions';
import ConnectToStores     from 'main/containers/ConnectToStoresHOC';
import { SinglePaneModal } from 'main/components/Modal';
import SupplierActions       from 'main/actions/SupplierActions';
import SupplierStore         from 'main/stores/SupplierStore';

class CreateSupplierModal extends React.Component {

  static get MODAL_ID() {
    return 'CREATE_SUPPLIER_MODAL';
  }

  constructor(props, context) {
    super(props, context);
    this.state = { supplierName: '' };
    this.save = this.save.bind(this);
  }

  save() {
    SupplierActions.create(this.state.supplierName);
  }

  render() {
    return (
      <SinglePaneModal
        modalSize="large"
        title="Create Supplier"
        modalId={CreateSupplierModal.MODAL_ID}
        onAccept={this.save}
        beforeDismiss={() => {
          this.setState({ supplierName: '' });
        }}
        acceptText="Create Supplier"
      >
        <LabeledInput label="Supplier Name">
          <TextInput
            placeholder="Supplier Name"
            value={this.state.supplierName}
            onChange={e => this.setState({ supplierName: e.target.value })}
          />
        </LabeledInput>
      </SinglePaneModal>
    );
  }
}

class DeleteSupplierModal extends React.Component {

  static get propTypes() {
    return {
      modalId: PropTypes.string.isRequired,
      supplier:  PropTypes.object.isRequired
    };
  }

  static get MODAL_ID_BASE() {
    return 'DELETE_SUPPLIER_MODAL';
  }

  constructor(props, context) {
    super(props, context);
    this.destroy = this.destroy.bind(this);
  }

  destroy() {
    SupplierActions.destroy(this.props.supplier.get('id'));
  }

  render() {
    return (
      <SinglePaneModal
        modalId={this.props.modalId}
        title="Destroy Supplier"
        renderFooter
        onAccept={this.destroy}
        acceptText="Destroy"
      >
        <h3>{`Are you sure you want to delete supplier ${this.props.supplier.get('name')}?`}</h3>
        <p>You won&apos;t be able to recover it.</p>
      </SinglePaneModal>
    );
  }
}

class Supplier extends React.Component {

  static get propTypes() {
    return {
      modalId: PropTypes.string.isRequired,
      supplier:  PropTypes.object.isRequired
    };
  }

  static get MODAL_ID_BASE() {
    return 'SUPPLIER_MODAL';
  }

  render() {
    return (
      <SinglePaneModal
        modalId={this.props.modalId}
        modalSize="large"
        title={this.props.supplier.get('name')}
      >
        <p>{"We don't actually track any properties of suppliers right now. If we did, they would be here."}</p>
      </SinglePaneModal>
    );
  }
}

class SupplierPage extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.showCreateSupplier = this.showCreateSupplier.bind(this);
    this.renderSupplierName = this.renderSupplierName.bind(this);
    this.renderDeleteAction = this.renderDeleteAction.bind(this);
    this.getSupplierRecords = this.getSupplierRecords.bind(this);
    this.state = {
      isLoaded: false
    };
  }

  componentDidMount() {
    SupplierActions.loadAll().done(() => this.setState({ isLoaded: true }));
  }

  showCreateSupplier() {
    return ModalActions.open(CreateSupplierModal.MODAL_ID);
  }

  deleteSupplierModalId(supplier) {
    return `${DeleteSupplierModal.MODAL_ID_BASE}_${supplier.get('id')}`;
  }

  supplierModalId(supplier) {
    return `${Supplier.MODAL_ID_BASE}_${supplier.get('id')}`;
  }

  getSupplierRecords() {
    return this.props.suppliers
      .sortBy(supplier => supplier.get('created_at')).reverse();
  }

  renderSupplierName(supplier) {
    return (
      <div>
        <Supplier supplier={supplier} modalId={this.supplierModalId(supplier)} />
        <a onClick={() => ModalActions.open(this.supplierModalId(supplier))}>
          {supplier.get('name')}
        </a>
      </div>
    );
  }

  renderDeleteAction(supplier) {
    const supplierHasMaterials = supplier.get('supplier_has_materials');
    return (
      <div>
        <DeleteSupplierModal supplier={supplier} modalId={this.deleteSupplierModalId(supplier)} />
        <Button
          link
          type="default"
          icon="fa fa-trash-alt"
          onClick={() => ModalActions.open(this.deleteSupplierModalId(supplier))}
          label={supplierHasMaterials ? 'There are materials registered for this supplier' : 'Delete'}
          disabled={supplierHasMaterials}
        />
      </div>
    );
  }

  render() {
    return (this.state.isLoaded ? (
      <div className="suppliers">
        <CreateSupplierModal />
        <List
          data={this.getSupplierRecords()}
          loaded
          id="suppliers-page-table"
          disabledSelection
          defaultActions={[
            {
              title: 'Add supplier',
              action: this.showCreateSupplier
            }
          ]}
        >
          <Column renderCellContent={this.renderSupplierName} header="Name" id="name" />
          <Column renderCellContent={this.renderDeleteAction} header="Actions" id="actions" />
        </List>
      </div>
    ) :
      <Spinner />
    );
  }
}

const getStateFromStores = () => {
  const suppliers = SupplierStore.getAll();

  return {
    suppliers
  };
};

export default ConnectToStores(SupplierPage, getStateFromStores);
