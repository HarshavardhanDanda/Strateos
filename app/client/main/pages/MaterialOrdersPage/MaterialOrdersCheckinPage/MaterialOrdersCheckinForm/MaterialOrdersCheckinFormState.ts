import { useEffect, useState } from 'react';
import _ from 'lodash';
import Immutable from 'immutable';
import String from 'main/util/String';
import {
  FormField,
  getRowId,
  initialState,
  isGroupMaterial,
  RowColorAndHighlightMap,
  RowColorAndHighlightMapType,
} from './MaterialOrderCheckinFormHelper';

function useMaterialOrderCheckinFormState() {
  const [data, setData] = useState(Immutable.fromJS([]));
  const [rowColorMap, setRowColorMap] = useState({});
  const [rowHighlightMap, setRowHighlightMap] = useState(initialState.rowHighlightMapInitialState);
  const [isEntireFormValid, setIsEntireFormValid] = useState(true);

  useEffect(() => {
    setIsEntireFormValid(Object.keys(rowColorMap).every((rowId: string) => rowColorMap[rowId] !== 'danger'));
  }, [rowColorMap]);

  const setRowColorAndHighlightMap = (rowColorAndHighlightMap: RowColorAndHighlightMapType) => {
    setRowColorMap(rowColorAndHighlightMap.rowColorMap);
    setRowHighlightMap(rowColorAndHighlightMap.rowHighlightMap);
  };

  const validateField = (field) => {
    const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
    data.forEach((materialItem, materialItemIdx) => {
      const omcs = materialItem.getIn(['orderable_material', 'orderable_material_components']);
      omcs.forEach((omc, omcIdx) => {
        const [parentRowId, rowId] = getRowId(data, materialItemIdx, omcIdx);
        let value = omc.getIn(['form', field, 'value']);
        if (field === FormField.container_type_id) {
          value = omc.getIn(['form', 'container_type', 'id']);
        }
        rowColorAndHighlightMap.validateFieldAndSetState(field, value, omc, rowId, parentRowId);
      });
    });
    setRowColorAndHighlightMap(rowColorAndHighlightMap);
  };

  const validateMassAndVolume = () => {
    validateField(FormField.volume_per_container);
  };

  const validateLotNo = () => {
    validateField(FormField.lot_no);
  };

  const validateLabel = () => {
    validateField(FormField.label);
  };

  const validateContainerType = () => {
    validateField(FormField.container_type_id);
  };

  const doHandleInputChange = (name: FormField, value: string, omc) => {
    let updatedValue = value;
    const omcs = data.find(order => order.get('id') === omc.get('parentRowId'))
      .getIn(['orderable_material', 'orderable_material_components']);

    switch (name) {
      case FormField.barcode:
        updatedValue = Immutable.fromJS({ value: String.removeNonPrintableAscii(value).trim(), isValid: false });
        break;
      case FormField.mass_per_container:
      case FormField.volume_per_container:
      case FormField.lot_no:
        updatedValue = Immutable.fromJS({ value: value, isValid: false });
        break;
      case FormField.label:
        updatedValue = Immutable.fromJS({ value: value.trim(), isValid: true });
        break;
    }

    const materialItemIdx = data.findIndex(order => order.get('id') === omc.get('parentRowId'));
    const omcIdx = omcs.findIndex(component => component.get('id') === omc.get('id'));

    const updatedData = data.setIn([materialItemIdx, 'orderable_material', 'orderable_material_components', omcIdx, 'form', name], updatedValue);
    const [parentRowId, rowId] = getRowId(data, materialItemIdx, omcIdx);
    const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
    const validateValue = updatedValue && (typeof updatedValue === 'object') ? Immutable.Map(updatedValue).get('value') : updatedValue;
    rowColorAndHighlightMap.validateFieldAndSetState(name, validateValue, omc, rowId, parentRowId);
    setData(updatedData);
    setRowColorAndHighlightMap(rowColorAndHighlightMap);
  };

  const debouncedDoHandleInputChange = _.debounce(doHandleInputChange, 600);

  const handleInputChange = (name: FormField, value: string, omc, filterByErrors: boolean) => {
    if (filterByErrors) {
      // Captures the entire input before the highlighted row disappears
      debouncedDoHandleInputChange(name, value, omc);
    } else {
      doHandleInputChange(name, value, omc);
    }
  };

  const setFormValidationErrors = (allErrors: Immutable.Map<string, object>) => {
    if (!(allErrors && allErrors.size > 0)) {
      return;
    }
    if (isEntireFormValid) {
      setIsEntireFormValid(false);
    }
    const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
    allErrors.forEach((rowErrors, parentRowId) => {
      _.keys(rowErrors).forEach((rowId) => {
        const errors = rowErrors[rowId];
        const isBarcodeUnicityError = typeof (errors) === 'string' && errors.split(' ').includes('Barcode');
        if (isBarcodeUnicityError) {
          rowColorAndHighlightMap.setDanger(FormField.barcode, errors, rowId, parentRowId);
        } else {
          const errorTypes = Object.keys(errors).filter(err => errors[err] !== undefined);
          errorTypes.forEach((errorType: string) => {
            const errorMessage = Array.isArray(errors[errorType]) ? errors[errorType][0] : errors[errorType];
            errorType = errorType === 'volume' ? 'volume_per_container' : errorType === 'mass' ? 'mass_per_container'  : errorType;
            if (isGroupMaterial(data)) {
              rowColorAndHighlightMap.setDanger(FormField[errorType], errorMessage, rowId, parentRowId);
            } else {
              rowColorAndHighlightMap.setDanger(FormField[errorType], errorMessage, parentRowId, parentRowId);
            }
          });
        }
      });
    });
    setRowColorAndHighlightMap(rowColorAndHighlightMap);
  };

  return {
    isEntireFormValid,
    rowHighlightMap,
    rowColorMap,
    data,
    setIsEntireFormValid,
    setRowColorAndHighlightMap,
    handleInputChange,
    setFormValidationErrors,
    setData,
    validateMassAndVolume,
    validateLotNo,
    validateLabel,
    validateContainerType,
  };
}

export default useMaterialOrderCheckinFormState;
