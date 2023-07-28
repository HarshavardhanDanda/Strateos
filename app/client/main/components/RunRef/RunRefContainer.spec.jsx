import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';
import sinon from 'sinon';

import ContainerAPI from 'main/api/ContainerAPI';
import AliquotStore from 'main/stores/AliquotStore';
import ContainerStore from 'main/stores/ContainerStore';
import { ShipmentStore } from 'main/stores/ShipmentStore';
import RunRefContainer from './RunRefContainer';

describe('RunRefContainer', () => {
  const sandbox = sinon.createSandbox();

  const props = {
    run: Immutable.Map({
      instructions: Immutable.List(),
    }),
    runRef: Immutable.Map({
      name: 'ref1',
      container_id: 'c1',
      container_type: Immutable.Map({
        acceptable_lids: [],
        capabilities: [],
        catalog_number: '-',
        col_count: 1,
        cost_each: '0.0',
        id: 'vendor-tube',
        is_tube: true,
        manual_execution: false,
        name: 'Vendor tube',
        sale_price: '0.0',
        shortname: 'vendor-tube',
        type: 'container_types',
        vendor: '-',
        well_count: 1,
        well_depth_mm: '0.0',
        well_volume_ul: '999999999.0'
      }),
      container: {
        id: 'c1'
      },
      orderable_material_component: {
        resource: {
          purity: null,
          organization_id: 'org3',
          compound: {},
          name: 'placeholder',
          compound_id: 'cff440d3-79df-4e33-920d-a9571ec924ea',
          metadata: {
            smiles: null,
            molecular_weight: null
          },
          properties: {},
          kind: 'ChemicalStructure',
          storage_condition: 'cold_4',
          orderable_material_components: [],
          id: 'rs1h3sxt585hm86',
          description: null,
          sensitivities: []
        },
      }
    })
  };
  const containerAPIResponse = {
    data: {
      id: 'ct1cwf6qzd54vgf',
      attributes: {
        aliquot_count: 2,
        barcode: undefined,
        container_type_id: '96-pcr',
        id: 'ct1et8cdx6bnmwr',
        label: 'pcr test',
        organization_id: 'org13',
        status: 'inbound',
        storage_condition: 'cold_4',
        test_mode: true,
        type: 'containers'
      }
    }
  };
  const container = Immutable.Map({
    aliquot_count: 2,
    barcode: undefined,
    container_type_id: '96-pcr',
    id: 'ct1et8cdx6bnmwr',
    label: 'pcr test',
    organization_id: 'org13',
    status: 'inbound',
    storage_condition: 'cold_4',
    test_mode: true,
    type: 'containers'
  });
  const aliquots = Immutable.List([
    Immutable.fromJS({
      container_id: 'ct1et8cdx6bnmwr',
      id: 'aq1et8cdx7t3j52',
      name: 'A1',
      type: 'aliquots',
      volume_ul: '131.0',
      mass_mg: '50',
      well_idx: 0,
      resource_id: 'rs16pc8krr6ag7'
    }),
    Immutable.fromJS({
      container_id: 'ct1et8cdx6bnmwr',
      id: 'aq1et8cdx7t3j53',
      name: 'A2',
      type: 'aliquots',
      volume_ul: '131.0',
      mass_mg: undefined,
      well_idx: 1
    })
  ]);
  const shipment = Immutable.fromJS({
    id: 'sr1dmz8ka2d7yf6',
    type: 'shipments',
    attributes: {
      checked_in_at: null,
      contact_name: null,
      contact_number: null,
      container_transfer_id: null,
      created_at: '2019-10-04T11:02:13.644-07:00',
      data: { },
      editable: true,
      label: 'FMCP',
      name: null,
      note: null,
      organization_id: 'org13',
      pickup_street: null,
      pickup_zipcode: null,
      receiving_note: null,
      scheduled_pickup: null,
      shipment_type: 'sample',
      shipped_at: null,
      lab_id: 'lb1fknzm4kjxcvg',
      updated_at: '2021-04-07T08:02:21.044-07:00',
      container_ids: [
        'ct1et8cdx6bnmwr'
      ],
      organization: {
        id: 'org13',
        name: 'Strateos'
      }
    }
  });

  let wrapper;
  let containerAPIStub;

  beforeEach(() => {
    containerAPIStub = sandbox.stub(ContainerAPI, 'get').returns({
      always: (cb) => {
        cb(containerAPIResponse);
      }
    });
    sandbox.stub(AliquotStore, 'getByContainer').returns(aliquots);
    sandbox.stub(ContainerStore, 'getById').returns(container);
    sandbox.stub(ShipmentStore, 'getById').returns(shipment);
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should re-fetch container if runRef prop is changed', () => {
    wrapper = shallow(<RunRefContainer {...props} />);
    expect(containerAPIStub.calledOnce).to.be.true;
    wrapper.setProps({ run: props.run, runRef: props.runRef.set('name', 'ref2') });
    expect(containerAPIStub.calledTwice).to.be.true;
  });

  it('should not re-fetch container if same runRef prop is set', () => {
    wrapper = shallow(<RunRefContainer {...props} />);
    expect(containerAPIStub.calledOnce).to.be.true;
    wrapper.setProps({ run: props.run, runRef: props.runRef.set('name', 'ref1') });
    expect(containerAPIStub.calledOnce).to.be.true;
  });
});
