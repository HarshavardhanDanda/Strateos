import _ from 'lodash';
import Immutable from 'immutable';
import moment from 'moment';
import OrderableMaterialStore from 'main/stores/OrderableMaterialStore';
import ResourceStore from 'main/stores/ResourceStore';
import ContainerStore from 'main/stores/ContainerStore';
import VendorStore from 'main/stores/VendorStore';
import CommonUiUtil from 'main/util/CommonUiUtil';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import LocationStore from 'main/stores/LocationStore';
import ArrayUtil from 'main/util/ArrayUtil';
import * as ContainerTypeUtil from 'main/util/ContainerTypeUtil';
import CheckinLogic from 'main/models/KitCheckinModal/CheckInLogic';
import { Item } from './MultiRowEditorModal/MultiRowEditorModal';

export enum FormField {
  lot_no = 'lot_no',
  barcode = 'barcode',
  mass_per_container = 'mass_per_container',
  volume_per_container = 'volume_per_container',
  label = 'label',
  location = 'location',
  container_type_id = 'container_type_id',
}

export const INLINE_EDITING_INPUTS = ['barcode', 'volume_per_container', 'mass_per_container', 'lot_no', 'label'];

export const Columns = {
  NAME: 'name',
  SKU: 'sku',
  LABEL: 'label',
  LAB: 'Lab',
  CONTAINER_TYPE: 'container type',
  RESOURCE_ID: 'Resource ID',
  CAS: 'CAS number',
  LOT: 'lot',
  LOCATION: 'location',
  STORAGE_CONDITION: 'storage condition',
  EXP_DATE: 'exp date',
  VOLUME: 'volume',
  MASS: 'mass',
  ORDER_ID: 'Order ID',
  BARCODE: 'barcode',
  TYPE: 'type',
  VENDOR: 'vendor',
  CREATED: 'created',
};

export const REQUIRED_VISIBLE_COLUMNS = [
  Columns.NAME, Columns.CONTAINER_TYPE, Columns.RESOURCE_ID, Columns.LOT,
  Columns.LOCATION, Columns.STORAGE_CONDITION, Columns.VOLUME, Columns.MASS, Columns.BARCODE
];
export const VISIBLE_COLUMNS = REQUIRED_VISIBLE_COLUMNS.concat([
  Columns.LABEL, Columns.SKU, Columns.CAS, Columns.EXP_DATE,
  Columns.ORDER_ID, Columns.TYPE, Columns.VENDOR, Columns.CREATED
]);

// For individual type: parentRowId and rowId is same and equal to kit_order.id
// For group type: parentRowId = kit_order.id and rowId = omc.id
export const initialState = {
  rowHighlightMapInitialState: {
    location: {}, // contains { parentRowId: { rowId: { type?, hasError? } } }
    container_type_id: {},
    volume_per_container: {},
    mass_per_container: {},
    storage_condition: {},
    barcode: {},
    lot_no: {},
    label: {}
  }
};

export interface RowColorAndHighlightMapType {
  rowColorMap: object;
  rowHighlightMap: typeof initialState.rowHighlightMapInitialState;
  setState: (
    field: FormField,
    rowId: string,
    parentRowId: string,
    errorMessage: (string | undefined),
    showIcon?: boolean) => RowColorAndHighlightMapType;
  setDanger: (
    field: FormField,
    errorMessage: string,
    rowId: string,
    parentRowId: string) => RowColorAndHighlightMapType;
  resetState: (
    field: FormField,
    rowId: string,
    parentRowId: string,
    setSuccess?: boolean) => RowColorAndHighlightMapType;
  deleteRow: (rowId: string, parentRowId: string) => RowColorAndHighlightMapType;
  validateFieldAndSetState: (
    field: FormField,
    value: string,
    omc: Immutable.Map<string, never>,
    rowId: string,
    parentRowId: string) => RowColorAndHighlightMapType;
}

const computeChildRowColorMapState = (rowId: string, parentRowId: string, highlightMap) => {
  const hasError = _.values(highlightMap).some((parentRowErrors) => {
    const rowError = _.get(parentRowErrors, [parentRowId, rowId]);
    return rowError && rowError.hasError;
  });
  return hasError ? 'danger' : undefined;
};
const computeParentRowColorMapState = (parentRowId: string, highlightMap) => {
  const hasError = _.values(highlightMap).some((parentRowErrors) => {
    const allErrorsUnderParent = _.get(parentRowErrors, parentRowId);
    return _.values(allErrorsUnderParent).some((rowError) => rowError && rowError.hasError);
  });
  return hasError ? 'danger' : undefined;
};

const validateMassAndVolume = (omc: Immutable.Map<string, never>, field: FormField.mass_per_container | FormField.volume_per_container, value: string) => {
  const containerTypeId = omc.getIn(['form', 'container_type', 'id']);
  const containerType = ContainerTypeStore.getById(containerTypeId);
  const maxVolume = ContainerTypeUtil.getMaxVolume(containerType);
  const maxMass = ContainerTypeUtil.getMaxMass(containerType);
  const volMeasurementUnit = omc.get('vol_measurement_unit');
  const massMeasurementUnit = omc.get('mass_measurement_unit');

  let volumeError;
  let massError;
  if (field === FormField.volume_per_container) {
    const massPerContainer = omc.getIn(['form', FormField.mass_per_container, 'value']);
    volumeError = CheckinLogic.validateField(FormField.volume_per_container, value, massPerContainer, maxVolume, volMeasurementUnit);
    massError = CheckinLogic.validateField(FormField.mass_per_container, massPerContainer, value, maxMass, massMeasurementUnit);
  } else {
    const volumePerContainer = omc.getIn(['form', FormField.volume_per_container, 'value']);
    volumeError = CheckinLogic.validateField(FormField.volume_per_container, volumePerContainer, value, maxVolume, volMeasurementUnit);
    massError = CheckinLogic.validateField(FormField.mass_per_container, value, volumePerContainer, maxMass, massMeasurementUnit);
  }
  return {
    volumeError,
    massError
  };
};

export const RowColorAndHighlightMap = function(rowColorMap = {}, rowHighlightMap = initialState.rowHighlightMapInitialState) {
  this.rowColorMap = _.cloneDeep(rowColorMap);
  this.rowHighlightMap = _.cloneDeep(rowHighlightMap);

  this.setState = (field: FormField, rowId: string, parentRowId: string, errorMessage: (string | undefined) = undefined, showIcon = false): RowColorAndHighlightMapType => {
    _.set(this.rowHighlightMap, [field, parentRowId, rowId], {
      type: errorMessage ? 'danger' : 'success',
      icon: showIcon && (errorMessage ? 'far fa-exclamation-circle' : 'fa fa-check'),
      iconPlacement: showIcon && (errorMessage ? 'left' : 'right'),
      message: errorMessage,
      isInlineEditing: INLINE_EDITING_INPUTS.includes(field),
      hasError: !!errorMessage
    });
    if (errorMessage) {
      _.set(this.rowColorMap, rowId, 'danger');
      _.set(this.rowColorMap, parentRowId, 'danger');
    } else {
      _.set(this.rowColorMap, rowId, computeChildRowColorMapState(rowId, parentRowId, this.rowHighlightMap));
      _.set(this.rowColorMap, parentRowId, computeParentRowColorMapState(parentRowId, this.rowHighlightMap));
    }
    return this;
  };

  this.setDanger = (field: FormField, errorMessage: string, rowId: string, parentRowId: string): RowColorAndHighlightMapType => {
    return this.setState(field, rowId, parentRowId, errorMessage, true);
  };

  this.resetState = (field: FormField, rowId: string, parentRowId: string, setSuccess = false): RowColorAndHighlightMapType => {
    if (field === FormField.barcode && setSuccess) {
      return this.setState(field, rowId, parentRowId, undefined, true);
    }
    _.set(this.rowHighlightMap, [field, parentRowId, rowId], {
      isInlineEditing: INLINE_EDITING_INPUTS.includes(field),
      hasError: false
    });
    _.set(this.rowColorMap, rowId, computeChildRowColorMapState(rowId, parentRowId, this.rowHighlightMap));
    _.set(this.rowColorMap, parentRowId, computeParentRowColorMapState(parentRowId, this.rowHighlightMap));
    return this;
  };

  this.deleteRow = (rowId: string, parentRowId: string): RowColorAndHighlightMapType => {
    _.keys(this.rowHighlightMap).forEach((field) => {
      if (parentRowId === rowId) { // for individual material remove entire parent
        _.unset(this.rowHighlightMap, [field, parentRowId]);
      } else {
        _.unset(this.rowHighlightMap, [field, parentRowId, rowId]);
      }
    });
    _.unset(this.rowColorMap, rowId);
    // Delete the parent as well if there are no errors under it
    if (!computeParentRowColorMapState(parentRowId, this.rowHighlightMap)) {
      _.unset(this.rowColorMap, parentRowId);
    }
    return this;
  };

  this.validateFieldAndSetState = (field: FormField, value: string, omc: Immutable.Map<string, never>, rowId: string, parentRowId: string): RowColorAndHighlightMapType => {
    const isMassVolumeField = field === FormField.mass_per_container || field === FormField.volume_per_container;
    if (isMassVolumeField) {
      const {
        volumeError,
        massError
      } = validateMassAndVolume(omc, field, value);

      this.resetState(FormField.volume_per_container, rowId, parentRowId);
      this.resetState(FormField.mass_per_container, rowId, parentRowId);
      if (volumeError) {
        this.setDanger(FormField.volume_per_container, volumeError, rowId, parentRowId);
      }
      if (massError) {
        this.setDanger(FormField.mass_per_container, massError, rowId, parentRowId);
      }
    } else {
      const error = CheckinLogic.validateField(field, value);
      if (error) {
        this.setDanger(field, error, rowId, parentRowId);
      } else {
        this.resetState(field, rowId, parentRowId);
      }
    }
    return this;
  };
};

export const hasLabAndBarcode = (item: Item, labId = undefined) =>
  !!((labId || item.get('lab_id') || item.getIn(['location', 'lab_id'])) && item.getIn(['barcode', 'value']));

export const isGroupMaterial = (data) => data.getIn([0, 'orderable_material', 'material', 'material_type']) === 'group';

export const isGroupMaterialCSVCheckin = (data) => data[0].getIn(['order', 'orderable_material', 'material', 'material_type']) === 'group';

/*
  (Vinay) Returns list of Item to be passed on to MultiRowEditModal for visible(expanded) selected rows only
  The includeAll param when true ignores row selections
*/
export const modalData = (fields, data, selected, expanded, includeAllRows = false) => {
  const isMaterialTypeGroup = isGroupMaterial(data);
  const formData = [];
  data.forEach((material, idx) => {

    if (
      includeAllRows ||
      (!isMaterialTypeGroup && selected.get(material.get('id'))) || // If type individual expanded is not set, only selected is set for row selection, hence filtered with selected rows.
      (isMaterialTypeGroup && Boolean(expanded.get(material.get('id')))) // If type group - we filter for expanded/visible groups
    ) {
      if (isMaterialTypeGroup) {
        material
          .getIn(['orderable_material', 'orderable_material_components'], [])
          .forEach((omc, omcIdx) => {
            const selectedMaterial = selected.get(material.get('id'));
            if (includeAllRows || (selectedMaterial && selectedMaterial[omc.get('id')])) {
              formData.push(
                Immutable.fromJS({
                  id: omc.get('id'),
                  material_idx: idx,
                  form_idx: omcIdx,
                  name: omc.getIn(['resource', 'name']),
                  sku: material.getIn(['orderable_material', 'sku']),
                  ...(fields.omc ? Object.keys(fields.omc).reduce((obj, field) => { obj[field] = omc.getIn(fields.omc[field]); return obj; }, {}) : {}),
                  ...(fields.material ? Object.keys(fields.material).reduce((obj, field) => { obj[field] = material.getIn(fields.material[field]); return obj; }, {}) : {}),
                })
              );
            }
          });
      } else {
        const omc = material.getIn([
          'orderable_material',
          'orderable_material_components',
          '0',
        ]);
        formData.push(
          Immutable.fromJS({
            id: omc.get('id'),
            material_idx: idx,
            form_idx: 0,
            name: material.getIn(['orderable_material', 'material', 'name']),
            sku: material.getIn(['orderable_material', 'sku']),
            ...(fields.omc ? Object.keys(fields.omc).reduce((obj, field) => { obj[field] = omc.getIn(fields.omc[field]); return obj; }, {}) : {}),
            ...(fields.material ? Object.keys(fields.material).reduce((obj, field) => { obj[field] = material.getIn(fields.material[field]); return obj; }, {}) : {}),
          })
        );
      }
    }
  });
  return Immutable.List(formData);
};

export const getInitialForm = (omc, resource, initialForm = Immutable.fromJS({})) => {
  let location = null;
  let storageCondition = null;
  let expirationDate = null;
  let containerType = omc.get('container_type');
  const barcode = initialForm.get('barcode') || '';
  const lotNo = initialForm.get('lot_no') || '';
  const label = initialForm.get('label') || '';
  const locationId = initialForm.get('location');
  const volumePerContainer = ArrayUtil.firstNonEmptyValue([initialForm.get('volume_per_container'), omc.get('volume_per_container')]);
  const massPerContainer = ArrayUtil.firstNonEmptyValue([initialForm.get('mass_per_container'), omc.get('mass_per_container')]);
  const storageConditionValue =  ArrayUtil.firstNonEmptyValue([initialForm.get('storage_condition'), resource.get('storage_condition')]);
  const containerTypeValue = initialForm.get('container_type');
  const expirationDateValue = moment(initialForm.get('expiration_date'), 'MM/DD/YYYY');

  if (storageConditionValue) {
    const validStorageCondition = ContainerStore.validStorageConditions.find(condition => condition.value === storageConditionValue);
    if (validStorageCondition) {
      storageCondition = Immutable.fromJS(validStorageCondition);
    }
  }
  if (containerTypeValue) {
    const validContainerType = ContainerTypeStore.getAll().find(ct => ct.get('id') === containerTypeValue);
    if (validContainerType) {
      containerType = validContainerType;
    }
  }
  if (locationId) {
    location = LocationStore.getById(locationId);
  }
  if (expirationDateValue.isValid()) {
    expirationDate = moment.utc(expirationDateValue);
  }

  return Immutable.Map({
    lot_no: Immutable.fromJS({ value: lotNo, isValid: false }),
    location: location,
    label: Immutable.fromJS({ value: label, isValid: false }),
    expiration_date: expirationDate,
    barcode: Immutable.fromJS({ value: barcode, isValid: false }),
    storage_condition: storageCondition,
    container_type: containerType,
    volume_per_container: Immutable.fromJS({ value: volumePerContainer, isValid: false }),
    mass_per_container: Immutable.fromJS({ value: massPerContainer, isValid: false }),
  });
};

export const mapOrderableMaterialToData = (propsData, response, isCSVCheckin = false) => {
  return Immutable.fromJS(
    propsData.map((item, index) => {
      const orderId = item.getIn(['order', 'id']) || `order-missing-id-${index}`;
      let orderableMaterial;
      let omcs;
      const isMaterialTypeGroupCSV = isCSVCheckin && isGroupMaterialCSVCheckin(propsData);

      if (isMaterialTypeGroupCSV) {
        orderableMaterial = item.getIn(['order', 'orderable_material']);
        omcs = orderableMaterial.get('orderable_material_components');
      } else {
        orderableMaterial = OrderableMaterialStore.getById(item.get('orderableMaterialId'));
        const omId = orderableMaterial.get('id');
        orderableMaterial = orderableMaterial.set('orderable_material_id', omId);
        omcs = orderableMaterial.get('orderable_material_components');
      }

      omcs = omcs.map((omc) => {
        const resourceId = isMaterialTypeGroupCSV ? omc.getIn(['resource', 'id']) : omc.getIn(['material_component', 'resource_id']);
        const resource = ResourceStore.getById(resourceId);
        const initialForm = isCSVCheckin ? omc.get('initialForm') : item.get('initialForm');
        const form = getInitialForm(omc, resource, initialForm);
        const rowUUID = CommonUiUtil.getUUIDv4();
        return omc.set('form', form)
          .set('vol_measurement_unit', omc.get('vol_measurement_unit') || 'µL')
          .set('mass_measurement_unit', omc.get('mass_measurement_unit') || 'mg')
          .set('resource', resource)
          .set('initialForm', form)
          .set('orderable_material_component_id', omc.get('id'))
          .set('parentRowId', orderId)
          .set('orderId', orderId)
          .set('id', rowUUID);
      });

      const materialId = isMaterialTypeGroupCSV ? item.getIn(['order', 'orderable_material', 'material', 'id']) : omcs.getIn([0, 'material_component', 'material_id']);
      const vendorId = response.included.find(entity => entity.id === materialId).relationships.vendor.data.id;
      const vendor = VendorStore.getById(vendorId);
      return {
        id: orderId,
        orderId: orderId,
        order: item.get('order'),
        orderable_material: orderableMaterial.set('orderable_material_components', omcs),
        vendor,
        labId: item.getIn(['order', 'lab_id'])
      };
    })
  );
};

export const getRowId = (data, materialIdx, omcIdx) => {
  const parentRowId = data.getIn([materialIdx, 'id']);
  const rowId = isGroupMaterial(data) ? data.getIn([materialIdx, 'orderable_material', 'orderable_material_components', omcIdx, 'id']) : parentRowId;
  return [parentRowId, rowId];
};
