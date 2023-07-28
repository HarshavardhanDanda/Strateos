import _ from 'lodash';
import Immutable from 'immutable';

import {
  agitate,
  liha,
  stamp,
  legacyStamp,
  objectsArrayRefs,
  oligosynthesize,
  prep,
  spe,
  spread,
  autopick,
  flow_analyze,
  provision,
  magnetic_transfer,
  dispense,
  liquid_handle,
  measure,
  measureMass,
  singleContainer,
  sonicate,
  lcmrm,
  generic_task
} from './ContainersInOp';

const AutoprotocolUtil = {
  containerNamesInOperation(operation) {
    const allContainerNames = (() => {

      switch (operation.get('op')) {
        case 'agitate':
          return agitate(operation);

        case 'sonicate':
          return sonicate(operation);
        case 'lcmrm':
          return lcmrm(operation);

        case 'pipette':
        case 'acoustic_transfer':
          return liha(operation);

        case 'stamp': {
          let refsByTransfer;

          if (operation.get('groups')) {
            refsByTransfer = stamp(operation);
          } else {
            refsByTransfer = legacyStamp(operation);
          }

          return refsByTransfer.flatten();
        }

        // These have an array of refs in operation['object']
        case 'lcms':
        case 'gel_separate':
        case 'pressurize':
          return objectsArrayRefs(operation);

        case 'oligosynthesize':
          return oligosynthesize(operation);

        case 'miniprep':
        case 'maxiprep':
          return prep(operation);

        case 'spread':
          return spread(operation);

        case 'spe':
          return spe(operation);

        case 'autopick':
          return autopick(operation);

        case 'flow_analyze':
          return flow_analyze(operation);

        case 'provision':
          return provision(operation);

        case 'magnetic_transfer':
          return magnetic_transfer(operation);

        case 'dispense':
          return dispense(operation);

        case 'absorbance':
        case 'envision':
        case 'evaporate':
        case 'cover':
        case 'flash_freeze':
        case 'fluorescence':
        case 'image':
        case 'image_plate':
        case 'incubate':
        case 'luminescence':
        case 'mesoscale_sectors600':
        case 'sanger_sequence':
        case 'seal':
        case 'spectrophotometry':
        case 'spin':
        case 'thermocycle':
        case 'uncover':
        case 'unseal':
        case 'x_blue_wash':
        case 'microwave':
        case 'nmr':
          return singleContainer(operation);

        // These have an array of refs in operation['object']
        case 'measure_concentration':
        case 'measure_volume':
          return measure(operation);
        // This has a single ref in operation['object']
        case 'measure_mass':
          return measureMass(operation);

        case 'liquid_handle':
          return liquid_handle(operation);

        case 'generic_task':
          return generic_task(operation);

        default:
          return Immutable.List();
      }
    })();

    return Immutable.Set(allContainerNames);
  },

  runFromRawAutoprotocol(raw) {
    const instructions = raw.instructions.map((inst) => {
      return { operation: inst };
    });

    const refs = Object.keys(raw.refs).map((name) => {
      return {
        name: name,
        container: {
          container_type: raw.refs[name].container_type
        }
      };
    });

    return Immutable.fromJS({
      instructions,
      refs
    });
  },

  numAcousticTransfers(operation) {
    const reducer = (acc, group) => acc + group.transfer.length;
    const initial = 0;

    return _.reduce(operation.groups, reducer, initial);
  }
};

export default AutoprotocolUtil;
