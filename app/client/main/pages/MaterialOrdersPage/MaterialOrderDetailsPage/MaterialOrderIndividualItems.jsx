import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Immutable from 'immutable';
import classNames from 'classnames';
import { List, Column, TextInput, Molecule, Select, Validated } from '@transcriptic/amino';

import MaterialStore from 'main/stores/MaterialStore';

import './MaterialOrderItems.scss';

class MaterialOrderIndividualItems extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(
      this,
      'renderName',
      'renderSku',
      'renderQuantity',
      'renderCost',
      'renderStructure',
      'renderVendor',
      'renderAmount',
      'lowestAmountRender'
    );
  }

  componentDidMount() {
    if (this.props.isCreatedFromMaterials && this.props.handleMaterialsByAmount) {
      this.lowestAmountRender();
    }
  }

  actions(e, publicCompoundLinkId) {
    e.stopPropagation();
    this.props.onCompoundClick(publicCompoundLinkId);
  }

  lowestAmountRender() {
    this.props.data.forEach(material => {
      const amountData = this.materialAmountOptions(material);
      setTimeout(() => {
        this.props.handleMaterialsByAmount(amountData[0].value, material.get('id'), material.get('material_id'));
      });
    });
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

  buildAmount(orderableMaterial) {
    const orderableMaterialComponent = orderableMaterial.getIn(['orderable_material_components', 0]);
    const volumeUl = _.toNumber(orderableMaterialComponent.get('volume_per_container'));
    const massMg = _.toNumber(orderableMaterialComponent.get('mass_per_container'));
    const unit = (volumeUl || !massMg) ? 'µL' : 'mg';
    const amount = (volumeUl || !massMg) ? volumeUl : massMg;
    return `${amount}${unit}`;
  }

  materialAmountOptions(material) {
    const amountOptions = [];
    const materialFromStore = MaterialStore.getById(material.get('material_id'));
    materialFromStore.get('orderable_materials').forEach((orderableMaterial) => {
      amountOptions.push({ name: this.buildAmount(orderableMaterial), value: orderableMaterial.get('id') });
    });
    const sortOptionsByAmount = amountOptions.sort((a, b) => Number(a.name.slice(0, -2)) - Number(b.name.slice(0, -2)));
    return sortOptionsByAmount;
  }

  validateCount(count) {
    if (_.isEmpty(_.toString(count))) {
      return 'Required';
    }
    return _.toNumber(count) > 0 ? '' : 'Must be greater than 0';
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
    const price = material.getIn(['orderable_materials', 0,  'price']);
    const count = material.getIn(['orderable_materials', 0, 'count']);
    return price ? `$${Number(price * count).toFixed(2)}` : '-';
  }

  renderStructure(material) {
    const compoundLink = material.getIn(['material_components', 0, 'resource', 'compound', 'model']);
    const smiles = compoundLink && compoundLink.get('smiles');
    let publicCompoundLinkId;
    if (compoundLink && compoundLink.get('organization_id') === null) {
      publicCompoundLinkId = compoundLink.get('id');
    }
    const { onCompoundClick } = this.props;
    return (
      <div
        className={classNames('material-order-items__molecule', { 'material-order-items__molecule--clickable': onCompoundClick })}
        onClick={(e) => onCompoundClick && this.actions(e, publicCompoundLinkId)}
      >
        <Molecule SMILES={smiles} size="tiny" />
      </div>
    );
  }

  renderVendor(material) {
    return material.get('vendor_name') || material.getIn(['vendor', 'name']);
  }

  renderAmount(material, index) {
    let amounts = [];
    if (this.props.isCreatedFromMaterials) {
      amounts = this.materialAmountOptions(material);
    }
    const name = material.get('id');

    return (this.props.isCreatedFromMaterials && amounts.length > 0 ?
      (
        <Select
          name={name}
          options={amounts}
          value={name}
          onChange={(e) => { this.props.handleMaterialsByAmount(e.target.value, material.get('id'), material.get('material_id'), index); }}
        />
      ) :
      this.buildAmount(material.getIn(['orderable_materials', 0]))
    );
  }

  renderTotalCost(materials) {
    const totalCost = materials.reduce((acc, material) => {
      const price = material.getIn(['orderable_materials', 0,  'price'], 0);
      const count = material.getIn(['orderable_materials', 0, 'count'], 0);
      return acc + parseFloat((price * count));
    }, 0);
    return (
      <div className="material-order-items__footer">
        <p className="material-order-items__footer-item">{`Total: $${Number(totalCost).toFixed(2)}`}</p>
      </div>
    );
  }

  render() {
    const { data } = this.props;
    const columns = [
      <Column
        renderCellContent={this.renderStructure}
        header="structure"
        id="smiles"
        key="smiles"
      />,
      <Column
        renderCellContent={this.renderName}
        header="name"
        id="name"
        key="name"
      />,
      <Column
        renderCellContent={this.renderVendor}
        header="vendor"
        id="vendor"
        key="vendor"
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
        renderCellContent={this.renderAmount}
        header="amount"
        id="amount"
        key="amount"
      />,
      <Column
        renderCellContent={this.renderCost}
        header="cost"
        id="cost"
        key="cost"
      />
    ];

    return (
      data.size > 0 && (
      <div>
        <List
          id="material-orders-group-items"
          tallRows
          loaded
          disableCard
          data={Immutable.Iterable(data)}
          selected={this.getSelectedRows()}
          onSelectRow={(_records, _willBeChecked, selectedRows) => this.props.onSelectRow(selectedRows)}
          onSelectAll={(selectedRows) => this.props.onSelectRow(selectedRows)}
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

MaterialOrderIndividualItems.propTypes = {
  onSelectRow: PropTypes.func,
  data: PropTypes.instanceOf(Immutable.List),
  selected: PropTypes.arrayOf(PropTypes.string),
  disableSelection: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  forceValidation: PropTypes.bool
};

export default MaterialOrderIndividualItems;
