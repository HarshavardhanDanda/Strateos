import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import Immutable from 'immutable';
import ResourceActions    from 'main/actions/ResourceActions';
import { hasInformaticsOfProvisionMixture } from 'main/util/InstructionUtil.js';
import ProvisionCard  from './ProvisionCard';
import { refsByName1 } from './provision-spec-data';

describe('ProvisionCard', () => {
  const sandbox = sinon.createSandbox();
  const instructions = [
    {
      id: 'i17mt5u8vq893',
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
        to: [
          {
            volume: '32.74:microliter',
            well: 'testDest1'
          }
        ]
      }
    },
    {
      id: 'i17mt5u8vq894',
      operation: {
        informatics: [
          {
            data: {},
            type: 'other'
          }
        ],
        measurement_mode: 'volume',
        op: 'provision',
        resource_id: 'rs16r3gkf8xxbt',
        to: [
          {
            volume: '32.74:microliter',
            well: 'testDest1'
          }
        ]
      }
    }
  ];

  afterEach(() => {
    sandbox.restore();
  });

  const renderComponent = () => {
    shallow(<ProvisionCard
      key="test"
      instruction={Immutable.fromJS(instructions[0])}
      refsByName={Immutable.fromJS(refsByName1)}
      provisionInstructions={Immutable.fromJS(instructions)}
    />).dive();
  };

  it('should load resources of instructions having informatics of provision_mixture type', () => {
    const clock = sinon.useFakeTimers();
    const resourcesLoadSpy = sandbox.stub(ResourceActions, 'loadMany');
    renderComponent();
    const expectedResourceIds = instructions.filter(ins => hasInformaticsOfProvisionMixture(ins))
      .map(ins => ins.operation.resource_id);

    // we need to wait since _.debounce is used in the component
    clock.tick(400);

    expect(resourcesLoadSpy.calledOnce).to.be.true;
    expect(resourcesLoadSpy.args[0][0]).to.deep.equal(expectedResourceIds);
    clock.restore();
  });

  it('should not load resources if there are no instructions having provision_mixture informatics', () => {
    instructions[0].operation.informatics[0].type = 'other';
    const resourcesLoadSpy = sandbox.stub(ResourceActions, 'loadMany');
    renderComponent();
    expect(resourcesLoadSpy.calledOnce).to.be.false;
  });
});
