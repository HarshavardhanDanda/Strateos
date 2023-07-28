import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import AutoprotocolUtil from 'main/util/AutoprotocolUtil';
import { ContainerTag } from 'main/components/InstructionTags/index';

import './ContainerTags.scss';
import classNames from 'classnames';

class ContainerTags extends React.Component {

  static get propTypes() {
    return {
      instruction: PropTypes.instanceOf(Immutable.Map).isRequired,
      run: PropTypes.instanceOf(Immutable.Map)
    };
  }

  render() {
    const operation = this.props.instruction.get('operation');
    const sequenceNo = this.props.instruction.get('sequence_no');

    return (
      <div className={classNames('container-tags', this.props.className)}>
        {AutoprotocolUtil.containerNamesInOperation(operation).map((rn) => {
          return (
            <ContainerTag
              key={rn}
              refName={rn}
              run={this.props.run}
              instructionSequenceNo={sequenceNo}
              showTimeConstraint
            />
          );
        })}
      </div>
    );
  }
}

export default ContainerTags;
