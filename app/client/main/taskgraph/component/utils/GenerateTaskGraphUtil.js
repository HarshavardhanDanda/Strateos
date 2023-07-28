import Immutable from 'immutable';

import AutoprotocolUtil from 'main/util/AutoprotocolUtil';
import { makeTaskId } from './TaskIds';
import { reformatAPtimeConstraint } from './TimeConstraintUtils';

const { containerNamesInOperation } = AutoprotocolUtil;

const INSTRUCTION_TASK_NAME = 'InstructionTask';
const FETCH_TASK_NAME       = 'FetchTask';
const SUPPLY_TASK_NAME      = 'SupplyTask';
const DESTINY_TASK_NAME     = 'DestinyTask';

const makeDependencies = (orderedTasks) => {
  let taskIdsByRef = Immutable.Map();
  orderedTasks.forEach((task) => {
    let refs;
    switch (task.get('name')) {
      case INSTRUCTION_TASK_NAME:
        refs = Immutable.Set(
          containerNamesInOperation(task.get('instruction'))
        );
        break;
      default:
        refs = Immutable.Iterable([task.get('obj')]);
    }

    refs.forEach((ref) => {
      let taskIds = taskIdsByRef.get(ref, Immutable.OrderedSet());
      taskIds = taskIds.add(task.get('id'));
      taskIdsByRef = taskIdsByRef.set(ref, taskIds);
    });
  });

  let dependencies = Immutable.List();
  taskIdsByRef.valueSeq().forEach((taskIds) => {
    let lastTaskId;
    taskIds.forEach((taskId) => {
      if (lastTaskId !== undefined) {
        dependencies = dependencies.push(Immutable.fromJS({
          // TODO: Change these var names to parent/child instead of _1/_2
          _1: taskId,
          _2: lastTaskId
        }));
      }
      lastTaskId = taskId;
    });
  });

  return dependencies;
};

// Makes a fetch/supply task given the autoprotocol ref info
const makeFetchTask = (run_id, refName, refBody) => {
  const taskName = refBody.get('id') ? FETCH_TASK_NAME : SUPPLY_TASK_NAME;

  return Immutable.Map({
    id: makeTaskId(run_id, taskName, refName),
    name: taskName,
    obj: refName
  });
};

// Makes a destiny task given the autoprotocol ref info
const makeDestinyTask = (run_id, refName, refBody) => {
  return Immutable.Map({
    id: makeTaskId(run_id, DESTINY_TASK_NAME, refName),
    name: DESTINY_TASK_NAME,
    obj: refName,
    discard: refBody.get('discard')
  });
};

const makeFetchAndDestinyTasks = (run_id, autoprotocol) => {
  let fetchTasks   = Immutable.OrderedSet();
  let destinyTasks = Immutable.OrderedSet();

  autoprotocol.get('refs').forEach((refBody, refName) => {
    fetchTasks = fetchTasks.add(makeFetchTask(run_id, refName, refBody));
    destinyTasks = destinyTasks.add(makeDestinyTask(run_id, refName, refBody));
  });

  return [fetchTasks, destinyTasks];
};

const makeInstructionTask = (run_id, instruction, sequenceNo) => {
  const refs = Immutable.Set(
    containerNamesInOperation(instruction)
  );

  return Immutable.fromJS({
    id: makeTaskId(run_id, INSTRUCTION_TASK_NAME, sequenceNo),
    sequenceNo,
    instruction,
    requiredObjects: refs,
    name: INSTRUCTION_TASK_NAME
  });
};

const makeInstructionTasks = (run_id, autoprotocol) => {
  let tasks = Immutable.OrderedSet();
  autoprotocol.get('instructions').forEach((instruction, index) => {
    const task = makeInstructionTask(run_id, instruction, index.toString());
    tasks = tasks.add(task);
  });
  return tasks;
};

const makeTimeConstraints = (fetchTasks, instructionTasks, APtimeConstraints) => {
  return APtimeConstraints.map((constraint) => {
    return reformatAPtimeConstraint(constraint, fetchTasks, instructionTasks);
  });
};

// Generate a task graph from autoprotocol
//
// @param  run          immutable run object
// @return TaskGraph    immutable map
const generateTaskGraph = (run) => {
  const autoprotocol = run.get('autoprotocol');
  const run_id = run.get('id');

  const instructionTasks = makeInstructionTasks(run_id, autoprotocol);
  const [fetchTasks, destinyTasks] = makeFetchAndDestinyTasks(run_id, autoprotocol);

  const taskSet         = fetchTasks.concat(instructionTasks).concat(destinyTasks);
  const dependencies    = makeDependencies(taskSet);
  const timeConstraints = makeTimeConstraints(
    fetchTasks,
    instructionTasks,
    autoprotocol.get('time_constraints', Immutable.List())
  );

  const tasks = taskSet.toMap().mapKeys((key, task) => task.get('id'));

  return Immutable.Map({ tasks, dependencies, timeConstraints });
};

export default generateTaskGraph;
