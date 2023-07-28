import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import { WellTag }   from 'main/components/InstructionTags/index';
import Unit          from 'main/components/unit';

function ConsolidateGroup(props) {

  const { body } = props;

  return (
    <div className="row-group consolidate-group">
      <div className="from">
        <div className="from-table target-well">
          <div className="row-group">
            {body.from.map((t) => {
              return (
                <div className="row" key={t.well}>
                  <WellTag
                    refName={t.well}
                    run={props.run}
                    instructionSequenceNo={props.instructionSequenceNo}
                  />
                  <div className="volume-label">
                    <Unit value={t.volume} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <i className="fa fa-arrow-right" />
      <div className="arrow">{'⟶ '}</div>
      <div className="to">
        <If condition={body.mix_after}>
          <span>
            {`& mix ${body.mix_after.repetitions} × `}
            <Unit value={body.mix_after.volume} />
          </span>
        </If>
        <WellTag
          refName={body.to}
          run={props.run}
          instructionSequenceNo={props.instructionSequenceNo}
        />
      </div>
    </div>
  );
}

ConsolidateGroup.propTypes = {
  run:  PropTypes.instanceOf(Immutable.Map).isRequired,
  body: PropTypes.object.isRequired
};

export default ConsolidateGroup;
