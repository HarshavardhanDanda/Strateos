import PropTypes from 'prop-types';
import React from 'react';

import { Param } from '@transcriptic/amino';
import SolidHandleOp from './SolidHandleOp';

function SolidHandleCard(props) {

  const op = props.instruction.operation;

  return (
    <div>
      <SolidHandleOp
        run={props.run}
        instruction={props.instruction}
      />
      <If condition={op.solid_class != undefined}>
        <Param
          label="Solid Class"
          value={op.solid_class}
        />
      </If>
    </div>
  );
}

SolidHandleCard.propTypes = {
  run: PropTypes.object.isRequired,
  instruction: PropTypes.object.isRequired
};

export default SolidHandleCard;
