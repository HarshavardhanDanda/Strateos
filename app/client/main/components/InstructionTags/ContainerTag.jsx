import React from 'react';
import _ from 'lodash';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import { Popover, Icon } from '@transcriptic/amino';

import RefTooltip from 'main/components/InstructionTags/RefTooltip';
import BaseTag from 'main/components/InstructionTags/BaseTag';
import ColorUtils from 'main/util/ColorUtils';
import TimeConstraintDetail from 'main/components/InstructionCard/TimeConstraintDetail';
import { getContainerCentricTimeConstraintType, getTimeConstraintIcon, getContainerCentricTimeConstraints } from 'main/util/TimeConstraintUtil';

import './ContainerTag.scss';

class ContainerTag extends React.Component {
  getRef(refName, run) {
    return run.get('refs').find(ref => ref.get('name') === refName);
  }

  getTimeConstraintType() {
    const { refName, run, instructionSequenceNo } = this.props;
    const timeConstraints = run && run.get('time_constraints');

    if (!_.isEmpty(timeConstraints) && !_.isUndefined(instructionSequenceNo)) {
      return getContainerCentricTimeConstraintType(instructionSequenceNo, refName);
    }
  }

  render() {
    const { refName, run, showTimeConstraint, showTimeConstraintDetail, instructionSequenceNo } = this.props;

    const color = ColorUtils.colorForRef(refName, run.get('refs'));
    const ref = this.getRef(refName, run);
    const containerRef = ref ? ref.toJS() : undefined;
    const timeConstraintType = showTimeConstraint ? this.getTimeConstraintType() : undefined;

    const tooltip = (
      containerRef && (
      <div onClick={e => e.stopPropagation()}>
        <RefTooltip
          containerRef={containerRef}
        />
      </div>
      )
    );

    return (
      <div className="tx-stack tx-stack--xxxs">
        <BaseTag
          backgroundColor={color}
          onClick={(e) => {
            if (this.context.onNavigateRef) {
              this.context.onNavigateRef(refName);
            }
            e.stopPropagation();
          }}
        >
          <Popover
            placement="bottom"
            content={tooltip}
            trigger="focus"
          >
            {
            timeConstraintType && timeConstraintType.length > 0 && (
            <Icon
              icon={`fa-regular ${getTimeConstraintIcon(timeConstraintType)}`}
              className="container-tag__time-constraint-icon"
            />
            )
          }
            <p className={!this.props.applyScroll ? 'container-tag' : 'container-tag-with-scroll'}>
              {this.props.children || refName}
            </p>
          </Popover>
        </BaseTag>
        {!_.isEmpty(timeConstraintType) && showTimeConstraintDetail && <TimeConstraintDetail timeConstraints={getContainerCentricTimeConstraints(instructionSequenceNo, refName)} run={run} />}
      </div>
    );
  }
}

ContainerTag.contextTypes = {
  onNavigateRef: PropTypes.func
};

ContainerTag.defaultProps = {
  disableTooltip: false
};

ContainerTag.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  refName: PropTypes.string,
  disableTooltip: PropTypes.bool,
  children: PropTypes.node,
  /* Applies scroll in container tag for larger Ref Name */
  applyScroll: PropTypes.bool
};

export default ContainerTag;
