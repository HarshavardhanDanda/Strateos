import Immutable       from 'immutable';
import _               from 'lodash';

import { splitRefObject } from 'main/util/RefUtil';
import humanize   from 'underscore.string/humanize';
import AutoprotocolUtil from 'main/util/AutoprotocolUtil';
import   { SpinOp } from '../components/InstructionCard/Ops';

const relevantWarps = (instruction) => {
  // Default to return all warps because there's no longer relevant warp ids.
  // Hopefully this full list of warps doesn't include superflous or error warps.
  // TODO start filtering out superflous warps, if they exist...
  return instruction.warps;
};

const liquidHandleChannel = (instruction) => {
  const shape = instruction.getIn(['operation', 'shape']);
  if (!shape) return 'single';

  const rows = shape.get('rows') || 1;
  const cols = shape.get('columns') || 1;
  if (rows === 1 && cols === 1) return 'single';

  return 'multi';
};

const identicalShape = (shapeA, shapeB) => {
  return shapeA.get('rows') === shapeB.get('rows') &&
    shapeA.get('columns') === shapeB.get('columns') &&
    shapeA.get('format') === shapeB.get('format');
};

const identicalRefs = (refsA, refsB) => {
  return refsA.sort().equals(refsB.sort());
};

const groupInstructions = (instructions) => {
  const instructionGroups = [];

  const defaultShape = Immutable.fromJS({ rows: 1, columns: 1, format: 'SBS96' });

  let currentLihaGroupSingle = { type: 'single', instructions: [] };
  let currentLihaGroupMulti = { type: 'multi', instructions: [] };
  let currentLihaGroupDispense = { type: 'dispense', instructions: [] };
  let previousShape;
  let previousRefs;

  instructions.forEach((instruction) => {
    const op = instruction.getIn(['operation', 'op']);
    const locations = instruction.getIn(['operation', 'locations']);

    const refs =
        locations && locations.map(loc => loc.get('location')).filter(loc => loc).map(loc => splitRefObject(loc)[0]);
    let shape = instruction.getIn(['operation', 'shape']);
    // The default shape for liha is 1 row 1 column which is omni. In case the shape
    // for an omni operation is specified, the default is specified here so when comparing
    // specified and unspecified omnis they will be identical.
    if (op === 'liquid_handle' && !shape) shape = defaultShape;

    if (
      op !== 'liquid_handle' ||
      (previousShape && !(identicalShape(shape, previousShape) && identicalRefs(refs, previousRefs)))
    ) {
      if (currentLihaGroupSingle.instructions.length !== 0) instructionGroups.push(currentLihaGroupSingle);
      if (currentLihaGroupMulti.instructions.length !== 0) instructionGroups.push(currentLihaGroupMulti);
      if (currentLihaGroupDispense.instructions.length !== 0) instructionGroups.push(currentLihaGroupDispense);
      currentLihaGroupSingle = { type: 'single', instructions: [] };
      currentLihaGroupMulti = { type: 'multi', instructions: [] };
      currentLihaGroupDispense = { type: 'dispense', instructions: [] };
      previousShape = undefined;
      previousRefs = undefined;
    }

    if (op === 'liquid_handle') {
      const channel = liquidHandleChannel(instruction);

      if (instruction.getIn(['operation', 'mode']) === 'dispense') {
        currentLihaGroupDispense.instructions.push(instruction);
      } else if (channel === 'single') {
        currentLihaGroupSingle.instructions.push(instruction);
      } else if (channel === 'multi') {
        currentLihaGroupMulti.instructions.push(instruction);
      }
      previousShape = shape;
      previousRefs = refs;
    } else {
      instructionGroups.push(instruction);
    }
  });

  if (currentLihaGroupSingle.instructions.length !== 0) instructionGroups.push(currentLihaGroupSingle);
  if (currentLihaGroupMulti.instructions.length !== 0) instructionGroups.push(currentLihaGroupMulti);
  if (currentLihaGroupDispense.instructions.length !== 0) instructionGroups.push(currentLihaGroupDispense);

  return Immutable.fromJS(instructionGroups);
};

const getInstructionIds = (instructionGroups) => {
  const instructionIds = [];
  instructionGroups.forEach((group) => {
    if (group.get('instructions')) {
      group.get('instructions').forEach(ins => {
        instructionIds.push(ins.get('id'));
      });
    } else {
      instructionIds.push(group.get('id'));
    }
  });
  return instructionIds;
};

const getInstructionCompleteStatus = (instructionGroups) => {
  const instructions = [];
  const addInstructions = (id, completed_at) => instructions.push({ id, completed_at });
  if (instructionGroups) {
    instructionGroups.forEach((group) => {
      if (group.get('instructions')) {
        group.get('instructions').forEach(instruction => {
          addInstructions(instruction.get('id'), instruction.get('completed_at'));
        });
      } else {
        addInstructions(group.get('id'), group.get('completed_at'));
      }
    });
  }
  return instructions;
};

const liquidHandleGradientStyle = (percent) => {
  return `linear-gradient(to right, #d8deda ${percent}%,#ffffff ${percent}%)`;
};

const PROVISION_MIXTURE = 'provision_mixture';

const hasInformaticsOfProvisionMixture = (instruction) => {
  return instruction && instruction.operation && !_.isEmpty(instruction.operation.informatics)
         && instruction.operation.informatics[0].type === PROVISION_MIXTURE;
};

const getInstructionCardTitle = (operation) => {
  const op = operation.get('op');
  if (op === 'spin') {
    return humanize(`spin ${operation.get('flow_direction') || SpinOp.defaultFlowDirection}`);
  } else if (op == 'dispense' && operation.get('x_cassette') != undefined) {
    return humanize(`dispense (${operation.get('x_cassette')})`);
  } else {
    return humanize(op);
  }
};
/*
 returns the first instruction having provided ref if event is 'start'
 else it will return last instruction having provided ref from the provided list of instructions.
*/
const findInstructionHavingRef = (instructions, refName, event) => {
  let instructionHavingRef;

  const doesInstructionHaveRef = (instruction) => {
    const { operation } = instruction;

    return AutoprotocolUtil.containerNamesInOperation(Immutable.fromJS(operation))
      .some((currentRefName) => currentRefName === refName);
  };

  if (event === 'start') {
    for (let i = 0; i < instructions.length; i++) {
      if (doesInstructionHaveRef(instructions[i])) {
        instructionHavingRef = instructions[i];
        break;
      }
    }
  } else {
    for (let i = instructions.length - 1; i >= 0; i--) {
      if (doesInstructionHaveRef(instructions[i])) {
        instructionHavingRef = instructions[i];
        break;
      }
    }
  }

  return instructionHavingRef;
};

export {
  relevantWarps,
  groupInstructions,
  getInstructionIds,
  getInstructionCompleteStatus,
  liquidHandleGradientStyle,
  PROVISION_MIXTURE,
  hasInformaticsOfProvisionMixture,
  getInstructionCardTitle,
  findInstructionHavingRef
};
