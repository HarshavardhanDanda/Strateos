import sinon from 'sinon';
import Moment from 'moment';
import ajax from 'main/util/ajax';
import Papa from 'papaparse';
import { expect } from 'chai';
import Immutable  from 'immutable';
import JSZip from 'jszip';

import ContainerStore from 'main/stores/ContainerStore';
import CompoundStore from 'main/stores/CompoundStore';
import AliquotCompoundLinkStore from 'main/stores/AliquotCompoundLinkStore';
import ContextualCustomPropertyConfigStore from 'main/stores/ContextualCustomPropertyConfigStore';
import UserStore from 'main/stores/UserStore';
import NotificationActions from 'main/actions/NotificationActions';
import AliquotAPI from 'main/api/AliquotAPI';
import ZIPUtil from 'main/util/ZIPUtil';
import CSVUtil from 'main/util/CSVUtil';
import AliquotActions, {
  getCompoundLinkIdsAndConcentrationMap,
  getCompoundCSVFields,
  getMaxAliquotCount,
  getUniqueOrgIdNameMappings,
  initializeCSVFields,
  loadContextualCustomPropertiesConfig,
  setCSVFields,
} from './AliquotActions';
import ContextualCustomPropertiesConfigActions from './ContextualCustomPropertiesConfigActions';

const containerTypesData = [{
  id: 'flask-250',
  attributes: {
    name: '250mL Flask',
    well_idx: 0,
    volume_ul: '250000.0',
    created_at: '2021-02-02T08:36:23.086-08:00',
    container_id: 'ct1fcts2at9rmdx',
    contextual_custom_properties: [
      { id: 'aq_ccp_1', key: 'solvent_id', value: '1234' },
    ],
    properties: { kvp_aliquot1: 'aq_flask250_test', kvp_aliquot2: 'aq_flask250_test2' },
    container: {
      contextual_custom_properties: [
        { id: 'ct_ccp_1', key: 'project_id', value: 'testprojectid' },
        { id: 'ct_ccp_2', key: 'msc_request_id', value: 'testmscrequestid' },
        { id: 'ct_ccp_3', key: 'msc_test_id', value: 'mscval1' },
        { id: 'ct_ccp_4', key: 'project_group_id', value: 'projval1;projval2' },
      ],
      properties: { kvp_container1: 'ct_flask250_test', kvp_container2: 'ct_flask250_test2' },
      organization_id: 'org13',
      organization_name: 'Strateos'
    },
  },
  type: 'aliquots'
},
{
  id: 'micro-1.5',
  attributes: {
    name: 'Micro 1.5',
    well_idx: 0,
    volume_ul: '10.0',
    created_at: '2021-02-03T08:36:23.086-08:00',
    container_id: 'ct12cts2at9r321x',
    contextual_custom_properties: [
      { id: 'aq_ccp_1', key: 'solvent_id', value: '321' },
      { id: 'aq_ccp_2', key: 'aliquot_group', value: 'aliqval1;aliqval2' },
    ],
    properties: { kvp_aliquot1: 'aq_micro_test', kvp_aliquot3: 'aq_micro_test3', kvp_aliquot4: 'aq_micro_test4' },
    container: {
      contextual_custom_properties: [
        { id: 'ct_ccp_1', key: 'project_id', value: 'projecttest123' },
        { id: 'ct_ccp_2', key: 'msc_request_id', value: 'msc_request_test_123' },
      ],
      properties: { kvp_container1: 'ct_micro_test', kvp_container3: 'ct_micro_test3', kvp_container4: 'ct_micro_test4' },
      organization_id: 'org13',
      organization_name: 'Strateos'
    },
  },
  type: 'aliquots'
},
{
  id: 'micro-2.0',
  attributes: {
    name: 'Micro 2.0',
    well_idx: 0,
    volume_ul: '10.0',
    created_at: '2021-02-04T08:36:23.086-08:00',
    container_id: 'ct42cts2at9r331',
    contextual_custom_properties: [
      { id: 'aq_ccp_2', key: 'submission_id', value: '321' },
    ],
    properties: { kvp_aliquot1: 'micro_lilly_aq', kvp_aliquot5: 'micro_lilly_aq5' },
    container: {
      contextual_custom_properties: [
        { id: 'ct_ccp_3', key: 'msc_order_id', value: 'mscordertest' },
        { id: 'ct_ccp_4', key: 'container_source_id', value: 'contsourcetest' },
      ],
      properties: { kvp_container1: 'micro_lilly_ct', kvp_container5: 'micro_lilly_ct5' },
      organization_id: 'org16ybu85maxuu',
      organization_name: 'Lilly'
    },
  },
  type: 'aliquots'
},
{
  id: 'vendor-tube',
  attributes: {
    name: 'Vendor Tube',
    well_idx: 0,
    volume_ul: '250000.0',
    created_at: '2021-02-02T08:36:23.086-08:00',
    container_id: 'ct2hcts2at9rm98',
    contextual_custom_properties: [
      { id: 'aq_ccp_1', key: 'solvent_id', value: '1234' },
    ],
    properties: { kvp_aliquot1: 'aq_test6' },
    container: {
      contextual_custom_properties: [
        { id: 'ct_ccp_1', key: 'project_id', value: 'project_123' },
        { id: 'ct_ccp_2', key: 'msc_request_id', value: 'msc_request_123' },
      ],
      properties: { kvp_container1: 'ct_test6' },
      organization_id: null,
      organization_name: null
    },
  },
  type: 'aliquots'
}];

const containerCCPCs = Immutable.fromJS([
  { id: 'ct_ccpc_1', key: 'project_id', config_definition: { type: 'string' } },
  { id: 'ct_ccpc_2', key: 'msc_request_id', config_definition: { type: 'string' } },
  {
    id: 'ct_ccpc_3',
    key: 'msc_test_id',
    config_definition: {
      type: 'choice',
      options: [{ name: 'msctest1', value: 'mscval1' }, { name: 'msctest2', value: 'mscval2' }]
    }
  },
  {
    id: 'ct_ccpc_4',
    key: 'project_group_id',
    config_definition: {
      type: 'multi-choice',
      options: [{ name: 'projgrp1', value: 'projval1' }, { name: 'projgrp2', value: 'projval2' }]
    }
  },
]);

const aliquotCCPCs = Immutable.fromJS([
  { id: 'aq_ccpc_1', key: 'solvent_id', config_definition: { type: 'string' } },
  {
    id: 'aq_ccpc_2',
    key: 'aliquot_group',
    config_definition: {
      type: 'multi-choice',
      options: [{ name: 'aliqgrp1', value: 'aliqval1' }, { name: 'aliqgrp2', value: 'aliqval2' }]
    }
  }
]);

describe('Aliquot Actions', () => {
  const apiPath = '/api/aliquots?include=aliquots_compound_links,compounds,contextual_custom_properties,container.contextual_custom_properties&filter[container_id]=ct1fcts2at9rmdx';
  const sandbox = sinon.createSandbox();
  let loadConfig;
  beforeEach(() => {
    loadConfig = sandbox
      .stub(ContextualCustomPropertiesConfigActions, 'loadConfig')
      .returns({
        then: (cb) => {
          cb();
          return { fail: () => ({}) };
        },
      });
    sandbox.stub(ContextualCustomPropertyConfigStore, 'loadCustomPropertiesConfig')
      .withArgs('org13', 'Container')
      .returns(containerCCPCs)
      .withArgs('org13', 'Aliquot')
      .returns(aliquotCCPCs)
      .withArgs('org16ybu85maxuu', 'Container')
      .returns(Immutable.fromJS([]))
      .withArgs('org16ybu85maxuu', 'Aliquot')
      .returns(Immutable.fromJS([]));

    const containers = [
      Immutable.fromJS({
        id: 'ct1fcts2at9rmdx',
        container_type: {
          col_count: 1,
          well_count: 1
        },
        organization_id: 'org13',
        organization_name: 'Strateos'
      }),
      Immutable.fromJS({
        id: 'ct12cts2at9r321x',
        container_type: {
          col_count: 1,
          well_count: 1
        },
        organization_id: 'org13',
        organization_name: 'Strateos'
      }),
      Immutable.fromJS({
        id: 'ct42cts2at9r331',
        container_type: {
          col_count: 1,
          well_count: 1
        },
        organization_id: 'org16ybu85maxuu',
        organization_name: 'Lilly'
      })
    ];

    sandbox.stub(ContainerStore, 'getById')
      .withArgs('ct1fcts2at9rmdx').returns(containers[0])
      .withArgs('ct12cts2at9r321x')
      .returns(containers[1])
      .withArgs('ct42cts2at9r331')
      .returns(containers[2]);

    sandbox.stub(UserStore, 'getById').returns(Immutable.Map({ name: 'test_user' }));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('getMaxAliquotCount should return max aliquot count of containers', () => {
    const containers = [
      {
        id: 'aq1et8cdx7t3j52',
        aliquot_count: 5
      }, {
        id: 'aq1et8cdx7t3j51',
        aliquot_count: 0
      }, {
        id: 'aq1et8cdx7t3j51',
        aliquot_count: 10
      }, {
        id: 'aq1et8cdx7t3j51',
        aliquots: [{ id: 'a' }, { id: 'b' }]
      }
    ];
    const maxAliquotCount = getMaxAliquotCount(Immutable.fromJS(containers));
    expect(maxAliquotCount).equals(10);
  });

  it('should return unique organisation ids', () => {
    const containers = [
      {
        id: 'ct1fcts2at9rmdx',
        organization_id: 'org13',
        organization_name: 'transcriptic'
      },
      {
        id: 'ct12cts2at9r321x',
        organization_id: 'org13',
        organization_name: 'transcriptic'
      },
      {
        id: 'ct42cts2at9r331',
        organization_id: 'org16ybu85maxuu',
        organization_name: 'other org'
      },
    ];
    const { orgIds, orgIdNameMap } = getUniqueOrgIdNameMappings(Immutable.fromJS(containers));
    expect(orgIds[0]).equals('org13');
    expect(orgIds[1]).equals('org16ybu85maxuu');
    expect(orgIdNameMap).to.be.deep.equals({ org13: 'transcriptic', org16ybu85maxuu: 'other org' });
  });

  it('should call loadConfig and loadCustomPropertiesConfig', async () => {
    const orgIds = ['org13', 'org16ybu85maxuu'];
    const {
      ccpcContainerHeadersByOrg,
      ccpcAliquotHeadersByOrg,
      containerCCPCsByOrg,
      aliquotCCPCsByOrg
    } = await loadContextualCustomPropertiesConfig(orgIds);
    expect(loadConfig.calledTwice).to.be.true;
    expect(ccpcContainerHeadersByOrg).to.be.deep.equal({
      org13: { ct_project_id: '', ct_msc_request_id: '', ct_msc_test_id: '', ct_project_group_id: '' },
      org16ybu85maxuu: {}
    });
    expect(ccpcAliquotHeadersByOrg).to.be.deep.equal({
      org13: { aq_solvent_id: '', aq_aliquot_group: '' },
      org16ybu85maxuu: {}
    });
    expect(containerCCPCsByOrg).to.be.deep.equal({
      org13: containerCCPCs.toJS(),
      org16ybu85maxuu: []
    });
    expect(aliquotCCPCsByOrg).to.be.deep.equal({
      org13: aliquotCCPCs.toJS(),
      org16ybu85maxuu: []
    });
  });

  it('should get compound link ids and concentration', () => {
    const aliquot = { id: 'aq17h2ajbw0003' };
    sandbox.stub(AliquotCompoundLinkStore, 'getByAliquotId').returns([
      Immutable.fromJS({
        compound_link_id: 'cmpl1guu882a8s5sw',
        concentration: 12,
      }),
    ]);
    const { compoundLinkIds, compoundLinkConcentration } = getCompoundLinkIdsAndConcentrationMap(aliquot);
    expect(compoundLinkIds).deep.equals(['cmpl1guu882a8s5sw']);
    expect(compoundLinkConcentration).deep.equals({ cmpl1guu882a8s5sw: 12 });
  });

  it('should initialize csv fields', () => {
    const aliquot = {
      id: 'aq17h2ajbw0003',
      name: 'test',
      volume_ul: '30.0',
      created_at: '2022-11-21T22:21:55.089-08:00',
      well_idx: 1
    };
    const container = {
      label: 'test100',
      id: 'ct1fcts2at9rmdx',
      container_type_id: 'vendor-tube',
      container_type: {
        col_count: 1,
        well_count: 1,
      }
    };
    const csvFields = initializeCSVFields(
      aliquot,
      container,
      { ct_prop_1: '', aq_prop1: '' },
      { ct_project_id: '', aq_solvent_id: '' }
    );
    expect(csvFields.aliquot_name).equals('test');
    expect(csvFields.container_label).equals('test100');
    expect(csvFields.container_id).equals('ct1fcts2at9rmdx');
    expect(csvFields.container_type).equals('vendor-tube');
    expect(csvFields.aliquot_id).equals('aq17h2ajbw0003');
    expect(csvFields.well).equals(1);
    expect(csvFields.human_well).equals('B1');
    expect(csvFields.created_at).deep.equals(
      Moment('2022-11-21T22:21:55.089-08:00')
    );
    expect(csvFields.volume_remaining).equals('30.0');
    expect(csvFields.concentration).equals('');
    expect(csvFields.compound_link_id).equals('');
    expect(csvFields.smiles).equals('');
    expect(csvFields.molecular_weight).equals('');
    expect(csvFields.reference_id).equals('');
    expect(csvFields.external_system_ids).equals('');
    expect(csvFields.ct_prop_1).equals('');
    expect(csvFields.aq_prop1).equals('');
    expect(csvFields.ct_project_id).equals('');
    expect(csvFields.aq_solvent_id).equals('');
  });

  it('should get CompoundLink CSV fields', () => {
    const csvFields = {};
    sandbox.stub(CompoundStore, 'getById').returns(
      Immutable.fromJS({
        m_moles: '1',
        molecular_weight: '108.21',
        smiles: 'S=C([S-])[S-]',
        reference_id: '2',
        id: 'cmpl1guu882a8s5sw',
        external_system_ids: [
          { id: 'clextid1', external_system_id: 'external_sys_id-1' },
        ],
      })
    );
    const compoundLinkId = 'cmpl1guu882a8s5sw';
    getCompoundCSVFields(compoundLinkId, csvFields, 12);
    expect(csvFields.compound_link_id).equals('cmpl1guu882a8s5sw');
    expect(csvFields.smiles).equals('S=C([S-])[S-]');
    expect(csvFields.molecular_weight).equals('108.21');
    expect(csvFields.reference_id).equals('2');
    expect(csvFields.external_system_ids).equals('external_sys_id-1');
  });

  it('should set csv fields based on column', () => {
    const csvFields = {};
    const container = {
      id: 'ct1fcts2at9rmdx',
      barcode: '232213',
      label: 'test100',
      status: 'available',
      container_type: {
        col_count: 1,
        well_count: 1,
      },
      lab: { name: 'test1' },
      organization_id: 'org13',
      organization_name: 'Strateos',
      aliquot_count: 2,
      storage_condition: 'cold_80',
      updated_at: '2022-11-21T22:21:55.089-08:00',
      shipment_code: 'ABC',
      generated_by_run_id: 'r1cc2xauy7qaa',
      created_by: 'system_user'
    };
    setCSVFields('status', csvFields, container);
    expect(csvFields.status).equals('available');
    setCSVFields('contents', csvFields, container);
    expect(csvFields.contents).equals('2 aliquots');
    setCSVFields('condition', csvFields, container);
    expect(csvFields.condition).equals('cold_80');
    setCSVFields('barcode', csvFields, container);
    expect(csvFields.barcode).equals('232213');
    setCSVFields('Last used', csvFields, container);
    expect(csvFields.last_used).deep.equals(
      Moment('2022-11-21T22:21:55.089-08:00'));
    setCSVFields('code', csvFields, container);
    expect(csvFields.shipment_code).equals('ABC');
    setCSVFields('organization', csvFields, container);
    expect(csvFields.organization_name).equals('Strateos');
    setCSVFields('run', csvFields, container);
    expect(csvFields.generated_by_run_id).equals('r1cc2xauy7qaa');
    setCSVFields('creator', csvFields, container);
    expect(csvFields.created_by).equals('test_user');
    setCSVFields('lab', csvFields, container);
    expect(csvFields.lab).equals('test1');
    setCSVFields('empty', csvFields, container);
    expect(csvFields.empty_mass_mg).equals('');
    setCSVFields('empty_mass', csvFields, container);
    expect(csvFields.empty_mass_mg).equals('');
    setCSVFields('location', csvFields, container);
    expect(csvFields.location).equals('');
    setCSVFields('hazards', csvFields, container);
    expect(csvFields.hazards).equals('');
  });

  it('should successfully load aliquots', () => {
    const get = sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb({
          data: containerTypesData,
          meta: {
            record_count: 1
          }
        });
        return { fail: () => ({}) };
      }
    });

    AliquotActions.downloadCSV(['ct1fcts2at9rmdx'], ['type', 'barcode', 'ID']);
    setTimeout(() => {
      sinon.assert.calledWith(get, apiPath);
    }, 0);
  });
});

describe('CSV Download', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(ContextualCustomPropertyConfigStore, 'loadCustomPropertiesConfig')
      .withArgs('org13', 'Container')
      .returns(containerCCPCs)
      .withArgs('org13', 'Aliquot')
      .returns(aliquotCCPCs);
  });

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    const containers = [
      Immutable.fromJS({
        id: 'ct1fcts2at9rmdx',
        barcode: '232213',
        label: 'test100',
        status: 'available',
        empty_mass_mg: '2',
        container_type: {
          col_count: 1,
          well_count: 1
        },
        organization_id: 'org13',
        organization_name: 'Strateos'
      }),
      Immutable.fromJS({
        id: 'ct12cts2at9r321x',
        barcode: '2314',
        label: 'test_cont',
        status: 'available',
        empty_mass_mg: '2',
        container_type: {
          col_count: 1,
          well_count: 1
        },
        organization_id: 'org13'
      }),
      Immutable.fromJS({
        id: 'ct42cts2at9r331',
        barcode: '500012',
        label: 'test_cont_31',
        status: 'available',
        empty_mass_mg: '5',
        container_type: {
          col_count: 1,
          well_count: 1
        },
        organization_id: 'org16ybu85maxuu',
        organization_name: 'Lilly'
      }),
      Immutable.fromJS({
        id: 'ct2hcts2at9rm98',
        barcode: '500113',
        label: 'test_cont_35',
        status: 'available',
        empty_mass_mg: '7',
        container_type: {
          col_count: 1,
          well_count: 1
        },
        organization_id: null,
        organization_name: null
      })
    ];

    sandbox.stub(ContainerStore, 'getById')
      .withArgs('ct1fcts2at9rmdx').returns(containers[0])
      .withArgs('ct12cts2at9r321x')
      .returns(containers[1])
      .withArgs('ct42cts2at9r331')
      .returns(containers[2])
      .withArgs('ct2fcts2at9rmt22')
      .returns(Immutable.fromJS({}))
      .withArgs('ct2hcts2at9rm98')
      .returns(Immutable.fromJS(containers[3]));
    sandbox.stub(AliquotCompoundLinkStore, 'getByAliquotId')
      .returns([Immutable.fromJS({
        compound_link_id: 'cmpl1guu882a8s5sw',
        concentration: 12,
      })]);
  });

  it('csv file should contain the fields that are present in visible columns list', () => {
    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    sandbox.stub(CompoundStore, 'getById')
      .returns(Immutable.fromJS({
        m_moles: '1',
        molecular_weight: '108.21',
        smiles: 'S=C([S-])[S-]',
        reference_id: '2',
        id: 'cmpl1guu882a8s5sw',
        external_system_ids: [{ id: 'clextid1', external_system_id: 'external_sys_id-1' }]
      }));
    const unparse = sandbox.stub(Papa, 'unparse').returns();
    sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb({
          data: containerTypesData,
          meta: {
            record_count: 1
          }
        });

        return { fail: () => ({}) };
      }
    });
    AliquotActions.downloadCSV(['ct1fcts2at9rmdx'], ['barcode', 'status', 'empty']);
    setTimeout(() => {
      expect(unparse.calledOnce).to.be.true;
      const args = unparse.args[0][0];
      expect(args[0].barcode).equal('232213');
      expect(args[0].status).equal('available');
      expect(args[0].empty_mass_mg).equal('2');
    }, 0);

  });

  it('csv file should contain the compound related fields', () => {
    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    sandbox.stub(CompoundStore, 'getById')
      .returns(Immutable.fromJS({
        m_moles: '1',
        molecular_weight: '108.21',
        smiles: 'S=C([S-])[S-]',
        reference_id: '2',
        id: 'cmpl1guu882a8s5sw',
        external_system_ids: [{ id: 'clextid1', external_system_id: 'external_sys_id-1' }],
      }));
    const unparse = sandbox.stub(Papa, 'unparse').returns();
    sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb({
          data: containerTypesData,
          meta: {
            record_count: 1
          }
        });
        return { fail: () => ({}) };
      }
    });

    AliquotActions.downloadCSV(['ct1fcts2at9rmdx'], ['barcode', 'status', 'empty']);
    setTimeout(() => {
      expect(unparse.calledOnce).to.be.true;
      const args = unparse.args[0][0];
      expect(args[0].concentration).equal(12);
      expect(args[0].compound_link_id).equal('cmpl1guu882a8s5sw');
      expect(args[0].smiles).equal('S=C([S-])[S-]');
      expect(args[0].molecular_weight).equal('108.21');
      expect(args[0].reference_id).equal('2');
      expect(args[0].external_system_ids).equal('external_sys_id-1');
    }, 0);

  });

  it('csv file should reflect correct smile with # in it', () => {
    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    sandbox.stub(CompoundStore, 'getById')
      .returns(Immutable.fromJS({
        m_moles: '1',
        molecular_weight: '108.21',
        smiles: 'CCC(CC)COC(=O)[C@H](C)NP(=O)(OC[C@H]1O[C@@](C#N)(c2ccc3c(N)ncnn23)[C@H](O)[C@@H]1O)Oc1ccccc1',
        reference_id: '2',
        id: 'cmpl1guu882a8s5sw',
        external_system_ids: [12345671, 21212232]
      }));
    const unparse = sandbox.stub(Papa, 'unparse').returns();
    sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb({
          data: containerTypesData,
          meta: {
            record_count: 1
          }
        });

        return { fail: () => ({}) };
      }
    });

    AliquotActions.downloadCSV(['ct1fcts2at9rmdx'], ['barcode', 'status', 'empty']);
    setTimeout(() => {
      expect(unparse.calledOnce).to.be.true;
      const args = unparse.args[0][0];
      expect(args[0].smiles).equal('CCC(CC)COC(=O)[C@H](C)NP(=O)(OC[C@H]1O[C@@](C#N)(c2ccc3c(N)ncnn23)[C@H](O)[C@@H]1O)Oc1ccccc1');
    }, 0);
  });

  it('csv file should have human_well column', () => {
    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    sandbox.stub(CompoundStore, 'getById')
      .returns(Immutable.fromJS({
        m_moles: '1',
        molecular_weight: '108.21',
        smiles: 'S=C([S-])[S-]',
        reference_id: '2',
        id: 'cmpl1guu882a8s5sw',
        external_system_ids: [12345671, 21212232]
      }));
    const unparse = sandbox.stub(Papa, 'unparse').returns();
    sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb({
          data: containerTypesData,
          meta: {
            record_count: 1
          }
        });

        return { fail: () => ({}) };
      }
    });

    AliquotActions.downloadCSV(['ct1fcts2at9rmdx'], ['barcode', 'status', 'empty']);
    setTimeout(() => {
      expect(unparse.calledOnce).to.be.true;
      const args = unparse.args[0][0];
      expect(args[0].human_well).equal('A1');
    }, 0);
  });

  it('should have csv file populate created_by column with email if name is empty', () => {
    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    sandbox.stub(CompoundStore, 'getById')
      .returns(Immutable.fromJS({
        m_moles: '1',
        molecular_weight: '108.21',
        smiles: 'S=C([S-])[S-]',
        reference_id: '2',
        id: 'cmpl1guu882a8s5sw',
        external_system_ids: [12345671, 21212232]
      }));
    sandbox.stub(UserStore, 'getById').returns(Immutable.Map({ name: '', email: 'email' }));

    const unparse = sandbox.stub(Papa, 'unparse').returns();
    sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb({
          data: containerTypesData,
          meta: {
            record_count: 1
          }
        });

        return { fail: () => ({}) };
      }
    });

    AliquotActions.downloadCSV(['ct1fcts2at9rmdx'], ['creator']);
    setTimeout(() => {
      expect(unparse.calledOnce).to.be.true;
      const args = unparse.args[0][0];
      expect(args[0].created_by).equal('email');
    }, 0);
  });

  it('should display error toast message when aliquot API fails', () => {
    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    const notificationActionsSpy = sandbox.stub(NotificationActions, 'handleError');
    const aliquotApiSpy = sandbox.stub(AliquotAPI, 'getManyByContainerIds').returns({
      then: () => ({
        fail: (cb) => cb({}),
      }),
    });
    AliquotActions.downloadCSV(['ct1fcts2at9rmdx'], ['creator']);
    setTimeout(() => {
      expect(aliquotApiSpy.calledOnce).to.be.true;
      expect(notificationActionsSpy.calledOnce).to.be.true;
      expect(notificationActionsSpy.args[0]).to.deep.equal(['', {}, 'CSV Download Failed']);
    }, 0);
  });

  it('should display error toast message when Contextual custom properties config API fails', () => {
    const notificationActionsSpy = sandbox.stub(NotificationActions, 'handleError');
    const contextualCustomPropertiesApi = sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      then: () => ({
        fail: (cb) => cb({}),
      }),
    });
    AliquotActions.downloadCSV(['ct1fcts2at9rmdx'], ['creator']);
    setTimeout(() => {
      expect(contextualCustomPropertiesApi.calledOnce).to.be.true;
      expect(notificationActionsSpy.calledOnce).to.be.true;
      expect(notificationActionsSpy.args[0]).to.deep.equal(['', {}, 'CSV Download Failed']);
    }, 0);
  });

  it('should download a csv when all the containers belong to the same organization', () => {
    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    sandbox.stub(CompoundStore, 'getById')
      .returns(Immutable.fromJS({
        m_moles: '1',
        molecular_weight: '108.21',
        smiles: 'S=C([S-])[S-]',
        reference_id: '2',
        id: 'cmpl1guu882a8s5sw',
        external_system_ids: [{ id: 'clextid1', external_system_id: 'external_sys_id-1' }]
      }));
    const unparse = sandbox.stub(Papa, 'unparse').returns();
    sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb({
          data: containerTypesData,
          meta: {
            record_count: 1
          }
        });
        return { fail: () => ({}) };
      }
    });
    AliquotActions.downloadCSV(['ct1fcts2at9rmdx', 'ct12cts2at9r321x'], ['barcode', 'status', 'empty']);
    setTimeout(() => {
      expect(unparse.calledOnce).to.be.true;
      const args = unparse.args[0][0];
      expect(Moment(args[0].created_at).format('llll')).equal('Tue, Feb 2, 2021 11:36 AM');
      expect(args[0].barcode).equal('232213');
      expect(args[0].status).equal('available');
      expect(args[0].empty_mass_mg).equal('2');
      expect(args[0].ct_project_id).equal('testprojectid');
      expect(args[0].ct_msc_request_id).equal('testmscrequestid');
      expect(args[0].ct_msc_test_id).equal('msctest1');
      expect(args[0].ct_project_group_id).equal('projgrp1;projgrp2');
      expect(args[0].ct_kvp_container1).equal('ct_flask250_test');
      expect(args[0].ct_kvp_container2).equal('ct_flask250_test2');
      expect(args[0].ct_kvp_container3).equal('');
      expect(args[0].ct_kvp_container4).equal('');
      expect(args[0].aq_solvent_id).equal('1234');
      expect(args[0].aq_aliquot_group).equal('');
      expect(args[0].aq_kvp_aliquot1).equal('aq_flask250_test');
      expect(args[0].aq_kvp_aliquot2).equal('aq_flask250_test2');
      expect(args[0].aq_kvp_aliquot3).equal('');
      expect(args[0].aq_kvp_aliquot4).equal('');

      expect(Moment(args[1].created_at).format('llll')).equal('Wed, Feb 3, 2021 11:36 AM');
      expect(args[1].barcode).equal('2314');
      expect(args[1].status).equal('available');
      expect(args[1].empty_mass_mg).equal('2');
      expect(args[1].ct_project_id).equal('projecttest123');
      expect(args[1].ct_msc_request_id).equal('msc_request_test_123');
      expect(args[1].ct_msc_test_id).equal('');
      expect(args[1].ct_project_group_id).equal('');
      expect(args[1].ct_kvp_container1).equal('ct_micro_test');
      expect(args[1].ct_kvp_container2).equal('');
      expect(args[1].ct_kvp_container3).equal('ct_micro_test3');
      expect(args[1].ct_kvp_container4).equal('ct_micro_test4');
      expect(args[1].aq_solvent_id).equal('321');
      expect(args[1].aq_aliquot_group).equal('aliqgrp1;aliqgrp2');
      expect(args[1].aq_kvp_aliquot1).equal('aq_micro_test');
      expect(args[1].aq_kvp_aliquot2).equal('');
      expect(args[1].aq_kvp_aliquot3).equal('aq_micro_test3');
      expect(args[1].aq_kvp_aliquot4).equal('aq_micro_test4');
    }, 0);
  });

  it('should download a zip when containers belong to different orgs', () => {
    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    sandbox.stub(CompoundStore, 'getById')
      .returns(Immutable.fromJS({
        m_moles: '1',
        molecular_weight: '108.21',
        smiles: 'S=C([S-])[S-]',
        reference_id: '2',
        id: 'cmpl1guu882a8s5sw',
        external_system_ids: [{ id: 'clextid1', external_system_id: 'external_sys_id-1' }]
      }));
    const unparse = sandbox.stub(Papa, 'unparse').returns();
    sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb({
          data: containerTypesData,
          meta: {
            record_count: 1
          }
        });
        return { fail: () => ({}) };
      }
    });
    const aliquotActionsDownloadZipSpy = sandbox.spy(AliquotActions, '_downloadZip');
    const zipUtilDownloadZipStub = sandbox.stub(ZIPUtil, 'downloadZip');

    AliquotActions.downloadCSV(['ct1fcts2at9rmdx', 'ct12cts2at9r321x', 'ct42cts2at9r331'], ['barcode', 'status', 'empty']);
    setTimeout(() => {
      expect(unparse.called).to.be.false;
      expect(aliquotActionsDownloadZipSpy.calledOnce).to.be.true;
      expect(zipUtilDownloadZipStub.calledOnce).to.be.true;

      const args = aliquotActionsDownloadZipSpy.args[0][0];
      expect(args.org13.length).equal(2);
      expect(args.org16ybu85maxuu.length).equal(1);

      expect(Moment(args.org13[0].created_at).format('llll')).equal('Tue, Feb 2, 2021 11:36 AM');
      expect(args.org13[0].barcode).equal('232213');
      expect(args.org13[0].status).equal('available');
      expect(args.org13[0].empty_mass_mg).equal('2');
      expect(args.org13[0].ct_project_id).equal('testprojectid');
      expect(args.org13[0].ct_msc_request_id).equal('testmscrequestid');
      expect(args.org13[0].ct_msc_test_id).equal('msctest1');
      expect(args.org13[0].ct_project_group_id).equal('projgrp1;projgrp2');
      expect(args.org13[0].ct_kvp_container1).equal('ct_flask250_test');
      expect(args.org13[0].ct_kvp_container2).equal('ct_flask250_test2');
      expect(args.org13[0].ct_kvp_container3).equal('');
      expect(args.org13[0].ct_kvp_container4).equal('');
      expect(args.org13[0].aq_solvent_id).equal('1234');
      expect(args.org13[0].aq_aliquot_group).equal('');
      expect(args.org13[0].aq_kvp_aliquot1).equal('aq_flask250_test');
      expect(args.org13[0].aq_kvp_aliquot2).equal('aq_flask250_test2');
      expect(args.org13[0].aq_kvp_aliquot3).equal('');
      expect(args.org13[0].aq_kvp_aliquot4).equal('');

      expect(Moment(args.org13[1].created_at).format('llll')).equal('Wed, Feb 3, 2021 11:36 AM');
      expect(args.org13[1].barcode).equal('2314');
      expect(args.org13[1].status).equal('available');
      expect(args.org13[1].empty_mass_mg).equal('2');
      expect(args.org13[1].ct_project_id).equal('projecttest123');
      expect(args.org13[1].ct_msc_request_id).equal('msc_request_test_123');
      expect(args.org13[1].ct_msc_test_id).equal('');
      expect(args.org13[1].ct_project_group_id).equal('');
      expect(args.org13[1].ct_kvp_container1).equal('ct_micro_test');
      expect(args.org13[1].ct_kvp_container2).equal('');
      expect(args.org13[1].ct_kvp_container3).equal('ct_micro_test3');
      expect(args.org13[1].ct_kvp_container4).equal('ct_micro_test4');
      expect(args.org13[1].aq_solvent_id).equal('321');
      expect(args.org13[1].aq_aliquot_group).equal('aliqgrp1;aliqgrp2');
      expect(args.org13[1].aq_kvp_aliquot1).equal('aq_micro_test');
      expect(args.org13[1].aq_kvp_aliquot2).equal('');
      expect(args.org13[1].aq_kvp_aliquot3).equal('aq_micro_test3');
      expect(args.org13[1].aq_kvp_aliquot4).equal('aq_micro_test4');

      expect(Moment(args.org16ybu85maxuu[0].created_at).format('llll')).equal('Thu, Feb 4, 2021 11:36 AM');
      expect(args.org16ybu85maxuu[0].barcode).equal('500012');
      expect(args.org16ybu85maxuu[0].status).equal('available');
      expect(args.org16ybu85maxuu[0].empty_mass_mg).equal('5');
      expect(args.org16ybu85maxuu[0].ct_msc_order_id).equal('mscordertest');
      expect(args.org16ybu85maxuu[0].ct_container_source_id).equal('contsourcetest');
      expect(args.org16ybu85maxuu[0].ct_kvp_container5).equal('micro_lilly_ct5');
      expect(args.org16ybu85maxuu[0].aq_submission_id).equal('321');
      expect(args.org16ybu85maxuu[0].aq_kvp_aliquot5).equal('micro_lilly_aq5');
    }, 0);
  });

  it('should throw an error when there are no aliquots for container(s)', () => {
    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    const notificationActionsSpy = sandbox.stub(NotificationActions, 'handleError');

    sandbox.stub(CompoundStore, 'getById')
      .returns(Immutable.fromJS({
        m_moles: '1',
        molecular_weight: '108.21',
        smiles: 'S=C([S-])[S-]',
        reference_id: '2',
        id: 'cmpl1guu882a8s5sw',
        external_system_ids: [{ id: 'clextid1', external_system_id: 'external_sys_id-1' }]
      }));

    sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb({
          data: containerTypesData,
          meta: {
            record_count: 1
          }
        });
        return { fail: () => ({}) };
      }
    });
    AliquotActions.downloadCSV(['ct2fcts2at9rmt22'], ['barcode', 'status', 'empty']);

    setTimeout(() => {
      expect(notificationActionsSpy.calledOnce).to.be.true;
      expect(notificationActionsSpy.args[0]).to.deep.equal(['', '', 'Selected container(s) does not have any aliquots']);
    }, 0);
  });

  it('should create the csv file with the organization name as the file name', () => {
    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    sandbox.stub(CompoundStore, 'getById')
      .returns(Immutable.fromJS({
        m_moles: '1',
        molecular_weight: '108.21',
        smiles: 'S=C([S-])[S-]',
        reference_id: '2',
        id: 'cmpl1guu882a8s5sw',
        external_system_ids: [{ id: 'clextid1', external_system_id: 'external_sys_id-1' }]
      }));
    sandbox.stub(Papa, 'unparse').returns();
    sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb({
          data: containerTypesData,
          meta: {
            record_count: 1
          }
        });
        return { fail: () => ({}) };
      }
    });
    const downloadCSVFromJSONStub = sandbox.spy(CSVUtil, 'downloadCSVFromJSON');

    AliquotActions.downloadCSV(['ct1fcts2at9rmdx'], ['barcode', 'status', 'empty']);

    setTimeout(() => {
      expect(downloadCSVFromJSONStub.calledOnce).to.be.true;
      expect(downloadCSVFromJSONStub.args[0][1]).to.equal('Strateos_container_results');
    }, 0);
  });

  it('should create the csv file with the name "stock_container_results" when organization id is null', () => {
    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    sandbox.stub(CompoundStore, 'getById')
      .returns(Immutable.fromJS({
        m_moles: '1',
        molecular_weight: '108.21',
        smiles: 'S=C([S-])[S-]',
        reference_id: '2',
        id: 'cmpl1guu882a8s5sw',
        external_system_ids: [{ id: 'clextid1', external_system_id: 'external_sys_id-1' }]
      }));
    const unparse = sandbox.stub(Papa, 'unparse').returns();
    sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb({
          data: containerTypesData,
          meta: {
            record_count: 1
          }
        });
        return { fail: () => ({}) };
      }
    });
    const downloadCSVFromJSONStub = sandbox.spy(CSVUtil, 'downloadCSVFromJSON');

    AliquotActions.downloadCSV(['ct2hcts2at9rm98'], ['barcode', 'status', 'empty']);

    setTimeout(() => {
      const args = unparse.args[0][0];

      expect(unparse.calledOnce).to.be.true;
      expect(downloadCSVFromJSONStub.calledOnce).to.be.true;
      expect(downloadCSVFromJSONStub.args[0][1]).to.equal('stock_container_results');
      expect(Moment(args[0].created_at).format('llll')).equal('Tue, Feb 2, 2021 11:36 AM');
      expect(args[0].barcode).equal('500113');
      expect(args[0].status).equal('available');
      expect(args[0].empty_mass_mg).equal('7');
      expect(args[0].ct_project_id).equal('project_123');
      expect(args[0].ct_msc_request_id).equal('msc_request_123');
      expect(args[0].ct_kvp_container1).equal('ct_test6');
      expect(args[0].aq_solvent_id).equal('1234');
      expect(args[0].aq_kvp_aliquot1).equal('aq_test6');
    }, 0);
  });

  it('should create the csv inside the zip file with the name "stock_container_results" when organization id is null', () => {
    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    sandbox.stub(CompoundStore, 'getById')
      .returns(Immutable.fromJS({
        m_moles: '1',
        molecular_weight: '108.21',
        smiles: 'S=C([S-])[S-]',
        reference_id: '2',
        id: 'cmpl1guu882a8s5sw',
        external_system_ids: [{ id: 'clextid1', external_system_id: 'external_sys_id-1' }]
      }));
    sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb({
          data: containerTypesData,
          meta: {
            record_count: 1
          }
        });
        return { fail: () => ({}) };
      }
    });
    const jsZipStub = sandbox.stub(JSZip.prototype, 'file');
    const aliquotActionsDownloadZipSpy = sandbox.spy(AliquotActions, '_downloadZip');
    const zipUtilDownloadZipStub = sandbox.stub(ZIPUtil, 'downloadZip');

    AliquotActions.downloadCSV(['ct1fcts2at9rmdx', 'ct2hcts2at9rm98'], ['barcode', 'status', 'empty']);

    setTimeout(() => {
      expect(aliquotActionsDownloadZipSpy.calledOnce).to.be.true;
      expect(zipUtilDownloadZipStub.calledOnce).to.be.true;
      expect(jsZipStub.calledTwice).to.be.true;
      expect(jsZipStub.args[0][0]).equals('Strateos_container_results.csv');
      expect(jsZipStub.args[1][0]).equals('stock_container_results.csv');
    }, 0);
  });

  it('should display the key/value pairs in respective columns when 2 containers have the same key', () => {
    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      then: (cb) => {
        cb();
        return { fail: () => ({}) };
      },
    });
    sandbox.stub(CompoundStore, 'getById')
      .returns(Immutable.fromJS({
        m_moles: '1',
        molecular_weight: '108.21',
        smiles: 'S=C([S-])[S-]',
        reference_id: '2',
        id: 'cmpl1guu882a8s5sw',
        external_system_ids: [{ id: 'clextid1', external_system_id: 'external_sys_id-1' }]
      }));
    sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb({
          data: containerTypesData,
          meta: {
            record_count: 1
          }
        });
        return { fail: () => ({}) };
      }
    });
    const aliquotActionsDownloadZipSpy = sandbox.spy(AliquotActions, '_downloadZip');
    const zipUtilDownloadZipStub = sandbox.stub(ZIPUtil, 'downloadZip');

    AliquotActions.downloadCSV(['ct1fcts2at9rmdx', 'ct12cts2at9r321x', 'ct42cts2at9r331'], ['barcode', 'status', 'empty']);

    setTimeout(() => {
      const args = aliquotActionsDownloadZipSpy.args[0][0];

      expect(aliquotActionsDownloadZipSpy.calledOnce).to.be.true;
      expect(zipUtilDownloadZipStub.calledOnce).to.be.true;

      expect(args.org13[0].ct_kvp_container1).equal('ct_flask250_test');
      expect(args.org13[0].ct_kvp_container2).equal('ct_flask250_test2');
      expect(args.org13[0].ct_kvp_container3).equal('');
      expect(args.org13[0].ct_kvp_container4).equal('');
      expect(args.org13[0].aq_kvp_aliquot1).equal('aq_flask250_test');
      expect(args.org13[0].aq_kvp_aliquot2).equal('aq_flask250_test2');
      expect(args.org13[0].aq_kvp_aliquot3).equal('');
      expect(args.org13[0].aq_kvp_aliquot4).equal('');

      expect(args.org13[1].ct_kvp_container1).equal('ct_micro_test');
      expect(args.org13[1].ct_kvp_container2).equal('');
      expect(args.org13[1].ct_kvp_container3).equal('ct_micro_test3');
      expect(args.org13[1].ct_kvp_container4).equal('ct_micro_test4');
      expect(args.org13[1].aq_kvp_aliquot1).equal('aq_micro_test');
      expect(args.org13[1].aq_kvp_aliquot2).equal('');
      expect(args.org13[1].aq_kvp_aliquot3).equal('aq_micro_test3');
      expect(args.org13[1].aq_kvp_aliquot4).equal('aq_micro_test4');

      expect(args.org16ybu85maxuu[0].ct_kvp_container1).equal('micro_lilly_ct');
      expect(args.org16ybu85maxuu[0].ct_kvp_container5).equal('micro_lilly_ct5');
      expect(args.org16ybu85maxuu[0].aq_kvp_aliquot1).equal('micro_lilly_aq');
      expect(args.org16ybu85maxuu[0].aq_kvp_aliquot5).equal('micro_lilly_aq5');
    }, 0);
  });
});
