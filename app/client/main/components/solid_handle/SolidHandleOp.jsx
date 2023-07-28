import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import SolidHandleOpSummaries from 'main/components/solid_handle/SolidHandleOpSummaries';

class SolidHandleOp extends React.PureComponent {

  render() {
    return (
      <div>
        <SolidHandleOpSummaries
          run={this.props.run}
          instruction={Immutable.fromJS(this.props.instruction)}
        />
      </div>
    );
  }
}

SolidHandleOp.propTypes = {
  run: PropTypes.object.isRequired,
  instruction: PropTypes.object.isRequired
};

export default SolidHandleOp;
