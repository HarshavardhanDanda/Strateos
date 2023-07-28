import React from 'react';
import _ from 'lodash';
import { TextDescription } from '@transcriptic/amino';
import FieldMapperPreview from './FieldMapperPreview';
import FieldMapperForm, { Props as FieldMapperFormProps } from './FieldMapperForm';
import { FieldMapperData } from './types';

type Props = {
  data: FieldMapperData;
} & Pick<FieldMapperFormProps,
  'fields' | 'onChange' | 'getCustomError'
>;

function FieldMapper(props: Props) {
  const {
    data,
    fields,
    onChange,
    getCustomError
  } = props;

  if (data.length < 1) {
    console.error('Data must have minimum one row to map fields.');
    return null;
  }

  const renderPreviewTable = () => (
    <FieldMapperPreview data={data} />
  );

  const renderDescription = () => (
    <TextDescription color="secondary">
      Select all fields that would be mapped in your import file. The fields will be mapped by their column header name.
    </TextDescription>
  );

  const renderMappingForm = () => (
    <FieldMapperForm
      fields={fields}
      data={data}
      onChange={onChange}
      getCustomError={getCustomError}
    />
  );

  return (
    <div className="tx-stack tx-stack--md">
      {renderPreviewTable()}
      {renderDescription()}
      {renderMappingForm()}
    </div>
  );
}

export default FieldMapper;
