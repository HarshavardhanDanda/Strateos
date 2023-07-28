import sinon from 'sinon';
import { expect } from 'chai';
import Immutable from 'immutable';
import Papa from 'papaparse';
import Moment from 'moment';

import ajax from 'main/util/ajax';
import CompoundAPI from 'main/api/CompoundAPI';
import SessionStore from 'main/stores/SessionStore';
import CompoundStore from 'main/stores/CompoundStore';
import UserStore from 'main/stores/UserStore';
import SDFUtil from 'main/util/SDFUtil';
import CSVUtil from 'main/util/CSVUtil';
import NotificationActions from 'main/actions/NotificationActions';
import { getDefaultSearchPerPage } from 'main/util/List';
import { CompoundsPageActions } from './CompoundsActions';
import ZIPUtil from '../../util/ZIPUtil';

describe('CompoundsAction', () => {
  let index;
  let organization;
  const sandbox = sinon.createSandbox();
  const fakeMethod = () => {};

  beforeEach(() => {
    index = sandbox.stub(CompoundAPI, 'index').returns({
      done: () => { },
      always: () => { },
      fail: () => { }
    });

    sandbox.stub(CompoundsPageActions, 'search_queue').callsFake(fn => fn());
    organization = Immutable.fromJS({ id: 'foo' });
    sandbox.stub(SessionStore, 'getOrg').returns(organization);
  });

  afterEach(() => {
    sandbox.restore();
  });

  const compound = {
    clogp: '2.304',
    id: 'cmpl1efjg7db6w6th',
    smiles: 'CC(CC)',
    sdf: 'test-ccp',
    formula: 'C10H19N',
    molecular_weight: '153.27',
    exact_molecular_weight: '153.212345',
    tpsa: '26.02',
    labels: Immutable.List([{ name: 'label1', organization_id: 'org13' }, { name: 'label2', organization_id: 'org13' }]),
  };

  it('should do a search with a default sort field', () => {
    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1'
    }, () => {}, () => {});

    expect(index.args[0][0]).to.deep.equal({
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at'],
      filters: {
      }
    });
  });

  it('should do a search with a query only', () => {
    CompoundsPageActions.doSearch({
      searchQuery: 'strateos',
      searchField: 'all',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { content: { query: 'strateos', search_field: 'all' } },
      query: 'strateos',
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });
  });

  it('should do a search with container status', () => {
    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchContainerStatus: 'all'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });

    index.resetHistory();

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchContainerStatus: 'available'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { container_status: 'available' },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });
  });

  it('should do a search on the creator when the current user is a regular user', () => {
    const user = Immutable.fromJS({ id: 'user-id' });
    sandbox.stub(SessionStore, 'getUser').returns(user);

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchCreator: 'me'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { creator: 'user-id' },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });

    index.resetHistory();

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchCreator: 'all'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {},
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });

    index.resetHistory();

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchCreator: 'other-id'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { creator: 'user-id' },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });
  });

  it('should do a search on the creator when the current user is an admin', () => {
    const user = Immutable.fromJS({ id: 'user-id' });
    sandbox.stub(SessionStore, 'getUser').returns(user);
    sandbox.stub(SessionStore, 'isAdmin').returns(true);

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchCreator: 'me'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {  creator: 'user-id' },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });

    index.resetHistory();

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchCreator: 'all'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });

    index.resetHistory();

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchCreator: 'other-id'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { creator: 'other-id' },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });
  });

  it('should filter by public / private', () => {
    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchSource: 'all'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });

    index.resetHistory();

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchSource: 'private'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {  source: 'private' },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });

    index.resetHistory();

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchSource: 'public'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {  source: 'public' },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });
  });

  it('should do a structure similarity search', () => {
    CompoundsPageActions.doSearch({
      searchSortBy: 'search_score',
      searchPage: 1,
      searchSimilarity: 'ClC1CCCCC1',
      searchPerPage: getDefaultSearchPerPage()
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {  search_similarity: 'ClC1CCCCC1' },
      limit: getDefaultSearchPerPage(),
      page: 1,
      sortBy: ['search_score']
    });
  });

  it('should do a hasResources search', () => {
    CompoundsPageActions.doSearch({
      searchSortBy: 'search_score',
      searchPage: 1,
      hasResources: true,
      searchPerPage: getDefaultSearchPerPage()
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {  has_resources: true },
      limit: getDefaultSearchPerPage(),
      page: 1,
      sortBy: ['search_score']
    });
  });

  it('should do a structure similarity search with a # in SMILES string', () => {
    CompoundsPageActions.doSearch({
      searchSortBy: 'search_score',
      searchPage: 1,
      searchSimilarity: 'CCC(CC)COC(=O)[C@H](C)NP(=O)(OC[C@H]1O[C@@](C#N)(c2ccc3c(N)ncnn23)[C@H](O)[C@@H]1O)Oc1ccccc1',
      searchPerPage: getDefaultSearchPerPage()
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {
        search_similarity: 'CCC(CC)COC(%3DO)%5BC%40H%5D(C)NP(%3DO)(OC%5BC%40H%5D1O%5BC%40%40%5D(C%23N)(c2ccc3c(N)ncnn23)%5BC%40H%5D(O)%5BC%40%40H%5D1O)Oc1ccccc1'
      },
      limit: getDefaultSearchPerPage(),
      page: 1,
      sortBy: ['search_score']
    });
  });

  it('should do a structure similarity search and a content search concurrently', () => {
    CompoundsPageActions.doSearch({
      searchQuery: 'some_name',
      searchField: 'name',
      searchSortBy: 'search_score',
      searchPage: 1,
      searchSimilarity: 'CCC(CC)COC(=O)[C@H](C)NP(=O)(OC[C@H]1O[C@@](C#N)(c2ccc3c(N)ncnn23)[C@H](O)[C@@H]1O)Oc1ccccc1',
      searchPerPage: getDefaultSearchPerPage()
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {
        content: { query: 'some_name', search_field: 'name' },
        search_similarity: 'CCC(CC)COC(%3DO)%5BC%40H%5D(C)NP(%3DO)(OC%5BC%40H%5D1O%5BC%40%40%5D(C%23N)(c2ccc3c(N)ncnn23)%5BC%40H%5D(O)%5BC%40%40H%5D1O)Oc1ccccc1'
      },
      limit: getDefaultSearchPerPage(),
      page: 1,
      sortBy: ['search_score'],
      query: 'some_name'
    });
  });

  it('should do a search with weight bounds', () => {
    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchWeight: { min: '', max: '' }
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {},
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });

    index.resetHistory();

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchWeight: { min: '100', max: '' }
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { molecular_weight: { min: '100' } },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });

    index.resetHistory();

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchWeight: { min: '', max: '100' }
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { molecular_weight: { max: '100' } },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });

    index.resetHistory();

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchWeight: { min: '100', max: '100' }
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {  molecular_weight: { min: '100', max: '100' } },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });
  });

  it('should do a search with tpsa bounds', () => {
    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchTPSA: { min: '', max: '' }
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });

    index.resetHistory();

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchTPSA: { min: '100', max: '' }
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { tpsa: { min: '100' } },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });

    index.resetHistory();

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchTPSA: { min: '', max: '100' }
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { tpsa: { max: '100' } },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });

    index.resetHistory();

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchTPSA: { min: '100', max: '100' }
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {  tpsa: { min: '100', max: '100' } },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });
  });

  it('should do a search with clogp bounds', () => {
    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchCLOGP: { min: '', max: '' }
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {},
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });

    index.resetHistory();

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchCLOGP: { min: '', max: '100' }
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { clogp: { max: '100' } },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });

    index.resetHistory();

    CompoundsPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchCLOGP: { min: '100', max: '100' }
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: { clogp: { min: '100', max: '100' } },
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at']
    });
  });

  it('should reflect correct values after csv download', async () => {
    // testing smiles string with special characters to check if they are encoded into URI. - = # $ \
    const compound = {
      clogp: '2.304',
      created_at: '2020-05-22T16:00:41.172-07:00',
      created_by: 'u19ahey7f2',
      id: 'cmpl1efjg7db6w6th',
      smiles: 'C#CCN1CCC2=C(C1)c1c(OC(=O)CCCN3CCCCC3)cc(C(C)C(C)CCCNN)cc1OC2(C)C\\.-=#$:/$',
      formula: 'C10H19N',
      molecular_weight: '153.27',
      exact_molecular_weight: '153.212345',
      tpsa: '26.02',
      labels: Immutable.List([{ name: 'label1', organization_id: 'org13' }, { name: 'label2', organization_id: 'org13' }]),
      name: 'mol',
      reference_id: '1235',
      organization_name: 'lilly',
      mfcd_number: 'mfcd123',
      cas_number: 'acs123',
      search_score: 'score123',
      pub_chem_id: 'pid',
      organization_id: null,
      external_system_ids: Immutable.List([]),
      flammable: true,
      strong_acid: true
    };

    sandbox.stub(CompoundStore, 'getById').withArgs('cmpl1efjg7db6w6th').returns(Immutable.Map(compound));
    sandbox.stub(UserStore, 'getById').withArgs('u19ahey7f2').returns(Immutable.Map({ email: 'example@user.com' }));
    const downloadLink = decodeURIComponent(await CompoundsPageActions.downloadCSV(['cmpl1efjg7db6w6th']));
    const csv = Papa.parse(downloadLink.substring(downloadLink.indexOf(',') + 1));
    const headers = csv.data[0];
    const row = csv.data[1];
    expect(row[headers.indexOf('Structure')]).equal(compound.smiles);
    expect(row[headers.indexOf('Nickname')]).equal(compound.name);
    expect(row[headers.indexOf('RefId')]).equal(compound.reference_id);
    expect(row[headers.indexOf('Id')]).equal(compound.id);
    expect(row[headers.indexOf('Formula')]).equal(compound.formula);
    expect(row[headers.indexOf('Weight')]).equal(compound.molecular_weight);
    expect(row[headers.indexOf('ExactMass')]).equal(compound.exact_molecular_weight);
    expect(row[headers.indexOf('TPSA')]).equal(compound.tpsa);
    expect(row[headers.indexOf('cLogp')]).equal(compound.clogp);
    expect(row[headers.indexOf('Created')]).equal(Moment(compound.created_at).format('MMM D, YYYY'));
    expect(row[headers.indexOf('Labels')]).equal(compound.labels.toJS().map(label => label.name).join(','));
    expect(row[headers.indexOf('Creator')]).equal('example@user.com');
    expect(row[headers.indexOf('OrganizationName')]).equal(compound.organization_name);
    expect(row[headers.indexOf('MFCD')]).equal(compound.mfcd_number);
    expect(row[headers.indexOf('CAS')]).equal(compound.cas_number);
    expect(row[headers.indexOf('Score')]).equal(compound.search_score);
    expect(row[headers.indexOf('PubchemId')]).equal(compound.pub_chem_id);
    expect(row[headers.indexOf('Source')]).equal('Public');
    expect(row[headers.indexOf('ExternalSystemId')]).equal('');
    expect(row[headers.indexOf('Hazards')]).equal('flammable,strong_acid');
  });

  it('should have correct number of rows after csv download ', async () => {
    const numberOfDownloads = 24;
    const compound = {
      clogp: '2.304',
      created_at: undefined,
      created_by: 'u19ahey7f2',
      id: 'cmpl1efjg7db6w6th',
      smiles: 'C#CCN1CCC2=C(C1)c1c(OC(=O)CCCN3CCCCC3)cc(C(C)C(C)CCCNN)cc1OC2(C)C\\.-=#$:/$',
      formula: 'C10H19N',
      molecular_weight: '153.27',
      exact_molecular_weight: '153.212345',
      tpsa: '26.02',
      labels: Immutable.List([{ name: 'label1', organization_id: 'org13' }, { name: 'label2', organization_id: 'org13' }]),
      name: 'mol',
      reference_id: '1235'
    };
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.Map(compound));
    sandbox.stub(UserStore, 'getById').returns(Immutable.Map({ email: 'example@user.com' }));
    const compoundsList = [];
    for (let i = 0; i < numberOfDownloads; i++) {
      compoundsList.push(compound.id);
    }
    const downloadLink = decodeURIComponent(await CompoundsPageActions.downloadCSV(compoundsList));
    const csv = Papa.parse(downloadLink.substring(downloadLink.indexOf(',') + 1));
    expect(csv.data.length).equal(numberOfDownloads + 1);
  });

  it('should have correct values if the creator is undefined in csv download', async () => {
    const compound = {
      clogp: '2.304',
      created_at: '2020-05-22T16:00:41.172-07:00',
      created_by: 'u19ahey7f2',
      id: 'cmpl1efjg7db6w6th',
      smiles: 'C#CCN1CCC2=C(C1)c1c(OC(=O)CCCN3CCCCC3)cc(C(C)C(C)CCCNN)cc1OC2(C)C\\.-=#$:/$',
      formula: 'C10H19N',
      molecular_weight: '153.27',
      exact_molecular_weight: '153.212345',
      tpsa: '26.02',
      labels: Immutable.List([{ name: 'label1', organization_id: 'org13' }, { name: 'label2', organization_id: 'org13' }]),
      name: 'mol',
      reference_id: '1235'
    };
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.Map(compound));
    sandbox.stub(UserStore, 'getById').returns(undefined);
    const downloadLink = decodeURIComponent(await CompoundsPageActions.downloadCSV(['testId']));
    const csv = Papa.parse(downloadLink.substring(downloadLink.indexOf(',') + 1));
    const headers = csv.data[0];
    const row = csv.data[1];
    expect(row[headers.indexOf('Structure')]).equal(compound.smiles);
    expect(row[headers.indexOf('Nickname')]).equal(compound.name);
    expect(row[headers.indexOf('RefId')]).equal(compound.reference_id);
    expect(row[headers.indexOf('Id')]).equal(compound.id);
    expect(row[headers.indexOf('Formula')]).equal(compound.formula);
    expect(row[headers.indexOf('Weight')]).equal(compound.molecular_weight);
    expect(row[headers.indexOf('ExactMass')]).equal(compound.exact_molecular_weight);
    expect(row[headers.indexOf('TPSA')]).equal(compound.tpsa);
    expect(row[headers.indexOf('cLogp')]).equal(compound.clogp);
    expect(row[headers.indexOf('Created')]).equal(Moment(compound.created_at).format('MMM D, YYYY'));
    expect(row[headers.indexOf('Labels')]).equal(compound.labels.toJS().map(label => label.name).join(','));
    expect(row[headers.indexOf('Creator')]).equal('');
  });

  it('should have correct values if the name, ref_id are undefined in csv download', async () => {
    const compound = {
      clogp: '2.304',
      created_at: undefined,
      created_by: undefined,
      id: 'cmpl1efjg7db6w6th',
      smiles: undefined,
      formula: 'C10H19N',
      molecular_weight: '153.27',
      exact_molecular_weight: '153.212345',
      tpsa: '26.02',
      labels: Immutable.List([{ name: 'label1', organization_id: 'org13' }, { name: 'label2', organization_id: 'org13' }]),
      name: undefined,
      reference_id: undefined
    };
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.Map(compound));
    sandbox.stub(UserStore, 'getById').returns(undefined);
    const downloadLink = decodeURIComponent(await CompoundsPageActions.downloadCSV(['testId']));
    const csv = Papa.parse(downloadLink.substring(downloadLink.indexOf(',') + 1));
    const headers = csv.data[0];
    const row = csv.data[1];
    // undefined will be replaced by empty string in csv
    expect(row[headers.indexOf('Structure')]).equal(compound.smiles || '');
    expect(row[headers.indexOf('Nickname')]).equal(compound.name || '');
    expect(row[headers.indexOf('RefId')]).equal(compound.reference_id || '');
    expect(row[headers.indexOf('Id')]).equal(compound.id || '');
    expect(row[headers.indexOf('Formula')]).equal(compound.formula || '');
    expect(row[headers.indexOf('Weight')]).equal(compound.molecular_weight || '');
    expect(row[headers.indexOf('ExactMass')]).equal(compound.exact_molecular_weight || '');
    expect(row[headers.indexOf('TPSA')]).equal(compound.tpsa || '');
    expect(row[headers.indexOf('cLogp')]).equal(compound.clogp || '');
    expect(row[headers.indexOf('Created')]).equal(Moment(compound.created_at).format('MMM D, YYYY'));
    expect(row[headers.indexOf('Labels')]).equal(compound.labels.toJS().map(label => label.name).join(','));
    expect(row[headers.indexOf('Creator')]).equal('');
  });

  it('should have the correct data when sdf file is downloaded', async () => {
    const compound = {
      clogp: '2.304',
      id: 'testId',
      smiles: 'CC(CC)',
      sdf: 'test-ccp',
      formula: 'C10H19N',
      molecular_weight: '153.27',
      exact_molecular_weight: '153.212345',
      tpsa: '26.02',
      labels: Immutable.List([{ name: 'label1', organization_id: 'org13' }, { name: 'label2', organization_id: 'org13' }]),
    };
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.Map(compound));
    const spy = sandbox.stub(SDFUtil, 'downloadSDF');
    await CompoundsPageActions.downloadSDF(['testId']);
    expect(spy.calledOnce).to.be.true;
  });

  it('should fetch from CompoundAPI if store doesn\'t have the record', async () => {
    const compound = {
      data: {
        id: 'cmpl1gr7zvdeehhr6',
        type: 'compounds',
        links: {
          self: 'testing'
        },
        attributes: {
          sdf: 'test-ccp'
        }
      }
    };

    sandbox.stub(CompoundStore, 'getById').returns(undefined);
    const compoundAPI = sandbox.stub(CompoundAPI, 'get').returns(compound);
    await CompoundsPageActions.downloadSDF(['compoundId1']);
    expect(compoundAPI.calledOnce).to.be.true;
  });

  it('should download multiple sdf files as a zip file', async () => {
    const spy = sandbox.stub(ZIPUtil, 'downloadZip');
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.Map(compound));
    await CompoundsPageActions.downloadSDFZip(['compoundId1', 'compoundId2']);
    expect(spy.calledOnce).to.be.true;
    expect(spy.args[0][1]).to.equal('compounds');
  });

  it('should download csv file when isSDF is false', () => {
    const downloadCSVSpy = sandbox.stub(CompoundsPageActions, 'downloadCSV');
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.Map(compound));
    const compoundApiSpy = sandbox.stub(CompoundAPI, 'get');
    CompoundsPageActions.downloadCompounds(true, false, ['compoundId1', 'compoundId2']);
    expect(downloadCSVSpy.calledOnce).to.be.true;
    expect(compoundApiSpy.notCalled).to.be.true;
  });

  it('should convert sdf and csv files into single zip file', async () => {
    const downloadZipSpy = sandbox.stub(ZIPUtil, 'downloadZip');
    const compoundApiSpy = sandbox.stub(CompoundAPI, 'get');
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.Map(compound));
    await CompoundsPageActions.downloadCompounds(true, true, ['compoundId1', 'compoundId2']);
    expect(downloadZipSpy.calledOnce).to.be.true;
    expect(compoundApiSpy.notCalled).to.be.true;
  });

  it('should call downloadCSVAndSDF when isCsv and isSDF is true', async () => {
    const downloadCSVAndSDFSpy = sandbox.stub(CompoundsPageActions, 'downloadCSVAndSDF');
    const compoundApiSpy = sandbox.stub(CompoundAPI, 'get');
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.Map(compound));
    await CompoundsPageActions.downloadCompounds(true, true, ['compoundId1', 'compoundId2']).catch(() => {});
    expect(downloadCSVAndSDFSpy.calledOnce).to.be.true;
    expect(downloadCSVAndSDFSpy.args[0][0]).to.eql(['compoundId1', 'compoundId2']);
    expect(compoundApiSpy.notCalled).to.be.true;
  });

  it('should call downloadCSV when only csv is requested', async () => {
    const downloadCSVsSpy = sandbox.spy(CompoundsPageActions, 'downloadCSV');
    const compoundApiSpy = sandbox.stub(CompoundAPI, 'get');
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.Map(compound));
    await CompoundsPageActions.downloadCompounds(true, false, ['compoundId1', 'compoundId2']);
    expect(downloadCSVsSpy.calledOnce).to.be.true;
    expect(downloadCSVsSpy.args[0][0]).to.eql(['compoundId1', 'compoundId2']);
    expect(compoundApiSpy.notCalled).to.be.true;
  });

  it('should call downloadSDF when only sdf is requested', () => {
    const downloadSDFSpy = sandbox.stub(CompoundsPageActions, 'downloadSDF');
    const compoundApiSpy = sandbox.spy(CompoundAPI, 'get');
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.Map(compound));
    CompoundsPageActions.downloadCompounds(false, true, ['compoundId1']);
    expect(downloadSDFSpy.calledOnce).to.be.true;
    expect(downloadSDFSpy.calledWith(['compoundId1'])).to.be.true;
    expect(compoundApiSpy.notCalled).to.be.true;
  });

  it('should call downloadSDFZIP when isCsv is false and isSDF is true and when compounds length is greater than 1', () => {
    const downloadSDFZipSpy = sandbox.stub(CompoundsPageActions, 'downloadSDFZip');
    const compoundApiSpy = sandbox.stub(CompoundAPI, 'get');
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.Map(compound));
    CompoundsPageActions.downloadCompounds(false, true, ['compoundId1', 'compoundId2']);
    expect(downloadSDFZipSpy.calledOnce).to.be.true;
    expect(downloadSDFZipSpy.args[0][0]).to.eql(['compoundId1', 'compoundId2']);
    expect(compoundApiSpy.notCalled).to.be.true;
  });

  it('should call downloadSDFZIP when isCsv is false and isSDF is true and when compounds length is equal to 1', () => {
    const downloadSDFSpy = sandbox.stub(CompoundsPageActions, 'downloadSDFFile');
    const compoundApiSpy = sandbox.stub(CompoundAPI, 'get');
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.Map(compound));
    CompoundsPageActions.downloadCompounds(false, true, ['compoundId1']);
    expect(compoundApiSpy.notCalled).to.be.true;
    expect(downloadSDFSpy.calledOnce).to.be.true;
    expect(downloadSDFSpy.args[0][0]).to.eql('compoundId1');
  });

  it('should download csv file when csvData is false', async () => {
    const downloadCSVFromJSONSpy = sandbox.stub(CSVUtil, 'downloadCSVFromJSON');
    const compoundApiSpy = sandbox.stub(CompoundAPI, 'get');
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.Map(compound));
    await CompoundsPageActions.downloadCSV(['compoundId1', 'compoundId2'], false);
    expect(downloadCSVFromJSONSpy.calledOnce).to.be.true;
    expect(compoundApiSpy.notCalled).to.be.true;
  });

  it('should return csv file when csvData is true', async () => {
    const spy = sandbox.stub(Papa, 'unparse');
    const downloadCSVFromJSONSpy = sandbox.stub(CSVUtil, 'downloadCSVFromJSON');
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.Map(compound));
    await CompoundsPageActions.downloadCSV(['compoundId1', 'compoundId2'], true);
    expect(spy.calledOnce).to.be.true;
    expect(downloadCSVFromJSONSpy.notCalled).to.be.true;
  });

  it('should display error toast message when compound is not found', async () => {
    sandbox.stub(CompoundStore, 'getById')
      .returns(undefined);
    const notificationActionsSpy = sandbox.stub(NotificationActions, 'createNotification');
    const xhrFailed = {
      readyState: 4,
      responseText: '{"errors":[{"title":"Record not found","detail":"The record identified by ccpc1gq5u2yd6nb5v could not be found.","code":"404","status":"404"}]}',
      responseJSON: {
        errors: [
          {
            title: 'Record not found',
            detail: 'The record identified by ccpc1gq5u2yd6nb5v could not be found.',
            code: '404',
            status: '404'
          }
        ]
      },
      status: 404,
      statusText: 'Not Found'
    };

    const compoundApi = sandbox.stub(CompoundAPI, 'get').throws(xhrFailed);

    await CompoundsPageActions.downloadCompounds(true, true, ['ccpc1gq5u2yd6nb5v']).catch(() => {});
    expect(compoundApi.calledOnce).to.be.true;
    expect(notificationActionsSpy.calledOnce).to.be.true;
    expect(notificationActionsSpy.args[0][0].text).equal('The record identified by ccpc1gq5u2yd6nb5v could not be found.');
  });

  it('should set and unset state isSearching when doSearch action is called', async () => {
    sandbox.restore();
    const singly = ajax.singly();
    sandbox.stub(CompoundsPageActions, 'search_queue').callsFake(singly);
    sandbox.stub(SessionStore, 'getOrg').returns(organization);
    const updateStateSpy = sandbox.spy(CompoundsPageActions, 'updateState');
    sandbox.stub(CompoundAPI, 'index').callsFake(() => {
      expect(updateStateSpy.args[0][0]).to.deep.equal({ isSearching: true });
      return {
        done: () => { },
        always: (cb) => {
          cb();
          expect(updateStateSpy.args[1][0]).to.deep.equal({ isSearching: false });
        },
        fail: () => { }
      };
    });
    return CompoundsPageActions.doSearch({ limit: getDefaultSearchPerPage(), page: '1' }, fakeMethod,  fakeMethod);
  });
});
