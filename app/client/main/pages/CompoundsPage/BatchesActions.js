import _ from 'lodash';
import ajax from 'main/util/ajax';
import BatchAPI from 'main/api/BatchAPI';
import SessionStore from 'main/stores/SessionStore';
import { Molecule as OCLMolecule } from 'openchemlib';
import { BatchesSearchDefaults, BatchesPageState } from 'main/pages/CompoundsPage/BatchesState';
import { convertValue, getValueAndUnit } from 'main/util/unit.js';
import NotificationActions from 'main/actions/NotificationActions';
import CSVUtil from 'main/util/CSVUtil';
import ReactionStore from 'main/stores/ReactionStore';
import RunStore from 'main/stores/RunStore';
import BatchStore from 'main/stores/BatchStore';

const queryParamsForBatchCSV = {
  version: 'v1',
  fields: {
    containers: ['container_type_id', 'barcode'],
    runs: ['status', 'success_notes', 'success'],
    aliquots: ['container_id', 'volume_ul'],
    synthesis_request: ['name'],
    synthesis_program: ['name'],
    compounds: ['reference_id', 'formula', 'smiles']
  },
  includes: ['compound', 'aliquots', 'runs', 'containers', 'synthesis_request', 'synthesis_program']
};
const BatchesActions = {
  searchOptions() {
    return _.pick(
      this.stateStore.get(),
      ...Array.from(Object.keys(BatchesSearchDefaults))
    );
  },

  search_queue: _.debounce(ajax.singly(), 200),

  updateState(nextState) {
    const currentState = this.stateStore.get();
    const newState = _.extend(currentState, nextState);
    this.stateStore.set(newState);
  },

  onSearchInputChange(onSearchFailed, searchInput, onSearchSucceed = () => {}) {
    const searchQuery = _.isEmpty(searchInput) ? '' : searchInput;

    const options = {
      ...this.searchOptions(),
      searchPage: 1,
      searchQuery,
    };

    this.updateState({
      searchInput
    });

    this.doSearch(options, onSearchFailed, onSearchSucceed);
  },

  onSearchSimilarityChange(onSearchFailed, searchInput = () => {}, onSearchSucceed = () => {}) {
    const searchSimilarity = _.isEmpty(searchInput) ? '' : searchInput;

    const options = {
      ...this.searchOptions(),
      searchPage: 1,
      searchSimilarity,
    };

    this.updateState({
      searchSimilarity
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

  hasValidationError(searchOptions) {
    return !!(searchOptions.searchPurity.hasError || searchOptions.searchMassYield.hasError);
  },

  doSearch(searchOptionsParam, onSearchFailed, onSearchSucceed = () => { }) {
    if (this.hasValidationError(searchOptionsParam)) { return; }
    const searchOptions = _.omit(searchOptionsParam, 'searchInput');
    const searchSortBy = searchOptions.searchSortBy || BatchesSearchDefaults.searchSortBy;
    const descending = searchOptions.descending;
    const sortBy = [descending ? `-${searchSortBy}` : searchSortBy];
    const filters = {};

    this.updateState({ isSearching: true });

    const indexOptions = {
      sortBy,
      page: searchOptions.searchPage,
      limit: searchOptions.searchPerPage,
      version: 'v1',
      filters,
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
    };

    if (!_.isEmpty(searchOptions.searchQuery) && !_.isEmpty(searchOptions.searchField)) {
      indexOptions.filters[searchOptions.searchField] =  searchOptions.searchQuery;
      indexOptions.query = searchOptions.searchQuery;
    }

    if (!_.isEmpty(searchOptions.searchCreator) && searchOptions.searchCreator === 'me') {
      indexOptions.filters.created_by = SessionStore.getUser().get('id');
    }

    if (!_.isEmpty(searchOptions.synthesisRequest.id)) {
      indexOptions.filters.synthesis_request_id = searchOptions.synthesisRequest.id.toString();
    }

    if (!_.isEmpty(searchOptions.searchSimilarity)) {
      indexOptions.filters.search_similarity = encodeURIComponent(searchOptions.searchSimilarity);
    }

    if (!_.every(searchOptions.searchPurity, _.isEmpty)) {
      const { min, max } =  _.omitBy(searchOptions.searchPurity, _.isEmpty);
      const minValue = min && min.split(':')[0];
      const maxValue = max && max.split(':')[0];
      if (minValue || maxValue) {
        const searchPurity = this.getMinMaxObject(minValue, maxValue);
        indexOptions.filters.purity = searchPurity;
      }
    }

    if (!_.every(searchOptions.searchMassYield, _.isEmpty)) {
      const { min, max } = searchOptions.searchMassYield;
      const [minValue, minUnit] = getValueAndUnit(min);
      const [maxValue, maxUnit] = getValueAndUnit(max);
      const massMin = minValue && minUnit &&  convertValue(minValue, 'mass', minUnit, 'milligram').toString();
      const massMax = maxValue && maxUnit && convertValue(maxValue, 'mass', maxUnit, 'milligram').toString();
      if (massMin || massMax) {
        const searchMassYield = this.getMinMaxObject(massMin, massMax);
        indexOptions.filters.mass_yield = searchMassYield;
      }
    }

    if (!_.isEmpty(searchOptions.synthesisProgram.id)) {
      indexOptions.filters.synthesis_program_id = searchOptions.synthesisProgram.id;
    }

    return this.search_queue((next) => {
      const promise = BatchAPI.index(indexOptions);

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

  getMinMaxObject(minValue, maxValue) {
    return { ...(minValue && { min: minValue }), ...(maxValue && { max: maxValue }) };
  },

  downloadCSV(batchIds) {
    const batches = [];
    BatchAPI.getMany(batchIds, queryParamsForBatchCSV).then(() => {
      _.forEach(batchIds, (batchId) => {
        const batchFromStore = BatchStore.getById(batchId);
        const batchCSV = this._generateBatchCSVDataFromStoreData(batchFromStore);
        batches.push(batchCSV);
      });

      CSVUtil.downloadCSVFromJSON(batches, batches.length > 1 ? 'batches' : batchIds[0]);
    }).fail((status) => NotificationActions.handleError('', status, 'CSV Download Failed'));
  },

  generateBatchStatus(batch) {
    let status;
    if (batch.get('samples_created_at')) {
      status = batch.get('purity') >= 90 ? 'success' : 'failed';
    } else {
      const reactionId = batch.get('reaction_id');
      const reaction = ReactionStore.getById(reactionId);
      if (reaction) {
        const runId = reaction.get('runId');
        const run = runId && RunStore.getById(runId);
        status = run && run.getIn(['attributes', 'status']);
      }
    }

    return status;
  },

  generateBatchStatusText(status) {
    const statusText = {
      in_progress: 'In progress',
      complete: 'In progress',
      pending: 'Submitted',
      accepted: 'Submitted',
      canceled: 'Cancelled',
      rejected: 'Cancelled',
      aborted: 'Failed',
      failed: 'Failed',
      success: 'Completed'
    };

    return statusText[status];
  },

  generateBatchStatusType(status) {
    const statusType = {
      in_progress: 'action',
      complete: 'action',
      pending: 'warning',
      accepted: 'warning',
      aborted: 'danger',
      canceled: 'danger',
      rejected: 'danger',
      failed: 'danger',
      success: 'success'
    };

    return statusType[status];
  },

  _generateBatchCSVDataFromStoreData(batchStoreData) {
    const batch = {};
    const aliquots = batchStoreData.get('aliquots');
    const runsFromBatch = batchStoreData.get('runs');
    const containersFromBatch = batchStoreData.get('containers');
    const containers = [];

    const runs = runsFromBatch && runsFromBatch.map((run) => {
      const id = run.get('id');
      const isSuccess = run.get('success');
      const success = _.isBoolean(isSuccess) ? (isSuccess ? 'success' : 'failed') : 'n/a';
      const successNotes = run.get('success_notes');
      const isFeedbackNotPresent = _.isNull(isSuccess) && _.isNull(successNotes);
      const runFeeback = isFeedbackNotPresent ? 'n/a' : `${success} - ${_.defaultTo(successNotes, 'n/a')}`;
      return `${id}- ${runFeeback}`;
    });

    containersFromBatch && containersFromBatch.forEach((container) => {
      if (container.get('container_type_id') === 'a1-vial') {
        const aliquot = aliquots.find(aliquot => aliquot.get('container_id') === container.get('id'));
        const barcode = container.get('barcode');
        const volume = aliquot.get('volume_ul');
        containers.push(`${barcode} - ${volume}:microliter`);
      }
    });

    batch.label = batchStoreData.get('name');
    batch.status = this.generateBatchStatusText(this.generateBatchStatus(batchStoreData));
    batch.smiles = batchStoreData.getIn(['compound', 'smiles']);
    batch.reference_id = batchStoreData.getIn(['compound', 'reference_id']);
    batch.molecular_formula = batchStoreData.getIn(['compound', 'formula']);
    batch.synthesis_request = batchStoreData.getIn(['synthesis_request', 'name']);
    batch.synthesis_program = batchStoreData.getIn(['synthesis_program', 'name']);
    batch.purity = batchStoreData.get('purity');
    batch.mass_yield_mg = batchStoreData.get('post_purification_mass_yield_mg');
    batch.containers = containers.join(',');
    batch.run_feedback_comments = runsFromBatch && runs.join(',');

    return batch;
  }
};

const BatchesPageActions = _.extend({}, BatchesActions, {
  stateStore: BatchesPageState
});

export { BatchesPageActions };
