import Immutable from 'immutable';
import { expect } from 'chai';

import {
  instructionsLoadStatus,
  runLoadStatus,
  refsLoadStatus,
  runIsFullJSON
} from './loadStatus';

/* eslint-disable no-unused-expressions */

describe('loadStatus', () => {
  it('runIsFullJSON should ensure run contains all data a run full_json would', () => {
    const runMissingData = Immutable.fromJS({});
    const run = Immutable.fromJS({
      id: '',
      instructions: [{ warps: [] }],
      refs: [],
      'has_quote?': true
    });
    const runMissingInstructions = Immutable.fromJS({
      id: '',
      refs: [],
      'has_quote?': true
    });
    const runMissingRefs = Immutable.fromJS({
      id: '',
      instructions: [{ warps: [] }],
      'has_quote?': true
    });
    const runMissingHasQuote = Immutable.fromJS({
      id: '',
      instructions: [{ warps: [] }],
      refs: []
    });
    const runHasNullQuote = Immutable.fromJS({
      id: '',
      instructions: [{ warps: [] }],
      refs: [],
      'has_quote?': null // eslint-disable-line no-null/no-null
    });
    const runMissingWarpsInInstructions = Immutable.fromJS({ id: '', instructions: [], refs: [], 'has_quote?': true });

    expect(runIsFullJSON(run)).to.be.true;
    expect(runIsFullJSON(runMissingData)).to.be.false;
    expect(runIsFullJSON(runMissingInstructions)).to.be.false;
    expect(runIsFullJSON(runMissingRefs)).to.be.false;
    expect(runIsFullJSON(runMissingHasQuote)).to.be.false;
    expect(runIsFullJSON(runHasNullQuote)).to.be.true;
    expect(runIsFullJSON(runMissingWarpsInInstructions)).to.be.false;
  });

  it('instructionsLoadStatus should ensure Instructions are not empty', () => {
    const instructions = Immutable.fromJS([{}, {}]);
    const emptyInstructions = Immutable.fromJS([]);

    expect(instructionsLoadStatus(instructions)).to.be.true;
    expect(instructionsLoadStatus(emptyInstructions)).to.be.false;
  });

  it('runLoadStatus should ensure RunPage fetches show_minimal Run object', () => {
    const run = Immutable.fromJS({ id: 'someId', datasets: [], dependents: [] });
    const theWrongRun = Immutable.fromJS({});

    expect(runLoadStatus(run)).to.be.true;
    expect(runLoadStatus(theWrongRun)).to.be.false;
  });

  it('refsLoadStatus should ensure refs are not empty', () => {
    const refs = Immutable.fromJS([{}, {}]);
    const emptyRefs = Immutable.fromJS([]);

    expect(refsLoadStatus(refs)).to.be.true;
    expect(refsLoadStatus(emptyRefs)).to.be.false;
  });
});
