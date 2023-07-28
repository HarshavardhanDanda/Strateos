import React from 'react';
import { expect } from 'chai';
import Immutable from 'immutable';
import testRun from 'main/test/run-json/everyInstructionAdminRun.json';
import SolidHandleOpSummaries from './SolidHandleOpSummaries';

const immutableTestRun = Immutable.fromJS(testRun);
const solidHandleWithSolidClass = testRun.instructions.filter(i => i.operation.op === 'solid_handle')[0];

describe('SolidHandleOpSummaries', () => {
  it('should convert mass and render correctly', () => {

    const wrapper = enzyme.shallow(
      <SolidHandleOpSummaries
        run={immutableTestRun}
        instruction={Immutable.fromJS(solidHandleWithSolidClass)}
      />
    );

    const solidHandleOpInstance = wrapper.instance();
    expect(solidHandleOpInstance.transferredMassString(5)).to.equal('5µg');
    expect(solidHandleOpInstance.convertMassToNumber('5:microgram')).to.equal(5);
    expect(wrapper.text()).to.equal('1000µg<WellTag />1000µg<WellTag />');
  });
});
