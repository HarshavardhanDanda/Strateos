import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import TransferGroup from 'main/components/instructions/LiquidTransfers/TransferGroup';
import Unit          from 'main/components/unit';

import { Param } from '@transcriptic/amino';

import acousticOperationIsLarge from './acousticOperationIsLarge';

function AcousticTransferOp({ instruction, run }) {
  const tooLarge = acousticOperationIsLarge(instruction.operation);
  if (tooLarge) return <TooLargeMessage />;

  const dropletValue = (
    <Unit value={instruction.operation.droplet_size || '25:nanoliter'} />
  );

  return (
    <div className="acoustic-transfer-op operation">
      <ul className="params">
        <Param
          label="Droplet Size"
          value={dropletValue}
        />
      </ul>
      <div className="instruction-table">
        {
          instruction.operation.groups.map((group, i) => {
            return <TransferGroup key={i} body={group.transfer} run={run} />;
          })
        }
      </div>
    </div>
  );
}

AcousticTransferOp.propTypes = {
  instruction: PropTypes.instanceOf(Object).isRequired,
  run: PropTypes.instanceOf(Immutable.Map).isRequired
};

function TooLargeMessage() {
  return (
    <p>
      There are too many transfers in this instruction to display.
      You can download the autoprotocol to see details of the transfers.
    </p>
  );
}

export default AcousticTransferOp;
