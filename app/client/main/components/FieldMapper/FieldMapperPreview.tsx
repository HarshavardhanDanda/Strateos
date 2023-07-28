import React from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import { Card, Column, Section, Table } from '@transcriptic/amino';
import { FieldMapperData } from './types';

interface Props {
  data: FieldMapperData;
}

function FieldMapperPreview(props: Props) {
  const {
    data,
  } = props;

  return  (
    <Card>
      <Section title="Table data preview">
        <Table
          id="field-mapper-preview-table"
          loaded
          data={Immutable.fromJS(data.filter((record, idx) => idx === 0))}
          disabledSelection
        >
          {Object.keys(data[0]).map(key => {
            return (
              <Column
                key={`${key}-column`}
                id={key}
                header={key}
                renderCellContent={(record) => record.get(key) || 'N/A'}
                disableFormatHeader
              />
            );
          })}
        </Table>
      </Section>
    </Card>
  );
}

export default FieldMapperPreview;
