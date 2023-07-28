import Classnames from 'classnames';
import Immutable  from 'immutable';
import PropTypes  from 'prop-types';
import React      from 'react';

import { liquidHandleGradientStyle } from 'main/util/InstructionUtil';
import { ExpandableCard, TextDescription } from '@transcriptic/amino';
import ManageInstruction             from 'main/lab/PrimeDirective/ManageInstruction';
import ContainerTags                 from 'main/components/InstructionCard/ContainerTags';
import WorkcellActions               from './WorkcellActions';

import 'main/lab/PrimeDirective/ManageInstruction/ManageInstruction.scss';

class AdminLiquidHandleGroup extends React.Component {
  static get propTypes() {
    return {
      group:             PropTypes.instanceOf(Immutable.Iterable).isRequired,
      channel:           PropTypes.string.isRequired,
      WCselectedState:   PropTypes.object,
      isHuman:           PropTypes.func,
      run:               PropTypes.instanceOf(Immutable.Map),
      instructionNumber: PropTypes.number,
      onToggleHuman:     PropTypes.func.isRequired,
      onComplete:        PropTypes.func.isRequired,
      onSelect:          PropTypes.func.isRequired,
      onUndo:            PropTypes.func.isRequired,
      isMarkAllCompleteInProgress: PropTypes.bool.isRequired,
      completionSnapshot: PropTypes.object.isRequired
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      inProgress: false
    };
  }

  percentComplete() {
    const completeCount = this.props.group.countBy((ins) => {
      return ins.get('completed_at') ? 'complete' : 'incomplete';
    });
    return ((completeCount.get('complete') || 0) / this.props.group.size) * 100;
  }

  shapeText() {
    if (!this.props.group.get(0)) {
      return '';
    }

    const shape = this.props.group.get(0).getIn(['operation', 'shape']);
    if (!shape) return '';

    return ` ${shape.get('rows')}R X ${shape.get('columns')}C`;
  }

  cardHead() {
    const title = 'Liquid Handle Group';
    const subtitle = `(${this.props.channel && this.props.channel.toUpperCase()})${this.shapeText()}`;

    return (
      <div className="instruction-card__head liquid-handle-group__head">
        <div className="instruction-card__title-wrapper">
          { this.props.instructionNumber &&
          <TextDescription tag="span" className="instruction-card__title-index"> {this.props.instructionNumber}. </TextDescription>
            }
          <TextDescription heavy tag="span">
            {title.toUpperCase()}
          </TextDescription>
          <TextDescription className="instruction-card__title--small" tag="span" color="secondary">
            {subtitle}
          </TextDescription>
        </div>
        <div className="instruction-card__head-content">
          <ContainerTags instruction={this.props.group.get(0)} run={this.props.run} />
        </div>
      </div>
    );
  }

  cardBody() {
    return (
      <div className="instruction-card__body">
        {this.props.group.map((ins, index) => {
          let selectedForWorkcell;
          if (this.props.WCselectedState) {
            selectedForWorkcell = this.props.WCselectedState[ins.get('sequence_no')];
          }

          return (
            <ManageInstruction
              {...this.props}
              key={ins.get('id')}
              instruction={ins}
              parentInstructionNumber={this.props.instructionNumber}
              instructionNumber={index + 1}
              selectedForWorkcell={selectedForWorkcell}
              humanExecuted={this.props.isHuman ? this.props.isHuman(ins) : false}
            />
          );
        })}
      </div>
    );
  }

  render() {
    const percent = this.percentComplete();

    return (
      <div className="manage-instruction">
        <ExpandableCard
          className={Classnames('instruction-card instruction-card-container liquid-handle-group', { completed: percent === 100 })}
          cardHead={this.cardHead()}
          cardBody={this.cardBody()}
          cardHeadStyle={{ background: liquidHandleGradientStyle(percent) }}
        />
        <WorkcellActions
          {...this.props}
          inProgress={this.state.inProgress}
          setInProgress={bool => this.setState({ inProgress: bool })}
        />
      </div>
    );
  }
}

export default AdminLiquidHandleGroup;
