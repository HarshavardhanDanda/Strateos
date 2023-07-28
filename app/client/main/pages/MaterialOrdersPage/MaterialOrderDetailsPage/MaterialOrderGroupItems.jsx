import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Immutable from 'immutable';
import { List, Column, TextInput, Validated } from '@transcriptic/amino';

import './MaterialOrderItems.scss';

class MaterialOrderGroupItems extends React.Component {

  constructor(props) {
    super(props);

    _.bindAll(
      this,
      'renderName',
      'renderSku',
      'renderQuantity',
      'renderCost'
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

  isPrivateMaterial(material) {
    return material.get('is_private');
  }

  getMaterialId(material) {
    return material.get('id');
  }

  isNameClickable(material) {
    const { canManageAllMaterials, canViewPublicMaterials } = this.props;
    return canManageAllMaterials || (canViewPublicMaterials && !this.isPrivateMaterial(material));
  }

  validateCount(count) {
    if (_.isEmpty(_.toString(count))) {
      return 'Required';
    }
    return _.toNumber(count) > 0 ? '' : 'Must be greater than 0';
  }

  renderName(material) {
    const { handleNameClick } = this.props;
    const isClickable = this.isNameClickable(material);
    return (
      <div className={isClickable && 'material-order-items__name--clickable'} onClick={(event) => isClickable && handleNameClick(event, this.getMaterialId(material))}>
        {material.get('name', '-')}
      </div>
    );
  }

  renderSku(material) {
    return material.getIn(['orderable_materials', 0, 'sku'], '-');
  }

  renderQuantity(material) {
    return (
      this.props.isReadOnly ?
        material.getIn(['orderable_materials', 0, 'count'])
        : (
          <Validated
            error={this.props.forceValidation && this.validateCount(material.getIn(['orderable_materials', 0, 'count']))}
            force_validate={this.props.forceValidation}
          >
            <TextInput
              value={material.getIn(['orderable_materials', 0, 'count'])}
              type="number"
              defaultValue="1"
              min="1"
              style={{ width: '80px' }}
              onChange={(e) => this.props.handleCountChange(e.target.value, material.getIn(['orderable_materials', 0, 'id']))}
            />
          </Validated>
        )
    );
  }

  renderCost(material) {
    const price = material.getIn(['orderable_materials', 0,  'price'], 0);
    const count = material.getIn(['orderable_materials', 0, 'count'], 0);
    return price ? `$${Number(price * count).toFixed(2)}` : '-';
  }

  renderTotalCost(materials) {
    const totalCost = materials.reduce((acc, material) => {
      const price = material.getIn(['orderable_materials', 0,  'price'], 0);
      const count = material.getIn(['orderable_materials', 0, 'count'], 0);
      return acc + parseFloat((price * count));
    }, 0);
    return (
      <div className="material-order-items__footer">
        <p className="material-order-items__footer-item-group">{`Total: $${Number(totalCost).toFixed(2)}`}</p>
      </div>
    );
  }

  render() {
    const { data } = this.props;

    const columns = [
      <Column
        renderCellContent={this.renderName}
        header="name"
        id="name"
        key="name"
      />,
      <Column
        renderCellContent={this.renderSku}
        header="sku"
        id="sku"
        key="sku"
      />,
      <Column
        renderCellContent={this.renderQuantity}
        header="quantity"
        id="quantity"
        key="quantity"
      />,
      <Column
        renderCellContent={this.renderCost}
        header="cost"
        id="cost"
        key="cost"
      />
    ];

    return (
      data.size > 0 &&
      (
        <div>
          <List
            id="material-orders-group-items"
            tallRows
            loaded
            disableCard
            data={Immutable.Iterable(data)}
            selected={this.getSelectedRows()}
            onSelectRow={(_records, _willBeChecked, selectedRows) => this.props.onSelectRow && this.props.onSelectRow(selectedRows)}
            onSelectAll={(selectedRows) => this.props.onSelectRow && this.props.onSelectRow(selectedRows)}
            disabledSelection={this.props.disableSelection}
          >
            {columns}
          </List>
          {this.renderTotalCost(data)}
        </div>
      )
    );
  }

}

MaterialOrderGroupItems.propTypes = {
  onSelectRow: PropTypes.func,
  data: PropTypes.instanceOf(Immutable.List),
  selected: PropTypes.arrayOf(PropTypes.string),
  disableSelection: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  forceValidation: PropTypes.bool
};

export default MaterialOrderGroupItems;
