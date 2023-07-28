import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import PageWithSearchAndList from 'main/components/PageWithSearchAndList/PageWithSearchAndList';
import withPageWithSearchAndList from 'main/components/PageWithSearchAndList/PageWithSearchAndListHOC';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import CompoundStore from 'main/stores/CompoundStore';
import { CompoundSearchStore } from 'main/stores/search';
import Urls from 'main/util/urls';
import ModalActions from 'main/actions/ModalActions';
import UserActions from 'main/actions/UserActions';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import CompoundSearchFilters from 'main/pages/CompoundsPage/CompoundSearchFilters';
import CompoundSearchResults from 'main/pages/CompoundsPage/CompoundSearchResults';
import { CompoundRegistrationModal, CompoundDownloadModal } from 'main/components/Compounds';
import BulkCompoundRegistrationModal from 'main/components/Compounds/CompoundRegistration/BulkCompoundRegistrationModal';
import { CompoundsPageActions } from './CompoundsActions';
import { CompoundsPageState, CompoundsSearchDefaults } from './CompoundsState';
import StructureSearchModal from './StructureSearchModal';
import CompoundCreationDropDown from './CompoundCreationDropDown';

import './CompoundsPage.scss';

class CompoundsPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      downloadOption: {
        csv: false,
        sdf: false
      },
      isPublicCompound: false,
      disableToggle: false,
      libraries: {}
    };

    _.bindAll(this,
      'onDownloadClicked',
      'onModalDownloadClicked',
      'updateSelected',
      'onCompoundCreation',
      'onTogglePublicCompound',
      'loadCompoundRelations',
      'onDownloadOptionChange',
      'renderFilters',
      'renderSearchResults',
      'onSearchFilterReset'
    );
  }

  componentDidMount() {
    this.load();
  }

  findById(id) {
    return CompoundStore.getById(id);
  }

  load() {
    if (!this.props.actions.doSearch) {
      return;
    }
    const searchOptions = { ...this.props.searchOptions.toJS(), ...AcsControls.isFeatureEnabled(FeatureConstants.VIEW_LIBRARIES) && { includes: ['libraries'] } };
    this.props.actions.doSearch(searchOptions, this.props.onSearchFailed, (compounds) => {
      this.loadCompoundRelations(compounds);
      compounds.data.map((result) =>  UserActions.load(result.attributes.created_by));
    });

    if (!AcsControls.isFeatureEnabled(FeatureConstants.REGISTER_COMPOUND)) {
      AcsControls.isFeatureEnabled(FeatureConstants.REGISTER_PUBLIC_COMPOUND) && this.setState({ isPublicCompound: true, disableToggle: true });
    }
  }

  loadCompoundRelations(compounds) {
    const libraries = {};
    compounds.data.forEach((result) => {
      if (result.relationships && result.relationships.libraries && result.relationships.libraries.data.length > 0) {
        libraries[result.id] = result.relationships.libraries.data.map((record) => record.id);
      }
    });
    this.setState({
      libraries
    });
  }

  onCompoundCreation(data) {
    const currentCreatedCompounds = this.props.createdIds;
    const newCreatedCompounds = Immutable.fromJS(data)
      .get('compounds')
      .map(cmp => cmp.get('data'))
      .toMap()
      .mapKeys((k, compound) => compound.get('id'));

    this.props.actions.updateState({
      createdCompounds: currentCreatedCompounds.merge(newCreatedCompounds)
    });

    newCreatedCompounds.forEach(compound => {
      CompoundSearchStore.prependResult(compound, '');
    });
  }

  renderPrimaryInfo() {
    return (
      <CompoundCreationDropDown alignment="right" />
    );
  }

  onDownloadClicked() {
    ModalActions.open(CompoundDownloadModal.MODAL_ID);
  }

  onModalDownloadClicked() {
    const compoundIds = this.props.selected;
    CompoundsPageActions.downloadCompounds(this.state.downloadOption.csv, this.state.downloadOption.sdf, compoundIds);
    this.closeCompoundDownloadModal();
  }

  onSearchFilterReset() {
    this.props.onSearchFilterChange(Immutable.Map(this.props.zeroStateSearchOptions), this.loadCompoundRelations);
  }

  onSearchSimilarityChange(query, onSearchSucceeded) {
    this.props.actions.onSearchSimilarityChange(this.props.onSearchFailed, query, onSearchSucceeded);
  }

  drawStructure() {
    ModalActions.open(StructureSearchModal.MODAL_ID);
  }

  renderFilters() {
    const { searchOptions } = this.props;
    return (
      <div>
        <StructureSearchModal
          SMILES={searchOptions.get('searchSimilarity')}
          onSave={value => this.onSearchSimilarityChange(value, this.loadCompoundRelations)}
        />
        <CompoundSearchFilters
          searchOptions={searchOptions}
          showSource
          drawStructure={() => ModalActions.open(StructureSearchModal.MODAL_ID)}
          onSearchSimilarityChange={value => this.onSearchSimilarityChange(value, this.loadCompoundRelations)}
          onSearchFilterChange={options => this.props.onSearchFilterChange(options, this.loadCompoundRelations)}
          placeholder={this.searchPlaceholder()}
          onSearchInputChange={(query) => this.props.onSearchInputChange(query, this.loadCompoundRelations)}
          onSearchFilterReset={this.onSearchFilterReset}
        />
      </div>
    );
  }

  searchPlaceholder() {
    return ('Search by Name, Code, ID, or External System ID');
  }

  headerRow() {
    return '';
  }

  updateSelected(selectedRows) {
    this.props.actions.updateState({
      selected: Object.keys(selectedRows)
    });
  }

  getSelectedRows() {
    const selected = {};
    this.props.selected.forEach(element => {
      selected[element] = true;
    });
    return selected;
  }

  renderSearchResults() {
    const { searchOptions, isSearching, selected } = this.props;
    const records = this.props.search
      .get('results', Immutable.List())
      .filter(result => result);

    return (
      <CompoundSearchResults
        data={records}
        onSelectRow={selectedRows => this.updateSelected(selectedRows)}
        onRowClick={this.props.onViewDetailsClicked}
        selected={selected}
        isSearching={isSearching}
        searchOptions={searchOptions}
        page={this.props.page()}
        numPages={this.props.numPages()}
        pageSize={this.props.pageSize()}
        onSearchPageChange={(searchPage) => this.props.onSearchPageChange(searchPage, this.loadCompoundRelations)}
        onSearchFilterChange={options => this.props.onSearchFilterChange(options, this.loadCompoundRelations)}
        onSortChange={(key, direction) => this.props.onSortChange(key, direction, this.loadCompoundRelations)}
        onDownloadClicked={this.onDownloadClicked}
        libraries={this.state.libraries || {}}
      />
    );
  }

  onTogglePublicCompound() {
    this.setState({
      isPublicCompound: !this.state.isPublicCompound
    });
  }

  closeCompoundDownloadModal() {
    ModalActions.close(CompoundDownloadModal.MODAL_ID);
    this.setState({
      downloadOption: {
        csv: false,
        sdf: false
      }
    });
  }

  onDownloadOptionChange = e => {
    const downloadOption = { ...this.state.downloadOption };
    const option = e.target.name;
    downloadOption[option] = e.target.checked;
    this.setState({ downloadOption });
  };

  render() {
    const canRegisterPublicCompound = AcsControls.isFeatureEnabled(FeatureConstants.REGISTER_PUBLIC_COMPOUND);
    return (
      <React.Fragment>
        <PageWithSearchAndList
          className="compounds-page"
          hasResults={this.props.hasResults}
          isSearching={this.props.isSearching}
          resultUrl={this.props.resultUrl}
          beta={this.props.beta}
          zeroStateProps={this.props.zeroStateProps}
          hasPageLayout={this.props.hasPageLayout}
          listUrl={this.props.listUrl}
          extendSidebar
          renderFilters={this.renderFilters}
          renderSearchResults={this.renderSearchResults}
        />
        <CompoundDownloadModal
          closeModal={this.closeCompoundDownloadModal}
          text={`You have selected ${this.props.selected.length} compound(s). Please select the format you like to download.`}
          onDownloadClicked={this.onModalDownloadClicked}
          downloadOption={this.state.downloadOption}
          onDownloadOptionChange={this.onDownloadOptionChange}
        />,
        <BulkCompoundRegistrationModal
          onCompoundCreation={this.onCompoundCreation}
          onTogglePublicCompound={canRegisterPublicCompound ? this.onTogglePublicCompound : undefined}
          isPublicCompound={canRegisterPublicCompound && this.state.isPublicCompound}
          disableToggle={this.state.disableToggle}
        />,
        <CompoundRegistrationModal
          onTogglePublicCompound={canRegisterPublicCompound ? this.onTogglePublicCompound : undefined}
          isPublicCompound={canRegisterPublicCompound && this.state.isPublicCompound}
          disableToggle={this.state.disableToggle}
        />
      </React.Fragment>
    );
  }
}

export const props = () => {
  const {
    createdCompounds,
    isSearching,
    selected,
    searchQuery,
    searchPage,
  } = CompoundsPageState.get();
  const searchOptions = new Immutable.Map(CompoundsPageActions.searchOptions());
  const zeroStateProps = {
    title: "You're ready to add some compounds!",
    button: <CompoundCreationDropDown alignment="center" />
  };
  const listUrl = Urls.compounds();
  const resultUrl = Urls.compound;
  const actions = CompoundsPageActions;
  const search = CompoundSearchStore.getSearch(searchQuery, searchPage);
  const zeroStateSearchOptions = _.merge({}, CompoundsSearchDefaults, AcsControls.isFeatureEnabled(FeatureConstants.VIEW_LIBRARIES) && { includes: ['libraries'] });
  const getAllFetchedCompounds = CompoundStore.getAll();
  const hasResults = (getAllFetchedCompounds && getAllFetchedCompounds.size > 0);
  const searchZeroStateProps = {
    title: 'No compounds were found.'
  };

  return {
    listUrl,
    resultUrl,
    zeroStateProps,
    actions,
    createdIds: createdCompounds,
    search,
    searchOptions,
    zeroStateSearchOptions,
    hasResults,
    isSearching,
    selected,
    searchZeroStateProps,
    beta: false,
    hasPageLayout: false
  };
};

CompoundsPage.propTypes = {
  actions: PropTypes.object.isRequired,
  beta: PropTypes.bool,
  createdIds: PropTypes.instanceOf(Immutable.Map),
  hasPageLayout: PropTypes.bool,
  hasResults: PropTypes.bool.isRequired,
  history: PropTypes.object.isRequired,
  isSearching: PropTypes.bool.isRequired,
  listUrl: PropTypes.string,
  resultUrl: PropTypes.func.isRequired,
  search: PropTypes.instanceOf(Immutable.Map).isRequired,
  searchOptions: PropTypes.object.isRequired,
  searchZeroStateProps: PropTypes.object,
  selected: PropTypes.array,
  zeroStateProps: PropTypes.object,
  onSearchFailed: PropTypes.func,
  onSortChange: PropTypes.func.isRequired,
  onSearchInputChange: PropTypes.func.isRequired,
  onSearchFilterChange: PropTypes.func.isRequired,
  onSearchPageChange: PropTypes.func.isRequired,
  onViewDetailsClicked: PropTypes.func.isRequired,
  page: PropTypes.func.isRequired,
  numPages: PropTypes.func.isRequired,
  pageSize: PropTypes.func.isRequired,
  zeroStateSearchOptions: PropTypes.object.isRequired
};

const compoundsPageWithPageWithSearchAndList = withPageWithSearchAndList(CompoundsPage);
export default ConnectToStores(compoundsPageWithPageWithSearchAndList, props);
