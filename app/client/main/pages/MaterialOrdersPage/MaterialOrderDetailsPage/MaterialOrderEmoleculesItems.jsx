import React from 'react';
import PropTypes from 'prop-types';
import _  from 'lodash';
import Immutable from 'immutable';
import { List, Column, TextInput, Molecule, Validated } from '@transcriptic/amino';
import './MaterialOrderItems.scss';

class MaterialOrderEmoleculesItems extends React.Component {

  constructor(props) {
    super(props);

    _.bindAll(
      this,
      'renderSku',
      'renderQuantity',
      'renderCost',
      'renderStructure',
      'renderSupplier',
      'renderAmount'
    );
  }

  getSelectedRows() {
    const selectionMap = {};
    const { selected } = this.props;
    if (selected) {
      selected.forEach(element => {
        selectionMap[element] = true;
      });
    }
    return selectionMap;
  }

  validateCount(count) {
    if (_.isEmpty(_.toString(count))) {
      return 'Required';
    }
    return _.toNumber(count) > 0 ? '' : 'Must be greater than 0';
  }

  renderSku(material) {
    return material.getIn(['supplier', 'sku'], '-');
  }

  renderQuantity(material) {
    return (
      <Validated
        error={this.props.forceValidation && this.validateCount(material.get('count'))}
        force_validate={this.props.forceValidation}
      >
        <TextInput
          value={material.get('count')}
          type="number"
          defaultValue="1"
          min="1"
          style={{ width: '80px' }}
          onChange={(e) => this.props.handleCountChange(e.target.value, material.get('id'))}
        />
      </Validated>
    );
  }

  renderCost(material) {
    return material.getIn(['supplier', 'price']) ? `$${Number(material.getIn(['supplier', 'price']) * material.get('count')).toFixed(2)}` : '-';
  }

  renderStructure(material) {
    return <div className="material-order-items__molecule"><Molecule SMILES={material.get('smiles')} size="tiny" /></div>;
  }

  renderSupplier(material) {
    return material.getIn(['supplier', 'name'], '-');
  }

  renderAmount(material) {
    const unit = material.getIn(['supplier', 'units'], '');
    const amount = material.getIn(['supplier', 'quantity'], '-');
    return `${amount}${unit}`;
  }

  renderTotalCost(materials) {
    const totalCost = materials.reduce((acc, material) =>
      acc + (material.getIn(['supplier', 'price']) ? material.getIn(['supplier', 'price']) * material.get('count') : 0), 0);
    return (
      <div className="material-order-items__footer">
        <p className="material-order-items__footer-item-emolecule">{`Total: $${Number(totalCost).toFixed(2)}`}</p>
      </div>
    );
  }

  render() {
    const { data } = this.props;

    const columns = [
      <Column
        key="smiles"
        renderCellContent={this.renderStructure}
        header="structure"
        id="smiles"
      />,
      <Column
        key="supplier"
        renderCellContent={this.renderSupplier}
        header="supplier"
        id="supplier"
      />,
      <Column
        key="sku"
        renderCellContent={this.renderSku}
        header="sku"
        id="sku"
      />,
      <Column
        key="quantity"
        renderCellContent={this.renderQuantity}
        header="quantity"
        id="quantity"
      />,
      <Column
        key="amount"
        renderCellContent={this.renderAmount}
        header="amount"
        id="amount"
      />,
      <Column
        key="cost"
        renderCellContent={this.renderCost}
        header="cost"
        id="cost"
      />
    ];

    return (
      <If condition={data.size > 0}>
        <List
          id="material-orders-group-items"
          tallRows
          loaded
          disableCard
          data={Immutable.Iterable(data)}
          selected={this.getSelectedRows()}
          onSelectRow={(_records, _willBeChecked, selectedRows) => this.props.onSelectRow(selectedRows)}
          onSelectAll={(selectedRows) => this.props.onSelectRow(selectedRows)}
        >
          {columns}
        </List>
        {this.renderTotalCost(data)}
      </If>
    );
  }
}

MaterialOrderEmoleculesItems.propTypes = {
  onSelectRow: PropTypes.func.isRequired,
  data: PropTypes.instanceOf(Immutable.Iterable),
  selected: PropTypes.arrayOf(PropTypes.string),
  forceValidation: PropTypes.bool
};

export default MaterialOrderEmoleculesItems;
