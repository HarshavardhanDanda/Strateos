import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { SinglePaneModal } from 'main/components/Modal';
import ModalActions from 'main/actions/ModalActions';
import CompoundSelector from 'main/components/Compounds/CompoundSelector';
import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';
import { CompoundSelectorModalState, CompoundSelectorPublicModalState, CompoundSelectorModalDefaults, CompoundSelectorPublicOnlyDefaults } from 'main/pages/CompoundsPage/CompoundsState';
import { CompoundSelectorModalActions, CompoundSelectorPublicModalActions } from 'main/pages/CompoundsPage/CompoundsActions';
import { ButtonGroup, Button } from '@transcriptic/amino';
import Immutable from 'immutable';
import CompoundDetail from '../CompoundSelector/CompoundDetail';
import CompoundStructureSearch from '../CompoundSelector/CompoundStructureSearch';
import CompoundRegistrationModal from '../CompoundRegistration/CompoundRegistrationModal';
import { DrawPane, SpecifyPane } from '../CompoundRegistration';

class CompoundSelectorModal extends React.Component {

  static get MODAL_ID() {
    return 'SEARCH_COMPOUND_MODAL';
  }

  constructor(props) {
    super(props);
    this.state = {
      drawerOpen: false,
      disabled: true,
      compoundId: undefined,
      compoundExists: undefined,
      compoundSource: undefined,
      isMulti: false,
      isPublicCompound: false,
      disableToggle: false
    };
    _.bindAll(
      this,
      'closeDrawer',
      'onStructureSearchClick',
      'onCompoundsSelected',
      'onRowClick',
      'onUseCompound',
      'onSelect',
      'onSearch',
      'onSelectRow',
      'onTogglePublicCompound',
      'beforeDismiss',
      'onRegisterClick'
    );

  }

  componentDidMount() {
    if (!FeatureStore.hasFeature(FeatureConstants.REGISTER_COMPOUND) && !this.state.isPublicCompound) {
      FeatureStore.hasFeature(FeatureConstants.REGISTER_PUBLIC_COMPOUND) && this.setState({ isPublicCompound: true, disableToggle: true });
    }
  }

  onSearch(SMILES, callback) {
    this.closeDrawer();
    callback(SMILES);
  }

  onSelect(callback) {
    callback();
    this.onCompoundsSelected();
    this.beforeDismiss();
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

  onRowClick(compound, selected, callback) {
    const id = compound.get('id');
    const isNotSelected = selected.indexOf(id) === -1;

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
      Back
    </Button>
    <Button
      type="primary"
      size="small"
      disabled={!isNotSelected}
      onClick={() => this.onSelect(callback)}
    >
      Select
    </Button>
  </ButtonGroup>
    });
  }

  closeDrawer() {
    this.setState({ drawerOpen: false });
  }

  beforeDismiss() {
    this.setState({ disabled: true });
    this.closeDrawer();

    const selectorModalDefaults = this.props.searchByPublicCompounds ? CompoundSelectorPublicOnlyDefaults : CompoundSelectorModalDefaults;
    const actions = this.props.searchByPublicCompounds ? CompoundSelectorPublicModalActions : CompoundSelectorModalActions;

    actions.updateState({ ...selectorModalDefaults, selected: [] });
  }

  onTogglePublicCompound() {
    this.setState({
      isPublicCompound: !this.state.isPublicCompound,
    }, () => {
      this.setState({ drawerChildren: this.renderCompoundRegistration() });
    });
  }

  onSelectRow(selectedRows) {
    this.setState({ disabled: _.size(_.keys(selectedRows)) === 0 }, () => {
      if (this.props.isSingleSelect && !this.state.disabled) {
        this.onCompoundsSelected();
      }
    });
  }

  onCompoundsSelected() {
    const { selected } = this.props.searchByPublicCompounds ? CompoundSelectorPublicModalState.get() :  CompoundSelectorModalState.get();
    this.props.onCompoundsSelected(selected);
    if (this.props.isSingleSelect) {
      this.beforeDismiss();
    }
    ModalActions.close(this.props.modalId || CompoundSelectorModal.MODAL_ID);
  }

  onUseCompound(compoundId) {
    const { selected } = this.props.searchByPublicCompounds ? CompoundSelectorPublicModalState.get() : CompoundSelectorModalState.get();
    this.props.onCompoundsSelected([...selected, compoundId]);
    ModalActions.close(CompoundRegistrationModal.MODAL_ID);
  }

  onRegisterClick() {
    this.setState({
      isMulti: true,
      drawerOpen: true,
      drawerChildren: this.renderCompoundRegistration(),
      drawerTitle: 'Register Compound',
      paneTitles: Immutable.List(['Draw', 'Specify'])
    });
  }

  renderCompoundRegistration(compoundId, compoundExists, compoundSource) {
    const searchOptions = new Immutable.Map({ ...CompoundSelectorModalActions.searchOptions() });
    const smileString = searchOptions.get('searchSimilarity');
    const canRegisterPublicCompound = FeatureStore.hasFeature(FeatureConstants.REGISTER_PUBLIC_COMPOUND);

    return [
      (<DrawPane
        key="draw-pane"
        setCompound={(compoundId, compoundExists, compoundSource) => {
          this.setState({
            isMulti: true,
            drawerOpen: true,
            drawerChildren: this.renderCompoundRegistration(compoundId, compoundExists, compoundSource),
            drawerTitle: 'Register Compound',
            paneTitles: Immutable.List(['Draw', 'Specify'])
          });
        }}
        data={Immutable.fromJS({
          smiles: smileString
        })}
        onTogglePublicCompound={canRegisterPublicCompound && this.onTogglePublicCompound}
        isPublicCompound={this.state.isPublicCompound}
        disableToggle={this.state.disableToggle}
      />),
      (<SpecifyPane
        key="specify-pane"
        compoundId={compoundId}
        compoundExists={compoundExists}
        compoundSource={compoundSource}
        data={Immutable.fromJS({
          onUseCompound: this.onUseCompound
        })}
        isPublicCompound={this.state.isPublicCompound}
      />)
    ];
  }

  render() {
    const { title, isSingleSelect } = this.props;

    return (
      <SinglePaneModal
        modalId={this.props.modalId || CompoundSelectorModal.MODAL_ID}
        title={title}
        renderFooter={!isSingleSelect}
        acceptText="Select"
        onAccept={this.onCompoundsSelected}
        acceptBtnDisabled={this.state.disabled}
        beforeDismiss={this.beforeDismiss}
        modalSize="xlg"
        hasDrawer
        isMulti={this.state.isMulti}
        drawerPaneTitles={this.state.paneTitles}
        drawerTitle={this.state.drawerTitle}
        drawerState={this.state.drawerOpen}
        onDrawerClose={this.closeDrawer}
        drawerChildren={this.state.drawerChildren}
        drawerFooterChildren={this.state.drawerFooterChildren}
      >
        <CompoundSelector
          onStructureSearchClick={this.onStructureSearchClick}
          onRowClick={this.onRowClick}
          onUseCompound={this.onUseCompound}
          onSelectRow={this.onSelectRow}
          onRegisterClick={this.onRegisterClick}
          allowCompoundRegistration={this.props.allowCompoundRegistration}
          persistSearchResultSelection={this.props.persistSearchResultSelection}
          showSource={!this.props.searchByPublicCompounds}
          hideActions={this.props.hideActions}
          searchByPublicCompounds={this.props.searchByPublicCompounds}
          searchPublicAndPrivateByOrgId={this.props.searchPublicAndPrivateByOrgId}
          disableOrgFilter={this.props.disableOrgFilter}
          wideSidebar
        />
      </SinglePaneModal>
    );
  }

}

CompoundSelectorModal.defaultProps = {
  hideActions: false,
  persistSearchResultSelection: true
};

CompoundSelectorModal.propTypes = {
  onCompoundsSelected: PropTypes.func,
  title: PropTypes.string.isRequired,
  isSingleSelect: PropTypes.bool,
  allowCompoundRegistration: PropTypes.bool,
  hideActions: PropTypes.bool,
  modalId: PropTypes.string,
  persistSearchResultSelection: PropTypes.bool,
  disableOrgFilter: PropTypes.bool
};

export default CompoundSelectorModal;
