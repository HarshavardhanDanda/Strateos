import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import { Plate, Legend, Tube } from '@transcriptic/amino';

import InteractivePlate from './InteractivePlate';

describe('InteractivePlate', () => {
  let component;

  afterEach(() => {
    if (component) {
      component.unmount();
    }
  });

  it('should show spinner when loading', () => {
    component = shallow(
      <InteractivePlate
        loading
        initialDomain={[1, 2]}
        wellMap={Immutable.Map()}
        containerType={Immutable.Map({ col_count: 10, well_count: 100 })}
      />
    );

    expect(component.find('Spinner').length).to.equal(1);
  });

  it('should have default props', () => {
    component = shallow(
      <InteractivePlate
        initialDomain={[1, 2]}
        wellMap={Immutable.Map()}
        containerType={Immutable.Map({ col_count: 10, well_count: 100 })}
      />
    );

    const Klass = component.instance().constructor;
    expect(Klass.defaultProps).to.equals(InteractivePlate.defaultProps);
  });

  it('should have a Plate', () => {
    component = shallow(
      <InteractivePlate
        initialDomain={[1, 2]}
        wellMap={Immutable.Map()}
        containerType={Immutable.Map({ id: 'foo', col_count: 10, well_count: 100 })}
        getWellData={wellIndex => `Ct: ${{ 0: 12.16 }[wellIndex].toFixed(2)}`}
      />
    );

    const plate = component.find(Plate);
    expect(plate.length).to.equal(1);

    const legend = component.find(Legend);
    expect(legend.length).to.equal(1);

    expect(plate.props().getWellInfo(0).body).to.equal(component.instance().getWellData(0));
  });

  it('should have a Tube', () => {
    component = shallow(
      <InteractivePlate
        initialDomain={[1, 2]}
        wellMap={Immutable.Map()}
        containerType={Immutable.Map({ id: 'micro-2.0', is_tube: true })}
      />
    );

    const tube = component.find(Tube);
    expect(tube.length).to.equal(1);

    const legend = component.find(Legend);
    expect(legend.length).to.equal(1);
  });

  it('Tube with only volume, legend should display µl', () => {
    component = shallow(
      <InteractivePlate
        initialDomain={[1, 2]}
        wellMap={Immutable.Map()}
        aliquots={Immutable.fromJS([{ well_idx: 0, volume_ul: '30' }])}
        containerType={Immutable.Map({ id: 'micro-2.0', is_tube: true, well_count: 1, well_volume_ul: '2000' })}
      />
    );

    const legend = component.find(Legend);

    expect(legend.props().units).to.equal('µl');
    expect(legend.props().indicatorVal).to.equal(30);
  });

  it('Tube with both volume and mass, legend should display µl', () => {
    component = shallow(
      <InteractivePlate
        initialDomain={[1, 2]}
        wellMap={Immutable.Map()}
        aliquots={Immutable.fromJS([{ well_idx: 0, volume_ul: '30', mass_mg: '40' }])}
        containerType={Immutable.Map({ id: 'micro-2.0', is_tube: true, well_count: 1, well_volume_ul: '2000' })}
      />
    );

    const legend = component.find(Legend);

    expect(legend.props().units).to.equal('µl');
    expect(legend.props().indicatorVal).to.equal(30);
  });

  it('Tube with only mass, legend should display mg', () => {
    component = shallow(
      <InteractivePlate
        initialDomain={[1, 2]}
        wellMap={Immutable.Map()}
        aliquots={Immutable.fromJS([{ well_idx: 0, mass_mg: '40' }])}
        containerType={Immutable.Map({ id: 'micro-2.0', is_tube: true, well_count: 1, well_volume_ul: '2000' })}
      />
    );

    const legend = component.find(Legend);

    expect(legend.props().units).to.equal('mg');
    expect(legend.props().indicatorVal).to.equal(40);
  });

  it('Plate legend should update with selectedIndex ', () => {
    component = shallow(
      <InteractivePlate
        initialDomain={[1, 2]}
        wellMap={Immutable.Map()}
        aliquots={Immutable.fromJS([{ well_idx: 0, mass_mg: '40' }, { well_idx: 1, volume_ul: '30' }])}
        selectedIndex={0}
        containerType={Immutable.Map({ col_count: 10, well_count: 100, well_volume_ul: '2000' })}
      />
    );

    let legend = component.find(Legend);
    expect(legend.props().units).to.equal('mg');
    expect(legend.props().indicatorVal).undefined;

    component.setProps({ selectedIndex: 1 });
    legend = component.find(Legend);
    expect(legend.props().units).to.equal('µl');
  });

  it('Plate wells should be colored when volume or mass is present', () => {
    component = shallow(
      <InteractivePlate
        colorScale={['009aea', 'b2e5ff']}
        units={['µl', 'mg']}
        aliquots={Immutable.fromJS([{ volume_ul: '150.0', well_idx: 0 },
          { mass_mg: '310.0', well_idx: 1 },
          { mass_mg: '300.0', volume_ul: '50.0', well_idx: 2 }])}
        containerType={Immutable.Map({ col_count: 10, well_count: 100, well_volume_ul: '2000' })}
      />
    );

    const wells = component.find(Plate).props().wellMap;
    expect(wells.getIn([0, 'color'])).to.not.be.undefined;
    expect(wells.getIn([1, 'color'])).to.not.be.undefined;
    expect(wells.getIn([2, 'color'])).to.not.be.undefined;
    expect(wells.getIn([3, 'color'])).to.be.undefined;
  });

  it('should update wellColor when props are changed', () => {
    component = shallow(
      <InteractivePlate
        units={['µl', 'mg']}
        aliquots={Immutable.fromJS([{ volume_ul: '10.0', well_idx: 0 }])}
        containerType={Immutable.Map({ col_count: 10, well_count: 100, well_volume_ul: '2000' })}
        initialDomain={[1, 2, 3]}
      />
    );
    expect(component.find(Plate).props().wellMap.getIn([0, 'color'])).to.equal('#b2e5ff');
    component.setProps({ aliquots: Immutable.fromJS([{ volume_ul: '1.0', well_idx: 0 }]) });
    expect(component.find(Plate).props().wellMap.getIn([0, 'color'])).to.equal('#009aea');
  });

  it('should not update wellColor if same props are passed', () => {
    component = shallow(
      <InteractivePlate
        units={['µl', 'mg']}
        aliquots={Immutable.fromJS([{ volume_ul: '10.0', well_idx: 0 }])}
        containerType={Immutable.Map({ col_count: 10, well_count: 100, well_volume_ul: '2000' })}
        initialDomain={[1, 2, 3]}
      />
    );
    expect(component.find(Plate).props().wellMap.getIn([0, 'color'])).to.equal('#b2e5ff');
    component.setProps({ aliquots: Immutable.fromJS([{ volume_ul: '10.0', well_idx: 0 }]) });
    expect(component.find(Plate).props().wellMap.getIn([0, 'color'])).to.equal('#b2e5ff');
  });

});
