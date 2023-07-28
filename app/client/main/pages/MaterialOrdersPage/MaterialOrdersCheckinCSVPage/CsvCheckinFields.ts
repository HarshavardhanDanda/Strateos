import { Field } from 'main/components/FieldMapper/types';

export const keys = {
  vendorOrderId: 'Order ID*',
  sku: 'Sku*',
  containerType: 'Container Type*',
  lotNumber: 'Lot #*',
  locationId: 'Location ID*',
  storageCondition: 'Storage Condition*',
  barcode: 'Barcode*',
  label: 'Label',
  expirationDate: 'Exp Date (MM/dd/YYYY)',
  volume: 'Volume (µL)',
  mass: 'Mass (mg)',
  groupItemName: 'Group Item Name',
};

const fields: Field[] = [
  {
    display: keys.vendorOrderId,
    required: true
  },
  {
    display: keys.sku,
    required: true
  },
  {
    display: keys.containerType,
    required: true
  },
  {
    display: keys.lotNumber,
    required: true
  },
  {
    display: keys.locationId,
    required: true
  },
  {
    display: keys.storageCondition,
    required: true
  },
  {
    display: keys.barcode,
    required: true
  },
  {
    display: keys.label
  },
  {
    display: keys.expirationDate
  },
  {
    display: keys.volume
  },
  {
    display: keys.mass
  },
  {
    display: keys.groupItemName
  }
];

export default fields;
