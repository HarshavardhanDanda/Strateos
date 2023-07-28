import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import ThermocycleGroup from 'main/components/thermocycle/ThermocycleGroup';
import Manifest         from 'main/util/Manifest';

import { Button } from '@transcriptic/amino';

// without dye, no reads can be done
const NON_DYE_MIXES = ['MyTaq', 'KAPA 2G', 'KAPA HiFi', 'Phusion'];

// Control for specifying arbitrary thermocycle groups. Each group has a cycle
// count and some non-zero number of steps. Each step has a duration and a
// temperature.
class ThermocycleParameters extends React.Component {

  static get propTypes() {
    return {
      showErrors: PropTypes.bool,
      mix: PropTypes.string.isRequired,
      groups: PropTypes.arrayOf(
        PropTypes.shape({
          cycles: PropTypes.number,
          steps: PropTypes.arrayOf(
            PropTypes.shape({
              temperature: PropTypes.string,
              gradient: PropTypes.shape({
                top: PropTypes.string,
                bottom: PropTypes.string
              }),
              duration: PropTypes.string
            })
          )
        })
      ),
      onChange: PropTypes.func.isRequired
    };
  }

  static get defaultProps() {
    return {
      showErrors: false,
      groups: [
        {
          cycles: 1,
          steps: []
        }
      ]
    };
  }

  constructor(props, context) {
    super(props, context);

    this.onAddGroup = this.onAddGroup.bind(this);
  }

  onAddGroup() {
    this.props.onChange(
      (this.props.groups != undefined ? this.props.groups : []).concat([
        {
          cycles: 1,
          steps: [
            {
              duration: undefined,
              temperature: undefined
            }
          ] // what to do about gradient
        }
      ])
    );
  }

  onDeleteGroup(groupIndex) {
    return () => {
      this.props.onChange(
        Immutable.fromJS(this.props.groups).delete(groupIndex).toJS()
      );
    };
  }

  onAddStep(groupIndex) {
    return () => {
      this.props.onChange(
        this._updateIn([groupIndex, 'steps'], ss =>
          ss.push({
            duration: undefined,
            temperature: undefined
          })
        )
      );
    };
  }

  onDeleteStep(groupIndex) {
    return (stepIndex) => {
      return () => {
        this.props.onChange(
          this._updateIn([groupIndex, 'steps'], ss => ss.delete(stepIndex))
        );
      };
    };
  }

  onUpdateCycles(groupIndex) {
    return (e) => {
      e.stopPropagation();

      if (_.isEmpty(e.target.value)) {
        this.props.onChange(this._setIn([groupIndex, 'cycles'], undefined));
        return;
      }

      const nextValue = parseInt(e.target.value, 10);

      if (nextValue >= 0) {
        this.props.onChange(
          this._setIn([groupIndex, 'cycles'], nextValue)
        );
      }
    };
  }

  onUpdateStep(groupIndex) {
    return (stepIndex) => {
      return (key) => {
        return (e) => {
          const path = [groupIndex, 'steps', stepIndex].concat(key);
          this.props.onChange(this._setIn(path, e));
        };
      };
    };
  }

  onToggleStepRead(groupIndex) {
    return (stepIndex) => {
      return (e) => {
        e.preventDefault();
        e.stopPropagation();

        const path = [groupIndex, 'steps', stepIndex, 'read'];

        this.props.onChange(
          this._setIn(path, !Immutable.fromJS(this.props.groups).getIn(path, false))
        );
      };
    };
  }

  onToggleStepTemp(groupIndex) {
    return (stepIndex) => {
      return (type) => {
        return (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (type === 'gradient') {
            const temp = this._setIn([groupIndex, 'steps', stepIndex, 'gradient'], {
              top: undefined,
              bottom: undefined
            });

            this.props.onChange(
              this._deleteIn(
                [groupIndex, 'steps', stepIndex, 'temperature'],
                temp
              )
            );
          } else {
            const temp = this._setIn(
              [groupIndex, 'steps', stepIndex, 'temperature'],
              undefined
            );

            this.props.onChange(
              this._deleteIn([groupIndex, 'steps', stepIndex, 'gradient'], temp)
            );
          }
        };
      };
    };
  }

  getErrors() {
    if (this.props.showErrors) {
      return Manifest.errorFor('thermocycle', this.props.groups);
    } else {
      return Immutable.Map();
    }
  }

  hasMultipleGroups() {
    return this.props.groups.length > 1;
  }

  showRead() {
    return !_.includes(NON_DYE_MIXES, this.props.mix);
  }

  _setIn(path, val, object) {
    return Immutable.fromJS(object != undefined ? object : this.props.groups)
      .setIn(path, val)
      .toJS();
  }

  _updateIn(path, fn, object) {
    return Immutable.fromJS(object != undefined ? object : this.props.groups)
      .updateIn(path, fn)
      .toJS();
  }

  _deleteIn(path, object) {
    return Immutable.fromJS(object != undefined ? object : this.props.groups)
      .deleteIn(path)
      .toJS();
  }

  render() {
    return (
      <div className="thermocycle-parameters">
        {this.props.groups.map((group, groupIndex) => {
          return (
            <ThermocycleGroup
              key={groupIndex} // eslint-disable-line react/no-array-index-key
              group={group}
              groupErrors={this.getErrors().get(groupIndex, Immutable.Map())}
              isRemovableGroup={this.hasMultipleGroups()}
              showRead={this.showRead()}
              onDeleteGroup={this.onDeleteGroup(groupIndex)}
              onDeleteStep={this.onDeleteStep(groupIndex)}
              onAddStep={this.onAddStep(groupIndex)}
              onUpdateCycles={this.onUpdateCycles(groupIndex)}
              onUpdateStep={this.onUpdateStep(groupIndex)}
              onToggleStepTemp={this.onToggleStepTemp(groupIndex)}
              onToggleStepRead={this.onToggleStepRead(groupIndex)}
            />
          );
        })}
        <Button
          type="primary"
          link
          icon="fa fa-plus"
          tabIndex="-1"
          onClick={this.onAddGroup}
        >
          Add Group
        </Button>
      </div>
    );
  }
}

export default ThermocycleParameters;
