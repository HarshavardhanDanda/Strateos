import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Divider, Table, Column, Button, Molecule } from '@transcriptic/amino';
import Immutable from 'immutable';
import './MaterialComponent.scss';
import ModalActions from 'main/actions/ModalActions';
import CompoundSourceSelectorModal from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceSelectorModal';
import _ from 'lodash';
import * as UnitUtil from 'main/util/unit';
import ExpandedTableMaterial from './ExpandedTableMaterial';
import isValueUnitValid from './ReactantTable';

function MaterialComponent(props) {
  const [isExpanded, setExpanded] = useState(props.materials.reduce((obj, material) => ({ ...obj, [material.id]: false }), {}));
  const [updatedMaterialId, setUpdatedMaterialId] = useState(null);

  const expandedRow = (material) => {
    // this is throwing a warning: Invalid prop supplied, expected a ReactNode. This is because in amino, this props
    // is set as PropTypes.node which expects anything that can be rendered: numbers, strings, elements or an array
    // (or fragment) containing these types. Wrapping with React.Fragment doesn't solve the warning

    return (
      <div className="material-component__expanded-table">
        <ExpandedTableMaterial
          material={[material]}
          source={getSource(material)}
        />
      </div>
    );
  };

  const structure = (material) => {
    return <div className="material-component__molecule"><Molecule SMILES={material.get('compound').get('smiles')} /></div>;
  };

  const materialName = (material) => {
    return material.getIn(['compound', 'name']);
  };

  const quantity = (material) => {
    const materialQuantity = getQuantity(material);
    if (!materialQuantity) {
      return undefined;
    }
    const [value, unit] = Array.from(materialQuantity.split(/:/));
    return `${parseFloat(value).toFixed(2)} ${unit}`;
  };

  const getQuantityInDefaultUnits = (material) => {
    let materialQuantity = getQuantity(material);
    if (!materialQuantity) {
      return undefined;
    }
    materialQuantity = UnitUtil.convertUnitShorthandToName(materialQuantity);
    const phase = material.get('phase');
    if (phase === 'liquid') {
      return UnitUtil.toScalar(materialQuantity, 'microliter');
    } else if (phase === 'solid') {
      return UnitUtil.toScalar(materialQuantity, 'milligram');
    }
  };

  const getQuantity = (material) => {
    if (material.get('phase') === 'liquid') {
      if (!isValueUnitValid(material.get('sampleVolume'))) {
        return undefined;
      }
      return material.get('sampleVolume');
    }
    if (!isValueUnitValid(material.get('sampleMass'))) {
      return undefined;
    }
    return material.get('sampleMass');
  };

  // todo: update function when purity is included in the data
  const purity = (material) => {
    return material.get('purity') ? material.get('purity') : 'N/A';
  };

  const getSource = (material) => {
    const source = material.get('source');
    if (source === null) {
      return 'N/A';
    } else if (source.get('type') === 'CONTAINER') {
      return 'User Inventory';
    } else if (source.get('type') === 'MATERIAL') {
      if (source.getIn(['value', 'attributes', 'vendor']) === 'eMolecules') {
        return 'eMolecules';
      }
    } else if (source.get('type') === 'RESOURCE') {
      return 'Strateos';
    }
    return 'N/A';
  };

  const availability = (material) => {
    const source = getSource(material);
    if (source === 'eMolecules') {
      return material.getIn(['source', 'value', 'attributes', 'tier']);
    } else if (source === 'N/A') {
      return 'N/A';
    } else {
      return 'Immediate';
    }
  };

  const modalSourceType = (sourceType) => {
    if (sourceType === 'User Inventory') {
      return 'user_inventory';
    } else if (sourceType === 'Strateos') {
      return 'strateos';
    }
    return 'e_molecules';
  };

  const onUpdateBtnClick = (material) => {
    const materialToUpdate = material.get('id');
    setUpdatedMaterialId(materialToUpdate);
    const compound = getCompound(material);
    ModalActions.openWithData('SEARCH_COMPOUND_LINKED_CONTAINER_MODAL', { source: modalSourceType(getSource(material)), compound: compound.toJS(), labId: props.labId, originalCompound: material.get('originalCompound') });
  };

  const getCompound = (material) => {
    let compound = material.get('compound');
    const phase = material.get('phase');
    if (phase === 'liquid') {
      compound = compound.set('volume', getQuantityInDefaultUnits(material));
    } else if (phase === 'solid') {
      compound = compound.set('mass', getQuantityInDefaultUnits(material));
    }
    return compound;
  };

  const materialButton = (material) => {
    return (
      <div>
        { material.get('source') === null ? (
          <Button type="action" size="small" height="short" onClick={() => onUpdateBtnClick(material)}>
            Resolve
          </Button>
        ) : (
          <Button type="secondary" size="small" height="short" onClick={() => onUpdateBtnClick(material)}>
            Update
          </Button>
        )}
      </div>
    );
  };

  const disableExpandRow = (material) => {
    return getSource(material) === 'N/A';
  };

  const updateSourceDetail = (sourceData) => {
    let updatedMaterial = _.find(props.materials, r => r.id === updatedMaterialId);
    updatedMaterial = { ...updatedMaterial, source: sourceData };
    const immutableMaterial = Immutable.fromJS(updatedMaterial);
    if (sourceData.type === 'MATERIAL') {
      _.set(updatedMaterial, ['compound', 'smiles'], immutableMaterial.getIn(['source', 'value', 'attributes', 'smiles']));
    } else {
      _.set(updatedMaterial,  ['compound', 'smiles'], immutableMaterial.getIn(['originalCompound', 'smiles']));
    }
    props.updateReactants(updatedMaterial);
  };

  return (
    <div>
      <Card className="material-component__card">
        <h2 className="material-component__title">Materials</h2>
        <div className="material-component__divider">
          <Divider slim size="small" />
        </div>
        <Table
          id="material-table"
          data={Immutable.fromJS(props.materials.filter(reactant => !reactant.additionalProperties.pin))}
          disabledSelection
          loaded
          expanded={isExpanded}
          selected={isExpanded}
          disableExpandRow={disableExpandRow}
          onExpandRow={(_record, _willBeExpanded, expanded) => setExpanded(expanded)}
          renderExpandedRow={expandedRow}
        >
          <Column renderCellContent={structure} header="Structure" id="material-structure" />
          <Column renderCellContent={materialName} header="Name" id="material-name" />
          <Column sortable renderCellContent={quantity} header="Quantity" id="material-quantity" />
          <Column renderCellContent={purity} header="Purity" id="material-purity" />
          <Column renderCellContent={getSource} header="Source" id="material-source" />
          <Column sortable renderCellContent={availability} header="Availability" id="material-availability" />
          <If condition={!props.disableUpdateColumn}>
            <Column renderCellContent={materialButton} id="material-button" />
          </If>
        </Table>
      </Card>
      <CompoundSourceSelectorModal
        title={'Available Materials'}
        onSourceSelected={updateSourceDetail}
        reactionId={props.reactionId}
        reactantId={updatedMaterialId}
      />
    </div>
  );
}

MaterialComponent.defaultProps = {
  disableUpdateColumn: false
};

MaterialComponent.propTypes = {
  materials: PropTypes.array.isRequired,
  updateReactants: PropTypes.func.isRequired,
  disableUpdateColumn: PropTypes.bool
};

export default MaterialComponent;
