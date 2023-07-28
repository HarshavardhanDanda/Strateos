import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { WellTag } from 'main/components/InstructionTags/index';
import Unit from 'main/components/unit';

import { ExpandableCard, Param } from '@transcriptic/amino';

class GelPurifyOp extends React.PureComponent {
  expandableCardHead(extraction, run) {
    return (
      <div className="op">
        <h4>{`Lane ${extraction.lane}`}</h4>
        <h4>
          {`${extraction.band_size_range.min_bp}bp - ${extraction.band_size_range.max_bp}bp`}
        </h4>
        <WellTag refName={extraction.destination} run={run} />
      </div>
    );
  }

  expandableCardBody(extraction, run) {
    return (
      <ul className="params">
        <Param label="Lane" value={extraction.lane} />
        <Param
          label="Band Size Range"
          value={`${extraction.band_size_range.min_bp} - ${extraction
            .band_size_range.max_bp}`}
        />
        <Param label="Elution Volume" value={extraction.elution_volume} />
        <Param label="Elution Buffer" value={extraction.elution_buffer} />
        <Param
          label="Destination"
          value={<WellTag refName={extraction.destination} run={run} />}
        />
      </ul>
    );
  }

  render() {
    const op = this.props.instruction.operation;

    const extractions = op.extract
      .sort((a, b) => a.lane - b.lane)
      .map((extraction, i) => {
        return (
          <ExpandableCard
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            cardHead={this.expandableCardHead(extraction, this.props.run)}
            cardBody={this.expandableCardBody(extraction, this.props.run)}
          />
        );
      });

    return (
      <ul className="params">
        <Param
          label="Objects"
          value={op.objects.map((well) => {
            return <WellTag key={well} refName={well} run={this.props.run} />;
          })}
        />
        <Param
          label="Matrix"
          value={(
            <code>
              {op.matrix}
            </code>
          )}
        />
        <Param
          label="Ladder"
          value={(
            <code>
              {op.ladder}
            </code>
          )}
        />
        <Param label="Volume" value={<Unit value={op.volume} />} />
        <Param label="Extractions" value={extractions} />
      </ul>
    );
  }
}

GelPurifyOp.displayName = 'GelPurifyOp';

GelPurifyOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default GelPurifyOp;
