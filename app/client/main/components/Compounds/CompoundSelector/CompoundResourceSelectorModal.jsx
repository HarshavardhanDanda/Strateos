import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { MultiStepModalWrapper, MultiStepModalPane } from 'main/components/Modal';
import CompoundSelector from 'main/components/Compounds/CompoundSelector';
import ResourceStore from 'main/stores/ResourceStore';
import CompoundStore from 'main/stores/CompoundStore';
import { ButtonGroup, Button } from '@transcriptic/amino';
import ModalActions from 'main/actions/ModalActions';
import ResourceSelector from 'main/components/Resources/ResourceSelector/ResourceSelector';
import { CompoundSelectorPublicModalState, CompoundSelectorPublicOnlyDefaults } from 'main/pages/CompoundsPage/CompoundsState';
import { CompoundSelectorPublicModalActions } from 'main/pages/CompoundsPage/CompoundsActions';
import { ResourceSelectorModalState, ResourceSelectorModalDefaults } from 'main/pages/ResourcesPage/ResourcesState';
import { ResourceSelectorModalActions } from 'main/pages/ResourcesPage/ResourcesSearchActions';
import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';
import CompoundDetail from '../CompoundSelector/CompoundDetail';
import CompoundStructureSearch from '../CompoundSelector/CompoundStructureSearch';
import { DrawPane, SpecifyPane } from '../CompoundRegistration';

class CompoundResourceSelectorModal extends React.Component {
  static get MODAL_ID() {
    return 'CompoundResourceSelectorModal';
  }

  constructor(props) {
    super(props);
    this.state = { drawerOpen: false, compoundBtnDisabled: true, resourceBtnDisabled: true, currPaneIndex: 0 };
    _.bindAll(
      this,
      'closeDrawer',
      'onStructureSearchClick',
      'onRowClick',
      'onCompoundSelectRow',
      'onResourceSelectRow',
      'onNavigateNext',
      'beforeDismiss',
      'onRegisterClick',
      'onUseCompound'
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
    this.setState({ compoundBtnDisabled: _.size(_.keys(selectedRows)) !== 1 });
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
      drawerOpen: true,
      drawerChildren: <CompoundStructureSearch
        onCancel={this.closeDrawer}
        SMILES={smiles}
        onSearch={(SMILES) => this.onSearch(SMILES, callback)}
      />,
      drawerTitle: 'Search by Chemical Structure'
    });
  }

  beforeDismiss() {
    this.setState({ compoundBtnDisabled: true, resourceBtnDisabled: true });
    CompoundSelectorPublicModalActions.updateState({ ...CompoundSelectorPublicOnlyDefaults, selected: [] });
    ResourceSelectorModalActions.updateState({ ...ResourceSelectorModalDefaults, selected: [] });
  }

  onNavigateNext() {
    const { selected } = ResourceSelectorModalState.get();
    let resource = ResourceStore.getById(selected[0]);
    const compound = CompoundStore.getById(this.selectedCompound());
    resource = resource.setIn(['compound', 'name'], compound.get('name'));
    this.props.onSelectedResource(resource);
    this.beforeDismiss();
    ModalActions.close(CompoundResourceSelectorModal.MODAL_ID);
  }

  onResourceSelectRow(selectedRows) {
    this.setState({ resourceBtnDisabled: _.size(_.keys(selectedRows)) !== 1 });
  }

  selectedCompound() {
    const { selected } = CompoundSelectorPublicModalState.get();
    return selected[0];
  }

  onUseCompound(compoundId) {
    CompoundSelectorPublicModalActions.updateState({
      selected: [compoundId]
    });
    const compound = CompoundStore.getById(compoundId);
    this.setState({ drawerOpen: false, currPaneIndex: 1, selectedCompound: compound });
  }

  onRegisterClick() {
    this.setState({
      isMulti: true,
      drawerOpen: true,
      drawerChildren: this.renderCompoundRegistration(),
      drawerTitle: 'Register Compound',
      drawerPaneTitles: Immutable.List(['Draw', 'Specify'])
    });
    CompoundSelectorPublicModalActions.updateState({ selected: [] });
  }

  renderCompoundRegistration(compoundId, compoundExists, compoundSource) {
    const searchOptions = new Immutable.Map({ ...CompoundSelectorPublicModalActions.searchOptions() });
    const smileString = searchOptions.get('searchSimilarity');
    return [
      (<DrawPane
        key="draw-pane"
        setCompound={(compoundId, compoundExists, compoundSource) => {
          this.setState({
            isMulti: true,
            drawerOpen: true,
            drawerChildren: this.renderCompoundRegistration(compoundId, compoundExists, compoundSource),
            drawerTitle: 'Register Compound',
            drawerPaneTitles: Immutable.List(['Draw', 'Specify'])
          });
        }}
        isPublicCompound
        data={Immutable.fromJS({
          smiles: smileString
        })}
      />),
      (<SpecifyPane
        key="specify-pane"
        compoundId={compoundId}
        compoundExists={compoundExists}
        compoundSource={compoundSource}
        isPublicCompound
        data={Immutable.fromJS({
          onUseCompound: this.onUseCompound
        })}
      />)
    ];
  }

  render() {
    const canRegisterPublicCompound = FeatureStore.hasFeature(FeatureConstants.REGISTER_PUBLIC_COMPOUND);
    return (
      <MultiStepModalWrapper
        paneTitles={Immutable.List(['Select Compound', 'Select Resource'])}
        title="Material Creation"
        modalId={CompoundResourceSelectorModal.MODAL_ID}
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
          nextBtnDisabled={(this.props.isSingleSelect && this.state.compoundBtnDisabled)}
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
            hasResources
            wideSidebar
          />
        </MultiStepModalPane>
        <MultiStepModalPane
          key="Resource Selector"
          nextBtnName="Select"
          showBackButton={false}
          beforeNavigateNext={this.onNavigateNext}
          nextBtnDisabled={(this.props.isSingleSelect && this.state.resourceBtnDisabled)}
        >
          <ResourceSelector
            onSelectRow={this.onResourceSelectRow}
            compoundLinkId={this.selectedCompound()}
            disableCard
          />
        </MultiStepModalPane>
      </MultiStepModalWrapper>
    );
  }
}

CompoundResourceSelectorModal.propTypes = {
  onSelectedResource: PropTypes.func,
  isSingleSelect: PropTypes.bool,
  hideActions: PropTypes.bool
};

export default CompoundResourceSelectorModal;
