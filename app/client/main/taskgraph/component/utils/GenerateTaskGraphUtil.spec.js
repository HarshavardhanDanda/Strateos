import Immutable from 'immutable';

import generateTaskGraph from 'main/taskgraph/component/utils/GenerateTaskGraphUtil';

import { expect } from 'chai';

const withRun = autoprotocol => Immutable.Map({
  id: 'foobar',
  autoprotocol
});

describe('GenerateTaskGraphUtil', () => {
  it('generateTaskGraph 1 ref 1 instruction', () => {
    const run = withRun(Immutable.fromJS({
      refs: {
        plate: {
          new: '96-flat',
          cover: 'standard',
          discard: true
        }
      },
      instructions: [{
        op: 'image_plate',
        object: 'plate',
        mode: 'top',
        dataref: 'test_dataref'
      }]
    }));

    const taskGraph = generateTaskGraph(run);

    expect(taskGraph.get('tasks').count()).to.be.equal(3);
    expect(taskGraph.get('dependencies').count()).to.be.equal(2);
  });

  it('generateTaskGraph 2 refs 2 instructions', () => {
    const run = withRun(Immutable.fromJS({
      refs: {
        plate1: {
          new: '96-flat',
          cover: 'standard',
          discard: true
        },
        plate2: {
          new: '96-flat',
          cover: 'standard',
          discard: true
        }
      },
      instructions: [{
        op: 'image_plate',
        object: 'plate1',
        mode: 'top',
        dataref: 'test_dataref'
      }, {
        op: 'image_plate',
        object: 'plate2',
        mode: 'top',
        dataref: 'test_dataref'
      }]
    }));

    const taskGraph = generateTaskGraph(run);

    expect(taskGraph.get('tasks').count()).to.be.equal(6);
    expect(taskGraph.get('dependencies').count()).to.be.equal(4);
  });

  it('generateTaskGraph 2 refs 3 instructions', () => {
    const run = withRun(Immutable.fromJS({
      refs: {
        plate1: {
          new: '96-flat',
          cover: 'standard',
          discard: true
        },
        plate2: {
          new: '96-flat',
          cover: 'standard',
          discard: true
        }
      },
      instructions: [{
        op: 'image_plate',
        object: 'plate1',
        mode: 'top',
        dataref: 'test_dataref'
      }, {
        op: 'image_plate',
        object: 'plate2',
        mode: 'top',
        dataref: 'test_dataref'
      }, {
        op: 'pipette',
        groups: [{
          transfer: [{
            from: 'plate1',
            to: 'plate2',
            volume: '10:milliliter'
          }]
        }]
      }]
    }));

    const taskGraph = generateTaskGraph(run);

    expect(taskGraph.get('tasks').count()).to.be.equal(7);
    expect(taskGraph.get('dependencies').count()).to.be.equal(6);
  });

  it('can reformat time constraints', () => {
    const run = withRun(Immutable.fromJS({
      refs: {
        plate1: {
          new: '96-flat',
          cover: 'standard',
          discard: true
        },
        plate2: {
          new: '96-flat',
          cover: 'standard',
          discard: true
        }
      },
      instructions: [{
        op: 'image_plate',
        object: 'plate1',
        mode: 'top',
        dataref: 'test_dataref'
      }, {
        op: 'image_plate',
        object: 'plate2',
        mode: 'top',
        dataref: 'test_dataref'
      }, {
        op: 'pipette',
        groups: [{
          transfer: [{
            from: 'plate1',
            to: 'plate2',
            volume: '10:milliliter'
          }]
        }]
      }],
      time_constraints: [{
        from: {
          instruction_end: 0
        },
        to: {
          instruction_start: 1
        },
        less_than: '20:minute'
      }]
    }));

    const taskGraph = generateTaskGraph(run);
    const timeConstraints = taskGraph.get('timeConstraints').toJS();

    expect(timeConstraints.length).to.be.equal(1);
    expect(timeConstraints[0].from.endOf).to.be.equal('foobar|InstructionTask|0');
    expect(timeConstraints[0].to.startOf).to.be.equal('foobar|InstructionTask|1');
  });
});
