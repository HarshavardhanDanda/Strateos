import PropTypes from 'prop-types';

export const shipmentPropTypes = PropTypes.shape({
  id: PropTypes.func.isRequired,
  type: PropTypes.func.isRequired,
  name: PropTypes.func,
  containerIds: PropTypes.func,
  label: PropTypes.func,
  organizationName: PropTypes.func.isRequired,
  createdAt: PropTypes.func,
  checkedInAt: PropTypes.func,
  isCheckedIn: PropTypes.func,
  isContainerCheckedIn: PropTypes.func,
  isDeletable: PropTypes.func,
  status: PropTypes.func,
  isPickup: PropTypes.func,
  contactName: PropTypes.func,
  contactNumber: PropTypes.func,
  scheduledPickup: PropTypes.func,
  note: PropTypes.func,
  receiving_note: PropTypes.func,
  pickupStreet: PropTypes.func,
  pickupZipcode: PropTypes.func,
  packingUrl: PropTypes.func,
  labId: PropTypes.func,
  fullShipment: PropTypes.func,
});

class ShipmentModel {
  constructor(_shipment) {
    this._shipment = _shipment;
  }

  id() { return this._shipment.get('id'); }

  type() { return this._shipment.get('shipment_type'); }

  name() { return this._shipment.get('name'); }

  containerIds() { return this._shipment.get('container_ids', []); }

  label() { return this._shipment.get('label'); }

  organizationName() { return this._shipment.getIn(['organization', 'name']); }

  createdAt() { return this._shipment.get('created_at'); }

  checkedInAt() {
    return this._shipment.get('checked_in_at');
  }

  isCheckedIn() {
    return this.checkedInAt() != undefined;
  }

  static isContainerCheckedIn(container) {
    return container.get('status') !== 'inbound';
  }

  isDeletable() {
    return !this.isCheckedIn();
  }

  status() {
    const status = this._shipment.get('status');
    if (status) { return status.replace(/_/g, ' '); }
    return undefined;
  }

  isPickup() { return (this.scheduledPickup() !== undefined); }
  contactName() { return this._shipment.get('contact_name'); }
  contactNumber() { return this._shipment.get('contact_number'); }
  scheduledPickup() { return this._shipment.get('scheduled_pickup'); }
  note() { return this._shipment.get('note'); }
  receiving_note() { return this._shipment.get('receiving_note'); }
  pickupStreet() { return this._shipment.get('pickup_street'); }
  pickupZipcode() { return this._shipment.get('pickup_zipcode'); }
  packingUrl() { return this._shipment.get('packing_url'); }
  labId() { return this._shipment.get('lab_id'); }

  fullShipment() { return this._shipment; }
}

export default ShipmentModel;
