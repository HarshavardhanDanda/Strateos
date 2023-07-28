import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { Param }   from '@transcriptic/amino';

import { WellTag } from 'main/components/InstructionTags/index';
import Unit        from 'main/components/unit';
import LabelTag from 'main/components/InstructionTags/LabelTag';
import ColorUtils from 'main/util/ColorUtils';

class LCMSOp extends React.PureComponent {

  static get propTypes() {
    return {
      run: PropTypes.instanceOf(Immutable.Map).isRequired,
      instruction: PropTypes.object.isRequired
    };
  }

  render() {
    const op = this.props.instruction.operation;
    const containerDetails = this.props.instruction.generated_containers || [];
    const colorMap = ColorUtils.createColorMap(Immutable.fromJS(containerDetails.map(c => c.id)), ColorUtils.refColorPalette);
    return (
      <ul className="params">
        <Param
          label="Objects"
          value={op.objects.map((well) => {
            return (
              <span key={well}>
                <WellTag refName={well} run={this.props.run} />
                {' '}
              </span>
            );
          })}
        />

        <Param
          label="Generated Containers"
          value={containerDetails.map((ct) => {
            return (
              <span key={ct.id}>
                <LabelTag
                  containerId={ct.id}
                  label={ct.label}
                  color={colorMap.get(ct.id)}
                />
                {' '}
              </span>
            );
          })}
        />

        <Param
          label="Injection Volume"
          value={
            <Unit value={op.injection_volume} />
          }
        />

        <Param
          label="Num Injections"
          value={op.num_injections}
        />

        <Param
          label="Method Name"
          value={op.method_name}
        />

        <If condition={op.target_mass}>
          <Param
            label="Target Mass"
            value={op.target_mass}
          />
        </If>

        <If condition={op.string_info}>
          <Param
            label="String Info"
            value={op.string_info}
          />
        </If>

        <If condition={op.fraction_collection_params}>
          <If condition={op.fraction_collection_params.uv_threshold}>
            <Param
              label="UV Threshold"
              value={op.fraction_collection_params.uv_threshold}
            />
          </If>
          <If condition={op.fraction_collection_params.mass_threshold}>
            <Param
              label="Mass Threshold"
              value={op.fraction_collection_params.mass_threshold}
            />
          </If>
        </If>
      </ul>
    );
  }
}

export default LCMSOp;
