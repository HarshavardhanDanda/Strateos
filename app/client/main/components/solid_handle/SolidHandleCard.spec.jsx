import React from 'react';
import { expect } from 'chai';
import Immutable from 'immutable';
import testRun from 'main/test/run-json/everyInstructionAdminRun.json';
import { Param } from '@transcriptic/amino';

import SolidHandleCard from './SolidHandleCard';

const immutableTestRun = Immutable.fromJS(testRun);
const solidHandleWithSolidClass = testRun.instructions.filter(i => i.operation.op === 'solid_handle')[0];

describe('SolidHandleCard', () => {
  it('should render without throwing', () => {

    const solidHandleOp = enzyme.mount(
      <SolidHandleCard
        run={immutableTestRun}
        instruction={solidHandleWithSolidClass}
      />
    );

    expect(solidHandleOp.find('Param').exists()).to.be.true;
    const param = solidHandleOp.find(Param);
    expect(param.props().label).to.equal('Solid Class');
    expect(param.props().value).to.equal('cohesive');

  });

  it('should render without a solid_class without throwing', () => {

    const solidHandleWithoutSolidClass = { ...solidHandleWithSolidClass, operation: { ...solidHandleWithSolidClass.operation, solid_class: undefined } };

    const solidHandleOp = enzyme.mount(
      <SolidHandleCard
        run={immutableTestRun}
        instruction={solidHandleWithoutSolidClass}
      />
    );

    expect(solidHandleOp.find('Param').exists()).to.be.false;
  });
});
