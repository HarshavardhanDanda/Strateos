import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Immutable from 'immutable';

import { SinglePaneModal } from 'main/components/Modal';
import ModalActions from 'main/actions/ModalActions';
import MaterialStore from 'main/stores/MaterialStore';
import { MaterialsSelectorModalState, MaterialsSelectorModalDefaults } from 'main/pages/MaterialsPage/MaterialsState';
import { MaterialsSelectorModalActions } from 'main/pages/MaterialsPage/MaterialsActions';
import MaterialsSelector from 'main/pages/MaterialsPage/MaterialSelector/index';

class MaterialsSelectorModal extends React.Component {
  static get MODAL_ID() {
    return 'SEARCH_MATERIAL_MODAL';
  }

  constructor(props) {
    super(props);
    this.state = { disabled: true };

    _.bindAll(
      this,
      'onMaterialSelected',
      'onSelectRow',
      'beforeDismiss'
    );
  }

  beforeDismiss() {
    this.setState({ disabled: true });
    MaterialsSelectorModalActions.updateState({ ...MaterialsSelectorModalDefaults, selected: [] });
  }

  onSelectRow(selectedRows) {
    this.setState({ disabled: _.size(_.keys(selectedRows)) === 0 }, () => {
      if (this.props.isSingleSelect && !this.state.disabled) {
        this.onMaterialSelected();
      }
    });
  }

  onMaterialSelected() {
    const { selected: selectedIds } = MaterialsSelectorModalState.get();
    const selected = [];
    const materials = MaterialStore.getAll();

    // TODO: figure out an optimised way to do this by using OrderableMaterialStore instead
    selectedIds.forEach((id) => {
      materials.forEach(material => {
        material.get('orderable_materials').forEach(orderableMaterial => {
          if (orderableMaterial.get('id') === id) {
            selected.push(material
              .set('orderable_materials', Immutable.List([orderableMaterial]))
              .set('material_id', material.get('id'))
              .set('id', orderableMaterial.get('id'))
              .set('type', orderableMaterial.get('type'))
            );
          }
        });
      });
    });
    this.props.onMaterialSelected(selectedIds, Immutable.fromJS(selected));
    this.beforeDismiss();
    ModalActions.close(MaterialsSelectorModal.MODAL_ID);
  }

  render() {
    return (
      <SinglePaneModal
        modalId={MaterialsSelectorModal.MODAL_ID}
        title={this.props.title}
        renderFooter={!this.props.isSingleSelect}
        acceptText="Select"
        onAccept={this.onMaterialSelected}
        acceptBtnDisabled={this.state.disabled}
        beforeDismiss={this.beforeDismiss}
        modalSize="xlg"
      >
        <MaterialsSelector
          onSelectRow={this.onSelectRow}
          wideSidebar
          disableCard
        />
      </SinglePaneModal>
    );
  }
}

MaterialsSelectorModal.propTypes = {
  onMaterialSelected: PropTypes.func.isRequired,
  title: PropTypes.string,
  isSingleSelect: PropTypes.bool
};

MaterialsSelectorModal.defaultProps = {
  title: 'Select group materials',
  isSingleSelect: false
};

export default MaterialsSelectorModal;
