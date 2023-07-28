import PropTypes  from 'prop-types';
import React      from 'react';

import BSLLabel from 'main/components/bsl/BSLLabel';

import { LabeledInput, RadioGroup, Radio } from '@transcriptic/amino';

const BSL_LEVELS = [1, 2];

// Form element for changing bio safety level
class BSLSettings extends React.Component {

  static get propTypes() {
    return {
      bsl:      PropTypes.oneOf(BSL_LEVELS).isRequired,
      minBSL:   PropTypes.oneOf(BSL_LEVELS).isRequired,
      onChange: PropTypes.func.isRequired
    };
  }

  render() {
    return (
      <div className="bsl-settings">
        <LabeledInput label="Bio Safety Level">
          <RadioGroup
            name="bsl"
            size="large"
            value={this.props.bsl}
          >
            {BSL_LEVELS.map((bsl) => {
              return (
                <Radio
                  id={bsl}
                  key={bsl}
                  label={<BSLLabel bsl={bsl} />}
                  value={bsl}
                  disabled={bsl < this.props.minBSL}
                />
              );
            })}
          </RadioGroup>
        </LabeledInput>
        <div className="hint">{'Runs are executed and priced according to this BSL. BSL can only be increased.'}</div>
      </div>
    );
  }
}

export default BSLSettings;
