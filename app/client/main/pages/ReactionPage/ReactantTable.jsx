import React from 'react';
import PropTypes from 'prop-types';
import { Table, Column } from '@transcriptic/amino';
import Immutable from 'immutable';

export function isValueUnitValid(value) {
  return /\d+:\w+/.test(value);
}

function reactant(reactant) {
  return reactant.getIn(['compound', 'name']);
}

function molecularFormula(reactant) {
  return reactant.getIn(['compound', 'formula']);
}

function formulaMass(reactant) {
  if (!isValueUnitValid(reactant.get('formulaWeight'))) {
    return undefined;
  }
  return Array.from(reactant.get('formulaWeight').split(/:/))[0];
}

function molecularWeight(reactant) {
  return reactant.getIn(['compound', 'molecularWeight']);
}

function exactMolecularMass(reactant) {
  return reactant.getIn(['compound', 'exactMolecularWeight']);
}

function moles(reactant) {
  if (!isValueUnitValid(reactant.get('amount'))) {
    return undefined;
  }
  return Array.from(reactant.get('amount').split(/:/)).join(' ');
}

function limiting(reactant) {
  const limiting = reactant.get('limiting');
  return limiting ? 'yes' : 'no';
}

function equivalent(reactant) {
  return reactant.get('equivalent');
}

function additionOrder(reactant) {
  return reactant.get('additionOrder');
}

function base(reactant) {
  const base = reactant.get('base');
  return base ? 'yes' : 'no';
}

function sampleAmount(reactant) {
  if (reactant.get('phase') === 'liquid') {
    if (!isValueUnitValid(reactant.get('sampleVolume'))) {
      return undefined;
    }
    const [value, unit] = Array.from(reactant.get('sampleVolume').split(/:/));
    return `${parseFloat(value).toFixed(2)} ${unit}`;
  }

  if (!isValueUnitValid(reactant.get('sampleMass'))) {
    return undefined;
  }
  const [value, unit] = Array.from(reactant.get('sampleMass').split(/:/));
  return `${parseFloat(value).toFixed(2)} ${unit}`;
}

function phase(reactant) {
  return reactant.get('phase');
}

function pin(reactant) {
  const pin = reactant.getIn(['additionalProperties', 'pin']);
  return pin ? 'yes' : 'no';
}

function reactantId(reactant) {
  return reactant.get('refRxnId');
}

function ReactantTable(props) {
  return (
    <Table
      id="reactant-table"
      data={Immutable.fromJS(props.reactants)}
      disabledSelection
      loaded
    >
      <Column renderCellContent={reactantId} header="Rxn Id" id="reactant-reactionId" />
      <Column renderCellContent={reactant} header="Reactant" id="reactant-reactant" />
      <Column renderCellContent={molecularFormula} header="MF" id="reactant-molecular-formula" />
      <Column renderCellContent={formulaMass} header="FM" id="reactant-formula-mass" />
      <Column renderCellContent={molecularWeight} header="MW" id="reactant-molecular-weight" />
      <Column renderCellContent={exactMolecularMass} header="EM" id="reactant-exact-molecular-mass" />
      <Column renderCellContent={moles} header="Moles" id="reactant-moles" />
      <Column renderCellContent={limiting} header="Limit?" id="reactant-limiting" />
      <Column renderCellContent={equivalent} header="Eq" id="reactant-equivalent" />
      <Column renderCellContent={additionOrder} header="Addition Order" id="reactant-addition-order" />
      <Column renderCellContent={base} header="Base?" id="reactant-base" />
      <Column renderCellContent={sampleAmount} header="Sample Amount" id="reactant-sample-mass" />
      <Column renderCellContent={phase} header="Phase" id="reactant-phase" />
      <Column renderCellContent={pin} header="Pin?" id="reactant-pin" />
    </Table>
  );
}

ReactantTable.propTypes = {
  reactants: PropTypes.array.isRequired
};

export default ReactantTable;
