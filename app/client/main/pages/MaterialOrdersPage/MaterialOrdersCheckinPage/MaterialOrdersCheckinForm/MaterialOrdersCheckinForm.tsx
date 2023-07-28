import React, { useEffect, useState } from 'react';
import { Prompt } from 'react-router-dom';
import Immutable from 'immutable';
import moment from 'moment';
import _ from 'lodash';
import {
  Button,
  ButtonGroup,
  Column,
  DateTime,
  InputWithUnits,
  List,
  Spinner,
  Table,
  TextInput,
  Toggle,
  Tooltip,
  TextBody
} from '@transcriptic/amino';

import NotificationActions from 'main/actions/NotificationActions';
import ModalActions from 'main/actions/ModalActions';
import OrderableMaterialAPI from 'main/api/OrderableMaterialAPI.js';
import { LocationAssignmentModal } from 'main/models/LocationSelectorModal/LocationSelectorModal';
import LocationStore from 'main/stores/LocationStore';
import CommonUiUtil from 'main/util/CommonUiUtil';
import CheckinLogic from 'main/models/KitCheckinModal/CheckInLogic';
import KitOrderActions from 'main/actions/KitOrderActions';
import LocationsAPI from 'main/api/LocationsAPI';
import { ContainerInputsLogic } from 'main/inventory/components/ContainerInputs';
import LabStore from 'main/stores/LabStore';
import LabAPI from 'main/api/LabAPI';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import String from 'main/util/String';
import DateSelectorModal from './DateSelectorModal';
import StorageConditionSelectorModal from './StorageConditionSelectorModal';
import ContainerTypeSelectorModal from './ContainerTypeSelectorModal';
import MultiRowEditorModal from './MultiRowEditorModal';
import { Item } from './MultiRowEditorModal/MultiRowEditorModal';
import useMaterialOrderCheckinFormState from './MaterialOrdersCheckinFormState';
import * as CheckinFormHelper from './MaterialOrderCheckinFormHelper';
import './MaterialOrdersCheckinForm.scss';

const { Columns, VISIBLE_COLUMNS, REQUIRED_VISIBLE_COLUMNS, RowColorAndHighlightMap } = CheckinFormHelper;
const barcodeValidator = CheckinLogic.bulkItemsValidator(CheckinFormHelper.FormField.barcode);
const labelValidator = CheckinLogic.bulkItemsValidator(CheckinFormHelper.FormField.label);
const lotNumberValidator = CheckinLogic.bulkItemsValidator(CheckinFormHelper.FormField.lot_no);
const massPerContainerValidator = CheckinLogic.bulkItemsValidator(CheckinFormHelper.FormField.mass_per_container);
const volumePerContainerValidator = CheckinLogic.bulkItemsValidator(CheckinFormHelper.FormField.volume_per_container);

type ColumnRowHighlightType = {
  [key: string]: {
    type: string,
    icon?: string,
    iconPlacement?: string,
    isInlineEditing?: boolean;
    message?: string;
    hasError?: boolean;
  }
}

function MaterialOrdersCheckinForm(props) {
  const [initialData, setInitialData] = useState(Immutable.fromJS([]));
  const [loaded, setLoaded] = useState(false);
  const [resetToggle, setResetToggle] = useState(false); // reset selection toggle flag
  const [selected, setSelected] = useState(Immutable.fromJS({}));
  const [expanded, setExpanded] = useState(Immutable.fromJS({}));
  const [modified, setModified] = useState(false);
  const [individualVisibleColumns, setIndividualVisibleColumns] = useState(VISIBLE_COLUMNS);
  const [groupVisibleColumns, setGroupVisibleColumns] = useState(VISIBLE_COLUMNS);
  const [labId, setLabId] = useState(null);
  const [activeOmcId, setActiveOmcId] = useState(null);
  const [shouldValidateBarcode, setShouldValidateBarcode] = useState(false);
  const [listChanged, setListChanged] = useState(false); // list changed flag, enabled when user duplicate/delete rows
  const [shouldValidateMassAndVolume, setShouldValidateMassAndVolume] = useState(false);
  const [shouldValidateLotNo, setShouldValidateLotNo] = useState(false);
  const [shouldValidateLabel, setShouldValidateLabel] = useState(false);
  const [shouldValidateContainerType, setShouldValidateContainerType] = useState(false);
  const [isDisplayErrorsOnly, setIsDisplayErrorsOnly] = useState(false);

  const {
    isEntireFormValid,
    rowHighlightMap,
    rowColorMap,
    setRowColorAndHighlightMap,
    handleInputChange,
    setFormValidationErrors,
    data,
    setData,
    validateMassAndVolume,
    validateLotNo,
    validateLabel,
    validateContainerType,
  } = useMaterialOrderCheckinFormState(); // custom hook for form validation and checkin process.

  useEffect(() => {
    initializeDataFromProps();
    loadLabs();
  }, [props.data]);

  useEffect(() => {
    initiateUserSelection();
  }, [loaded]);

  useEffect(() => {
    if (shouldValidateMassAndVolume) {
      validateMassAndVolume();
      setShouldValidateMassAndVolume(false);
    }
  }, [shouldValidateMassAndVolume]);

  useEffect(() => {
    if (shouldValidateLotNo) {
      validateLotNo();
      setShouldValidateLotNo(false);
    }
  }, [shouldValidateLotNo]);

  useEffect(() => {
    if (shouldValidateLabel) {
      validateLabel();
      setShouldValidateLabel(false);
    }
  }, [shouldValidateLabel]);

  useEffect(() => {
    if (loaded && !shouldDisableResetButton()) {
      setModified(true);
    } else {
      setModified(false);
    }
  }, [data]);

  useEffect(() => {
    // If resetting form to its initial data, resetting the selection as well
    if (resetToggle) {
      resetUserSelection();
      setResetToggle(false);
    }

  }, [resetToggle, data]);

  useEffect(() => {
    if (shouldValidateBarcode) {
      validateAllBarcodes();
    }
  }, [shouldValidateBarcode]);

  useEffect(() => {
    if (shouldValidateContainerType) {
      validateContainerType();
      setShouldValidateContainerType(false);
    }
  }, [shouldValidateContainerType]);

  const loadLabs = () => {
    const labIds = props.data.map((item) => {
      return item.getIn(['order', 'lab_id']);
    });
    LabAPI.getMany(_.uniq(labIds));
  };

  const initializeDataFromProps = async () => {
    const omIds = [];
    const locationIds = [];
    props.data.forEach((item) => {
      const omId = item.get('orderableMaterialId');
      const locationId = item.getIn(['initialForm', 'location']);
      omIds.push(omId);
      if (locationId) {
        locationIds.push(locationId);
      }
    });
    const options = {
      includes: ['material', 'material.vendor', 'orderable_material_components.material_component.resource',
        'orderable_material_components.container_type'],
      filters: { id: omIds.join() }
    };
    try {
      await LocationsAPI.getMany(locationIds);
    } catch {
      // do nothing, just leave form cell empty
    }
    try {
      const orderableMaterialResponse = await OrderableMaterialAPI.index(options);
      const data = CheckinFormHelper.mapOrderableMaterialToData(props.data, orderableMaterialResponse, props.isCSVCheckin);
      initializeFormData(data);
    } catch (error) {
      NotificationActions.handleError(error);
    }
  };

  const initializeFormData = (data) => {
    setData(data);
    setInitialData(data);
    setLoaded(true);
    setResetToggle(true);
    setListChanged(false);
    setRowColorAndHighlightMap(new RowColorAndHighlightMap());
    if (props.validateAllOnInit) {
      setShouldValidateMassAndVolume(true);
      setShouldValidateLabel(true);
      setShouldValidateLotNo(true);
    }
    setShouldValidateBarcode(true);
  };

  const initiateUserSelection = () => {
    const selected = {};
    const expanded = {};
    data.forEach(item => {
      selected[item.get('id')] = true;
      expanded[item.get('id')] = true;
    });
    setSelectedRows(selected);
    if (!CheckinFormHelper.isGroupMaterial(data)) {
      setExpanded(Immutable.fromJS(expanded));
    }
  };

  const hasInputFieldError = (omc, field: CheckinFormHelper.FormField) => {
    return CheckinFormHelper.isGroupMaterial(data) ? _.get(rowHighlightMap, [field, omc.get('parentRowId'), omc.get('id'), 'hasError'], false)
      : _.get(rowHighlightMap, [field, omc.get('parentRowId'), omc.get('parentRowId'), 'hasError'], false);
  };

  const validateAllBarcodes = async () => {
    const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
    const allRowsWithBarcodes = getModalDataForField({ omc: { barcode: ['form', 'barcode'], location: ['form', 'location'] }, material: { lab_id: ['order', 'lab_id'] } }, true);
    const rowsWithLabAndBarcodes = allRowsWithBarcodes.filter((item)  => CheckinFormHelper.hasLabAndBarcode(item)).toList();

    if (rowsWithLabAndBarcodes.size > 0 && shouldSendValidateBarcodeRequest()) {
      const response = await barcodeValidator(rowsWithLabAndBarcodes);
      setData((data) => {
        let updatedData = data;
        response.forEach((validatedItem) => {
          const updatePath = [validatedItem.get('material_idx'), 'orderable_material', 'orderable_material_components',
            validatedItem.get('form_idx'), 'form', 'barcode', 'isValid'];
          const isValid = validatedItem.getIn(['barcode', 'isValid']);
          updatedData = updatedData.setIn(updatePath, isValid);
          const [parentRowId, rowId] = CheckinFormHelper.getRowId(data, validatedItem.get('material_idx'), validatedItem.get('form_idx'));
          if (!isValid) {
            rowColorAndHighlightMap.setDanger(CheckinFormHelper.FormField.barcode, 'Duplicate', rowId, parentRowId);
          } else {
            rowColorAndHighlightMap.resetState(CheckinFormHelper.FormField.barcode, rowId, parentRowId,  true);
          }
        });
        return updatedData;
      });
      setRowColorAndHighlightMap(rowColorAndHighlightMap);
    }
    setShouldValidateBarcode(false);
  };

  const updateSelectedData = (updateFunction) => {
    const updated = data.map((materialItem, materialItemIdx) => (
      materialItem.updateIn(
        ['orderable_material', 'orderable_material_components'],
        omcs => omcs.map((omc, omcIdx) => (
          isSelected(materialItem, omc) ? updateFunction(omc, materialItemIdx, omcIdx) : omc
        ))
      )
    ));
    setData(updated);
  };

  const getMaterialItemOmcs = (materialItem) => {
    return data.find(record => record.get('id') === materialItem.get('id'))
      .getIn(['orderable_material', 'orderable_material_components']);
  };

  const isSelected = (materialItem, omc) => {
    return expanded.get(materialItem.get('id')) && (selected.getIn([materialItem.get('id')]) || {})[omc.get('id')];
  };

  const getSelectionCount = () => {
    let count = 0;
    selected
      .filter((_v, key) => {
        return expanded.get(key);
      })
      .forEach((value) => {
        count += _.size(value);
      });
    return count;
  };

  const setSelectedRows = (rows: object, useSelectedOmcs?: boolean) => {
    let immSelection = Immutable.fromJS(rows);
    immSelection = immSelection.map((selectedOmcs, rowId) => {
      let nestedSelection = {};
      if (useSelectedOmcs) {
        nestedSelection = selectedOmcs.toJS();
      } else {
        const row = data.find(item => item.get('id') === rowId);
        const omcs = getMaterialItemOmcs(row);
        omcs.forEach((omc) => {
          nestedSelection[omc.get('id')] = true;
        });
      }
      return nestedSelection;
    });

    setSelected(immSelection);
  };

  const setSelectedNestedRows = (row, nestedRows?: object) => {
    setSelected(
      selected.set(row.get('id'), nestedRows)
    );
  };

  const prohibitedLocationsIds = (includeAllLocations = false) => {
    return data.reduce((prohibitedIds, item) => {
      const omcs = getMaterialItemOmcs(item);
      omcs.forEach(omc => {
        const locationId = omc.getIn(['form', 'location', 'id']);
        if ((includeAllLocations || !isSelected(item, omc)) && locationId) {
          prohibitedIds.push(locationId);
        }
      });
      return prohibitedIds;
    }, []);
  };

  const updateLocations = (locationIdOrIds: string | [Immutable.Map<string, string | [string]>]) => {
    const isMultiLocation = _.isArray(locationIdOrIds);
    const locationIds = isMultiLocation ? locationIdOrIds.map((element) => element.get('id')) : [locationIdOrIds];
    const locations = locationIds.map(id => LocationStore.getById(id));
    const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
    if (activeOmcId) {
      data.forEach((item, itemIdx) => {
        const activeOmcIndex = item.getIn(['orderable_material', 'orderable_material_components'])
          .findIndex((omc) => omc.get('id') === activeOmcId);
        if (activeOmcIndex > -1) {
          const omc = item.getIn(['orderable_material', 'orderable_material_components', activeOmcIndex]);
          handleInputChange(CheckinFormHelper.FormField.location, locations[0], omc, isDisplayErrorsOnly);
          setData(data.setIn([itemIdx, 'orderable_material', 'orderable_material_components', activeOmcIndex, 'form', 'location'], locations[0]));
          const [parentRowId, rowId] = CheckinFormHelper.getRowId(data, itemIdx, activeOmcIndex);
          rowColorAndHighlightMap.resetState(CheckinFormHelper.FormField.location, rowId, parentRowId);
          setActiveOmcId(null);
        }
      });
    } else {
      let idx = 0;
      updateSelectedData(
        (omc, materialItemIdx, omcIdx) => {
          const location = isMultiLocation ? locations[idx] : locations[0];
          idx += 1;
          const [parentRowId, rowId] = CheckinFormHelper.getRowId(data, materialItemIdx, omcIdx);
          rowColorAndHighlightMap.resetState(CheckinFormHelper.FormField.location, rowId, parentRowId);
          return omc.setIn(['form', 'location'], location);
        }
      );
    }
    setRowColorAndHighlightMap(rowColorAndHighlightMap);
    setShouldValidateBarcode(true);
  };

  const deleteSelectedRows = () => {
    const selectedCount = Object.keys(selected.toJS()).reduce((count, item) => {
      return count + (expanded.get(item) ? Object.keys(selected.get(item)).length : 0);
    }, 0);

    const message = `Are you sure you want to delete ${selectedCount} row(s)`;
    if (!CommonUiUtil.confirmWithUser(message)) {
      return;
    }
    if (CheckinFormHelper.isGroupMaterial(data)) {
      deleteGroupMaterialData(selected.toJS());
    } else {
      deleteIndividualMaterialData(selected.toJS());
    }
    setListChanged(true);
  };

  const deleteGroupMaterialData = (selected) => {
    const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
    let newData = data;
    let newExpanded = expanded;
    const newSelected = { ...selected };
    const emptyGroupMaterialIds = [];
    data.forEach((item, idx) => {
      if (selected[item.get('id')]) {
        const selectedOmcIDs = selected[item.get('id')];
        newData = newData.updateIn([idx, 'orderable_material', 'orderable_material_components'],
          (omcs) => omcs.filter((omc) => {
            const isDeleted = selectedOmcIDs[omc.get('id')] && isSelected(item, omc);
            if (isDeleted) {
              rowColorAndHighlightMap.deleteRow(omc.get('id'), item.get('id'));
            }
            return !isDeleted;
          }));

        if (newExpanded.get(item.get('id'))) {
          // deselect all omc under this expanded group material since selected oms being deleted
          delete newSelected[item.get('id')];
        }
        // Collect group material ids that ended up with no orderable material components
        if (newData.getIn([idx, 'orderable_material', 'orderable_material_components']).size === 0) {
          emptyGroupMaterialIds.push(item.get('id'));
        }
      }
    });

    newData = newData.filter(item => {
      const isKeepingOrder = !emptyGroupMaterialIds.includes(item.get('id'));
      if (!isKeepingOrder) {
        newExpanded = newExpanded.delete(item.get('id'));
      }
      return isKeepingOrder;
    });

    setData(newData);
    setExpanded(newExpanded);
    setSelectedRows(newSelected, true);
    setRowColorAndHighlightMap(rowColorAndHighlightMap);
  };

  const deleteIndividualMaterialData = (selected) => {
    const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
    let newExpanded = expanded;
    const newData = data.filter(item => {
      if (selected[item.get('id')]) {
        newExpanded = newExpanded.delete(item.get('id'));
        rowColorAndHighlightMap.deleteRow(item.get('id'), item.get('id'));
        return false;
      }
      return true;
    });

    setData(newData);
    setExpanded(newExpanded);
    setSelectedRows({}); // deselect all since selected just got deleted
    setRowColorAndHighlightMap(rowColorAndHighlightMap);
  };

  const onBulkUpdateField = (items: Immutable.List<Item>, field: CheckinFormHelper.FormField) => {
    let complementFieldToValidate;
    if (field === CheckinFormHelper.FormField.volume_per_container) { complementFieldToValidate = CheckinFormHelper.FormField.mass_per_container; }
    if (field === CheckinFormHelper.FormField.mass_per_container) { complementFieldToValidate = CheckinFormHelper.FormField.volume_per_container; }
    let updatedData = data;
    const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
    items.forEach((item: Item) => {
      const [parentRowId, rowId] = CheckinFormHelper.getRowId(updatedData, item.get('material_idx'), item.get('form_idx'));
      updatedData = updatedData.updateIn([item.get('material_idx')], (materialAtIdx) => {
        let updatedMaterialAtIndex = materialAtIdx;
        const formPath = ['orderable_material', 'orderable_material_components', item.get('form_idx'), 'form'];
        if (complementFieldToValidate) {
          const validatedComplementFieldItem = CheckinLogic.volumeMassItemValidator(complementFieldToValidate, item);
          const isValid = validatedComplementFieldItem.getIn([complementFieldToValidate, 'isValid']);
          const errorMessage = validatedComplementFieldItem.getIn([complementFieldToValidate, 'error']);
          rowColorAndHighlightMap.setState(complementFieldToValidate, rowId, parentRowId, errorMessage, errorMessage || !isValid);
          updatedMaterialAtIndex =  updatedMaterialAtIndex.setIn([formPath, complementFieldToValidate], validatedComplementFieldItem.get(complementFieldToValidate));
        }
        const isValid = item.getIn([field, 'isValid']);
        const errorMessage = item.getIn([field, 'error']);
        rowColorAndHighlightMap.setState(field, rowId, parentRowId, isValid && errorMessage, !!isValid);
        return updatedMaterialAtIndex.setIn([...formPath, field], item.get(field));
      });
    });
    setRowColorAndHighlightMap(rowColorAndHighlightMap);
    setData(updatedData);
    if (field === CheckinFormHelper.FormField.barcode) {
      setShouldValidateBarcode(true);
    }
  };

  const onSortChangeMaterialItems = (sortKey: string, sortDirection: 'asc' | 'desc') => {
    let sortedData = data.toJS();
    const orderDirection = (sortDirection === 'asc') ? 'asc' : 'desc';
    switch (sortKey) {
      case 'name':
        sortedData = _.orderBy(sortedData, (materialItem) => _.get(materialItem, ['orderable_material', 'material', 'name']), orderDirection);
        break;
      case 'sku':
        sortedData = _.orderBy(sortedData, (materialItem) => _.get(materialItem, ['orderable_material', 'sku']), orderDirection);
        break;
      case 'order-id':
        sortedData = _.orderBy(sortedData, (materialItem) => _.get(materialItem, ['order', 'vendor_order_id']), orderDirection);
        break;
      case 'barcode':
        sortedData = _.orderBy(sortedData, (materialItem) => _.get(materialItem, ['orderable_material', 'orderable_material_components', 0, 'form', 'barcode', 'value']), orderDirection);
        break;
      case 'lot-number':
        sortedData = _.orderBy(sortedData, (materialItem) => _.get(materialItem, ['orderable_material', 'orderable_material_components', 0, 'form', 'lot_no', 'value']), orderDirection);
        break;
    }
    setData(Immutable.fromJS(sortedData));
  };

  const onSortChangeOmcs = (sortKey: string, sortDirection: 'asc' | 'desc', materialItemIdx: string) => {
    let sortedOmcs = data.getIn([materialItemIdx, 'orderable_material', 'orderable_material_components']).toJS();
    const orderDirection = (sortDirection === 'asc') ? 'asc' : 'desc';
    switch (sortKey) {
      case 'name':
        sortedOmcs = _.orderBy(sortedOmcs, (omc) => _.get(omc, ['resource', 'name']), orderDirection);
        break;
      case 'barcode':
        sortedOmcs = _.orderBy(sortedOmcs, (omc) => _.get(omc, ['form', 'barcode', 'value']), orderDirection);
        break;
      case 'lot-number':
        sortedOmcs = _.orderBy(sortedOmcs, (omc) => _.get(omc, ['form', 'lot_no', 'value']), orderDirection);
        break;
    }
    setData(data.setIn([materialItemIdx, 'orderable_material', 'orderable_material_components'], Immutable.fromJS(sortedOmcs)));
  };

  const renderName = ({
    materialItem,
    omc
  }) => {
    const isNestedRow = CheckinFormHelper.isGroupMaterial(data) && omc;
    const displayName = isNestedRow ? (omc.get('name') || omc.getIn(['resource', 'name'])) : materialItem.getIn(['orderable_material', 'material', 'name']);
    return (
      <p>{displayName || '-'}</p>
    );
  };

  const duplicateSelectedRows = () => {
    if (CheckinFormHelper.isGroupMaterial(data)) {
      duplicateGroupMaterialData(selected);
    } else {
      duplicateIndividualMaterialData(selected);
    }
    setListChanged(true);
  };

  const getNextAvailableLocation = (location, prohibitedIds) => {
    if (LocationStore.isBoxCell(Immutable.fromJS(location))) {
      const newLocation = LocationStore.nextAvailableLocations(Immutable.fromJS(location), 1, prohibitedIds);
      if (newLocation.length > 0) {
        prohibitedIds.push(newLocation[0].get('id'));
      }
      return newLocation.length > 0 ? newLocation[0].toJS() : null;
    }
    return location;
  };

  const duplicateOMC = (omc, prohibitedIds) => {
    const duplicatedOMC = { ...omc };
    duplicatedOMC.form.barcode = { value: '', isValid: false };
    duplicatedOMC.initialForm = null;
    duplicatedOMC.id = CommonUiUtil.getUUIDv4();
    const location = omc.form.location;
    duplicatedOMC.form.location = getNextAvailableLocation(location, prohibitedIds);
    duplicatedOMC.form.label = { value: '', isValid: true };
    return Immutable.fromJS(duplicatedOMC);
  };

  const duplicateIndividualMatItem = (item, prohibitedIds) => {
    const duplicatedOM = { ...item };
    duplicatedOM.orderable_material.orderable_material_components[0].form.barcode = { value: '', isValid: false };
    duplicatedOM.id = CommonUiUtil.getUUIDv4();
    duplicatedOM.orderable_material.orderable_material_components[0].id = CommonUiUtil.getUUIDv4();
    duplicatedOM.orderable_material.orderable_material_components[0].parentRowId = duplicatedOM.id;
    duplicatedOM.orderable_material.orderable_material_components[0].initialForm = null;
    const location = item.orderable_material.orderable_material_components[0].form.location;
    duplicatedOM.orderable_material.orderable_material_components[0].form.location = getNextAvailableLocation(location, prohibitedIds);
    duplicatedOM.orderable_material.orderable_material_components[0].form.label = { value: '', isValid: true };
    return Immutable.fromJS(duplicatedOM);
  };

  const duplicateIndividualMaterialData = (selected) => {
    let updatedData = data;
    let newExpanded = expanded;
    const prohibitedIds = prohibitedLocationsIds(true);

    data.forEach((item) => {
      if (selected.get(item.get('id'))) {
        const duplicatedItem = duplicateIndividualMatItem(item.toJS(), prohibitedIds);
        updatedData = updatedData.push(duplicatedItem);
        newExpanded = newExpanded.set(duplicatedItem.get('id'), true);
      }
    });

    setData(updatedData);
    setExpanded(newExpanded);
  };

  const duplicateGroupMaterialData = (selected) => {
    const prohibitedIds = prohibitedLocationsIds(true);
    let updatedData = data;

    data.forEach((materialItem, idx) => {
      if (selected.get(materialItem.get('id'))) {
        const orderableMaterial = materialItem.get('orderable_material');
        const selectedOmcIDs = selected.get(materialItem.get('id'));
        orderableMaterial.get('orderable_material_components').forEach((omc) => {
          if (selectedOmcIDs[omc.get('id')] && isSelected(materialItem, omc)) {
            const duplicatedOMC = duplicateOMC(omc.toJS(), prohibitedIds);
            updatedData = updatedData.updateIn([idx, 'orderable_material', 'orderable_material_components'], (omcList) => omcList.push(duplicatedOMC));
          }
        });
      }
    });

    setData(updatedData);
  };

  const onBulkPaste = (event, omc, field) => {
    event.preventDefault();
    const clipboardData = event.clipboardData.getData('text');
    let updatedData = data;
    const pastedValues = clipboardData.trim().split(/\r?\n/);
    let startAssigningPastedValues = false;
    let pastedValuesCounter = 0;
    const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);

    data.forEach((material, materialIndex) =>
      material.getIn(['orderable_material', 'orderable_material_components']).forEach((component, omcIndex) => {
        if (!startAssigningPastedValues && material.get('id') === omc.get('parentRowId') && omc.get('id') === component.get('id')) {
          startAssigningPastedValues = true;
        }
        if (startAssigningPastedValues && pastedValuesCounter < pastedValues.length) {
          const value = pastedValues[pastedValuesCounter++];
          const updateValue = Immutable.fromJS({ value: (field === 'barcode') ? String.removeNonPrintableAscii(value).trim() : value, isValid: false });
          const updatePath = [materialIndex, 'orderable_material', 'orderable_material_components', omcIndex, 'form', field];
          updatedData = updatedData.setIn(updatePath, updateValue);
          const [parentRowId, rowId] = CheckinFormHelper.getRowId(data, materialIndex, omcIndex);
          rowColorAndHighlightMap.validateFieldAndSetState(field, updateValue.get('value'), omc, rowId, parentRowId);
        }
      })
    );
    setData(updatedData);
    setRowColorAndHighlightMap(rowColorAndHighlightMap);
  };

  const renderSku = ({ materialItem }) => (
    <p>{materialItem.getIn(['orderable_material', 'sku']) || '-'}</p>
  );

  const renderContainerType = ({ omc }) => (
    <p>{omc.getIn(['form', 'container_type', 'name']) || '-'}</p>
  );

  const renderResourceId = ({ omc }) => (
    <p>{omc.getIn(['resource', 'id'])}</p>
  );

  const renderCASNumber = ({ omc }) => (
    <p>{omc.getIn(['resource', 'compound', 'model', 'cas_number']) || '-'}</p>
  );

  const renderLotNumber = ({ omc }) => (
    <TextInput
      name="lot_no"
      placeholder="Input Lot No"
      value={omc.getIn(['form', 'lot_no', 'value'])}
      onChange={(event) => { handleInputChange(event.target.name, event.target.value, omc, isDisplayErrorsOnly); }}
      validated={{ hasError: hasInputFieldError(omc, CheckinFormHelper.FormField.lot_no) }}
      onPaste={event => onBulkPaste(event, omc, 'lot_no')}
    />
  );

  const renderLocation = ({ omc, materialItem }) => {
    const location = omc.getIn(['form', 'location', 'name']);
    const labId = materialItem.getIn(['order', 'lab_id']);
    return location ? (
      <p>{location}</p>
    ) : (
      <Button
        link
        onClick={() => {
          setActiveOmcId(omc.get('id'));
          setLabId(labId);
          ModalActions.open(LocationAssignmentModal.MODAL_ID);
        }}
      >
        Assign location
      </Button>
    );
  };

  const renderStorageCondition = ({ omc }) => (
    <p>{omc.getIn(['form', 'storage_condition', 'name']) || '-'}</p>
  );

  const hasNoOrders = props.data.some((item) => _.isNull(item.get('order')));

  const renderLab = ({ materialItem }) => {
    const labId = materialItem.getIn(['order', 'lab_id']);
    const lab = LabStore.getById(labId);
    return (
      <p>{lab !== undefined ? lab.get('name') : '-'}</p>
    );
  };

  const renderExpirationDate = ({ omc }) => {
    const timestamp = omc.getIn(['form', 'expiration_date']);
    const date = timestamp ? <DateTime timestamp={timestamp} /> : '-';
    return (
      <Tooltip
        placement="bottom"
        title={moment(timestamp).format('ll')}
      >
        <p>{date}</p>
      </Tooltip>
    );
  };

  const renderVolume = ({ omc }) => {
    return (
      <InputWithUnits
        name="volume_per_container"
        dimension="volume"
        preserveUnit
        placeholder="Input volume"
        value={`${omc.getIn(['form', 'volume_per_container', 'value']) || 0}:μL`}
        onChange={(event) => { handleInputChange(event.target.name, event.target.numericValue || 0, omc, isDisplayErrorsOnly); }}
        validated={{
          hasError: hasInputFieldError(omc, CheckinFormHelper.FormField.volume_per_container),
          hasWarning: false,
        }}
        onPaste={event => onBulkPaste(event, omc, 'volume_per_container')}
      />
    );
  };

  const renderMass = ({ omc }) => {
    return (
      <InputWithUnits
        name="mass_per_container"
        dimension="mass"
        preserveUnit
        placeholder="Input mass"
        value={`${omc.getIn(['form', 'mass_per_container', 'value']) || 0}:mg`}
        onChange={(event) => { handleInputChange(event.target.name, event.target.numericValue || 0, omc, isDisplayErrorsOnly); }}
        validated={{
          hasError: hasInputFieldError(omc, CheckinFormHelper.FormField.mass_per_container),
          hasWarning: false,
        }}
        onPaste={event => onBulkPaste(event, omc, 'mass_per_container')}
      />
    );
  };

  const renderOrderId = ({ materialItem }) => (
    <p>{materialItem.getIn(['order', 'vendor_order_id']) || '-'}</p>
  );

  const shouldSendValidateBarcodeRequest = () => {
    const barcodeHighLightMap: ColumnRowHighlightType = getRowHighlightMap(CheckinFormHelper.FormField.barcode);
    const invalidBarcodes = Object.values(barcodeHighLightMap).some(item => {
      return item.hasError;
    });
    return !invalidBarcodes;
  };

  const renderBarcode = ({ omc }) => {
    return (
      <span>
        <TextInput
          name="barcode"
          placeholder="Input barcode"
          value={omc.getIn(['form', 'barcode', 'value'])}
          onChange={(event) => {
            if (event.target.value !== omc.getIn(['form', 'barcode', 'value'])) {
              handleInputChange(event.target.name, event.target.value, omc, isDisplayErrorsOnly);
            }
          }}
          onBlur={validateAllBarcodes}
          validated={{ hasError: hasInputFieldError(omc, CheckinFormHelper.FormField.barcode) }}
          onPaste={event => onBulkPaste(event, omc, 'barcode')}
        />
      </span>
    );
  };

  const renderLabel = ({ omc }) => (
    <TextInput
      name={CheckinFormHelper.FormField.label}
      placeholder="Input label"
      value={omc.getIn(['form', 'label', 'value'], '')}
      onChange={(event) => handleInputChange(CheckinFormHelper.FormField.label, event.target.value, omc, isDisplayErrorsOnly)}
      validated={{ hasError: hasInputFieldError(omc, CheckinFormHelper.FormField.label) }}
      onPaste={event => onBulkPaste(event, omc, CheckinFormHelper.FormField.label)}
    />
  );

  const renderType = () => (
    <p>{CheckinFormHelper.isGroupMaterial(data) ? 'Group' : 'Individual'}</p>
  );

  const renderVendor = ({ materialItem }) => (
    <p>{materialItem.getIn(['vendor', 'name'])}</p>
  );

  const renderCreated = ({ materialItem }) => {
    const timestamp = materialItem.getIn(['order', 'created_at']);
    const date = timestamp ? <DateTime timestamp={timestamp} /> : '-';
    return (
      <Tooltip
        placement="bottom"
        title={moment(timestamp).format('ll')}
      >
        <p>{date}</p>
      </Tooltip>
    );
  };

  const selectionCount = getSelectionCount();

  const getRowHighlightMap = (label: CheckinFormHelper.FormField) => {
    const highLightMap = rowHighlightMap[label];
    let reducedRowHighlightMap = {};
    if (highLightMap) {
      _.values(highLightMap).forEach((rowErrorMap: ColumnRowHighlightType) => {
        reducedRowHighlightMap = {
          ...reducedRowHighlightMap,
          ...rowErrorMap,
        };
      });
    }
    return reducedRowHighlightMap;
  };

  const columns = [
    <Column
      renderCellContent={renderOrderId}
      sortable
      header={Columns.ORDER_ID}
      id="order-id"
      key="column-order-id"
      disableFormatHeader
      popOver
    />,
    <Column
      renderCellContent={renderSku}
      sortable
      header={Columns.SKU}
      id="sku"
      key="column-sku"
      popOver
    />,
    <Column
      renderCellContent={renderResourceId}
      header={Columns.RESOURCE_ID}
      id="resource-id"
      key="column-resource-id"
      disableFormatHeader
      popOver
    />,
    <Column
      renderCellContent={renderCASNumber}
      header={Columns.CAS}
      id="cas-number"
      key="column-cas-number"
      disableFormatHeader
      popOver
    />,
    <Column
      renderCellContent={renderName}
      sortable
      header={Columns.NAME}
      id="name"
      key="column-name"
      popOver
    />,
    <Column
      renderCellContent={renderLabel}
      header={Columns.LABEL}
      id="label"
      key="column-label"
      rowHighlightMap={getRowHighlightMap(CheckinFormHelper.FormField.label)}
    />,
    <Column
      renderCellContent={renderLab}
      header={Columns.LAB}
      id="lab"
      key="column-lab"
      popOver
    />,
    <Column
      renderCellContent={renderContainerType}
      header={Columns.CONTAINER_TYPE}
      id="container-type"
      key="column-container-type"
      popOver
      rowHighlightMap={getRowHighlightMap(CheckinFormHelper.FormField.container_type_id)}
    />,
    <Column
      renderCellContent={renderLotNumber}
      sortable
      header={Columns.LOT}
      id="lot-number"
      key="column-lot-number"
      popOver
      rowHighlightMap={getRowHighlightMap(CheckinFormHelper.FormField.lot_no)}
    />,
    <Column
      renderCellContent={renderLocation}
      header={Columns.LOCATION}
      id="location"
      key="column-location"
      popOver
      rowHighlightMap={getRowHighlightMap(CheckinFormHelper.FormField.location)}
    />,
    <Column
      renderCellContent={renderStorageCondition}
      header={Columns.STORAGE_CONDITION}
      id="storage-condition"
      key="column-storage-condition"
      popOver
    />,
    <Column
      renderCellContent={renderExpirationDate}
      header={Columns.EXP_DATE}
      id="expiration-date"
      key="column-expiration-date"
    />,
    <Column
      renderCellContent={renderVolume}
      header={Columns.VOLUME}
      id="volume"
      rowHighlightMap={getRowHighlightMap(CheckinFormHelper.FormField.volume_per_container)}
      key="column-volume"
    />,
    <Column
      renderCellContent={renderMass}
      header={Columns.MASS}
      id="mass"
      rowHighlightMap={getRowHighlightMap(CheckinFormHelper.FormField.mass_per_container)}
      key="column-mass"
    />,
    <Column
      renderCellContent={renderBarcode}
      sortable
      header={Columns.BARCODE}
      id="barcode"
      key="column-barcode"
      rowHighlightMap={getRowHighlightMap(CheckinFormHelper.FormField.barcode)}
    />,
    <Column
      renderCellContent={renderType}
      header={Columns.TYPE}
      id="type"
      key="column-type"
      popOver
    />,
    <Column
      renderCellContent={renderVendor}
      header={Columns.VENDOR}
      id="vendor"
      key="column-vendor"
      popOver
    />,
    <Column
      renderCellContent={renderCreated}
      header={Columns.CREATED}
      id="created"
      key="column-created"
    />,
  ];

  const hasLabAndBarcodeFilter = (formData) =>  formData.filter((item) => CheckinFormHelper.hasLabAndBarcode(item));

  const getModalDataForField = (field, includeAll = false) => CheckinFormHelper.modalData(field, data, selected, expanded, includeAll);

  const massAndVolumeModalData = getModalDataForField({
    omc: {
      volume_per_container: ['form', 'volume_per_container'],
      mass_per_container: ['form', 'mass_per_container'],
      vol_measurement_unit: ['vol_measurement_unit'],
      mass_measurement_unit: ['mass_measurement_unit'],
      container_type: ['form', 'container_type']
    }
  });

  const modals = [
    <MultiRowEditorModal
      onSubmit={onBulkUpdateField}
      data={getModalDataForField({ omc: { barcode: ['form', 'barcode'], location: ['form', 'location'] }, material: { lab_id: ['order', 'lab_id'] } })}
      validateField={barcodeValidator}
      preValidationFilter={hasLabAndBarcodeFilter}
      fieldName="barcode"
      fieldTitle="barcode"
      shouldValidate
      formFieldValidator="barcode"
      key="MultiRowEditorModal-Barcode"
    />,
    <MultiRowEditorModal
      onSubmit={onBulkUpdateField}
      data={getModalDataForField({ omc: { label: ['form', 'label'] } })}
      fieldName={CheckinFormHelper.FormField.label}
      fieldTitle="label"
      shouldValidate
      validateField={labelValidator}
      key="MultiRowEditorModal-Label"
    />,
    <MultiRowEditorModal
      onSubmit={onBulkUpdateField}
      data={massAndVolumeModalData}
      fieldName={CheckinFormHelper.FormField.mass_per_container}
      fieldTitle="mass"
      validateField={massPerContainerValidator}
      shouldValidate
      key="MultiRowEditorModal-Mass"
    />,
    <ContainerTypeSelectorModal
      onSelect={(containerType) => {
        updateSelectedData((omc) => (
          omc.setIn(['form', 'container_type'], containerType)
        ));
        setShouldValidateMassAndVolume(true);
        setShouldValidateContainerType(true);
      }}
      key="ContainerTypeSelectorModal"
    />,
    <StorageConditionSelectorModal
      onSelect={(storageCondition) => {
        updateSelectedData((omc) => (
          omc.setIn(['form', 'storage_condition'], Immutable.fromJS(storageCondition))
        ));
      }}
      key="StorageConditionSelectorModal"
    />,
    <MultiRowEditorModal
      onSubmit={onBulkUpdateField}
      data={massAndVolumeModalData}
      fieldName={CheckinFormHelper.FormField.volume_per_container}
      fieldTitle="volume"
      validateField={volumePerContainerValidator}
      shouldValidate
      key="MultiRowEditorModal-Volume"
    />,
    <LocationAssignmentModal
      labIdForFilter={labId}
      containersCount={activeOmcId ? 1 : selectionCount}
      modalId={LocationAssignmentModal.MODAL_ID}
      initialLocationId={null}
      prohibitedLocations={Immutable.List(prohibitedLocationsIds()).toSet()}
      updateMultipleLocations={updateLocations}
      onDismissed={() => {
        setActiveOmcId(null);
      }}
      key="LocationSelectorModal"
    />,
    <MultiRowEditorModal
      onSubmit={onBulkUpdateField}
      data={getModalDataForField({ omc: { lot_no: ['form', 'lot_no'] } })}
      fieldName={CheckinFormHelper.FormField.lot_no}
      fieldTitle="Lot No"
      validateField={lotNumberValidator}
      shouldValidate
      key="MultiRowEditorModal-Lotno"
    />,
    <DateSelectorModal
      onSelect={(date) => {
        updateSelectedData((omc) => (
          omc.setIn(['form', 'expiration_date'], Immutable.fromJS(date))
        ));
      }}
      key="DataSelectorModal"
    />
  ];

  const multiEditModalID = (fieldName) => `MULTIROW_${fieldName.toUpperCase()}_EDITOR_MODAL`;

  const getLabIds = () => {
    const selectedIds = Object.keys(selected.filter((item) => {
      return Object.keys(item).length > 0;
    }).toJS());
    let labIds = Immutable.Set();

    data.forEach((order) => {
      if (CheckinFormHelper.isGroupMaterial(data)) {
        const kitOrderId = order.getIn(['order', 'id']);
        selectedIds.forEach((item) => {
          if (item === kitOrderId && expanded.has(kitOrderId)) {
            labIds = labIds.add(order.getIn(['order', 'lab_id']));
          }
        });
      } else {
        const omcId = order.get('id');
        selectedIds.forEach((item) => {
          if (item === omcId) {
            labIds = labIds.add(order.getIn(['order', 'lab_id']));
          }
        });
      }
    });
    return labIds;
  };

  const canBulkAssignLocation = () => {
    return getLabIds().size === 1;
  };

  const actions = [
    {
      title: 'Barcode',
      action: () => ModalActions.open(multiEditModalID('barcode')),
      disabled: !selectionCount
    },
    {
      title: 'Container type',
      action: () => ModalActions.open(ContainerTypeSelectorModal.MODAL_ID),
      disabled: !selectionCount
    },
    {
      title: 'Storage condition',
      action: () => ModalActions.open(StorageConditionSelectorModal.MODAL_ID),
      disabled: !selectionCount
    },
    {
      title: 'Location',
      action: () => {
        setLabId(getLabIds().toJS()[0]);
        ModalActions.open(LocationAssignmentModal.MODAL_ID);
      },
      disabled: hasNoOrders ? !selectionCount : !canBulkAssignLocation(),
      label: expanded.size > 0 && !hasNoOrders && !canBulkAssignLocation() ? 'Cannot assign a location when orders are from different labs' : null
    },
    {
      title: 'Lot no',
      action: () => ModalActions.open(multiEditModalID('lot_no')),
      disabled: !selectionCount
    },
    {
      title: 'Volume',
      action: () => ModalActions.open(multiEditModalID('volume_per_container')),
      disabled: !selectionCount
    },
    {
      title: 'Label',
      action: () => ModalActions.open(multiEditModalID('label')),
      disabled: !selectionCount
    },
    {
      title: 'Mass',
      action: () => ModalActions.open(multiEditModalID('mass_per_container')),
      disabled: !selectionCount
    },
    {
      title: 'Expiration date',
      action: () => ModalActions.open(DateSelectorModal.MODAL_ID),
      disabled: !selectionCount
    },
    {
      title: 'Duplicate Row',
      action: duplicateSelectedRows,
      disabled: !selectionCount
    },
    {
      title: 'Delete Row',
      action: deleteSelectedRows,
      disabled: !selectionCount
    }
  ];

  const getColumnsByName = (columnNames: string[]) => (
    columns.filter(({ props }) => columnNames.includes(props.header))
  );

  const handleResetForm = () => {
    const message = 'Are you sure you would like to reset all changes?';
    if (CommonUiUtil.confirmWithUser(message)) {
      initializeFormData(initialData);
    }
  };

  const resetUserSelection = () => {
    initiateUserSelection();
    if (CheckinFormHelper.isGroupMaterial(data)) {
      setExpanded(Immutable.fromJS({}));
    }
  };

  const getParentOrderId = (item) => (item.get('order') ? item.getIn(['order', 'id']) : data.getIn([0, 'id']));

  const setBulkCheckinSaveFormat = () => {
    let containerPairsArr = Immutable.fromJS([]);
    let totalExpectedContainers = 0;
    let validationErrors = Immutable.Map<string, object>({});
    const omcDBIdMap = {}; // stores db id for omc.id (generated uuids for uniqueness)

    data.forEach(item => {
      const dataOrderId = getParentOrderId(item);
      const labId = item.getIn(['order', 'lab_id']);
      const locationId = item.getIn(['form', 'location', 'id']);

      const omcs = item.getIn(['orderable_material', 'orderable_material_components'], Immutable.List());
      const omcParentRowIdMap = {}; // stores parent table row id for omc.id
      const sanitizedOmcs = omcs.map((omc) => {
        omcParentRowIdMap[omc.get('id')] = omc.get('parentRowId');
        omcDBIdMap[omc.get('id')] = omc.get('orderable_material_component_id');
        omc = omc.setIn(['form', 'barcode'], omc.getIn(['form', 'barcode', 'value']));
        omc = omc.setIn(['form', 'volume_per_container'], omc.getIn(['form', 'volume_per_container', 'value']));
        omc = omc.setIn(['form', 'mass_per_container'], omc.getIn(['form', 'mass_per_container', 'value']));
        omc = omc.setIn(['form', 'lot_no'], omc.getIn(['form', 'lot_no', 'value']));
        return omc.merge(omc.get('form'));
      });
      totalExpectedContainers += sanitizedOmcs.size; // to prevent from partial checkin
      if (sanitizedOmcs.size > 0) {
        const containersMap = CheckinLogic.initialInputs(sanitizedOmcs, true);
        if (CheckinLogic.isValid(containersMap)) {
          const containerPairs = CheckinLogic.buildRequestContainers(containersMap, dataOrderId, labId || locationId, true);
          containerPairsArr = containerPairsArr.push(...containerPairs);
        } else {
          const allContainers = containersMap.valueSeq().flatten(true).toList();
          allContainers.forEach((container) => {
            if (!ContainerInputsLogic.isValid(container)) {
              const errorFields = ContainerInputsLogic.errors(container);
              const hasErrors = !(Object.keys(errorFields.toJS()).every((key) => errorFields.get(key) === undefined));
              if (hasErrors) {
                const omcId = container.getIn(['omcId', 'value']);
                validationErrors = validationErrors.set(omcParentRowIdMap[omcId], {
                  ...validationErrors.get(omcParentRowIdMap[omcId]), [omcId]: errorFields.toJS()
                });
              }
            }
          });
        }
      }
    });
    if (!validationErrors.isEmpty()) {
      setFormValidationErrors(validationErrors);
      return [];
    }
    // prepare payload
    const dataMap = containerPairsArr.reduce((acc, containerData) => {
      const orderId = containerData.getIn(['container', 'kit_order_id']);
      const omcId = containerData.getIn(['container', 'orderable_material_component_id']);
      const containerDataJs = containerData.setIn(['container', 'orderable_material_component_id'], omcDBIdMap[omcId]).toJS();
      if (acc.get(orderId)) {
        acc = acc.update(orderId, (containersList) => {
          containersList.push(containerDataJs);
          return containersList;
        });
      } else {
        acc = acc.set(orderId, [containerDataJs]);
      }
      return acc;
    }, Immutable.Map());
    const payload = _.entries(dataMap.toJS()).map(([orderId, containerData]) => ({
      id: orderId,
      data: containerData,
    }));
    const noOfContainers = payload.reduce((acc, obj: { data: Array<unknown>, id: string }) => (acc + obj.data.length), 0);
    return noOfContainers === totalExpectedContainers ? payload : [];
  };

  const handleBulkCheckin = () => {
    const orders = setBulkCheckinSaveFormat();

    if (orders.length > 0) {
      if (orders[0].id.startsWith('order-missing-id')) {
        KitOrderActions.materialCheckin(orders[0]).done(() => {
          setModified(false);
          _.debounce(onBulkCheckinSuccess, 400)();
        })
          .fail((response) => onBulkCheckinFailure(response));
      } else {
        KitOrderActions.bulkCheckin(orders).done(() => {
          setModified(false);
          _.debounce(onBulkCheckinSuccess, 400)();
        })
          .fail((response) => onBulkCheckinFailure(response));
      }
    }
  };

  const onBulkCheckinSuccess = () => {
    NotificationActions.createNotification({
      text: 'Your order(s) have been successfully checked in',
      isSuccess: true
    });
    props.onBulkCheckinSuccess();
  };

  const onBulkCheckinFailure = response => {
    const responses = Immutable.fromJS(response.responseJSON);
    let formErrors = Immutable.Map<string, object>({});
    responses.forEach(response => {
      const errors = response.get('errors').toJS();
      const kitOrderId = response.get('id');
      const kitOrder = data.filter(item => item.get('id') === kitOrderId).first();
      const omcs = data.filter(item => item.get('orderId') === kitOrderId);

      errors.forEach((errorObj) => {
        Object.entries(errorObj).forEach(([omcIdx, errorMsg]) => {
          if (CheckinFormHelper.isGroupMaterial(data)) {
            const omcId = kitOrder.getIn(['orderable_material', 'orderable_material_components', omcIdx, 'id']);
            formErrors = formErrors.set(kitOrderId, {
              ...formErrors.get(kitOrderId),
              [omcId]: errorMsg
            });
          } else {
            const omcId = omcs.getIn([omcIdx, 'id']);
            formErrors = formErrors.set(omcId, {
              ...formErrors.get(omcId),
              [omcId]: errorMsg
            });
          }
        });
      });
    });
    setFormValidationErrors(formErrors);
  };

  const shouldDisableResetButton = () => {
    if (listChanged) {
      return !listChanged;
    }
    return !data.toJS().some(material => {
      return material.orderable_material.orderable_material_components.some(omc => (
        !_.isEqual(omc.form, omc.initialForm)
      ));
    });
  };

  const formActionButtons = (
    <div className="material-orders-checkin-form__buttons">
      <ButtonGroup orientation="horizontal">
        {props.backButton}
        <Button
          type="secondary"
          onClick={handleResetForm}
          disabled={shouldDisableResetButton()}
        >
          Reset
        </Button>
        <Button
          type="primary"
          onClick={handleBulkCheckin}
          disabled={!isEntireFormValid}
        >
          Checkin
        </Button>
      </ButtonGroup>
    </div>
  );

  const onToggleChange = (event) => {
    if (event.target.value === 'on') {
      setIsDisplayErrorsOnly(true);
    } else {
      setIsDisplayErrorsOnly(false);
    }
  };

  const renderToggle = () => {
    return (
      <div className="material-orders-checkin-form__toggle">
        <Toggle
          name="list-toggle-filter"
          value={isDisplayErrorsOnly ? 'on' : 'off'}
          onChange={onToggleChange}
          size="large"
          readOnly={isEntireFormValid && !isDisplayErrorsOnly}
        />
        <TextBody className="material-orders-checkin-form__toggle-text">Only show rows with errors</TextBody>
      </div>
    );
  };

  const renderEmptyMessage = () => {
    if (isDisplayErrorsOnly) {
      return 'No Records With Error Found';
    }
  };

  const renderIndividualCheckinTable = () => {
    const columnNames = [Columns.NAME, Columns.SKU, Columns.LABEL, Columns.CONTAINER_TYPE, Columns.RESOURCE_ID, Columns.CAS, Columns.LOT, Columns.LOCATION, Columns.STORAGE_CONDITION,
      Columns.EXP_DATE, Columns.VOLUME, Columns.MASS, Columns.ORDER_ID, Columns.BARCODE, Columns.LAB];

    const columns = getColumnsByName(columnNames);

    const getDataToDisplay = (isDisplayErrorsOnly) => {
      if (isDisplayErrorsOnly) {
        return data.filter(order => rowColorMap[order.get('id')] === 'danger');
      } else {
        return data;
      }
    };

    return (
      <List
        loaded={loaded}
        data={getDataToDisplay(isDisplayErrorsOnly)}
        id={KeyRegistry.MATERIAL_ORDERS_INDIVIDUAL_CHECKIN_FORM_TABLE}
        showColumnFilter
        visibleColumns={_.intersection(individualVisibleColumns, columnNames)}
        requiredVisibleColumns={REQUIRED_VISIBLE_COLUMNS}
        persistKeyInfo={UserPreference.packInfo(KeyRegistry.MATERIAL_ORDERS_INDIVIDUAL_CHECKIN_FORM_TABLE)}
        onChangeSelection={(selectedColumns) => setIndividualVisibleColumns(selectedColumns)}
        showPagination={false}
        actions={actions}
        selected={selected.toJS()}
        onSelectRow={(_record, _willBeChecked, selectedRows) => setSelectedRows(selectedRows)}
        onSelectAll={(selectedRows) => setSelectedRows(selectedRows)}
        disableCard
        rowColorMap={rowColorMap}
        topActionArea={renderToggle()}
        emptyMessage={renderEmptyMessage()}
      >
        {columns.map((column) => (
          React.cloneElement(column, {
            renderCellContent: (materialItem, idx) => {
              const omc = materialItem.getIn(['orderable_material', 'orderable_material_components', 0]);
              return column.props.renderCellContent({ materialItem, omc, omcIdx: 0, materialItemIdx: idx });
            },
            onSortChange: column.props.sortable ? onSortChangeMaterialItems : null,
            key: column.props.id
          })
        ))}
      </List>
    );
  };

  const renderGroupCheckinTable = () => {
    const columnNames = [Columns.NAME, Columns.SKU, Columns.TYPE, Columns.ORDER_ID, Columns.VENDOR, Columns.CREATED, Columns.LAB];
    const columns = getColumnsByName(columnNames);

    const getDataToDisplay = (isDisplayErrorsOnly) => {
      if (isDisplayErrorsOnly) {
        return data.filter(order => rowColorMap[order.get('id')] === 'danger');
      } else {
        return data;
      }
    };

    return (
      <List
        loaded={loaded}
        data={getDataToDisplay(isDisplayErrorsOnly)}
        id={KeyRegistry.MATERIAL_ORDERS_GROUP_CHECKIN_FORM_TABLE}
        showColumnFilter
        visibleColumns={_.intersection(groupVisibleColumns, columnNames)}
        onChangeSelection={(selectedColumns) => setGroupVisibleColumns(selectedColumns)}
        persistKeyInfo={UserPreference.packInfo(KeyRegistry.MATERIAL_ORDERS_GROUP_CHECKIN_FORM_TABLE)}
        showPagination={false}
        actions={actions}
        selected={expanded.toJS()}
        expanded={expanded.toJS()}
        onExpandRow={(_record, _willBeExpanded, expandedRows) => {
          setExpanded(Immutable.fromJS(expandedRows));
        }}
        renderExpandedRow={renderNestedGroupCheckinTable}
        toggleRowColor={false}
        disabledSelection
        disableCard
        rowColorMap={rowColorMap}
        topActionArea={renderToggle()}
        emptyMessage={renderEmptyMessage()}
      >
        {columns.map((column) => (
          React.cloneElement(column, {
            renderCellContent: (materialItem, materialItemIdx) => {
              return column.props.renderCellContent({ materialItem, materialItemIdx });
            },
            onSortChange: column.props.sortable ? onSortChangeMaterialItems : null,
            key: column.props.id
          })
        ))}
      </List>
    );
  };

  const renderNestedGroupCheckinTable = (materialItem, materialItemIdx) => {
    const id = `nested-table--${materialItem.get('id')}`;
    const columnNames = [Columns.NAME, Columns.LABEL, Columns.CONTAINER_TYPE, Columns.RESOURCE_ID, Columns.CAS, Columns.LOT, Columns.LOCATION, Columns.STORAGE_CONDITION, Columns.EXP_DATE, Columns.VOLUME,
      Columns.MASS, Columns.BARCODE];
    const columns = getColumnsByName(columnNames);
    let omcs = getMaterialItemOmcs(materialItem);

    if (isDisplayErrorsOnly) {
      omcs = omcs.filter(omc => rowColorMap[omc.get('id')] === 'danger');
    }

    const nestedSelection = selected.getIn([materialItem.get('id')], {});

    return (
      <Table
        loaded={loaded}
        data={omcs}
        id={id}
        selected={nestedSelection}
        onSelectRow={(_record, _willBeChecked, selectedRows) => {
          setSelectedNestedRows(materialItem, selectedRows);
        }}
        onSelectAll={(selectedRows) => {
          setSelectedNestedRows(materialItem, selectedRows);
        }}
        toggleRowColor={false}
        nestedTable
        disableBorder
        rowColorMap={rowColorMap}
        emptyMessage={renderEmptyMessage()}
      >
        {columns.map((column) => (
          React.cloneElement(column, {
            renderCellContent: (omc, omcIdx) => {
              return column.props.renderCellContent({ materialItem, omc, omcIdx, materialItemIdx });
            },
            onSortChange: column.props.sortable ? (
              (sortKey, sortDirection) => onSortChangeOmcs(sortKey, sortDirection, materialItemIdx)
            ) : null,
            key: column.props.id
          })
        ))}
      </Table>
    );
  };

  const renderFormList = () => {
    if (loaded) {
      if (CheckinFormHelper.isGroupMaterial(data)) {
        return renderGroupCheckinTable();
      } else {
        return renderIndividualCheckinTable();
      }
    } else {
      return <Spinner />;
    }
  };

  return (
    <>
      <Prompt
        message="You're editing check in items. We won't be able to save your data if you proceed to discard. Do you want to discard these changes?"
        when={modified}
      />
      <div className="material-orders-checkin-form">
        {modals}
        {renderFormList()}
        {formActionButtons}
      </div>
    </>
  );
}

export default MaterialOrdersCheckinForm;
