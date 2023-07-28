import Immutable from 'immutable';
import { expect } from 'chai';

import orderedInstructionsWithRefNames from './orderedInstructionsWithRefNames';

describe('orderedInstructionsWithRefNames', () => {
  it('orderedInstructionsWithRefNames should ignore unordered instructions', () => {
    const outOfOrderInstructions = Immutable.fromJS([
      {
        sequence_no: 0,
        operation: {
          object: 'sealObject0',
          op: 'seal'
        }
      },
      {
        sequence_no: 1,
        operation: {
          object: 'sealObject1',
          op: 'seal'
        }
      },
      {
        sequence_no: 3,
        operation: {
          object: 'spinObject2',
          op: 'spin'
        }
      }
    ]);

    const prematurelyFetchedInstructions = Immutable.fromJS([
      {
        sequence_no: 20,
        operation: {
          object: 'sealObject0',
          op: 'seal'
        }
      },
      {
        sequence_no: 21,
        operation: {
          object: 'sealObject1',
          op: 'seal'
        }
      },
      {
        sequence_no: 22,
        operation: {
          object: 'spinObject2',
          op: 'spin'
        }
      }
    ]);

    const all = outOfOrderInstructions.concat(prematurelyFetchedInstructions);

    const partiallyFetchedRefs = Immutable.fromJS([
      { name: 'sealObject0' },
      { name: 'sealObject1' }
    ]);

    const prematurelyFetchedRefs = Immutable.fromJS([
      { name: 'spinObject2' }
    ]);

    const completeRefs = partiallyFetchedRefs.concat(prematurelyFetchedRefs);

    expect(orderedInstructionsWithRefNames(outOfOrderInstructions, completeRefs).count()).to.equal(2);
    expect(orderedInstructionsWithRefNames(prematurelyFetchedInstructions, completeRefs).count()).to.equal(0);
    expect(orderedInstructionsWithRefNames(all, completeRefs).count()).to.equal(2);
    expect(orderedInstructionsWithRefNames(all, partiallyFetchedRefs).count()).to.equal(2);
    expect(orderedInstructionsWithRefNames(all, prematurelyFetchedRefs).count()).to.equal(2);
  });
});
