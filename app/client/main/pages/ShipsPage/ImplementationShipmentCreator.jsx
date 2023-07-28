import * as Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Spinner, Validated } from '@transcriptic/amino';

import RowEntityCreator from 'main/components/RowEntityCreator';
import ContainerStore from 'main/stores/ContainerStore';
import SelectStorage from 'main/components/Input';
import { SimpleInputsValidator, validators } from 'main/components/validation';
import ImplementationShipmentInfo from 'main/pages/ShipsPage/ImplementationShipmentInfo';
import ImplementationShipmentConfirmModal from 'main/pages/ShipsPage/ImplementationShipmentConfirmModal';
import QuickListCreatorItemsList from 'main/components/QuickListCreatorItemsList';
import ModalActions from 'main/actions/ModalActions';
import { ShipmentModel } from 'main/stores/ShipmentStore';
import ShipmentAPI from 'main/api/ShipmentAPI';
import ShipmentActions from 'main/actions/ShipmentActions';
import SessionStore from 'main/stores/SessionStore';

import './ImplementationShipmentCreator.scss';

// Renders a RowEntityCreator and list of created items
class ImplementationShipmentCreator extends React.Component {

  static get propTypes() {
    return {
      items: PropTypes.instanceOf(Immutable.List),
      shipment: PropTypes.instanceOf(ShipmentModel),
      loading: PropTypes.bool,
      checkingIn: PropTypes.bool,
      package: PropTypes.object.isRequired,
      updatePackage: PropTypes.func.isRequired,
      onSave: PropTypes.func
    };
  }

  static get defaultProps() {
    return {
      checkingIn: false
    };
  }

  // Upon shipment create, pop the confirmation modal
  static openConfirmModal() {
    ModalActions.open('ShipmentCreateConfirmModal');
  }

  static initialState() {
    return {
      addedItems: Immutable.List(),
      newItem: Immutable.Map({ storage_condition: ContainerStore.defaultStorageCondition }),
      createdShipment: {
        accession: '',
        name: ''
      }
    };
  }

  constructor(props) {
    super(props);
    this.validator = SimpleInputsValidator({
      title: { validators: [validators.non_empty] },
      note: { validators: [] }
    });
    this.state = ImplementationShipmentCreator.initialState();

    _.bindAll(
      this,
      'onPSUploaded',
      'onPSUploadAborted',
      'onPSAttached',
      'onAdd',
      'onItemInput',
      'onTextInput',
      'updateShipment',
      'saveShipment',
      'onDestroy',
      'onLabInput'
    );
  }

  // Fired when an item is created through the RowEntityCreator
  onAdd(e, valid) {
    e.preventDefault();
    if (valid) {
      this.setState({
        addedItems: this.state.addedItems.concat(Immutable.List([this.state.newItem])),
        newItem: Immutable.Map({ storage_condition: ContainerStore.defaultStorageCondition })
      });
    } else {
      this.setState((state) => {
        return { newItem: state.newItem.set('force_validate', true) };
      });
    }
  }

  // Handler for data in the RowEntityCreator being updated
  // Adds the new data to the newItem attribute of state
  // INPUT: Immutable Map containing whatever k,v pairs have been set thus far
  onItemInput(updatedItem) {
    this.setState({ newItem: updatedItem });
  }

  // Fired when an item is removed from a shipment in the UI
  onDestroy(index) {
    this.setState({ addedItems: this.state.addedItems.remove(index) });
  }

  onTextInput(key, value) {
    this.props.updatePackage(key, value);
  }

  onLabInput(key, value, cb) {
    this.props.updatePackage(key, value);
    if (this.props.shipment) {
      cb();
    }
  }

  // Fired when a file has been selected to be uploaded for the packing slip
  onPSAttached(files) {
    const uploadFile = files[0].file;
    this.props.updatePackage('uploading', true);
    this.props.updatePackage('psFile', uploadFile);
  }

  // Fired when the file has been uploaded successfully
  onPSUploaded(file, key) {
    // If this file was uploaded for a pre-existing shipment, update the shipment
    if (this.props.shipment) {
      const fillShip = this.props.shipment.fullShipment().set('packing_url', key).toJS();
      ShipmentAPI.update(this.props.shipment.id(), this.omitParamsForShipmentUpdate(fillShip));
    }
    this.props.updatePackage('uploading', false);
    this.props.updatePackage('ps_attachment_url', key);
  }

  // When a file uploaded is aborted
  onPSUploadAborted() {
    this.props.updatePackage('psFile', undefined);
    this.props.updatePackage('uploading', false);
  }

  // if a shipment has been modified, update it in the DB using the 'update' shipment action
  updateShipment(key, value) {
    if (this.props.checkingIn || this.props.shipment) {
      const fillShip = this.props.shipment.fullShipment().set(key, value).toJS();
      ShipmentAPI.update(
        this.props.shipment.id(), this.omitParamsForShipmentUpdate(fillShip)
      );
    }
  }

  omitParamsForShipmentUpdate(shipment) {
    return _.omit(shipment, ['type', 'organization',  'id', 'links']);
  }

  // Create a shipment
  saveShipment() {
    if (this.validator.isValid(Immutable.fromJS(this.props.package))) {
      const ship = {
        attributes: {
          organization_id: SessionStore.getOrg().get('id'),
          shipment_type: 'implementation',
          name: this.props.package.title,
          note: this.props.package.note,
          packing_url: this.props.package.ps_attachment_url,
          lab_id: this.props.package.lab_id
        }
      };
      const implementationItems = [];
      Promise.all(this.state.addedItems.map((item) => {
        const implItem = item.get('force_validate') ? _.omit(item.toJS(), ['force_validate']) : item;
        const implShipment = { data: { attributes: implItem } };
        implementationItems.push(implShipment);
        return implementationItems;
      }));
      ShipmentActions.createShipmentWithImplementationItems({ data: ship, implementation_item_params: implementationItems })
        .then((shipment) => {
          this.props.onSave();

          if (shipment && shipment.data && shipment.data.attributes) {
            // reset state of shipment creation form to blank
            this.setState({
              ...ImplementationShipmentCreator.initialState(),
              createdShipment: {
                accession: shipment.data.attributes.label,
                name: shipment.data.attributes.name
              }
            });
            // pop the confirmation modal presenting the final details from the shipment
            ImplementationShipmentCreator.openConfirmModal(true);
          }
        });
    } else {
      this.props.updatePackage('force_validate', true);
    }
  }

  // Render the full shipment creation form, including the Implementation Item creator
  renderShipmentCreateForm() {

    const forceValidate = this.props.package.force_validate;
    const errors = forceValidate && this.validator.errors(Immutable.fromJS(this.props.package));
    return (
      <div className="implementation-shipment-creator row">
        {
          /*
            The ConfirmModal is popped after a shipment is created successfully
          */
        }
        <ImplementationShipmentConfirmModal
          modalId="ShipmentCreateConfirmModal"
          shipmentName={this.state.createdShipment.name}
          shipmentAccession={this.state.createdShipment.accession}
        />
        <Validated
          force_validate={forceValidate}
          error={errors && errors.title}
        >
          <input
            placeholder="Shipment Title..."
            type="text"
            className="implementation-shipment-creator__title col-md-6"
            value={this.props.package.title}
            onChange={e => this.onTextInput('title', e.target.value)}
            onBlur={e => (!this.props.checkingIn && this.updateShipment('name', e.target.value))}
            readOnly={this.props.checkingIn}
          />
        </Validated>
        {
          // render the row entity creator only if we're not checking in and a shipment
          // wasn't provided as a prop
          (!this.props.checkingIn && !this.props.shipment) && (
            <div
              className="col-md-12"
            >
              {
                /*
                  The RowEntityCreator renders its children,
                  wrapping input fields in Validator components
                */
              }
              <label htmlFor="name">Add Shipment Items</label>
              <RowEntityCreator
                onAdd={this.onAdd}
                entity={this.state.newItem}
                onEntityInput={this.onItemInput}
              >
                <input
                  placeholder="Item Name"
                  className={'row-entity-creator__input'}
                  displayClass="row-entity-creator__text-input row-entity-creator__input-container"
                  type="text"
                  name="name"
                  id="name"
                  value=""
                  validator={{ validators: [validators.non_empty] }}
                />
                <div className="row-entity-creator__vertical-divider" />
                <input
                  placeholder="Quantity"
                  className="row-entity-creator__input"
                  displayClass="row-entity-creator__number-input row-entity-creator__input-container"
                  type="text"
                  pattern="[0-9]*"
                  name="quantity"
                  value=""
                  validator={{ validators: [validators.positive_integer] }}
                />
                <div className="row-entity-creator__vertical-divider" />
                <input
                  placeholder="Container Type"
                  className="row-entity-creator__input"
                  displayClass="row-entity-creator__text-input row-entity-creator__input-container"
                  type="text"
                  name="container_type"
                  value=""
                  validator={{ validators: [validators.non_empty] }}
                />
                <div className="row-entity-creator__vertical-divider" />
                <SelectStorage
                  name="storage_condition"
                  validator={{ validators: [] }}
                  className="row-entity-creator__dropdown row-entity-creator__input"
                  value={(this.state.newItem && this.state.newItem.get('storage_condition')) ?
                    this.state.newItem.get('storage_condition') :
                    ContainerStore.defaultStorageCondition
                  }
                  onChange={e => this.onItemInput(this.state.newItem.set('storage_condition', e.target.value))}
                />
                <div className="row-entity-creator__vertical-divider" />
                <textarea
                  name="note"
                  placeholder="Notes"
                  className="row-entity-creator__input"
                  displayClass="row-entity-creator__block-entry row-entity-creator__input-container"
                  value=""
                  validator={{ validators: [] }}
                />
              </RowEntityCreator>
            </div>
          )
        }
        { (this.state.addedItems.count() !== 0 || (this.props.shipment && this.props.items.count() !== 0)) &&
          (
          <QuickListCreatorItemsList
            checkingIn={this.props.checkingIn}
            shipment={this.props.shipment}
            onDestroy={this.onDestroy}
            items={this.props.shipment ? this.props.items : this.state.addedItems}
          />
          )
         }
        <ImplementationShipmentInfo
          onTextInput={this.onTextInput}
          updateShipment={this.updateShipment}
          saveShipment={this.saveShipment}
          disableSave={this.state.addedItems.count() == 0}
          package={this.props.package}
          checkingIn={!!this.props.checkingIn}
          shipment={this.props.shipment}
          onPSUploaded={this.onPSUploaded}
          onPSUploadAborted={this.onPSUploadAborted}
          onPSAttached={this.onPSAttached}
          onLabInput={this.onLabInput}
          labs={this.props.labs}
        />
      </div>
    );
  }

  render() {
    return (
      this.props.loading ? <Spinner /> : this.renderShipmentCreateForm()
    );
  }
}

export default ImplementationShipmentCreator;
