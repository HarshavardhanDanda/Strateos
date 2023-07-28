import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import ContainerStore from 'main/stores/ContainerStore';

import sinon from 'sinon';
import { ProvisionToContainerList, ProvisionSelector } from './index';

function refsByName() {
  return Immutable.fromJS({
    'CalibrationPlate_2020-04-29': {
      name: 'CalibrationPlate_2020-04-29',
      container_id: 'ct1eczdt2xhr5u8',
      container_type: {
        name: '96-Well White with Clear Flat Bottom Polystyrene Not Treated Microplate'
      },
      container: {
        label: 'CalibrationPlate_2020-04-29',
        container_type: {
          name: '96-Well White with Clear Flat Bottom Polystyrene Not Treated Microplate'
        },
        id: 'ct1eczdt2xhr5u8'
      }
    }
  });
}

function provisionToError() {
  return Immutable.fromJS({
    0: 'Must specify src container',
    1: 'Must specify src container',
    2: 'Must specify src container',
    3: 'Must specify src container'
  });
}

function provisions(mode) {
  const provisions = [
    {
      well: 'CalibrationPlate_2020-04-29/88',
      id: 0
    },
    {
      well: 'CalibrationPlate_2020-04-29/89',
      id: 1
    }
  ];

  if (mode === 'mass') {
    provisions[0].mass = '100:milligram';
    provisions[1].mass = '100:milligram';
  } else {
    provisions[0].volume = '100:microliter';
    provisions[1].volume = '100:microliter';
  }

  return provisions;
}

function instruction(mode) {
  const instruction = {
    operation: {
      measurement_mode: mode,
      op: 'provision',
      to: [
        {
          well: 'CalibrationPlate_2020-04-29/88'
        }
      ]
    },
    completed_at: null
  };

  if (mode === 'mass') {
    instruction.operation.to[0].mass = '100:milligram';
  } else {
    instruction.operation.to[0].volume = '100:microliter';
  }

  return instruction;
}

function provisionspec(mode) {
  const provisionspec = {
    transfers: [
      {
        from: 'ct1bqcw47hmg7v',
        from_well_idx: 0,
        to: 'CalibrationPlate_2020-04-29',
        to_well_idx: 88
      }
    ]
  };

  if (mode === 'mass') {
    provisionspec.transfers[0].mass = '100:milligram';
  } else {
    provisionspec.transfers[0].volume = '100:microliter';
  }

  return provisionspec;
}

function sampleData(mode) {
  return {
    provisions: Immutable.fromJS(provisions(mode)),
    addedContainers: Immutable.fromJS([]),
    refsByName: refsByName(),
    provisionMap: Immutable.fromJS({}),
    provisionToError: provisionToError(),
    forceValidate: false,
    measurementMode: mode,
    onContainerChosen: () => {}
  };
}

function provisionSelectorProps(mode) {
  return {
    instruction: Immutable.fromJS(instruction(mode)),
    refsByName: refsByName(),
    runId: 'r1',
    provisionSpec: Immutable.fromJS(provisionspec(mode)),
    provisionSpecContainers: Immutable.Map(),
    runCompleted: false,
    refetchAutoProvision: () => {},
    showManualButton: true
  };
}

const propsMassMode = sampleData('mass');

const propsVolumeMode = sampleData('volume');

describe('Provision Containers List', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should show mass units when measurement mode is mass', () => {
    wrapper = shallow(<ProvisionToContainerList {...propsMassMode} />);
    expect(wrapper.find('Unit').at(0).props().value).to.equal('100:milligram');
    expect(wrapper.find('Unit').at(1).props().value).to.equal('100:milligram');
  });

  it('should show volume units when measurement mode is volume', () => {
    wrapper = shallow(<ProvisionToContainerList {...propsVolumeMode} />);
    expect(wrapper.find('Unit').at(0).props().value).to.equal('100:microliter');
    expect(wrapper.find('Unit').at(1).props().value).to.equal('100:microliter');
  });

  function addContainer(volume_ul, mass_mg, mode) {
    const props = provisionSelectorProps(mode);
    sandbox.stub(ContainerStore, 'getById').returns(
      Immutable.fromJS({
        id: 'xyz',
        aliquots: [
          {
            volume_ul: volume_ul,
            mass_mg: mass_mg
          }
        ]
      })
    );

    wrapper = shallow(<ProvisionSelector {...props} />);
    wrapper.setState({ navIndex: 2, selectedContainerIds: Immutable.Set(['xyz']) });
    wrapper.find('ConnectedPagedStockView').props().actions.find(action => action.title === 'Add').action();
  }

  function testContainerAddition(volume_ul, mass_mg, mode, containerOptionsCount) {
    addContainer(volume_ul, mass_mg, mode);

    expect(wrapper.state().addedContainerIds.toJS()).to.eql(['xyz']);
    expect(wrapper.state().selectedContainerIds.size).to.eql(0);
    // provisionable containers among the added ones should show up in the selectable drop down
    expect(wrapper.find('ProvisionToContainerList').dive().find('Select').props().options.length)
      .to.equal(containerOptionsCount);
  }

  function testContainerRemoval(volume_ul, mass_mg, mode, containerOptionsCount) {
    // Select and add containers to get the option to remove them
    testContainerAddition(volume_ul, mass_mg, mode, containerOptionsCount);

    wrapper.setState({ selectedContainerIds: Immutable.Set(['xyz']) });
    wrapper.find('ConnectedPagedStockView').props().actions.find(action => action.title === 'Remove').action();

    expect(wrapper.state().addedContainerIds.toJS()).to.eql([]);
    expect(wrapper.state().selectedContainerIds.size).to.eql(0);
    expect(wrapper.find('ProvisionToContainerList').dive().find('Select').props().options.length)
      .to.equal(0);
  }

  it('should be able to add volume container to selection dropdown', () => {
    testContainerAddition(100, null, 'volume', 1);
  });

  it('should not be able to add volume container when volume is insufficient', () => {
    testContainerAddition(80, null, 'volume', 0);
  });

  it('should be able to add mass container to selection dropdown', () => {
    testContainerAddition(null, 100, 'mass', 1);
  });

  it('should not be able to add mass container when mass is insufficient', () => {
    testContainerAddition(null, 80, 'mass', 0);
  });

  it('should be able to remove the added volume container', () => {
    testContainerRemoval(100, null, 'volume', 1);
  });

  it('should be able to remove the added mass container', () => {
    testContainerRemoval(null, 100, 'mass', 1);
  });

  it('should have manual button and error msg when showManualButton is true for mass containers', () => {
    const props = provisionSelectorProps('mass');
    wrapper = shallow(<ProvisionSelector {...props} showManualButton errors={['Exact match not found, please check Manual section']} />);
    expect(wrapper.find('CurrentProvisionSpec').props().errors[0]).to.equal('Exact match not found, please check Manual section');
    const manualButton = wrapper.find('Pane');
    expect(manualButton.props().nextBtnName).to.equal('Manual');
  });

  it('should have manual button when showManualButton is true for volume containers', () => {
    const props = provisionSelectorProps('volume');
    wrapper = shallow(<ProvisionSelector {...props} showManualButton  errors={['Exact match not found, please check Manual section']} />);
    expect(wrapper.find('CurrentProvisionSpec').props().errors[0]).to.equal('Exact match not found, please check Manual section');
    const manualButton = wrapper.find('Pane');
    expect(manualButton.props().nextBtnName).to.equal('Manual');
  });
});
