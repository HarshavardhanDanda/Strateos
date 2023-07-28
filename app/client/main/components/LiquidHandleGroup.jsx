import Classnames     from 'classnames';
import * as Immutable from 'immutable';
import _              from 'lodash';
import PropTypes      from 'prop-types';
import React          from 'react';

import { liquidHandleGradientStyle } from 'main/util/InstructionUtil';
import { ExpandableCard, Button, TextDescription }    from '@transcriptic/amino';
import LiquidHandleOpSummaries       from 'main/components/liquid_handle/LiquidHandleOpSummaries';
import InstructionCard               from 'main/components/InstructionCard';
import ContainerTags                 from 'main/components/InstructionCard/ContainerTags';

class LiquidHandleGroup extends React.Component {

  static get propTypes() {
    return {
      group: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      run: PropTypes.object.isRequired,
      pathInstructionId: PropTypes.string,
      warpEventErrors: PropTypes.instanceOf(Immutable.Iterable),
      channel: PropTypes.string.isRequired,
      instructionNumber: PropTypes.number.isRequired
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      expanded: Array(this.props.group.size).fill(false),
      groupExpanded: false
    };

    this.toggleAll             = this.toggleAll.bind(this);
    this.expandableCardHead    = this.expandableCardHead.bind(this);
    this.expandableCardBody    = this.expandableCardBody.bind(this);
    this.toggleInstructionCard = this.toggleInstructionCard.bind(this);
    this.toggleGroup           = this.toggleGroup.bind(this);
  }

  containsWarpEventErrors() {
    if (!this.props.warpEventErrors) {
      return false;
    }

    const warpIds = this.props.warpEventErrors.map(e => e.get('warp_id')).toSet();

    return this.props.group.find((instruction) => {
      return instruction.get('warps').find(warp => warpIds.includes(warp.get('id')));
    }) !== undefined;
  }

  expandableCardHead() {
    const title = `Liquid Handle Group (${this.props.channel})`.toUpperCase();
    return (

      <div className="op instruction-card__head">
        <div className="instruction-card__title-wrapper">
          { this.props.instructionNumber &&
          <TextDescription tag="span" className="instruction-card__title-index"> {this.props.instructionNumber}. </TextDescription>
          }

          <TextDescription heavy tag="span">
            {title}

            {
              this.containsWarpEventErrors() ?
                <div className="error">warp error</div> :
                undefined
            }

            {
              this.state.groupExpanded ? (
                <Button type="default" onClick={this.toggleAll}>
                  {this.state.expanded.includes(false) ? 'Expand all instructions' : 'Collapse all instructions'}
                </Button>
              ) : undefined
            }
          </TextDescription>
        </div>
        <div className="instruction-card__head-content">
          <ContainerTags instruction={this.props.group.get(0)} run={this.props.run} />
        </div>
      </div>
    );
  }

  instructionInGroup(instruction, index) {
    if (this.state.expanded[index]) {
      return (
        <InstructionCard
          instruction={instruction}
          run={this.props.run}
          pathInstructionId={this.props.pathInstructionId}
          warpEventErrors={this.props.warpEventErrors}
          expanded
          showTimeConstraint
        />
      );
    }

    return (
      <LiquidHandleOpSummaries
        run={this.props.run}
        instruction={instruction}
      />
    );
  }

  expandableCardBody() {
    return (
      <div className="operation">
        {this.props.group.map((ins, i) => {

          return (
            // eslint-disable-next-line jsx-a11y/interactive-supports-focus
            <div
              role="button"
              aria-pressed={this.state.expanded[i]}
              className="instruction-in-group"
              key={ins.get('sequence_no')}
              onClick={(e) => {
                e.stopPropagation();
                this.toggleInstructionCard(e, i);
              }}
            >
              <a
                className="toggle-card"
                onClick={e => this.toggleInstructionCard(e, i)}
              >
                {this.state.expanded[i] ? <i className="far fa-minus-square" /> : <i className="far fa-plus-square" />}
              </a>

              {this.instructionInGroup(ins, i)}
            </div>
          );
        })}
      </div>
    );
  }

  toggleAll(e) {
    const { group } = this.props;
    e.stopPropagation();

    if (this.state.expanded.includes(false)) {
      this.setState({ expanded: Array(group.size).fill(true) });
      return;
    }

    this.setState({ expanded: Array(group.size).fill(false) });
  }

  toggleInstructionCard(e, index) {
    e.preventDefault();
    e.stopPropagation();

    this.setState((prevState) => {
      const expanded = prevState.expanded.slice(0);
      expanded[index] = !expanded[index];
      return { expanded };
    });
  }

  toggleGroup() {
    this.setState(prevState => ({ groupExpanded: !prevState.groupExpanded }));
  }

  completePercent() {
    const completeCount = this.props.group.countBy((ins) => {
      return ins.get('completed_at') ? 'complete' : 'incomplete';
    });

    return (completeCount.get('complete') / this.props.group.size) * 100;
  }

  render() {
    const percent = this.completePercent();

    return (
      <ExpandableCard
        className={`instruction-card liquid-handle-group ${Classnames(
          { completed: percent === 100 }
        )}`}
        cardHead={this.expandableCardHead()}
        cardBody={this.expandableCardBody}
        onExpandToggle={this.toggleGroup}
        cardHeadStyle={{ background: liquidHandleGradientStyle(percent) }}
      />
    );
  }
}

export default LiquidHandleGroup;
