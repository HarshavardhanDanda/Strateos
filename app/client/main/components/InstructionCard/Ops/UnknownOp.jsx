import _ from 'lodash';
import React from 'react';

class UnknownOp extends React.PureComponent {
  render() {
    return (
      <div>
        <i className="fa fa-exclamation-triangle" />
        {
          " Oops! We don't know how to display this instruction. You can see the raw data below. "
        }
      </div>
    );
  }
}

UnknownOp.displayName = 'UnknownOp';

export default UnknownOp;
