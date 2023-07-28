import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';

import TransferGroup from 'main/components/instructions/LiquidTransfers/TransferGroup';
import PipetteGroups from './PipetteGroups';
import DistributeGroup from './DistributeGroup';
import MixGroup from './MixGroup';
import ConsolidateGroup from './ConsolidateGroup';

describe('PipetteGroups', () => {
  const run = Immutable.fromJS({
    refs: [{ name: 'foo', container_type: { id: 'ct12' } }]
  });
  const instructionSequenceNo = 0;

  it('should pass instructionSequenceNo to DistributeGroup', () => {
    const groups = [
      { distribute: {
        from: 'master mix/0',
        to: [
          { well: 'pcr/0', volume: '24:microliter' },
        ]
      } }
    ];
    const wrapper = shallow(<PipetteGroups groups={groups} run={run} instructionSequenceNo={instructionSequenceNo} />);
    const distributeGroup = wrapper.dive().find(DistributeGroup);
    expect(distributeGroup.props().instructionSequenceNo).to.equal(instructionSequenceNo);
  });

  it('should pass instructionSequenceNo to TransferGroup', () => {
    const groups = [
      { transfer: [] }
    ];
    const wrapper = shallow(<PipetteGroups groups={groups} run={run} instructionSequenceNo={instructionSequenceNo} />);
    const transferGroup = wrapper.dive().find(TransferGroup);
    expect(transferGroup.props().instructionSequenceNo).to.equal(instructionSequenceNo);
  });

  it('should pass instructionSequenceNo to MixGroup', () => {
    const groups = [
      { mix: [] }
    ];
    const wrapper = shallow(<PipetteGroups groups={groups} run={run} instructionSequenceNo={instructionSequenceNo} />);
    const mixGroup = wrapper.dive().find(MixGroup);
    expect(mixGroup.props().instructionSequenceNo).to.equal(instructionSequenceNo);
  });

  it('should pass instructionSequenceNo to ConsolidateGroup', () => {
    const groups = [
      { consolidate: {
        from: 'master mix/0',
        to: [
          { well: 'pcr/0', volume: '24:microliter' },
        ]
      } }
    ];
    const wrapper = shallow(<PipetteGroups groups={groups} run={run} instructionSequenceNo={instructionSequenceNo} />);
    const consolidateGroup = wrapper.dive().find(ConsolidateGroup);
    expect(consolidateGroup.props().instructionSequenceNo).to.equal(instructionSequenceNo);
  });
});
