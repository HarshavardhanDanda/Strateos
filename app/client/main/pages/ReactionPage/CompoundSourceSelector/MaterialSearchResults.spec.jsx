import React from 'react';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import Immutable from 'immutable';
import SessionStore from 'main/stores/SessionStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import { Pagination, List, Table } from '@transcriptic/amino';
import CompoundStore from 'main/stores/CompoundStore';
import MaterialSearchResults from './MaterialSearchResults';

describe('MaterialSearchResults', () => {

  const sandbox = sinon.createSandbox();
  const materialData = [{
    vendor: {
      created_at: '2012-06-12T00:14:57.000-07:00',
      name: 'GenScript',
      updated_at: '2021-04-05T08:14:32.234-07:00',
      vendor_has_materials: true,
      id: 'vend1f',
      type: 'vendors'
    },
    created_at: '2022-05-04T01:54:40.994-07:00',
    name: 'BenzoicAcidProvisionable2',
    supplier: {
      created_at: '2021-07-16T14:46:29.347-07:00',
      name: 'Enamine',
      updated_at: '2021-08-06T05:17:01.878-07:00',
      is_preferred: true,
      id: 'sup1fxyfj42uvjzz',
      type: 'suppliers'
    },
    material_components: [
      {
        material_id: 'mat1gz76u2pky58g',
        resource_id: 'rs1fzs98nuw7azd',
        id: 'matc1gz76u2prgwrk',
        type: 'material_components',
        resource: {
          organization_id: 'org13',
          acl: [],
          created_at: '2021-08-01T21:34:49.918-07:00',
          compound: {
            model: {
              organization_id: null,
              created_at: '2019-06-17T17:24:09.559-07:00',
              name: 'Benzoic-acid',
              created_by: 'ad17h37hcyb6uc',
              compound_id: 'd7a041ea-da09-af9a-9af6-383b1175cc15',
              reference_id: 'Benz-798789',
              properties: {},
              deprecated_inchi_key: 'WPYMKLBDIGXBTP-UHFFFAOYSA-N',
              updated_at: '2021-11-25T02:09:10.280-08:00',
              id: 'cmpl1d8yndvdpzpef'
            },
            context: null,
            reload_needed: false,
            changing: false,
            save_needed: false
          },
          name: 'BenzoicAcid',
          properties: {},
          kind: 'ChemicalStructure',
          storage_condition: 'cold_4',
          updated_at: '2021-08-01T21:34:49.918-07:00',
          deleted_at: null,
          type: 'resources',
          id: 'rs1fzs98nuw7azd',
          description: null,
          sensitivities: [],
          design: {}
        }
      }
    ],
    is_private: false,
    url: null,
    total_ordered: 0,
    material_type: 'individual',
    note: null,
    organization: {
      test_account: false,
      default_payment_method_id: 'pm1dffyk3tbmwsw',
      subdomain: 'transcriptic',
      signals_api_key: null,
      owner_id: 'user0605202109',
      created_at: '2014-03-06T20:09:18.712-08:00',
      name: 'Strateos',
      updated_at: '2021-04-21T15:46:50.434-07:00',
      api_key: '25711aecebda3c06695af9a14046c1d6',
      type: 'organizations',
      id: 'org13',
      signals_tenant: null,
      account_manager_id: null
    },
    orderable_materials: [
      {
        price: 27,
        margin: 0.1,
        sku: '656783',
        tier: null,
        id: 'omat1gz76u2pqcqmj',
        type: 'orderable_materials'
      }
    ],
    updated_at: '2022-05-04T01:54:40.994-07:00',
    deleted_at: null,
    type: 'materials',
    id: 'mat1gz76u2pky58g'
  }];

  const compound = {
    oxidizer: null,
    strong_acid: null,
    formula: 'C7H6O2',
    exact_molecular_weight: '122.036779',
    molecular_weight: '122.12',
    organization_id: null,
    general: null,
    no_flags: true,
    unknown: null,
    created_at: '2019-06-17T17:24:09.559-07:00',
    tpsa: '37.3',
    smiles: 'O=C(O)c1ccccc1',
    name: 'Benzoic-acid',
    pub_chem_id: null,
    peroxide_former: null,
    created_by: 'ad17h37hcyb6uc',
    mfcd_number: null,
    compound_id: 'd7a041ea-da09-af9a-9af6-383b1175cc15',
    clogp: '1.3848',
    reference_id: 'Benz-798789',
    water_reactive_nucleophile: null,
    properties: {},
    contextual_custom_properties: [],
    cas_number: null,
    flammable: null,
    organization_name: null,
    strong_base: null,
    type: 'compounds',
    id: 'cmpl1d8yndvdpzpef',
    search_score: null,
    water_reactive_electrophile: null,
    external_system_ids: [],
    inchi_key: 'WPYMKLBDIGXBTP-UHFFFAOYSA-N',
    labels: []
  };

  const records = Immutable.fromJS(materialData);

  const props = {
    data: records,
    selected: [],
    searchOptions: { get: () => [] },
    pageSize: 12,
    page: 1,
    numPages: 5,
    onSearchPageChange: sinon.spy(),
    onSelectRow: sinon.spy(),
    onSortChange: sinon.spy(),
    onSearchFilterChange: sinon.spy(),
    onRowClick: sinon.spy(),
    isSearching: false
  };

  beforeEach(() => {
    const compoundId = 'cmpl1d8yndvdpzpef';
    sandbox.stub(CompoundStore, 'getById')
      .withArgs(compoundId)
      .returns(Immutable.fromJS(compound));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should have a default empty message', () => {
    const input = { ...props };
    input.data = Immutable.fromJS([]);
    const table = shallow(<MaterialSearchResults {...input} />)
      .find(List)
      .dive()
      .find(Table)
      .dive();
    expect(table.text()).to.equal('No records.');
  });

  it(' should have 8 columns by default', () => {
    const input = { ...props };
    input.data = Immutable.fromJS([]);
    const list = shallow(<MaterialSearchResults {...input} />)
      .find(List)
      .dive();
    expect(list.find('.list__topBar--right').render().text()).to.contains('Columns 8');
  });

  it('should have corresponding persistence key info to enable user preference', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));
    const input = { ...props };
    input.data = Immutable.fromJS([]);
    const list = shallow(<MaterialSearchResults {...input} />)
      .find(List);

    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.REACTIONS_COMPOUND_LINKED_MATERIALS_TABLE
    });
  });

  it('verify table data', () => {
    const input = { ...props };
    const list = shallow(<MaterialSearchResults {...input} />)
      .find(List)
      .dive()
      .find(Table)
      .dive();
    const body = list.find('Block').find('Body').find('Row').at(0);
    expect(body.find('BodyCell').length).to.equal(9);
    const bodycell1 = body.find('BodyCell').at(1);
    expect(bodycell1.dive().find('Molecule').at(0).prop('SMILES')).to.equal('O=C(O)c1ccccc1');
    expect(body.find('BodyCell').at(2).dive().text()).to.equal('Benzoic-acid');
    expect(body.find('BodyCell').at(3).dive().text()).to.equal('Benz-798789');
    expect(body.find('BodyCell').at(4).dive().text()).to.equal('122.12');
    expect(body.find('BodyCell').at(5).dive().text()).to.equal('cmpl1d8yndvdpzpef');
    expect(body.find('BodyCell').at(6).dive().text()).to.equal('Enamine');
    expect(body.find('BodyCell').at(7).dive().text()).to.equal('GenScript');
    expect(body.find('BodyCell').at(8).dive().text()).to.equal('-');
  });

  it('no of rows validation', () => {
    const input = { ...props };
    const list = shallow(<MaterialSearchResults {...input} />)
      .find(List)
      .dive()
      .find(Table)
      .dive();
    const rows = list.find('Block').find('Body').find('Row');
    expect(rows.length).to.equal(1);
  });

  it('should show pagination if there are records', () => {
    const input = { ...props };
    const list = shallow(<MaterialSearchResults {...input} />).find(List);
    expect(list.dive().find(Pagination)).to.have.length(1);
  });

  it('should not show pagination if there are no records', () => {
    const input = { ...props };
    input.data = Immutable.fromJS([]);
    const list = shallow(<MaterialSearchResults {...input} />).find(List);
    expect(list.dive().find(Pagination)).to.have.length(0);
  });

  it('should have spinner when isSearching is true', () => {
    const wrapper = mount(<MaterialSearchResults {...props} isSearching />);
    expect(wrapper.find('Spinner').length).to.be.equal(1);
  });
});
