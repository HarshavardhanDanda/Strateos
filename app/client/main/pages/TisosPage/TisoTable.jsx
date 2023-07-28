import Immutable   from 'immutable';
import _           from 'lodash';
import PropTypes   from 'prop-types';
import React       from 'react';

import { Table, Card, Column } from '@transcriptic/amino';
import BaseTableTypes from 'main/components/BaseTableTypes';
import { TabLayout } from '../../components/TabLayout/TabLayout';

import './TisosPage.scss';

function TisoSlot({ data }) {
  return <span>{`Col ${data.col} / Row ${data.row}`}</span>;
}

TisoSlot.propTypes = {
  data: PropTypes.shape({
    row: PropTypes.string,
    col: PropTypes.string
  })
};

class TisoTable extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      sentIds: []
    };
  }

  renderIdRecord(record) {
    return <p>{record.get(('id'))}</p>;
  }

  renderContainerRecord(record) {
    const container = { id: record.get(('container_id')) };
    return  <BaseTableTypes.ContainerUrl data={container} />;
  }

  renderRunExecutionRecord(record) {
    return record.get(('run_execution_id')) ? <p>{record.get(('run_execution_id'))}</p> : <p>—</p>;
  }

  renderRunRecord(record) {
    return <BaseTableTypes.Run data={record.get(('run_id'))} />;
  }

  renderInstructionRecord(record) {
    return record.get(('instruction_id')) ? <p>{record.get(('instruction_id'))}</p> : <p>—</p>;
  }

  renderContainerTypeRecord(record) {
    return <BaseTableTypes.ContainerTypeId data={record.get(('container_type'))} />;
  }

  renderDeviceRecord(record) {
    return record.get(('device_id')) ? <p>{record.get(('device_id'))}</p> : <p>—</p>;
  }

  renderSlotRecord(record) {
    const slot = record.get(('slot'));
    return slot ? <span>{`Col ${slot.get('col')} / Row ${slot.get('row')}`}</span> : <p>—</p>;
  }

  render() {
    const reservations = this.props.reservations.map((r) => {
      const container = {
        id: r.container_id
      };
      const run = {
        id: r.run_id
      };
      return {
        container,
        run,
        ...r
      };
    });
    return (
      <TabLayout theme="gray">
        <Card>
          <Table
            data={Immutable.fromJS(reservations)}
            loaded
            disabledSelection
            id="tisos-container-table"
          >
            <Column renderCellContent={this.renderIdRecord} header="reservation id" id="name-column" />
            <Column renderCellContent={this.renderContainerRecord} header="container" id="container-column" />
            <Column renderCellContent={this.renderRunExecutionRecord} header="run execution" id="execution-column" />
            <Column renderCellContent={this.renderRunRecord} header="run" id="run-column" />
            <Column renderCellContent={this.renderInstructionRecord} header="instruction" id="instruction-column" />
            <Column renderCellContent={this.renderContainerTypeRecord} header="container type" id="container-column" />
            <Column renderCellContent={this.renderDeviceRecord} header="device" id="device-column" />
            <Column renderCellContent={this.renderSlotRecord} header="slot" id="slot-column" />
          </Table>
        </Card>
      </TabLayout>
    );
  }
}

TisoTable.propTypes = {
  reservations: PropTypes.array
};

export default TisoTable;
