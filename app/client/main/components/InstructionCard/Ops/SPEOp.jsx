import React, { Component } from 'react';
import Immutable            from 'immutable';
import PropTypes            from 'prop-types';
import { inflect }          from 'inflection';

import { Param }   from '@transcriptic/amino';
import { WellTag } from 'main/components/InstructionTags/index';
import Unit        from 'main/components/unit';

class SPEOp extends Component {
  static get propTypes() {
    return {
      instruction: PropTypes.object.isRequired,
      run: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  render() {
    const { operation } = this.props.instruction;
    const { object, cartridge, pressure_mode, load_sample,
      condition, equilibrate, rinse, elute } = operation;

    const arrayText = (arr) => {
      return arr ? `[${arr.length} ${inflect('item', arr.length)} ]` : 'None';
    };

    return (
      <ul className="params">
        <Param
          label="Object"
          value={<WellTag refName={object} run={this.props.run} />}
        />
        <Param
          label="Cartridge"
          value={cartridge}
        />
        <Param
          label="Pressure Mode"
          value={pressure_mode}
        />
        <Param
          label="Load Sample"
          value={(
            <ul className="params">
              <Param
                label="Volume"
                value={<Unit value={load_sample.volume} />}
              />
              <Param
                label="Loading Flowrate"
                value={<Unit value={load_sample.loading_flowrate} />}
              />
              <Param
                label="Settle Time"
                value={<Unit value={load_sample.settle_time} />}
              />
              <Param
                label="Processing Time"
                value={<Unit value={load_sample.processing_time} />}
              />
              <Param
                label="Flow Pressure"
                value={<Unit value={load_sample.flow_pressure} />}
              />
            </ul>
          )}
        />
        <Param
          label="Condition"
          value={arrayText(condition)}
        />
        <Param
          label="Equilibrate"
          value={arrayText(equilibrate)}
        />
        <Param
          label="Rinse"
          value={arrayText(rinse)}
        />
        <Param
          label="Elute"
          value={arrayText(elute)}
        />
      </ul>
    );
  }
}

export default SPEOp;
