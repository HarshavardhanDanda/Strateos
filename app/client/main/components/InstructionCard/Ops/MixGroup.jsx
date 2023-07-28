import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import Unit          from 'main/components/unit';

import { WellTag }   from 'main/components/InstructionTags/index';

import './MixGroup.scss';

function MixGroup(props) {

  const { body } = props;

  return (
    <div className="row-group mix-group">
      <p>Mix</p>
      <i className="fa fa-arrow-right" />
      <div className="to-table target-well mix-group__target">
        {body.map((t) => {
          return (
            <div className="mix-group__target-data" key={t.well}>
              <WellTag refName={t.well} run={props.run} instructionSequenceNo={props.instructionSequenceNo} />
              <div className="volume-label">
                {`${t.repetitions} × `}<Unit value={t.volume} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

MixGroup.propTypes = {
  run:  PropTypes.instanceOf(Immutable.Map).isRequired,
  body: PropTypes.array.isRequired
};

export default MixGroup;
