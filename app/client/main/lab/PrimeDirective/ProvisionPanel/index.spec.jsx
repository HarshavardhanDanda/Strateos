import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Card, CollapsiblePanel } from '@transcriptic/amino';
import ProvisionPanel from 'main/lab/PrimeDirective/ProvisionPanel';

function provisionInstructionsVolumeData(measurementMode, resourceId, id) {
  return {
    operation: {
      to: [
        {
          volume: '900:microliter',
          well: '50 uM Fluoroscein/0'
        },
        {
          volume: '96.345:microliter',
          well: '50 uM Fluoroscein/0'
        }
      ],
      op: 'provision',
      resource_id: resourceId,
      measurementmode: measurementMode
    },
    completed_at: '2020-04-29T14:27:29.520-07:00',
    id: id
  };
}

function provisionInstructionsMassData() {
  return {
    operation: {
      to: [
        {
          mass: '100:milligram',
          well: 'CalibrationPlate_2020-04-29/84'
        },
        {
          mass: '100:milligram',
          well: 'CalibrationPlate_2020-04-29/85'
        }
      ],
      op: 'provision',
      resource_id: 'rs1b6z2vgatkq7',
      measurement_mode: 'mass'
    },
    completed_at: '2020-04-29T14:27:13.638-07:00',
    id: 'i1eczdt2u69xv9'
  };
}

function sampleData(measurementMode) {
  return {
    provisionInstructions: Immutable.fromJS([
      provisionInstructionsVolumeData(measurementMode, 'rs194na2u3hfam', 'i1eczdt2uggr2j')
    ]),
    resources: Immutable.fromJS([
      {
        id: 'rs194na2u3hfam',
        name: 'Phosphate Buffer Saline, pH 7.2'
      }
    ]),
    initiallyCollapsed: false
  };
}

const propsUndefinedMode = sampleData(undefined);

const propsVolumeMode = sampleData('volume');

const propsMassMode = {
  provisionInstructions: Immutable.fromJS([
    provisionInstructionsMassData()
  ]),
  resources: Immutable.fromJS([
    {
      id: 'rs1b6z2vgatkq7',
      name: 'LUDOX® CL-X colloidal silica'
    }
  ]),
  initiallyCollapsed: false
};

const props = {
  provisionInstructions: Immutable.fromJS([
    provisionInstructionsMassData(),
    provisionInstructionsVolumeData('volume', 'rs1b4xwqsnmx52', 'i1eczdt2ud45nf'),
    provisionInstructionsVolumeData(undefined, 'rs194na2u3hfam', 'i1eczdt2uggr2j')
  ]),
  resources: Immutable.fromJS([
    {
      id: 'rs1b6z2vgatkq7',
      name: 'LUDOX® CL-X colloidal silica'
    },
    {
      id: 'rs1b4xwqsnmx52',
      name: 'Milli-Q Water'
    },
    {
      id: 'rs194na2u3hfam',
      name: 'Phosphate Buffer Saline, pH 7.2'
    }
  ]),
  initiallyCollapsed: false
};

describe('Provision Panel Table test', () => {
  let table;
  let wrapper;

  afterEach(() => {
    if (table) {
      table.unmount();
    }

    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('should have table with 5 columns', () => {
    table = shallow(<ProvisionPanel {...props} />).dive().find('Table');
    expect(table.find('Column').length).to.equal(5);
    expect(table.find('Column').at(0).props().header).to.equal('Resource Name');
    expect(table.find('Column').at(1).props().header).to.equal('Resource Id');
    expect(table.find('Column').at(2).props().header).to.equal('Total Quantity');
    expect(table.find('Column').at(3).props().header).to.equal('Remaining Quantity');
    expect(table.find('Column').at(4).props().header).to.equal('Lot Numbers Used');
  });

  it('should show volume when measurement mode is not specified for the instruction', () => {
    table = shallow(<ProvisionPanel {...propsUndefinedMode} />).dive().find('Table').dive();
    const row1 = table.find('Row').at(1);
    expect(row1.find('BodyCell').length).to.equal(5);
    expect(row1.find('BodyCell').at(0).childAt(0).text()).to.contain('Phosphate Buffer Saline, pH 7.2');
    expect(row1.find('BodyCell').at(1).childAt(0).text()).to.contain('rs194na2u3hfam');
    expect(row1.find('BodyCell').at(2).childAt(0).text()).to.contain('996.345 μL');
    expect(row1.find('BodyCell').at(3).childAt(0).text()).to.contain('0 μL');
  });

  it('should show volume when measurement mode is volume for the instruction', () => {
    table = shallow(<ProvisionPanel {...propsVolumeMode} />).dive().find('Table').dive();
    const row1 = table.find('Row').at(1);
    expect(row1.find('BodyCell').length).to.equal(5);
    expect(row1.find('BodyCell').at(0).childAt(0).text()).to.contain('Phosphate Buffer Saline, pH 7.2');
    expect(row1.find('BodyCell').at(1).childAt(0).text()).to.contain('rs194na2u3hfam');
    expect(row1.find('BodyCell').at(2).childAt(0).text()).to.contain('996.345 μL');
    expect(row1.find('BodyCell').at(3).childAt(0).text()).to.contain('0 μL');
  });

  it('should show mass when measurement mode is mass for the instruction', () => {
    table = shallow(<ProvisionPanel {...propsMassMode} />).dive().find('Table').dive();
    const row1 = table.find('Row').at(1);
    expect(row1.find('BodyCell').length).to.equal(5);
    expect(row1.find('BodyCell').at(0).childAt(0).text()).to.contain('LUDOX® CL-X colloidal silica');
    expect(row1.find('BodyCell').at(1).childAt(0).text()).to.contain('rs1b6z2vgatkq7');
    expect(row1.find('BodyCell').at(2).childAt(0).text()).to.contain('200 mg');
    expect(row1.find('BodyCell').at(3).childAt(0).text()).to.contain('0 mg');
  });

  it('should show both mass and volume based on the measurement mode for the instructions', () => {
    table = shallow(<ProvisionPanel {...props} />).dive().find('Table').dive();
    const row1 = table.dive().find('Row').at(1);
    expect(row1.find('BodyCell').length).to.equal(5);
    expect(row1.find('BodyCell').at(0).childAt(0).text()).to.contain('LUDOX® CL-X colloidal silica');
    expect(row1.find('BodyCell').at(1).childAt(0).text()).to.contain('rs1b6z2vgatkq7');
    expect(row1.find('BodyCell').at(2).childAt(0).text()).to.contain('200 mg');
    expect(row1.find('BodyCell').at(3).childAt(0).text()).to.contain('0 mg');

    const row2 = table.dive().find('Row').at(2);
    expect(row2.find('BodyCell').length).to.equal(5);
    expect(row2.find('BodyCell').at(0).childAt(0).text()).to.contain('Milli-Q Water');
    expect(row2.find('BodyCell').at(1).childAt(0).text()).to.contain('rs1b4xwqsnmx52');
    expect(row2.find('BodyCell').at(2).childAt(0).text()).to.contain('996.345 μL');
    expect(row2.find('BodyCell').at(3).childAt(0).text()).to.contain('0 μL');

    const row3 = table.dive().find('Row').at(3);
    expect(row3.find('BodyCell').length).to.equal(5);
    expect(row3.find('BodyCell').at(0).childAt(0).text()).to.contain('Phosphate Buffer Saline, pH 7.2');
    expect(row3.find('BodyCell').at(1).childAt(0).text()).to.contain('rs194na2u3hfam');
    expect(row3.find('BodyCell').at(2).childAt(0).text()).to.contain('996.345 μL');
    expect(row3.find('BodyCell').at(3).childAt(0).text()).to.contain('0 μL');
  });

  it('should have Card component wrapped for CollapsiblePanel', () => {
    wrapper = shallow(<ProvisionPanel {...props} />).dive();

    const card = wrapper.find(Card);
    expect(card).to.have.length(1);
    expect(card.find(CollapsiblePanel)).to.have.length(1);
  });
});
