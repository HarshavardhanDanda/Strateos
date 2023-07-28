import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { WellTag }   from 'main/components/InstructionTags/index';
import Unit          from 'main/components/unit';

import './DistributeGroup.scss';

function DistributeGroup(props) {

  const { body } = props;

  return (
    <div className="row-group distribute-group">
      <div className="from distribute-group__content">
        <If condition={body.mix_before}>
          <p>
            {`Mix ${body.mix_before.repetitions} × `}
            <Unit value={body.mix_before.volume} />
            {'& '}
          </p>
        </If>
        <WellTag
          refName={body.from}
          run={props.run}
          instructionSequenceNo={props.instructionSequenceNo}
        />
      </div>
      <div className="arrow">{'⟶ '}</div>
      <div className="to">
        <div className="to-table target-well">
          <div className="row-group">
            {body.to.map((t) => {
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
    </div>
  );
}

DistributeGroup.propTypes = {
  run:  PropTypes.instanceOf(Immutable.Map).isRequired,
  body: PropTypes.object.isRequired
};

export default DistributeGroup;
