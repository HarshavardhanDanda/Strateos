import AutoprotocolUtil from 'main/util/AutoprotocolUtil';

const MAX_ACOUSTIC_TRANSFERS_TO_RENDER = 500;

function acousticOperationIsLarge(operation) {
  const numTransfers =  AutoprotocolUtil.numAcousticTransfers(operation);
  return numTransfers > MAX_ACOUSTIC_TRANSFERS_TO_RENDER;
}

export default acousticOperationIsLarge;
