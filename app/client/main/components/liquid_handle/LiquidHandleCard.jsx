import PropTypes from 'prop-types';
import React     from 'react';

import { Param } from '@transcriptic/amino';
import LiquidHandleOp from './LiquidHandleOp';

function LiquidHandleCard(props) {
  const shape   = props.instruction.operation.shape;
  const rows    = shape ? shape.rows || 1 : 1;
  const columns = shape ? shape.columns || 1 : 1;
  const format  = shape ? shape.format || 'SBS96' : 'SBS96';

  return (
    <div>
      <LiquidHandleOp
        run={props.run}
        instruction={props.instruction}
      />
      <ul className="params">
        <Param
          label="Rows"
          value={rows}
        />
        <Param
          label="Columns"
          value={columns}
        />
        <Param
          label="Format"
          value={format}
        />
      </ul>
    </div>
  );
}

LiquidHandleCard.propTypes = {
  run: PropTypes.object.isRequired,
  instruction: PropTypes.object.isRequired
};

export default LiquidHandleCard;
