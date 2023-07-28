import * as Immutable from 'immutable';
import _              from 'lodash';
import PropTypes      from 'prop-types';
import React          from 'react';

import { groupInstructions } from 'main/util/InstructionUtil';
import InstructionCard       from 'main/components/InstructionCard';
import LiquidHandleGroup     from 'main/components/LiquidHandleGroup';
import AutoprotocolUtil      from 'main/util/AutoprotocolUtil';

class RunInstructions extends React.Component {
  static get propTypes() {
    return {
      run:               PropTypes.instanceOf(Immutable.Map).isRequired,
      filterByRef:       PropTypes.string,
      pathInstructionId: PropTypes.string,
      warpEventErrors:   PropTypes.instanceOf(Immutable.Iterable)
    };
  }

  constructor(props) {
    super(props);

    // FUTURE FIX: Groups should be calculated by parent and passed down as a prop.
    this.groups = this.groupedInstructions(props);
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(prevProps.run, this.props.run) || !_.isEqual(prevProps.filterByRef, this.props.filterByRef)) {
      this.groups = this.groupedInstructions(this.props);
    }
  }

  groupedInstructions(props) {
    let ungroupedInstructions;
    if (props.filterByRef) {
      ungroupedInstructions = this.filterInstructionsByRef();
    } else {
      ungroupedInstructions = props.run.get('instructions');
    }
    return groupInstructions(ungroupedInstructions);
  }

  filterInstructionsByRef() {
    const instructions = this.props.run.get('instructions');

    return instructions.filter((instruction) => {
      const operation = instruction.get('operation');
      const refNames = AutoprotocolUtil.containerNamesInOperation(operation);
      return refNames.has(this.props.filterByRef);
    });
  }

  render() {
    const { groups } = this;
    const { run, pathInstructionId, warpEventErrors } = this.props;

    if (groups.size === 0) {
      return <div>No instructions</div>;
    }

    return (
      <div>
        {groups.map((group, index) => {
          if (group.get('instructions')) {
            return (
              <LiquidHandleGroup
                key={group.getIn(['instructions', 0, 'id'])}
                group={group.get('instructions')}
                instructionNumber={index + 1}
                run={run}
                channel={group.get('type')}
                pathInstructionId={pathInstructionId}
                warpEventErrors={warpEventErrors}
              />
            );
          }

          return (
            <InstructionCard
              key={group.get('sequence_no')}
              instruction={group}
              run={run}
              instructionNumber={index + 1}
              pathInstructionId={pathInstructionId}
              warpEventErrors={warpEventErrors}
              showTimeConstraint
            />
          );
        })}
      </div>
    );
  }
}

export default RunInstructions;
