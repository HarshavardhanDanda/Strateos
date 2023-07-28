import _ from 'lodash';
import sinon from 'sinon';
import { expect } from 'chai';
import Immutable from 'immutable';

import BatchAPI from 'main/api/BatchAPI';
import SessionStore from 'main/stores/SessionStore';
import { BatchesPageActions } from 'main/pages/CompoundsPage/BatchesActions';
import { BatchesSearchDefaults } from 'main/pages/CompoundsPage/BatchesState';
import BatchResData from 'main/pages/CompoundsPage/mocks/batch_res_data';
import CSVUtil from 'main/util/CSVUtil';
import NotificationActions from 'main/actions/NotificationActions';
import ReactionStore from 'main/stores/ReactionStore';
import RunStore from 'main/stores/RunStore';
import BatchStore from 'main/stores/BatchStore';

const expectedJSONForCSVDownload = {
  label: 'test_batch',
  status: 'Completed',
  smiles: 'CC(C)(C)c1ccc(S(=O)(=O)Cl)cc1',
  reference_id: 'CAS 15084-51-2',
  molecular_formula: 'C10H13ClO2S',
  synthesis_request: 'request_name',
  synthesis_program: 'program_name',
  purity: 90,
  mass_yield_mg: 1.1,
  containers: 'container_barcode - 30.0:microliter',
  run_feedback_comments: 'run_id- success - Test123'
};

describe('BatchesAction', () => {
  let index;
  const onSearchFailed = sinon.stub();
  const onSearchSucceed = sinon.stub();
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    index = sandbox.stub(BatchAPI, 'index').returns({
      done: () => { },
      always: () => { },
      fail: () => { }
    });

    sandbox.stub(BatchesPageActions, 'search_queue').callsFake(fn => fn());
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should include compounds', () => {
    BatchesPageActions.doSearch(BatchesSearchDefaults, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {},
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      version: 'v1'
    });
  });

  it('should filter batches by All', () => {
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchQuery: 'batch123',
      searchField: 'all'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { all: 'batch123' },
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      version: 'v1',
      query: 'batch123'
    });
  });

  it('should filter batches by ID', () => {
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchQuery: 'abc',
      searchField: 'id'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { id: 'abc' },
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      version: 'v1',
      query: 'abc'
    });
  });

  it('should filter by user', () => {
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchField: 'id',
      searchCreator: 'me'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { created_by: 'user3202' },
      includes: ['compound', 'organization', 'user'],
      fields: {
        organizations: ['name', 'subdomain'],
        users: ['profile_img_url', 'name']
      },
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      version: 'v1'
    });
  });

  it('should filter batches by Name', () => {
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchQuery: 'test batch',
      searchField: 'name'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { name: 'test batch' },
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      version: 'v1',
      query: 'test batch'
    });
  });

  it('should search with default sort field', () => {
    BatchesPageActions.doSearch(BatchesSearchDefaults, () => {}, () => {});

    expect(index.args[0][0]).to.deep.equal({
      filters: {},
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });
  });

  it('should do a structure similarity search', () => {
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchSimilarity: 'ClC1CCCCC1'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {  search_similarity: 'ClC1CCCCC1' },
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });
  });

  it('should not add structure similarity filter when smile is empty', () => {
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchSimilarity: ''
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {},
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });
  });

  it('should not search when invalid smile is given', () => {
    const doSearch = sandbox.stub(BatchesPageActions, 'doSearch');
    BatchesPageActions.onSearchSimilarityChange(onSearchFailed, 'CCcd', onSearchSucceed);
    expect(doSearch.notCalled).to.be.true;
  });

  it('should search when valid smile is given', () => {
    const doSearch = sandbox.stub(BatchesPageActions, 'doSearch');
    BatchesPageActions.onSearchSimilarityChange(onSearchFailed, 'CCC', onSearchSucceed);
    expect(doSearch.calledOnce).to.be.true;
  });

  it('should do a search with purity bounds', () => {
    BatchesPageActions.doSearch(BatchesSearchDefaults, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {},
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });

    index.resetHistory();

    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchPurity: { min: '100:%', hasError: false }
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { purity: { min: '100' } },
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });

    index.resetHistory();

    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchPurity: { max: '100:%', hasError: false }
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { purity: { max: '100' } },
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });

    index.resetHistory();

    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchPurity: { min: '10:%', max: '100:%', hasError: false }
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {  purity: { min: '10', max: '100' } },
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });
  });

  it('should not search when purity values has validation error', () => {
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchPurity: { min: '100%', max: '20:%', hasError: true }
    }, () => { }, () => { });

    expect(index.notCalled).to.be.true;
  });

  it('should do a search with no mass yield bounds', () => {
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { },
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });
  });

  it('should do a search with lower mass yield bound', () => {
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchMassYield: { min: '45:milligram', max: '', hasError: false },
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { mass_yield: { min: '45' } },
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });
  });

  it('should do a search with upper mass yield bound', () => {
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchMassYield: { min: '', max: '100:milligram', hasError: false },
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { mass_yield: { max: '100' } },
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });
  });

  it('should do a search with lower and upper mass yield bounds', () => {
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchMassYield: { min: '10:milligram', max: '100:milligram', hasError: false },
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { mass_yield: { min: '10', max: '100' } },
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });
  });

  it('should not search when mass yeild values has validation error', () => {
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchMassYield: { min: '100:milligram', max: '20:milligram', hasError: true },
    }, () => { }, () => { });

    expect(index.notCalled).to.be.true;
  });

  it('should have BatchesSearchDefaults as default search options', () => {
    BatchesPageActions.updateState(BatchesSearchDefaults);
    const searchOptions = BatchesPageActions.searchOptions();
    expect(searchOptions).to.deep.equal(BatchesSearchDefaults);
  });

  it('should be sortable by fields', () => {
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchSortBy: 'purity'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {},
      page: 1,
      limit: 10,
      sortBy: ['-purity'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });

    index.resetHistory();

    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchSortBy: 'post_purification_mass_yield_mg',
      descending: false
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {},
      page: 1,
      limit: 10,
      sortBy: ['post_purification_mass_yield_mg'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });

    index.resetHistory();

    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchSortBy: 'samples_created_at',
      descending: false
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {},
      page: 1,
      limit: 10,
      sortBy: ['samples_created_at'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });

    index.resetHistory();

    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchSortBy: 'label',
      descending: false
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {},
      page: 1,
      limit: 10,
      sortBy: ['label'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });
  });

  it('should be sortable by synthesis program field', () => {
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchSortBy: 'synthesis_program_name',
      descending: false
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {},
      page: 1,
      limit: 10,
      sortBy: ['synthesis_program_name'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });

    index.resetHistory();

    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchSortBy: 'synthesis_program_name',
      descending: true
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {},
      page: 1,
      limit: 10,
      sortBy: ['-synthesis_program_name'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });
  });

  it('should be sortable by synthesis request field', () => {
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchSortBy: 'synthesis_request_name',
      descending: false
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {},
      page: 1,
      limit: 10,
      sortBy: ['synthesis_request_name'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });

    index.resetHistory();

    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      searchSortBy: 'synthesis_request_name',
      descending: true
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {},
      page: 1,
      limit: 10,
      sortBy: ['-synthesis_request_name'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });
  });

  it('should do a synthesis program search', () => {
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      synthesisProgram: { id: 'programId', name: '' },
      synthesisRequest: { id: 'requestId', name: '' }
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {  synthesis_program_id: 'programId', synthesis_request_id: 'requestId' },
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });
  });

  it('should filter batches by synthesis request', () => {
    BatchesPageActions.doSearch({
      ...BatchesSearchDefaults,
      synthesisRequest: { id: 'srq129', name: '' },
      synthesisProgram: { id: 'abcd123', name: '' }
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {  synthesis_request_id: 'srq129', synthesis_program_id: 'abcd123' },
      limit: 10,
      page: 1,
      sortBy: ['-created_at'],
      includes: ['compound', 'organization', 'user'],
      fields: { organizations: ['name', 'subdomain'], users: ['profile_img_url', 'name'] },
      version: 'v1'
    });
  });

  it('should be able to download CSV', () => {
    sandbox.stub(BatchAPI, 'getMany').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    sandbox.stub(BatchStore, 'getById').returns(Immutable.fromJS(BatchResData));
    const csvUtilStub = sandbox.spy(CSVUtil, 'downloadCSVFromJSON');

    BatchesPageActions.downloadCSV(['b1']);
    setTimeout(() => {
      expect(csvUtilStub.calledOnce).to.be.true;
      expect(csvUtilStub.args[0][0]).to.deep.equal([expectedJSONForCSVDownload]);
      expect(csvUtilStub.args[0][1]).to.equal('b1');
    }, 0);
  });

  it('should have the name batches for csv if multiple ids are present', () => {
    sandbox.stub(BatchAPI, 'getMany').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    const csvUtilStub = sandbox.spy(CSVUtil, 'downloadCSVFromJSON');
    const second_batch = { ...BatchResData, id: 'b2' };
    const getByIdStub = sandbox.stub(BatchStore, 'getById');
    getByIdStub.withArgs('b1').returns(Immutable.fromJS(BatchResData));
    getByIdStub.withArgs('b2').returns(Immutable.fromJS(second_batch));
    BatchesPageActions.downloadCSV(['b1', 'b2']);

    setTimeout(() => {
      expect(csvUtilStub.calledOnce).to.be.true;
      expect(csvUtilStub.args[0][0].length).to.equal(2);
      expect(csvUtilStub.args[0][1]).to.equal('batches');
    }, 0);
  });

  it('should be able to download CSV for failed runs', () => {
    const batchResponseData = _.cloneDeep(BatchResData);
    batchResponseData.runs[0].success = false;
    const expectedData = { ...expectedJSONForCSVDownload };
    expectedData.run_feedback_comments = 'run_id- failed - Test123';

    sandbox.stub(BatchAPI, 'getMany').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    sandbox.stub(BatchStore, 'getById').returns(Immutable.fromJS(batchResponseData));
    const csvUtilStub = sandbox.spy(CSVUtil, 'downloadCSVFromJSON');

    BatchesPageActions.downloadCSV(['b1']);
    setTimeout(() => {
      expect(csvUtilStub.calledOnce).to.be.true;
      expect(csvUtilStub.args[0][0]).to.deep.equal([expectedData]);
      // For a single batch, the file name will be the batchId
      expect(csvUtilStub.args[0][1]).to.equal('b1');
    }, 0);
  });

  it('should show notification if there is any error while downloading csv', () => {
    sandbox.stub(BatchAPI, 'getMany').returns({
      then: () => ({
        fail: (cb) => cb({}),
      }),
    });
    const notificationActionsSpy = sandbox.spy(NotificationActions, 'handleError');

    BatchesPageActions.downloadCSV(['b1']);
    setTimeout(() => {
      expect(notificationActionsSpy.calledOnce).to.be.true;
      expect(notificationActionsSpy.args[0][2]).to.equal('CSV Download Failed');
    }, 0);
  });

  it('should generate status based on the batch properties', () => {
    const batch_high_purity = Immutable.Map({ samples_created_at: '2023-02-01T02:32:03.471-08:00', purity: 90 });
    const batch_low_purity = Immutable.Map({ samples_created_at: '2023-02-01T02:32:03.471-08:00', purity: 20 });
    const batch_reaction_id = Immutable.Map({ reaction_id: 'r1' });
    const reaction = Immutable.Map({
      runId: 'reaction1'
    });
    const run = Immutable.Map({
      attributes: {
        status: 'in_progress'
      }
    });
    const reactionStoreStub = sandbox.stub(ReactionStore, 'getById').returns(reaction);
    const runStoreStub = sandbox.stub(RunStore, 'getById').returns(run);

    expect(BatchesPageActions.generateBatchStatus(batch_high_purity)).to.equal('success');
    expect(BatchesPageActions.generateBatchStatus(batch_low_purity)).to.equal('failed');
    expect(BatchesPageActions.generateBatchStatus(batch_reaction_id)).to.equal(run.getIn(['attributes', 'status']));
    expect(reactionStoreStub.calledWithExactly(batch_reaction_id.get('reaction_id'))).to.be.true;
    expect(runStoreStub.calledWithExactly(reaction.get('runId'))).to.be.true;
  });

  it('should convert data from store to csv downloadable format', () => {
    const returnValue = BatchesPageActions._generateBatchCSVDataFromStoreData(Immutable.fromJS(BatchResData));
    expect(returnValue).to.deep.equal(expectedJSONForCSVDownload);
  });

  it('should have run success notes and run success boolean as n/a if they are null', () => {
    const batchResponseData = _.cloneDeep(BatchResData);
    batchResponseData.runs[0].success = null;
    batchResponseData.runs[0].success_notes = null;
    const expectedData = { ...expectedJSONForCSVDownload };
    expectedData.run_feedback_comments = 'run_id- n/a';

    const returnValue = BatchesPageActions._generateBatchCSVDataFromStoreData(Immutable.fromJS(batchResponseData));
    expect(returnValue).to.deep.equal(expectedData);
  });

  it('should have run success boolean as n/a if it is null', () => {
    const batchResponseData = _.cloneDeep(BatchResData);
    batchResponseData.runs[0].success = null;
    const expectedData = { ...expectedJSONForCSVDownload };
    expectedData.run_feedback_comments = 'run_id- n/a - Test123';

    const returnValue = BatchesPageActions._generateBatchCSVDataFromStoreData(Immutable.fromJS(batchResponseData));
    expect(returnValue).to.deep.equal(expectedData);
  });

  it('should have run success notes as n/a if it is null', () => {
    const batchResponseData = _.cloneDeep(BatchResData);
    batchResponseData.runs[0].success_notes = null;
    const expectedData = { ...expectedJSONForCSVDownload };
    expectedData.run_feedback_comments = 'run_id- success - n/a';

    const returnValue = BatchesPageActions._generateBatchCSVDataFromStoreData(Immutable.fromJS(batchResponseData));
    expect(returnValue).to.deep.equal(expectedData);
  });
});
