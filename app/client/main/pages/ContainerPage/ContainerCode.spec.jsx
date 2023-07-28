import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import ContainerCode from './ContainerCode';

const container = Immutable.Map({
  aliquot_count: 2,
  barcode: undefined,
  container_type_id: '96-pcr',
  id: 'ct1et8cdx6bnmwr',
  label: 'pcr test',
  organization_id: 'org13',
  status: 'consumable',
  storage_condition: 'cold_4',
  test_mode: true,
  type: 'containers',
  lab: { id: 'lb1', name: 'lab1' },
  shipment_code: 'SHIP-12'
});
const containerType = Immutable.Map({});
const shipment = Immutable.Map({ code: 'SHIP-12' });

describe('ContainerCode', () => {
  let wrapper;

  afterEach(() => {
    wrapper.unmount();
  });

  it('should render container type plate icon', () => {
    wrapper = shallow(<ContainerCode container={container} containerType={containerType} />);

    expect(wrapper.find('Icon').props().icon).to.equal('aminor-plate');
  });

  it('should render container type tube icon', () => {
    const tubeContainerType = container.set('is_tube', true);
    wrapper = shallow(<ContainerCode container={container} containerType={tubeContainerType} />);

    expect(wrapper.find('Icon').props().icon).to.equal('aminor-tube');
  });

  it('should render shipment code', () => {
    wrapper = shallow(<ContainerCode container={container} containerType={containerType} shipment={shipment} />);

    expect(wrapper.find('h4').text()).to.equal('SHIP-12');
  });
});
