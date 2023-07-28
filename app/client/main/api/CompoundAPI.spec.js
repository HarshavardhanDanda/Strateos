import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import Immutable from 'immutable';
import CompoundAPI from './CompoundAPI';
import ContextualCustomProperties from './ContextualCustomProperties';

describe('CompoundAPI', () => {
  const sandbox = sinon.createSandbox();
  const customProperty = Immutable.fromJS(
    {
      id: 'ccp1gbfdncs7mz3s',
      type: 'contextual_custom_properties',
      context_type: 'Container',
      context_id: 'ct1gbfdncqtgg5j',
      value: 'Mosaic 0001',
      key: 'ct_prop_1'
    }
  );

  const compound_response = {
    data: {
      id: 'cmpl1gmk7n6gbuze5',
      type: 'compounds',
      links: {
        self: 'http://localhost:5000/api/compounds/cmpl1gmk7n6gbuze5'
      },
      attributes: {
        name: null,
        reference_id: null,
        organization_id: 'org13',
        created_by: 'u1786qx96dfsg',
        created_at: '2022-01-18T23:36:52.989-08:00',
        properties: {},
        search_score: null,
        clogp: null,
        formula: null,
        inchi: null,
        inchi_key: null,
        molecular_weight: null,
        exact_molecular_weight: null,
        morgan_fingerprint: null,
        sdf: null,
        smiles: null,
        tpsa: null,
        compound_id: null,
        pub_chem_id: null,
        cas_number: null,
        mfcd_number: null,
        unknown: null,
        flammable: null,
        oxidizer: null,
        strong_acid: null,
        water_reactive_nucleophile: null,
        water_reactive_electrophile: null,
        general: null,
        peroxide_former: null,
        strong_base: null,
        no_flags: null,
        labels: [],
        organization_name: 'Strateos',
        contextual_custom_properties: [
          {
            id: 'ccp1gmk7n6gzajrq',
            context_type: 'CompoundLink',
            context_id: 'cmpl1gmk7n6gbuze5',
            value: '',
            key: 'emolecules_id'
          },
          {
            id: 'ccp1gmk7n6gsgcyh',
            context_type: 'CompoundLink',
            context_id: 'cmpl1gmk7n6gbuze5',
            value: '',
            key: 'sigma_id'
          }
        ],
        external_system_ids: [
          {
            id: 'clextid1gmk7n6gf9kt8',
            organization_id: 'org13',
            external_system_id: 'CP_888',
            compound_link_id: 'cmpl1gmk7n6gbuze5',
            created_at: '2022-01-18T23:36:52.992-08:00',
            updated_at: '2022-01-18T23:36:52.992-08:00'
          }
        ]
      }
    }
  };

  afterEach(() => {
    sandbox.restore();
  });

  it('should call update custom property api', () => {
    const mockUpdateCustomProperty = sandbox.spy(ContextualCustomProperties, 'updateCustomProperty');
    const key = 'ccpc_key_1';
    const value = 'some data';
    const containerId = customProperty.get('context_id');

    CompoundAPI.updateCustomProperty(
      containerId,
      key,
      value);

    expect(mockUpdateCustomProperty.calledOnce).to.be.true;
  });

  it('should load compound and call ContextualCustomProperties loadCustomProperties', () => {
    const get = sandbox.stub(ajax, 'get').returns({
      done: cb => {
        cb(compound_response);
        return { fail: () => ({}) };
      }
    });
    const mockLoadCustomProperties = sandbox.spy(ContextualCustomProperties, 'loadCustomProperties');
    const compoundId = 'cmpl1gmk7n6gbuze5';
    const url = `/api/compounds/${compoundId}`;

    CompoundAPI.get(compoundId);

    expect(get.calledOnce).to.be.true;
    expect(get.calledWithExactly(url)).to.be.true;
    expect(mockLoadCustomProperties.calledOnce).to.be.true;
    expect(mockLoadCustomProperties.calledWithExactly(
      compound_response.data.attributes.contextual_custom_properties)).to.be.true;
  });
});
