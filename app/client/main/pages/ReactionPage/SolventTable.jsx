import React from 'react';
import PropTypes from 'prop-types';
import { Table, Column, Unit } from '@transcriptic/amino';
import Immutable from 'immutable';

function additionOrder(solvent) {
  return solvent.get('additionOrder');
}

function solvent(solvent) {
  return solvent.getIn(['resource', 'name']);
}

function volume(solvent) {
  const volume = solvent.get('volume');
  if (!volume) return;
  return (
    <Unit
      value={volume}
      convertForDisplay
      shortUnits
    />
  );
}

function SolventTable(props) {
  return (
    <Table
      id="solvent-table"
      data={Immutable.fromJS(props.solvents)}
      disabledSelection
      loaded
    >
      <Column renderCellContent={solvent} header="Solvent" id="solvent-solvent" />
      <Column renderCellContent={volume} header="Volume" id="solvent-volume" />
      <Column renderCellContent={additionOrder} header="Addition Order" id="solvent-addition-order" />
    </Table>
  );
}

SolventTable.propTypes = {
  solvents: PropTypes.array.isRequired
};

export default SolventTable;
