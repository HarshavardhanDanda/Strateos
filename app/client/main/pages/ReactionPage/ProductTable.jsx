import React from 'react';
import PropTypes from 'prop-types';
import { Table, Column, Unit } from '@transcriptic/amino';
import Immutable from 'immutable';

export function isValueUnitValid(value) {
  return /\d+:\w+/.test(value);
}

function productId(product) {
  return product.get('refRxnId');
}

function productName(product) {
  return product.getIn(['compound', 'name']);
}

function molecularFormula(product) {
  return product.getIn(['compound', 'formula']);
}

function formulaMass(product) {
  if (!isValueUnitValid(product.get('formulaWeight'))) {
    return undefined;
  }
  return Array.from(product.get('formulaWeight').split(/:/))[0];
}

function molecularWeight(product) {
  return product.getIn(['compound', 'molecularWeight']);
}

function exactMolecularMass(product) {
  return product.getIn(['compound', 'exactMolecularWeight']);
}

function theoreticalMass(product) {
  if (!isValueUnitValid(product.get('theoreticalMass'))) {
    return undefined;
  }
  const [value, unit] = Array.from(product.get('theoreticalMass').split(/:/));
  const accurateValue = parseFloat(value).toFixed(3);
  const theoreticalMass = accurateValue + ':' + unit;
  return (
    <Unit
      value={theoreticalMass}
      convertForDisplay
      shortUnits
    />
  );
}

function ProductTable(props) {
  return (
    <Table
      id="product-table"
      data={Immutable.fromJS(props.product)}
      disabledSelection
      loaded
    >
      <Column renderCellContent={productId} header="Rxn Id" id="product-product-id" />
      <Column renderCellContent={productName} header="Product" id="product-product-name" />
      <Column renderCellContent={molecularFormula} header="MF" id="product-molecular-formula" />
      <Column renderCellContent={formulaMass} header="FM" id="product-formula-mass" />
      <Column renderCellContent={molecularWeight} header="MW" id="product-molecular-weight" />
      <Column renderCellContent={exactMolecularMass} header="EM" id="product-exact-molecular-mass" />
      <Column renderCellContent={theoreticalMass} header="Theo Mass" id="product-theoretical-mass" />
    </Table>
  );
}

ProductTable.propTypes = {
  product: PropTypes.array.isRequired
};

export default ProductTable;
