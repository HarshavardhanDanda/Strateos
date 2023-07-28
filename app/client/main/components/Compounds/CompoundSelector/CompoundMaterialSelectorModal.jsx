import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { ButtonGroup, Button } from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';

import { MultiStepModalWrapper, MultiStepModalPane } from 'main/components/Modal';
import CompoundSelector from 'main/components/Compounds/CompoundSelector';
import ModalActions from 'main/actions/ModalActions';
import { CompoundSelectorPublicModalState } from 'main/pages/CompoundsPage/CompoundsState';
import { CompoundSelectorPublicModalActions } from 'main/pages/CompoundsPage/CompoundsActions';
import MaterialsSelector from 'main/pages/MaterialsPage/MaterialSelector';
import VendorCatalogSelector from 'main/pages/MaterialsPage/VendorCatalogSelector';
import { MaterialsSelectorModalState } from 'main/pages/MaterialsPage/MaterialsState';
import { VendorCatalogPageState } from 'main/pages/MaterialsPage/VendorCatalogSelector/VendorCatalogState';
import { MaterialsSelectorModalActions } from 'main/pages/MaterialsPage/MaterialsActions';
import { VendorCatalogPageActions } from 'main/pages/MaterialsPage/VendorCatalogSelector/VendorCatalogActions';
import MaterialStore from 'main/stores/MaterialStore';
import VendorCatalogStore from 'main/stores/VendorCatalogStore';
import CompoundStore from 'main/stores/CompoundStore';
import FeatureStore from 'main/stores/FeatureStore';
import CompoundDetail from '../CompoundSelector/CompoundDetail';
import CompoundStructureSearch from '../CompoundSelector/CompoundStructureSearch';
import { DrawPane, SpecifyPane } from '../CompoundRegistration';

class CompoundMaterialSelectorModal extends React.Component {
  static get MODAL_ID() {
    return 'CompoundMaterialSelectorModal';
  }

  constructor(props) {
    super(props);
    this.state = { drawerOpen: false, compoundBtnDisabled: true, materialBtnDisabled: true, currPaneIndex: 0, source: 'strateos' };
    _.bindAll(
      this,
      'closeDrawer',
      'onStructureSearchClick',
      'onRowClick',
      'onCompoundSelectRow',
      'onSelectRow',
      'beforeDismiss',
      'onRegisterClick',
      'onUseCompound',
      'onMaterialSelected',
      'clearMaterialSelection',
      'onSelectSource'
    );
  }

  onRowClick(compound) {
    this.setState({
      isMulti: false,
      drawerOpen: true,
      drawerChildren: <CompoundDetail
        compound={compound}
        onBack={this.closeDrawer}
      />,
      drawerTitle: 'Compound Details',
      drawerFooterChildren:
  <ButtonGroup>
    <Button
      type="primary"
      link
      onClick={this.closeDrawer}
    >
      Cancel
    </Button>
  </ButtonGroup>
    });
  }

  onCompoundSelectRow(selectedRows) {
    const selected = _.keys(selectedRows);
    const compound = CompoundStore.getById(selected[0]);
    this.setState({ compoundBtnDisabled: _.size(selected) !== 1, selectedCompound: compound });
  }

  onUseCompound(compoundId) {
    CompoundSelectorPublicModalActions.updateState({
      selected: [compoundId]
    });
    const compound = CompoundStore.getById(compoundId);
    this.setState({ drawerOpen: false, currPaneIndex: 1, selectedCompound: compound });
  }

  onSearch(smiles, callback) {
    this.closeDrawer();
    callback(smiles);
  }

  closeDrawer() {
    this.setState({ drawerOpen: false });
  }

  onStructureSearchClick(smiles, callback) {
    this.setState({
      isMulti: false,
      drawerOpen: true,
      drawerChildren: <CompoundStructureSearch
        onCancel={this.closeDrawer}
        SMILES={smiles}
        onSearch={(SMILES) => this.onSearch(SMILES, callback)}
      />,
      drawerTitle: 'Search by Chemical Structure'
    });
  }

  onStrateosMaterialSelected() {
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
    this.props.onMaterialSelected(selectedIds, Immutable.fromJS(selected), this.state.source);
    MaterialsSelectorModalActions.updateState({ selected: [] });
  }

  onEmoleculesVendorSelected() {
    const { selected: selectedIds } = VendorCatalogPageState.get();
    const selected = [];
    selectedIds.forEach((id) => {
      const materials = VendorCatalogStore.getById(id);
      if (materials) {
        selected.push(materials);
      }
    });
    this.props.onMaterialSelected(selectedIds, selected, this.state.source, this.state.selectedCompound);
    VendorCatalogPageActions.updateState({ selected: [] });
  }

  onMaterialSelected() {
    switch (this.state.source) {
      case 'emolecules':
        this.onEmoleculesVendorSelected();
        break;
      default:
        this.onStrateosMaterialSelected();
    }
    this.beforeDismiss();
    ModalActions.close(CompoundMaterialSelectorModal.MODAL_ID);
  }

  clearMaterialSelection(back) {
    switch (this.state.source) {
      case 'emolecules':
        VendorCatalogPageActions.updateState({ selected: [] });
        break;
      default:
        MaterialsSelectorModalActions.updateState({ selected: [] });
    }
    back();
  }

  beforeDismiss() {
    this.setState({ compoundBtnDisabled: true, materialBtnDisabled: true });
    CompoundSelectorPublicModalActions.updateState({ selected: [] });
  }

  onSelectRow(selectedRows) {
    this.setState({ materialBtnDisabled: _.size(_.keys(selectedRows)) < 1 });
  }

  selectedCompound() {
    const { selected } = CompoundSelectorPublicModalState.get();
    return selected[0];
  }

  onSelectSource(source) {
    this.setState({ source });
  }

  onRegisterClick() {
    this.setState({
      isMulti: true,
      drawerOpen: true,
      drawerChildren: this.renderPublicCompoundRegistration(),
      drawerTitle: 'Register Compound',
      drawerPaneTitles: Immutable.List(['Draw', 'Specify'])
    });
    CompoundSelectorPublicModalActions.updateState({ selected: [] });
  }

  renderPublicCompoundRegistration(compoundId, compoundExists, compoundSource) {
    const searchOptions = new Immutable.Map({ ...CompoundSelectorPublicModalActions.searchOptions() });
    const smileString = searchOptions.get('searchSimilarity');
    return [
      (<DrawPane
        key="draw-pane"
        setCompound={(compoundId, compoundExists, compoundSource) => {
          this.setState({
            isMulti: true,
            drawerOpen: true,
            drawerChildren: this.renderPublicCompoundRegistration(compoundId, compoundExists, compoundSource),
            drawerTitle: 'Register Compound',
            drawerPaneTitles: Immutable.List(['Draw', 'Specify'])
          });
        }}
        isPublicCompound
        data={Immutable.fromJS({
          smiles: smileString
        })}
      />),
      compoundId && (
      <SpecifyPane
        key="specify-pane"
        compoundId={compoundId}
        compoundExists={compoundExists}
        compoundSource={compoundSource}
        data={Immutable.fromJS({
          onUseCompound: this.onUseCompound
        })}
        isPublicCompound
      />
      )
    ];
  }

  renderMaterialsSelector() {
    return (
      <MaterialsSelector
        onSelectRow={this.onSelectRow}
        compoundId={this.selectedCompound()}
        onSelectSource={this.onSelectSource}
        wideSidebar
        disableCard
      />
    );
  }

  renderVendorCatalogSelector() {
    return (
      <VendorCatalogSelector
        onSelectRow={this.onSelectRow}
        compoundId={this.selectedCompound()}
        onSelectSource={this.onSelectSource}
        wideSidebar
        disableCard
      />
    );
  }

  renderSourceSelector() {
    switch (this.state.source) {
      case 'emolecules':
        return this.renderVendorCatalogSelector();
      default:
        return this.renderMaterialsSelector();
    }
  }

  render() {
    const canRegisterPublicCompound = FeatureStore.hasFeature(FeatureConstants.REGISTER_PUBLIC_COMPOUND);
    return (
      <MultiStepModalWrapper
        paneTitles={Immutable.List(['Select Compound', 'Select Material'])}
        title="Order Creation"
        modalId={CompoundMaterialSelectorModal.MODAL_ID}
        modalSize="xlg"
        currPaneIndex={this.state.currPaneIndex}
        paneIndexReporter={(i) => { this.setState({ currPaneIndex: i }); }}
        hasDrawer
        drawerPaneTitles={this.state.drawerPaneTitles}
        drawerState={this.state.drawerOpen}
        drawerTitle={this.state.drawerTitle}
        drawerChildren={this.state.drawerChildren}
        onDrawerClose={this.closeDrawer}
        beforeDismiss={this.beforeDismiss}
        drawerFooterChildren={this.state.drawerFooterChildren}
        isMulti={this.state.isMulti}
      >
        <MultiStepModalPane
          key="Select Compounds"
          showBackButton={false}
          nextBtnName="Continue"
          nextBtnDisabled={(this.state.compoundBtnDisabled)}
        >
          <CompoundSelector
            onStructureSearchClick={this.onStructureSearchClick}
            allowCompoundRegistration={canRegisterPublicCompound}
            onRowClick={this.onRowClick}
            onSelectRow={this.onCompoundSelectRow}
            onRegisterClick={this.onRegisterClick}
            hideActions={this.props.hideActions}
            showSource={false}
            onUseCompound={this.onUseCompound}
            searchByPublicCompounds
            wideSidebar
          />
        </MultiStepModalPane>
        <MultiStepModalPane
          key="Material Selector"
          nextBtnName="Select"
          showBackButton
          beforeNavigateBack={this.clearMaterialSelection}
          beforeNavigateNext={this.onMaterialSelected}
          nextBtnDisabled={(this.state.materialBtnDisabled)}
        >
          {this.renderSourceSelector()}
        </MultiStepModalPane>
      </MultiStepModalWrapper>
    );
  }
}

CompoundMaterialSelectorModal.propTypes = {
  onMaterialSelected: PropTypes.func,
  hideActions: PropTypes.bool
};

export default CompoundMaterialSelectorModal;
