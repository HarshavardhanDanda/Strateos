import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';

import ContainerDetails from 'main/inventory/inventory/ContainerDetails.jsx';

const container = Immutable.fromJS({
  id: 'aq1et8cdx7t3j52',
  container: 'pcr-0.5',
  status: 'available',
  container_type_id: 'pcr-0.5',
  storage_condition: 'cold_4',
  shipment_id: 'sr1f3d9kms9nccm',
  organization_id: 'org13',
  organization_name: 'Transcriptic',
  location_id: 'loc1dssgxed8dzgf',
  shipment_code: 'BVD',
  created_at: '2020-11-08T23:55:05.145-08:00',
  label: 'tube 1',
  public_location_description: 'In transit to Transcriptic.',
  hazards: ['flammable'],
  updated_at: '2020-11-08T23:55:05.218-08:00',
  aliquot_count: 5,
  created_by: 'u1fbwm6dcf3kh4'
});

const runRef = Immutable.fromJS({
  container: container,
  container_id: 'ct1e4gmtykzdqny',
  container_type: {
    shortname: 'pcr-0.5',
    vendor: 'Corning',
    retired_at: null,
    acceptable_lids: [],
    name: '96-Well White with Clear Flat Bottom'
  },
  destiny: {},
  id: '457043',
  name: 'calibration',
  new_container_type: null,
  resource_kit_item: undefined,
  run_id: 'r1efjb5ag5y7dh',
  type: 'refs'
});

const containerType = Immutable.fromJS({
  acceptable_lids: ['low_evaporation', 'standard', 'universal'],
  capabilities: ['spin', 'incubate', 'absorbance'],
  catalog_number: '3632',
  col_count: 12,
  height_mm: '14.22',
  id: 'pcr-0.5',
  is_tube: false,
  name: '96-Well White with Clear Flat Bottom',
  retired_at: null,
  sale_price: '9.5557',
  shortname: '96-flat',
  vendor: 'Corning',
  well_count: 96,
  well_depth_mm: '10.67',
  well_volume_ul: '340.0'
});

const props = {
  containerType: containerType,
  container: container,
  runRef: runRef
};

describe('ContainerDetails', () => {
  it('should render without error', () => {
    shallow(
      <ContainerDetails {...props} />
    );
  });

  it('should have created by field in containers detail in run view under project', () => {
    const containerDetails = shallow(
      <ContainerDetails {...props} />
    );
    expect(containerDetails.find('InternalKeyValueEntry').last().equals('Created By'));
  });
});
