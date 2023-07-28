import _ from 'lodash';
import Immutable from 'immutable';
import ajax from 'main/util/ajax';
import CompoundAPI from 'main/api/CompoundAPI';
import SessionStore from 'main/stores/SessionStore';
import UserStore from 'main/stores/UserStore';
import NotificationActions from 'main/actions/NotificationActions';
import CSVUtil from 'main/util/CSVUtil';
import SDFUtil from 'main/util/SDFUtil';
import CompoundStore from 'main/stores/CompoundStore';
import { getHazardsFromCompound } from 'main/util/Hazards';
import { Molecule as OCLMolecule } from 'openchemlib';
import Moment from 'moment';
import JSZip from 'jszip';
import ZIPUtil from 'main/util/ZIPUtil';
import Papa from 'papaparse';
import {
  CompoundsSearchDefaults,
  CompoundsDrawerState,
  CompoundsPageState,
  CompoundSelectorModalState,
  CompoundSelectorPublicModalState
} from './CompoundsState';

const CompoundsActions = {
  searchOptions() {
    return _.pick(
      this.stateStore.get(),
      ...Array.from(Object.keys(CompoundsSearchDefaults))
    );
  },

  search_queue: _.debounce(ajax.singly(), 200),

  updateState(nextState) {
    const currentState = this.stateStore.get();
    const newState = _.extend(currentState, nextState);
    this.stateStore.set(newState);
  },

  onSearchInputChange(onSearchFailed, searchInput, onSearchSucceed = () => {}) {
    const searchQuery = _.isEmpty(searchInput) ? '' : searchInput.trim();

    const options = {
      ...this.searchOptions(),
      searchPage: 1,
      searchQuery: encodeURIComponent(searchQuery)
    };

    this.updateState({
      searchInput,
      searchSortBy: options.searchSortBy,
      descending: options.descending
    });
    if (this.searchOptions().searchQuery !== searchQuery) {
      this.doSearch(options, onSearchFailed, onSearchSucceed);
    }
  },

  onSearchSimilarityChange(onSearchFailed, searchInput, onSearchSucceed = () => {}) {
    const searchSimilarity = _.isEmpty(searchInput) ? '' : searchInput;

    const options = {
      ...this.searchOptions(),
      descending: true,
      searchSortBy: 'search_score',
      searchPage: 1,
      searchSimilarity,
    };

    this.updateState({
      searchSimilarity,
      searchSortBy: options.searchSortBy,
      descending: options.descending
    });

    try {
      OCLMolecule.fromSmiles(searchSimilarity);
    } catch (err) {
      return err;
    }

    return this.doSearch(options, onSearchFailed, onSearchSucceed);
  },

  onSearchPageChange(onSearchFailed, searchPage, onSearchSucceed = () => {}) {
    const options = {
      ...this.searchOptions(),
      searchPage
    };

    this.updateState({
      searchPage
    });

    this.doSearch(options, onSearchFailed, onSearchSucceed);
  },

  onSearchFilterChange(onSearchFailed, options, onSearchSucceed = () => {}) {
    this.updateState(options.toJS());

    const mergedOptions = {
      ...this.searchOptions(),
      ...options.toJS(),
      searchPage: 1
    };

    this.doSearch(mergedOptions, onSearchFailed, onSearchSucceed);
  },

  onSortOptionChange(onSearchFailed, searchSortBy, descending, onSearchSucceed = () => {}) {
    const options = {
      ...this.searchOptions(),
      searchSortBy,
      descending
    };

    this.doSearch(options, onSearchFailed, onSearchSucceed);
  },

  doSearch(searchOptionsParam, onSearchFailed, onSearchSucceed = () => { }) {
    // we always update the search input immediately
    const searchOptions = _.omit(searchOptionsParam, 'searchInput');

    const searchSortBy = searchOptions.searchSortBy || CompoundsSearchDefaults.searchSortBy;
    const descending = searchOptions.descending;
    const sortBy = [descending ? `-${searchSortBy}` : searchSortBy];

    const organization = SessionStore.getOrg();
    const user = SessionStore.getUser();

    const filters = {};
    if (!organization) {
      filters.source = 'public'; // in case of admin when organization_id is null
    }

    if (searchOptions.organization_id) { filters.organization = searchOptions.organization_id; }

    const indexOptions = {
      filters,
      limit: searchOptions.searchPerPage,
      page: searchOptions.searchPage,
      sortBy
    };

    // this filter will filter public as well private compounds based on org id passed
    if (searchOptions.searchPublicAndPrivateByOrgId) { filters.organization_id = searchOptions.searchPublicAndPrivateByOrgId; }

    if (!_.isEmpty(searchOptions.searchQuery) && !_.isEmpty(searchOptions.searchField)) {
      indexOptions.filters.content = { query: encodeURIComponent(searchOptions.searchQuery), search_field: searchOptions.searchField };
      indexOptions.query = searchOptions.searchQuery;
    }

    if (!_.isEmpty(searchOptions.searchLabel)) {
      indexOptions.filters.labels = searchOptions.searchLabel.toString();
    }

    if (!_.isEmpty(searchOptions.includes)) {
      indexOptions.includes = searchOptions.includes;
    }

    if (searchOptions.hasResources) {
      indexOptions.filters.has_resources = searchOptions.hasResources;
    }

    const {
      searchSimilarity,
      searchWeight,
      searchTPSA,
      searchCLOGP,
      searchContainerStatus,
      searchCreator,
      searchSource,
      searchHazard,
      searchProperties
    } = searchOptions;

    if (!_.isEmpty(searchSimilarity)) {
      indexOptions.filters.search_similarity = encodeURIComponent(searchSimilarity);
    }

    if (!_.every(searchWeight, _.isEmpty)) {
      indexOptions.filters.molecular_weight = _.omitBy(searchWeight, _.isEmpty);
    }

    if (!_.every(searchTPSA, _.isEmpty)) {
      indexOptions.filters.tpsa = _.omitBy(searchTPSA, _.isEmpty);
    }

    if (!_.every(searchCLOGP, _.isEmpty)) {
      indexOptions.filters.clogp = _.omitBy(searchCLOGP, _.isEmpty);
    }

    if (!_.isEmpty(searchContainerStatus) && searchContainerStatus !== 'all') {
      indexOptions.filters.container_status = searchContainerStatus;
    }

    if (!_.isEmpty(searchCreator) && searchCreator !== 'all') {
      let user_id = user.get('id');
      if (SessionStore.isAdmin()) {
        // transform me intro current user id.
        user_id = searchCreator === 'me' ? user.get('id') : searchCreator;
      }

      indexOptions.filters.creator = user_id;
    }

    if (!_.isEmpty(searchSource) && searchSource !== 'all') {
      indexOptions.filters.source = searchSource;
    }

    if (!_.isEmpty(searchHazard)) {
      indexOptions.filters.flags = searchOptions.searchHazard.toString();
    }

    if (!_.isEmpty(searchProperties)) {
      indexOptions.filters.contextual_custom_properties = searchProperties;
    }

    if (searchOptions.searchByPublicCompounds && searchSource !== 'public') {
      indexOptions.filters.source = 'public';
    }

    return this.search_queue((next) => {
      this.updateState({ isSearching: true });
      const promise = CompoundAPI.index(indexOptions);
      promise.done((result) => {
        this.updateState(searchOptions);
        onSearchSucceed(result);
      });
      promise.always(() => {
        this.updateState({ isSearching: false });
        return next();
      });
      return promise.fail((xhr) => {
        onSearchFailed(xhr);
      });
    });
  },

  async downloadCSV(compoundIds, csvData) {
    const selectedCompounds = await Promise.all(compoundIds.map(compoundId => this.getCompoundData(compoundId)));

    const CSVCompounds = selectedCompounds.map(compound => {
      const creator = UserStore.getById(compound.get('created_by'));
      const organizationId = compound.get('organization_id');

      const externalIDs = compound.get('external_system_ids');
      const firstExternalID = externalIDs && externalIDs.getIn([0, 'external_system_id']);
      return {
        Structure: compound.get('smiles') || '',
        Nickname: compound.get('name') || '',
        ExternalSystemId: firstExternalID || '',
        RefId: compound.get('reference_id') || '',
        Id: compound.get('id') || '',
        Formula: compound.get('formula') || '',
        Weight: compound.get('molecular_weight') || '',
        Score: compound.get('search_score') || '',
        ExactMass: compound.get('exact_molecular_weight') || '',
        TPSA: compound.get('tpsa') || '',
        cLogp: compound.get('clogp') || '',
        Created: Moment(compound.get('created_at')).format('MMM D, YYYY') || '',
        Labels: compound.get('labels').toJS().map(label => label.name) || '',
        Hazards: getHazardsFromCompound(compound) || '',
        Source: organizationId ? 'Private' : 'Public' || '',
        Creator: creator ? creator.get('name') || creator.get('email') || '' : '',
        OrganizationName: compound.get('organization_name') || '',
        MFCD: compound.get('mfcd_number') || '',
        CAS: compound.get('cas_number') || '',
        PubchemId: compound.get('pub_chem_id') || ''
      };
    });
    if (csvData) {
      return Papa.unparse(CSVCompounds);
    }

    return CSVUtil.downloadCSVFromJSON(CSVCompounds, 'compounds');
  },

  async getCompoundData(compoundId) {
    let compound = CompoundStore.getById(compoundId);
    if (!compound) {
      // in case of api failure the exception will be propagated, caller has to handle the exception
      const response = await CompoundAPI.get(compoundId, { fields: { compounds: ['id', 'sdf'] } });
      compound = Immutable.fromJS(response.data.attributes);
    }
    return compound;
  },

  async downloadSDFFile(compoundId) {
    const compound = await this.getCompoundData(compoundId);
    return SDFUtil.downloadSDF(compound.get('sdf'), compoundId);
  },

  async downloadSDFZip(compoundIds) {
    const fileName = 'compounds';
    const zipFile = new JSZip();
    await Promise.all(compoundIds.map(compoundId =>
      this.getCompoundData(compoundId).then(compound => zipFile.file(`${compoundId}.sdf`, compound.get('sdf')))
    ));
    return ZIPUtil.downloadZip(zipFile, fileName);
  },

  async downloadSDF(compoundIds) {
    if (compoundIds.length === 1) {
      await this.downloadSDFFile(...compoundIds);
    } else if (compoundIds.length > 1) {
      await this.downloadSDFZip(compoundIds);
    }
  },

  async downloadCSVAndSDF(compoundIds) {
    const zipFile = new JSZip();
    const fileName = compoundIds.length === 1 ? compoundIds[0] : 'compounds';

    await Promise.all(compoundIds.map(compoundId =>
      this.getCompoundData(compoundId).then(compound => zipFile.file(`${compoundId}.sdf`, compound.get('sdf')))
    ));

    zipFile.file(`${fileName}.csv`, this.downloadCSV(compoundIds, true));
    ZIPUtil.downloadZip(zipFile, fileName);
  },

  async downloadCompounds(isCSV, isSDF, compoundIds) {
    if (isCSV && isSDF) {
      await this.downloadCSVAndSDF(compoundIds).catch((res) => NotificationActions.handleError(res));
    } else if (isCSV) {
      this.downloadCSV(compoundIds).catch((res) => NotificationActions.handleError(res));
    } else if (isSDF) {
      await this.downloadSDF(compoundIds).catch((res) => NotificationActions.handleError(res));
    }
  }
};

const CompoundsPageActions = _.extend({}, CompoundsActions, {
  stateStore: CompoundsPageState
});
const CompoundsDrawerActions = _.extend({}, CompoundsActions, {
  stateStore: CompoundsDrawerState
});
const CompoundSelectorModalActions = _.extend({}, CompoundsActions, {
  stateStore: CompoundSelectorModalState
});
const CompoundSelectorPublicModalActions = _.extend({}, CompoundsActions, {
  stateStore: CompoundSelectorPublicModalState
});
export { CompoundsPageActions, CompoundsDrawerActions, CompoundSelectorModalActions, CompoundSelectorPublicModalActions };
