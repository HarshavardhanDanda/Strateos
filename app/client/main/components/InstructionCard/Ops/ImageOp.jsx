import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import { ContainerTag }  from 'main/components/InstructionTags/index';
import { Param }         from '@transcriptic/amino';

class ImageOp extends Component {
  static get propTypes() {
    return {
      instruction: PropTypes.object.isRequired,
      run:         PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  render() {
    const { operation, sequence_no } = this.props.instruction;
    const { object, mode, num_images, back_lighting, magnification, exposure } = operation;
    return (
      <ul className="params">
        <Param
          label="Object"
          value={(
            <ContainerTag
              refName={object}
              run={this.props.run}
              instructionSequenceNo={sequence_no}
              showTimeConstraint
              showTimeConstraintDetail
            />
          )}
        />
        <Param
          label="Mode"
          value={mode}
        />
        <Param
          label="Number of Images"
          value={num_images}
        />
        <Param
          label="Back Lighting"
          value={`${back_lighting}`}
        />
        <Param
          label="Magnification"
          value={magnification}
        />
        <If condition={Boolean(exposure)}>
          <Param
            label="Exposure"
            value={(
              <ul className="params">
                <Param
                  label="Aperture"
                  value={exposure.aperture}
                />
                <Param
                  label="ISO"
                  value={exposure.iso}
                />
                <Param
                  label="Shutter Speed"
                  value={exposure.shutter_speed}
                />
              </ul>
            )}
          />
        </If>
      </ul>
    );
  }
}

export default ImageOp;
