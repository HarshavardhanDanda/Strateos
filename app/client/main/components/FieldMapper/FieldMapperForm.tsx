import React, { useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import { Column, Icon, Select, Table, TextBody, Toggle, Tooltip, Validated } from '@transcriptic/amino';
import { FieldMapperData, FieldMap, Field } from './types';
import FieldMapperHelper from './FieldMapperHelper';

import './FieldMapperForm.scss';

export interface Props {
  fields: Field[];
  data: FieldMapperData;
  onChange: (
    fieldMap: FieldMap,
    transformedData: FieldMapperData,
    isValid: boolean
  ) => void;
  getCustomError?: (
    fieldMap: FieldMap,
    transformedData: FieldMapperData,
  ) => FieldMap;
}

function FieldMapperForm(props: Props) {
  const {
    fields,
    data,
    onChange,
    getCustomError
  } = props;

  /**
   * Form fields gets initiated with the best matching key in the data prop.
   */
  const [fieldMap, setFieldMap] = useState(FieldMapperHelper.constructInitialFieldMap(fields, data));
  const firstUpdate = useRef(true);

  useEffect(() => {
    setFieldMap(FieldMapperHelper.constructInitialFieldMap(fields, data));
  }, [data]);

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    const map = FieldMapperHelper.buildSimplifiedFieldMap(fieldMap);
    const transformedData = FieldMapperHelper.buildTransformedData(fieldMap, data);
    const isValid = _.isEmpty(getErrors());
    onChange(map, transformedData, isValid);
  }, [fieldMap]);

  const getErrors = () => {
    const map = FieldMapperHelper.buildSimplifiedFieldMap(fieldMap);
    const transformedData = FieldMapperHelper.buildTransformedData(fieldMap, data);
    const generatedError = FieldMapperHelper.buildErrorMap(fieldMap);
    const customError = getCustomError ? getCustomError(map, transformedData) : {};
    return { ...generatedError, ...customError };
  };

  const handleKeyRowToggle = (event, idx) => {
    const enabled = event.target.value === 'on';
    let field = fieldMap.get(idx).set('enabled', enabled);
    if (!enabled) {
      field = field.set('value', null);
    }
    setFieldMap(fieldMap.set(idx, field));
  };

  const handleUserKeySelect = (event, idx) => {
    setFieldMap(fieldMap.setIn([idx, 'value'], event.target.value));
  };

  const isKeySelected = (key: string) => {
    return fieldMap.find(item => item.get('value') === key);
  };

  const displayMissingDataWarning = (record) => {
    const key = record.get('key');
    const mappedKey = record.get('value');
    if (getErrors()[key]) {
      return false;
    }
    return record.get('required') && data.some((row) => {
      const isMissingData = mappedKey && !row[mappedKey];
      return isMissingData;
    });
  };

  const renderEnabledToggle = (record, idx) => (
    <Toggle
      name={`enabled-toggle-${idx}`}
      value={record.get('enabled') ? 'on' : 'off'}
      readOnly={record.get('required')}
      onChange={(event) => {
        handleKeyRowToggle(event, idx);
      }}
    />
  );

  const renderMappedKey = (record) =>  (
    <div className="field-mapper-form__mapped-key">
      <TextBody>{record.get('key')}</TextBody>
      {displayMissingDataWarning(record) && (
        <Tooltip title="Missing column data, you can either re-upload or assign information in the next step." placement="right">
          <Icon icon="far fa-info-circle" color="danger" />
        </Tooltip>
      )}
    </div>
  );

  const renderUserKey = (record, idx) => {
    const errorMessage = getErrors()[record.get('key')];
    const options = Object.keys(data[0]).map(key => ({
      name: key,
      value: key,
      disabled: isKeySelected(key)
    }));
    return (
      <Validated force_validate error={errorMessage}>
        <Select
          value={record.get('value')}
          options={options}
          disabled={!record.get('enabled')}
          nullable
          onChange={(event) => {
            handleUserKeySelect(event, idx);
          }}
        />
      </Validated>
    );
  };

  return  (
    <Table
      id="field-mapper-form-table"
      loaded
      data={fieldMap}
      disabledSelection
    >
      <Column
        key="toggle"
        id="toggle"
        header=""
        renderCellContent={renderEnabledToggle}
        relativeWidth={0.3}
      />
      <Column
        key="key"
        id="key"
        header="Mapped column names"
        renderCellContent={renderMappedKey}
      />
      <Column
        key="value"
        id="value"
        header="Uploaded column names"
        renderCellContent={renderUserKey}
      />
    </Table>
  );
}

export default FieldMapperForm;
