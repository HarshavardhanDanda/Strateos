import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import ContainerType from 'main/helpers/ContainerType';
import { splitRefObject, containerForRef } from 'main/util/RefUtil';
import ContainerTag from 'main/components/InstructionTags/ContainerTag';

import './WellTag.scss';

class WellTag extends React.Component {
  constructor(props) {
    super(props);
    const [refName] = Array.from(splitRefObject(props.refName));
    this.container = containerForRef(refName, props.run);
  }

  render() {
    const [refName, wellIdx] = splitRefObject(this.props.refName);
    const container = this.container;

    let wellText;

    if (container && container.container_type != undefined) {
      const containerType = new ContainerType(container.container_type);
      const humanizedWellIdx = containerType.humanWell(wellIdx);
      wellText = humanizedWellIdx;
    } else {
      wellText = wellIdx;
    }

    return (
      <ContainerTag
        run={this.props.run}
        refName={refName}
        instructionSequenceNo={this.props.instructionSequenceNo}
        showTimeConstraint
      >
        <span className="well-tag">
          <If condition={this.props.prefix}>
            <span className="well-tag__prefix">{`${this.props.prefix} `}</span>
          </If>
          <span className="well-tag__refname">
            {refName}
          </span>
          <span className="well-tag__well-text">{`/${wellText}`}</span>
        </span>
      </ContainerTag>
    );
  }
}

WellTag.propTypes = {
  refName: PropTypes.string.isRequired,
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  prefix: PropTypes.string
};

export default WellTag;
