/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const InstructionStore = { ...CRUDStore('instructions'),
  act(action) {
    switch (action.type) {
      case 'INSTRUCTION_DATA':
        return this._receiveData([action.instruction]);

      case 'INSTRUCTION_LIST':
        return this._receiveData(action.instructions);

      case 'INSTRUCTIONS_API_LIST':
        return this._receiveData(action.entities);

      default:
        return undefined;
    }
  },
  getByRunId(runId) {
    return this.getAll()
      .filter(instruction => instruction.get('run_id') === runId)
      .sortBy(instruction => instruction.get('sequence_no'));
  }
};

InstructionStore._register(Dispatcher);

export default InstructionStore;
