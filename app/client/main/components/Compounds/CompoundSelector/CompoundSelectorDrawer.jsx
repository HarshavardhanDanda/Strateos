import React, { Component } from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import { CompoundSelectorPublicModalState, CompoundSelectorPublicOnlyDefaults } from 'main/pages/CompoundsPage/CompoundsState';
import CompoundSelector from 'main/components/Compounds/CompoundSelector';
import CompoundDetail from 'main/components/Compounds/CompoundSelector/CompoundDetail';
import { CompoundSelectorPublicModalActions } from 'main/pages/CompoundsPage/CompoundsActions';
import { Button, ButtonGroup, ModalDrawer } from '@transcriptic/amino';
import CompoundStore from 'main/stores/CompoundStore';
import SessionStore from 'main/stores/SessionStore';
import CompoundStructureSearch from 'main/components/Compounds/CompoundSelector/CompoundStructureSearch';

export class CompoundSelectorDrawer extends Component {

  constructor(props) {
    super(props);

    this.state = {
      detailsDrawerOpen: false,
      disabled: true,
      showDetails: false,
      showSearchStructure: false,
      selectedColumns: ['structure', 'nickname', 'formula', 'weight', 'Tpsa', 'C logp', 'creator']
    };

    this.onRowClick = this.onRowClick.bind(this);
    this.onSelectRow = this.onSelectRow.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.beforeDismiss = this.beforeDismiss.bind(this);
    this.onCompoundsSelected = this.onCompoundsSelected.bind(this);
    this.onStructureSearchClick = this.onStructureSearchClick.bind(this);
    this.clearState = _.debounce(this.clearState, 400).bind(this); /* for smooth closing and clearing state should require debounce */
  }

  onSelect(callback) {
    callback();
    this.onCompoundsSelected();
  }

  clearState() {
    this.setState({ disabled: true });
    CompoundSelectorPublicModalActions.updateState({ ...CompoundSelectorPublicOnlyDefaults, selected: [] });
  }

  beforeDismiss() {
    this.props.closeDrawer();
    this.clearState();
  }

  onCompoundsSelected() {
    const { selected } = CompoundSelectorPublicModalState.get();
    let compounds;
    if (this.props.isSingleSelect || selected.length === 1) {
      compounds = Immutable.fromJS(CompoundStore.getById(selected[0]));
    } else {
      compounds = Immutable.fromJS(CompoundStore.getByIds(selected));
    }
    if (compounds) {
      this.props.onCompoundSelected(compounds);
    }
    this.setState({ detailsDrawerOpen: false }, () => this.beforeDismiss());
  }

  onSelectRow(selectedRows) {
    this.setState({ disabled: _.size(selectedRows) === 0 }, () => {
      if (this.props.isSingleSelect && !this.state.disabled) {
        this.onCompoundsSelected();
      }
    });
  }

  onStructureSearchClick(smiles, callback) {
    this.setState({
      detailsDrawerOpen: true,
      smiles: smiles,
      structureSearchCallback: callback,
      drawerTitle: 'Search by Chemical Structure',
      showSearchStructure: true
    });
  }

  onSearch(SMILES, callback) {
    this.setState({ detailsDrawerOpen: false });
    callback(SMILES);
  }

  onRowClick(compound, selected, callback) {
    this.setState({
      detailsDrawerOpen: true,
      drawerTitle: 'Compound Details',
      compound: compound,
      rowClickCallback: callback,
      selected: selected,
      showDetails: true
    });
  }

  renderCompoundDetails() {
    const showInventory = SessionStore.getOrg() !== null;
    return (
      <div
        className="compound-selector-drawer__compound-details"
      >
        <CompoundDetail
          compound={this.state.compound}
          onBack={() => this.setState({ detailsDrawerOpen: false })}
          showInventory={showInventory}
        />
      </div>
    );
  }

  renderCompoundDetailsFooter() {
    const id = this.state.compound && this.state.compound.get('id');
    const isNotSelected = this.state.selected && this.state.selected.indexOf(id) === -1;
    return (
      <ButtonGroup>
        <Button
          type="primary"
          link
          onClick={() => this.setState({ detailsDrawerOpen: false })}
        >
          Back
        </Button>
        <Button
          type="primary"
          size="small"
          disabled={!isNotSelected}
          onClick={() => this.onSelect(this.state.rowClickCallback)}
        >
          Select
        </Button>
      </ButtonGroup>
    );
  }

  renderDrawer() {
    return (
      <Choose>
        <When condition={this.state.showDetails}>
          {this.renderCompoundDetails()}
        </When>
        <Otherwise>
          {this.renderStructureSearch()}
        </Otherwise>
      </Choose>
    );
  }

  renderCompoundSelector() {
    return (
      <CompoundSelector
        allowCompoundRegistration={false}
        onSelectRow={this.onSelectRow}
        onRowClick={this.onRowClick}
        onStructureSearchClick={this.onStructureSearchClick}
        visibleColumns={this.state.selectedColumns}
        handleColumnChange={(columns) => this.setState({ selectedColumns: columns })}
        className="compound-selector-drawer__compound-selector"
        isDrawer
        showSource={false}
        wideSidebar
        disableCard
        hideActions
        searchByPublicCompounds
      />
    );
  }

  renderCompoundSelectorFooter() {
    return (
      <ButtonGroup>
        <Button
          type="primary"
          link
          onClick={this.beforeDismiss}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          size="small"
          disabled={this.state.disabled}
          onClick={() => { this.onCompoundsSelected(); }}
        >
          Select
        </Button>
      </ButtonGroup>
    );
  }

  renderStructureSearch() {
    return (
      <CompoundStructureSearch
        onCancel={() => this.setState({ detailsDrawerOpen: false })}
        SMILES={this.state.smiles}
        onSearch={(SMILES) => this.onSearch(SMILES, this.state.structureSearchCallback)}
      />
    );
  }

  render() {
    return (
      <React.Fragment>
        <ModalDrawer
          title="Link compound"
          drawerState={this.props.open}
          onDrawerClose={this.beforeDismiss}
          drawerChildren={this.renderCompoundSelector()}
          drawerFooterChildren={!this.props.isSingleSelect ? this.renderCompoundSelectorFooter() : undefined}
        />
        <ModalDrawer
          title={this.state.drawerTitle}
          hasBackground={false}
          drawerState={this.state.detailsDrawerOpen}
          onDrawerClose={() => this.setState({ detailsDrawerOpen: false, showDetails: false, showSearchStructure: false })}
          drawerChildren={this.renderDrawer()}
          drawerFooterChildren={!this.props.isSingleSelect ? this.renderCompoundDetailsFooter() : undefined}
          style={{ zIndex: 1000, position: 'fixed' }}
          sideTransition
        />
      </React.Fragment>
    );
  }
}

export default CompoundSelectorDrawer;
