import React from 'react';
import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import Immutable from 'immutable';

import CurrentProvisionSpec from './CurrentProvisionSpec';

describe('CurrentProvisionSpec', () => {
  let wrapper;
  afterEach(() => {
    if (wrapper)wrapper.unmount();
  });

  const refs = Immutable.fromJS({
    Micro90Wash: {
      container_type: {
        acceptable_lids: ['screw-cap'],
        capabilities: ['transfer', 'spin', 'provision', 'incubate', 'cover', 'uncover', 'dispense-source'],
        catalog_number: '227270',
        col_count: 1,
        height_mm: null,
        id: 'conical-50',
        is_tube: true,
        name: '50mL Conical',
        retired_at: null,
        sale_price: '1.071',
        shortname: 'conical-50',
        vendor: 'Greiner',
        well_count: 1,
        well_depth_mm: '0.0',
        well_volume_ul: '50000.0'
      }
    }
  });

  const containers = Immutable.fromJS([
    {
      aliquot_count: 1,
      aliquot_created_at: '2015-12-10T09:01:00.345-08:00',
      barcode: null,
      container_type_id: 'micro-1.5',
      id: 'ct18ffzpks5gh4',
      label: 'label',
      location_id: 'loc17kj7hgnr2ps'
    }
  ]);

  function getProvisions(mass, volume) {
    return Immutable.fromJS({
      ct18ffzpks5gh4: [{
        id: 0,
        mass: `${mass}:milligram`,
        volume: `${volume}:microliter`,
        well: 'Micro90Wash/0'
      }]
    });
  }

  it('should have mass units', () => {
    const empty = () => {};
    wrapper = mount(
      <CurrentProvisionSpec
        provisionsByContainerId={getProvisions(33)}
        refsByName={refs}
        provisionSpecContainers={containers}
        refetchAutoProvision={empty}
        currentNavigation="CURRENT SPEC"
        onEditContainer={empty}
        runCompleted={false}
        instructionCompleted={false}
        measurementMode="mass"
      />
    );
    const units = wrapper.find('Unit');
    expect(units.text()).to.equal('33 mg');
  });

  it('should have mass units in grams', () => {
    const empty = () => {};
    wrapper = mount(
      <CurrentProvisionSpec
        provisionsByContainerId={getProvisions(330000.43)}
        refsByName={refs}
        provisionSpecContainers={containers}
        refetchAutoProvision={empty}
        currentNavigation="CURRENT SPEC"
        onEditContainer={empty}
        runCompleted={false}
        instructionCompleted={false}
        measurementMode="mass"
      />
    );
    const units = wrapper.find('Unit');
    expect(units.text()).to.equal('330.00043 g');
  });

  it('should have volume units', () => {
    const empty = () => {};
    wrapper = mount(
      <CurrentProvisionSpec
        provisionsByContainerId={getProvisions(undefined, 33)}
        refsByName={refs}
        provisionSpecContainers={containers}
        refetchAutoProvision={empty}
        currentNavigation="CURRENT SPEC"
        onEditContainer={empty}
        runCompleted={false}
        instructionCompleted={false}
      />
    );
    const units = wrapper.find('Unit');
    expect(units.text()).to.equal('33 µL');
  });

  it('should have volume units in milliliters', () => {
    const empty = () => {};
    wrapper = mount(
      <CurrentProvisionSpec
        provisionsByContainerId={getProvisions(undefined, 330000.43)}
        refsByName={refs}
        provisionSpecContainers={containers}
        refetchAutoProvision={empty}
        currentNavigation="CURRENT SPEC"
        onEditContainer={empty}
        runCompleted={false}
        instructionCompleted={false}
      />
    );
    const units = wrapper.find('Unit');
    expect(units.text()).to.equal('330.00043 mL');
  });

  it('should not show generate buttons when showManualButton is true', () => {
    const empty = () => {};
    wrapper = shallow(
      <CurrentProvisionSpec
        provisionsByContainerId={getProvisions(undefined, 330000.43)}
        refsByName={refs}
        provisionSpecContainers={containers}
        refetchAutoProvision={empty}
        currentNavigation="CURRENT SPEC"
        onEditContainer={empty}
        runCompleted={false}
        instructionCompleted={false}
        showManualButton
      />
    );
    expect(wrapper.find('ButtonGroup').length).to.equal(0);
  });

  it('should show generate buttons when showManualButton is false', () => {
    const empty = () => {};
    wrapper = shallow(
      <CurrentProvisionSpec
        provisionsByContainerId={getProvisions(undefined, 330000.43)}
        refsByName={refs}
        provisionSpecContainers={containers}
        refetchAutoProvision={empty}
        currentNavigation="CURRENT SPEC"
        onEditContainer={empty}
        runCompleted={false}
        instructionCompleted={false}
      />
    );
    expect(wrapper.find('ButtonGroup').find('Button').length).to.equal(2);
  });
});
