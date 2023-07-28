import React, { useEffect, useState } from 'react';
import { Column, Icon, Table, TextInput, Validated } from '@transcriptic/amino';
import Immutable from 'immutable';
import _ from 'lodash';
import { SinglePaneModal } from 'main/components/Modal';
import String from 'main/util/String';
import { validators } from 'main/components/validation';

type ItemValue = {
  value: string | number | undefined;
  isValid: boolean | null;
  error?: string | undefined;
}

export interface Item extends Immutable.Map<string, unknown> {
  material_idx: number;
  form_idx: number;
  id: string;
  name: string;
  location?: unknown;
  lab_id?: ItemValue;
  label?: ItemValue;
  lot_no?: ItemValue;
  mass_per_container?: ItemValue;
  volume_per_container?: ItemValue;
  container_type?: unknown;
  sku: string;
}

interface fieldProps {
  onSubmit: (data: Immutable.List<Item>, fieldName: string) => void;
  /**
  * data: The Data that is required to populate table, should be in <Item> format
  */
  data: Immutable.List<Item>;
  /**
  * validateField: function for populating field=>isValid to true or false
  */
  validateField?: (items) => Promise<Immutable.List<Item>>;
  /**
  * fieldName: this determines the value which needs to be changed and read from the data. e.g: 'barcode'
  */
  fieldName: string;
  /**
  * fieldTitle: this helps with text for fields such as 'lot_no; to show as 'Lot No' instead of field value 'lot_no'
  */
  fieldTitle: string;
  /**
  * shouldValidate: boolean to whether do back end validation on inputs
  */
  shouldValidate?: boolean;
  /**
  * preValidationFilter: function checks for data send before hitting validation API. e.g barcode needs to have labId, barcode to hit validation API
  */
  preValidationFilter?: (formData: Immutable.List<Item>) => Immutable.List<Item>;
  /**
  * formFieldValidator: string to indicate which type of input field validator to checking input text characters
  * e.g. use barcode character validator to check form values, all the values need to be valid before hitting back end for further validation
  */
  formFieldValidator?: string;
}

const isSameRow = (rowA, rowB) =>
  rowA.get('material_idx') === rowB.get('material_idx') &&
  rowA.get('form_idx') === rowB.get('form_idx');

function MultiRowEditorModal(props: fieldProps) {
  const [formData, setFormData] = useState(props.data);
  const [shouldNotDismiss, setShouldNotDismiss] = useState(true);

  useEffect(() => {
    setFormData(props.data);
  }, [props.data]);

  const onSortChangeMaterialItems = (sortKey: string, sortDirection: 'asc' | 'desc') => {
    let sortedData = formData.toJS();
    switch (sortKey) {
      case 'name':
        sortedData = _.orderBy(sortedData, (item) => _.get(item, ['name']), sortDirection);
        break;
      case 'sku':
        sortedData = _.orderBy(sortedData, (item) => _.get(item, ['sku']), sortDirection);
        break;
    }
    setFormData(Immutable.fromJS(sortedData));
  };

  const isFieldValueValid = (value: string) => {
    const text = String.removeNonPrintableAscii(value).trim();
    if (!props.formFieldValidator) {
      return null;
    }
    const error = validators[props.formFieldValidator](text);
    return !error;
  };

  const validateFieldAndSetFormData = (initialLoad = false) => {
    if (props.shouldValidate) {
      let updatedFormData = formData;
      let validatedData = formData;
      let fieldsValidatedData;
      let someFieldsInvalid = false;

      if (props.formFieldValidator) {
        fieldsValidatedData = formData.map((item) => {
          return item.setIn([props.fieldName, 'isValid'], isFieldValueValid(item.getIn([props.fieldName, 'value'])));
        });
        someFieldsInvalid = fieldsValidatedData.some(item => {
          return item.getIn([props.fieldName, 'isValid']) === false;
        });
      }

      if (!someFieldsInvalid) {
        if (initialLoad) {
          validatedData = formData.filter(item => !!item.getIn([props.fieldName, 'value'])).toList();
        } else if (props.preValidationFilter) {
          validatedData = props.preValidationFilter(formData);
        }
        return props.validateField(validatedData).then((response) => {
          response.forEach((validatedItem) => {
            const rowIdx = updatedFormData.findIndex((item) =>
              isSameRow(item, validatedItem)
            );
            if (rowIdx > -1) {
              updatedFormData = updatedFormData.setIn(
                [rowIdx, props.fieldName, 'isValid'],
                validatedItem.getIn([props.fieldName, 'isValid'])
              );
              updatedFormData = updatedFormData.setIn(
                [rowIdx, props.fieldName, 'error'],
                validatedItem.getIn([props.fieldName, 'error'])
              );
            }
          });
          setFormData(updatedFormData);
          return updatedFormData;
        });
      } else {
        setFormData(fieldsValidatedData);
        return fieldsValidatedData;
      }
    } else {
      return formData;
    }
  };

  const isButtonDisabled = formData.some((data) => {
    return data.getIn([props.fieldName, 'isValid']) === false;
  });

  const renderValidationMark = (item) => {
    const isValid = item.getIn([props.fieldName, 'isValid'], null);
    if (isValid !== null && (!_.isEmpty(item.getIn([props.fieldName, 'value'])) && item.getIn([props.fieldName, 'value']) !== undefined)) {
      return isValid ? (
        <Icon icon="fa fa-check" color="success" />
      ) : (
        <Icon icon="fa fa-times" color="danger" />
      );
    }
  };

  const handleOnChange = (event, idx) => {
    const value = event.target.value;
    setFormData(
      formData.setIn(
        [idx, props.fieldName], Immutable.fromJS({
          value: String.removeNonPrintableAscii(value).trim(),
          isValid: isFieldValueValid(value)
        })
      )
    );
  };

  const handleOnPaste = (event, idx) => {
    event.preventDefault();
    const clipboardData = event.clipboardData.getData('text');
    let updatedFormData = formData;
    let rowCount = idx;
    const fields = clipboardData.trim().split(/\r?\n/);
    const maxInputs = formData.size;

    fields.forEach((input) => {
      if (rowCount < maxInputs) {
        updatedFormData = updatedFormData.setIn(
          [rowCount++, props.fieldName],
          Immutable.fromJS({
            value: String.removeNonPrintableAscii(input).trim(),
            isValid: isFieldValueValid(input) })
        );
      }
    });
    setFormData(updatedFormData);
  };

  const onRenderCellContent = (item, field) => { return  <p>{item.get(field) || '-'}</p>; };

  const renderField = (item, idx) => (
    <Validated
      force_validate
      error={item.getIn([props.fieldName, 'error'])}
    >
      <TextInput
        placeholder={`Input ${props.fieldTitle}`}
        value={item.getIn([props.fieldName, 'value'])}
        onBlur={() => validateFieldAndSetFormData()}
        onPaste={(event) => { handleOnPaste(event, idx); }}
        onChange={(event) => { handleOnChange(event, idx); }}
      />
    </Validated>
  );

  const modalTitle = `Assign ${props.fieldTitle}s`;

  const finalCheck = async (resolve) => {
    const checkedData = await validateFieldAndSetFormData();
    const shouldNotSubmit = checkedData.some((data) => {
      return data.getIn([props.fieldName, 'isValid']) === false;
    });

    if (shouldNotSubmit) {
      setShouldNotDismiss(shouldNotSubmit);
    } else {
      props.onSubmit(checkedData, props.fieldName);
      setShouldNotDismiss(shouldNotSubmit);
    }
    resolve();
  };

  return (
    <SinglePaneModal
      fieldTitle={modalTitle}
      modalSize="large"
      modalId={`MULTIROW_${props.fieldName.toUpperCase()}_EDITOR_MODAL`}
      onAccept={() => {
        return new Promise((resolve) => {
          finalCheck(resolve);
        });
      }}
      disableDismiss={shouldNotDismiss}
      onOpen={() => validateFieldAndSetFormData(true)}
      beforeDismiss={() => (setFormData(props.data))}
      acceptBtnDisabled={isButtonDisabled}
    >
      <Table
        data={formData}
        id="props.fieldName-table"
        loaded
        disableBorder
        disabledSelection
      >
        <Column
          renderCellContent={(item) => onRenderCellContent(item, 'name')}
          header="Name"
          id="name"
          relativeWidth={3}
          sortable
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onSortChange={onSortChangeMaterialItems as any}
        />
        <Column
          renderCellContent={(item) => onRenderCellContent(item, 'sku')}
          header="Sku"
          id="sku"
          relativeWidth={2}
          sortable
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onSortChange={onSortChangeMaterialItems as any}
        />
        <Column
          renderCellContent={renderField}
          header={_.capitalize(props.fieldTitle)}
          id={props.fieldName}
          relativeWidth={7}
        />
        {props.shouldValidate && (
          <Column
            renderCellContent={renderValidationMark}
            header=""
            id="checkMark"
            alignContentRight
          />
        )}
      </Table>
    </SinglePaneModal>
  );
}

export default MultiRowEditorModal;
