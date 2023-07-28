import Immutable from 'immutable';

import { ContainerInputsLogic } from 'main/inventory/components/ContainerInputs';
import { validators } from 'main/components/validation';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import ContainerActions from 'main/actions/ContainerActions';
import NotificationActions from 'main/actions/NotificationActions';
import * as ContainerTypeUtil from 'main/util/ContainerTypeUtil';
import ContainerTypeHelper from 'main/helpers/ContainerType';
import * as Unit from 'main/util/unit';
import _ from 'lodash';

const UnitNames = Immutable.fromJS({
  nanoliter: 'nL',
  microliter: 'μL',
  milliliter: 'mL',
  liter: 'L'
});

const CheckinLogic = {
  initialInputs(orderableMaterialComponents, canBulkCheckin = false) {
    // Map of (orderableMaterialComponentId -> [containerInputs, containerInputs])
    let containersMap = Immutable.Map();
    orderableMaterialComponents.forEach((orderableMaterialComponent) => {
      containersMap = this.addContainer(containersMap, orderableMaterialComponent, canBulkCheckin);
    });

    return containersMap;
  },

  addContainer(containersMap, orderableMaterialComponent, canBulkCheckin) {
    const orderableMaterialComponentId = orderableMaterialComponent.get('id');
    const containers = containersMap.get(orderableMaterialComponentId, Immutable.List());
    const container = this.newContainer(orderableMaterialComponent, canBulkCheckin);
    return containersMap.set(orderableMaterialComponentId, containers.push(container));
  },

  newContainer(orderableMaterialComponent, canBulkCheckin) {
    // Input values for the ContainerInputs component.
    return Immutable.OrderedMap({
      omcId: Immutable.fromJS({
        value: orderableMaterialComponent.get('id')
      }),
      barcode: Immutable.fromJS({
        validators: this.getFormFieldValidators('barcode'),
        optional: false,
        value: orderableMaterialComponent.get('barcode'),
      }),
      container_type_id: Immutable.fromJS({
        validators: this.getFormFieldValidators('container_type_id'),
        optional: false,
        value: orderableMaterialComponent.getIn(['container_type', 'id'])
      }),
      resource_id: Immutable.fromJS({
        value: orderableMaterialComponent.getIn(['resource', 'id'])
      }),
      lot_no: Immutable.fromJS({
        validators: [validators.non_empty],
        optional: false,
        value: orderableMaterialComponent.get('lot_no')
      }),
      location: canBulkCheckin ? Immutable.fromJS({
        validators: [validators.container_location],
        value: orderableMaterialComponent.get('location')
      }) : Immutable.fromJS({
        validators: [validators.container_location],
      }),
      label: Immutable.fromJS({
        value: orderableMaterialComponent.getIn(['label', 'value'], '')
      }),
      storage_condition: Immutable.fromJS({
        value: orderableMaterialComponent.getIn(['resource', 'storage_condition'])
      }),
      expires_at: Immutable.fromJS({
        value: orderableMaterialComponent.get('expiration_date')
      }),
      volume: Immutable.fromJS({
        value: Unit.convertUnitShorthandToName(`${orderableMaterialComponent.get('volume_per_container')}:${orderableMaterialComponent.get('vol_measurement_unit')}`),
        validators: [],
        gValidators: [this.volumeValidator.bind(this)]
      }),
      mass: Immutable.fromJS({
        value:  Unit.convertUnitShorthandToName(`${orderableMaterialComponent.get('mass_per_container')}:${orderableMaterialComponent.get('mass_measurement_unit')}`),
        validators: [],
        gValidators: [this.massValidator.bind(this)]
      })
    });
  },

  volumeValidator(inputs, volume) {
    // Restrict volume to by containerType's max volume * well_count
    // When creating aliquots server side we will equally divide the volume.
    const containerTypeId = inputs.getIn(['container_type_id', 'value']);
    const containerType = ContainerTypeStore.getById(containerTypeId);
    if (!containerType) return undefined;

    const mass = inputs.getIn(['mass', 'value']);
    const mass_mg = Unit.toScalar(mass, 'milligram');
    let volumeValue = Unit.toScalar(volume, 'microliter');
    const maxVolume = containerType.get('well_volume_ul');
    let maxTotalVolume = maxVolume * containerType.get('well_count');

    const unit = volume && volume.split(':')[1];

    switch (unit) {
      case 'milliliter':
        volumeValue = Unit.toScalar(volume, 'milliliter');
        maxTotalVolume = (maxTotalVolume / 1000);
        break;
      case 'liter':
        volumeValue = Unit.toScalar(volume, 'liter');
        maxTotalVolume = (maxTotalVolume / 1000000);
        break;
      case 'nanoliter':
        volumeValue = Unit.toScalar(volume, 'nanoliter');
        maxTotalVolume = maxTotalVolume * 1000;
        break;
      default:
        break;
    }

    return this.volumeMassValidator(volumeValue, mass_mg, maxTotalVolume, UnitNames.get(unit));
  },

  massValidator(inputs, mass) {
    const containerTypeId = inputs.getIn(['container_type_id', 'value']);
    const containerType = ContainerTypeStore.getById(containerTypeId);
    if (!containerType) return undefined;

    const volume = inputs.getIn(['volume', 'value']);
    const volume_ul = Unit.toScalar(volume, 'microliter');
    const mass_mg = Unit.toScalar(mass, 'milligram');
    const maxVolume = containerType.get('well_volume_ul');
    const maxTotalVolume = maxVolume * containerType.get('well_count');
    // Checking against twice the density of water - 2mg/ul
    return this.volumeMassValidator(mass_mg, volume_ul, 2 * maxTotalVolume);
  },

  // mass, volume or volume, mass can be passed for value and complementaryValue
  volumeMassValidator(value, complementaryValue, max, unitNotation) {
    const mustBeNumericMessage = validators.numeric(value);
    if (value != null && mustBeNumericMessage) {
      return mustBeNumericMessage;
    } else if (!_.toNumber(value) && !_.toNumber(complementaryValue)) {
      return 'Must specify either volume or mass';
    } else if (!value) {
      return undefined;
    } else if (!isNaN(max) || ((value && value >= 0) && (complementaryValue && complementaryValue >= 0))) {
      return validators.between(0, max, unitNotation)(value);
    } else {
      return validators.positive_float(value);
    }
  },

  isValid(containersMap) {
    // Map over every container for each orderableMaterialComponent and check that they are valid (no errors).
    const allContainers = containersMap.valueSeq().flatten(true);
    return allContainers.every(container => ContainerInputsLogic.isValid(container));
  },

  // Flattens all containers into a list and adds the kit_order_id
  buildRequestContainers(containersMap, kitOrderId, labId, canBulkCheckin = false) {
    const newMap = containersMap.map((containers, orderableMaterialComponentId) => {
      return containers.map((c) => {
        const resourceId = c.getIn(['resource_id', 'value']);
        const lotNo = c.getIn(['lot_no', 'value']) ? c.getIn(['lot_no', 'value']).toString() : null;
        const vol_ul = Unit.toScalar(c.getIn(['volume', 'value']), 'microliter');
        const mass_mg = Unit.toScalar(c.getIn(['mass', 'value']), 'milligram');

        let container = ContainerInputsLogic.toDBContainers(c);
        if (!canBulkCheckin) { container = container.set('container_type', container.get('container_type_id')); }
        container = container.merge({ orderable_material_component_id: orderableMaterialComponentId });
        if (kitOrderId) {
          container = container.set('kit_order_id', kitOrderId);
        }

        if (labId) {
          container = container.set('lab_id', labId);
        }

        container = container.set('status', 'available');

        const containerType = ContainerTypeStore.getById(container.get('container_type_id'));
        const containerTypeHelper = new ContainerTypeHelper({
          col_count: containerType.get('col_count')
        });

        const aliquotCount = containerType.get('well_count');

        const volumePerAliquot = vol_ul / aliquotCount;
        const massPerAliquot = mass_mg / aliquotCount;

        const aliquots = Immutable.Range(0, aliquotCount).map((wellIdx) => {
          let aliquot = Immutable.Map();
          const idx = canBulkCheckin ? wellIdx : containerTypeHelper.humanWell(wellIdx);
          aliquot = aliquot.set('well_idx', idx);
          if (!isNaN(massPerAliquot)) {
            aliquot = aliquot.set('mass_mg', massPerAliquot);
          }
          if (!isNaN(volumePerAliquot)) {
            aliquot = aliquot.set('volume_ul', volumePerAliquot);
          }
          aliquot = aliquot.set('lot_no', lotNo);
          aliquot = aliquot.set('resource_id', resourceId);

          return aliquot;
        });
        if (canBulkCheckin) {
          return  Immutable.fromJS({ container, aliquots });
        } else {
          container = container.set('aliquots', aliquots);
          return Immutable.fromJS(container);
        }
      });
    });

    return newMap.valueSeq().flatten(true);
  },

  bulkItemsBarcodeValidator(items) {
    const containers = items.map((item) => ({
      barcode: item.getIn(['barcode', 'value']),
      lab_id: item.get('lab_id') || item.getIn(['location', 'lab_id']),
    }));
    return new Promise((resolve) => {
      ContainerActions.validateBarcodes(containers)
        .done((responses) => {
          let validatedItems = items;
          responses.forEach((response, idx) => {
            validatedItems = validatedItems.setIn([idx, 'barcode', 'isValid'], _.get(response, ['is_valid'], false));
          });
          resolve(validatedItems);
        })
        .fail((...args) => {
          NotificationActions.handleError(...args);
          resolve(items);
        });
    });
  },

  volumeMassItemValidator(field, item) {
    const containerTypeId = item.getIn(['container_type', 'id']);
    const containerType = ContainerTypeStore.getById(containerTypeId);
    const maxVolume = ContainerTypeUtil.getMaxVolume(containerType);
    const maxMass = ContainerTypeUtil.getMaxMass(containerType);
    const volMeasurementUnit = item.get('vol_measurement_unit');
    const massMeasurementUnit = item.get('mass_measurement_unit');

    const massInput = item.getIn(['mass_per_container', 'value']);
    const volumeInput = item.getIn(['volume_per_container', 'value']);
    let errorMsg;
    if (field === 'volume_per_container') {
      errorMsg = this.validateField('volume_per_container', volumeInput, massInput, maxVolume, volMeasurementUnit);
    } else {
      errorMsg = this.validateField('mass_per_container', massInput, volumeInput,  maxMass, massMeasurementUnit);
    }
    let updatedItem = item.setIn([field, 'error'], errorMsg);
    updatedItem = updatedItem.setIn([field, 'isValid'], !errorMsg);
    return updatedItem;
  },

  bulkItemsValidator(field) {
    return (items) => {
      if (field === 'barcode') {
        return this.bulkItemsBarcodeValidator(items);
      }
      const isMassVolumeField = field === 'mass_per_container' || field === 'volume_per_container';
      const validatedItems = items.map((item) => {
        if (isMassVolumeField) {
          return this.volumeMassItemValidator(field, item);
        }
        const error = this.validateField(field, item.getIn([field, 'value']));
        return item.updateIn([field], updater => updater.set('isValid', !error).set('error', error));
      });
      return Promise.resolve(validatedItems.toList());
    };
  },

  getFormFieldValidators(field) {
    switch (field) {
      case 'lot_no': return [validators.non_empty];
      case 'mass_per_container':
      case 'volume_per_container': return [this.volumeMassValidator];
      case 'label': return [validators.no_slashes, validators.no_commas];
      case 'barcode': return [validators.non_empty, validators.barcode];
      case 'container_type_id': return [validators.non_empty, validators.retiredContainerTypeValidator];
    }
    return undefined;
  },

  validateField(field, ...validationFunctionArgs) {
    const validators = this.getFormFieldValidators(field);
    if (validators) {
      for (const validator of validators) {
        const errorMsg = validator(...validationFunctionArgs);
        if (errorMsg) return errorMsg;
      }
    }
  }
};

export default CheckinLogic;
