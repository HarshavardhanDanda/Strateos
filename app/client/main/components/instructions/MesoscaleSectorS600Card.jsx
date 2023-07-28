import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { ContainerTag } from 'main/components/InstructionTags';
import { Param } from '@transcriptic/amino';

function MesoScaleSectorS600Card({ instruction, run }) {
  const { operation, sequence_no } = instruction;

  return (
    <ul className="params">
      <Param
        label="Object"
        value={(
          <ContainerTag
            refName={operation.object}
            run={run}
            instructionSequenceNo={sequence_no}
            showTimeConstraint
            showTimeConstraintDetail
          />
        )}
      />
      <Param
        label="Assay"
        value={operation.assay}
      />
    </ul>
  );
}

MesoScaleSectorS600Card.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.shape({
    operation: PropTypes.shape({
      object: PropTypes.string.isRequired,
      assay: PropTypes.string.isRequired
    }).isRequired
  }).isRequired
};

export default MesoScaleSectorS600Card;
