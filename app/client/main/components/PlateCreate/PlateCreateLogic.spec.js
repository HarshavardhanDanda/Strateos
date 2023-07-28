import _ from 'lodash';
import { expect } from 'chai';
import Immutable from 'immutable';
import sinon from 'sinon';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import PlateCreateLogic from './PlateCreateLogic';

const expectedPayload = {
  label: 'plate (15)',
  container_type: '1-flat',
  storage_condition: 'cold_4',
  test_mode: false,
  lab_id: 'lb1g3u4resfaznq',
  aliquots: [{
    well_idx: 'A1',
    name: 'aliquot_name',
    volume_ul: 1,
    mass_mg: 1,
    properties: Immutable.fromJS({ Test: '1', Test2: '2' }),
  }] };

const containerTypeResponse = {
  acceptable_lids: ['universal'],
  capabilities: [
    'incubate',
    'image_plate',
    'colonize',
    'envision'],
  catalog_number: '267060',
  col_count: 1,
  cost_each: '4.71',
  dead_volume_ul: '36000.0',
  height_mm: '17.3',
  id: '1-flat',
  is_tube: false,
  manual_execution: false,
  name: '1-Well Nunc Non-treated Flat Bottom Plate',
  retired_at: null,
  safe_min_volume_ul: '40000.0',
  sale_price: '5.6049',
  shortname: '1-flat',
  type: 'container_types',
  vendor: 'Fisher',
  well_count: 1,
  well_depth_mm: '11.6',
  well_volume_ul: '90000.0'
};

describe('PlateCreateLogic', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(ContainerTypeStore, 'getById').returns(Immutable.fromJS(containerTypeResponse));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('buildContainerWithBulkCreateContainerPayLoad should parse inputValues correctly', () => {
    const inputValues = {
      force_validate: false,
      name: 'plate (15)',
      lab_id: 'lb1g3u4resfaznq',
      wellMap: [
        {
          name: 'aliquot_name',
          volume: '1:microliter',
          properties: { Test: '1', Test2: '2' },
          hasVolume: true,
          mass: '1:milligram'
        }
      ],
      test_mode: false,
      cols: 1,
      rows: 1,
      storage: 'cold_4',
      containerType: '1-flat' };
    const parsedContainerPayload = PlateCreateLogic.buildContainerWithBulkCreateContainerPayLoad(Immutable.fromJS(inputValues));
    expect(parsedContainerPayload).to.be.eql(expectedPayload);
  });
});
