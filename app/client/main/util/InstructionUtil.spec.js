import { expect } from 'chai';
import Immutable from 'immutable';
import { hasInformaticsOfProvisionMixture, findInstructionHavingRef, getInstructionCardTitle } from './InstructionUtil';

const instruction = {
  id: 'i17mt5u8su5bf',
  operation: {
    informatics: [
      {
        data: {},
        type: 'provision_mixture'
      }
    ],
    measurement_mode: 'volume',
    op: 'provision',
    resource_id: 'rs16r3gkf8xxbz',
  }
};

describe('InstructionUtil#hasInformaticsOfProvisionMixture', () => {
  it('should return true if instruction has informatics of type provision_mixture', () => {
    expect(hasInformaticsOfProvisionMixture(instruction)).to.be.true;
  });

  it('should return false if instruction does not have informatics of type provision_mixture', () => {
    instruction.operation.informatics[0].type = 'other';
    expect(hasInformaticsOfProvisionMixture(instruction)).to.be.false;
  });

  it('should return false if instruction does not have informatics', () => {
    instruction.operation.informatics = undefined;
    expect(hasInformaticsOfProvisionMixture(instruction)).to.be.false;
  });
});

describe('InstructionUtil#findInstructionHavingRef', () => {
  const refName1 = 'test_ref1';
  const refName2 = 'test_ref2';
  const instructions = [
    {
      sequence_no: 0,
      operation: {
        object: refName1,
        op: 'dispense',
      },
    },
    {
      sequence_no: 1,
      operation: {
        object: refName1,
        op: 'dispense',
      },
    },
    {
      sequence_no: 2,
      operation: {
        object: refName2,
        op: 'dispense',
      },
    },
    {
      sequence_no: 3,
      operation: {
        object: refName2,
        op: 'dispense',
      },
    },
  ];

  it('should return first instruction having provided ref if instructionFrom is "start"', () => {
    expect(findInstructionHavingRef(instructions, refName1, 'start')).to.equal(instructions[0]);
  });

  it('should return last instruction having provided ref if instructionFrom is "end"', () => {
    expect(findInstructionHavingRef(instructions, refName2, 'end')).to.equal(instructions[3]);
  });
});

describe('InstructionUtil#getInstructionCardTitle', () => {
  it('should return correct instruction card title', () => {
    const operation = Immutable.fromJS({ duration: '2:hour', shaking: true, object: 'bacteria384', where: 'warm_37', op: 'incubate' });
    instruction.operation.informatics = undefined;
    expect(getInstructionCardTitle(operation)).to.equal('Incubate');
  });

  it('should return correct title when op is spin', () => {
    const operation = Immutable.fromJS({ acceleration: '500:g', duration: '1.0:minute', object: 'adp_glo_reservoir', op: 'spin', x_human: true, flow_direction: 'inward' });
    expect(getInstructionCardTitle(operation)).to.equal('Spin inward');
  });

  it('should return correct title when op is dispense', () => {
    const operation = Immutable.fromJS({ op: 'dispense', object: 'src_plate' });
    expect(getInstructionCardTitle(operation)).to.equal('Dispense');
  });
});
