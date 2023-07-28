import React     from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import { Section } from '@transcriptic/amino';

import ImmutableUtil from 'main/util/ImmutableUtil';
import ProvisionCard from '../ProvisionCard';

class AutoProvisionPanel extends React.Component {
  static get propTypes() {
    return {
      provisionInstructions: PropTypes.instanceOf(Immutable.Iterable),
      refs: PropTypes.instanceOf(Immutable.Iterable)
    };
  }

  render() {
    const refsByName = ImmutableUtil.indexBy(this.props.refs, 'name');

    return (
      <div className="auto-provision-panel">
        <Section title="Provisions">
          {this.props.provisionInstructions.map((provision) => {
            return (
              <ProvisionCard
                key={provision.get('id')}
                instruction={provision}
                refsByName={refsByName}
                provisionInstructions={this.props.provisionInstructions}
              />
            );
          })}
        </Section>
      </div>
    );
  }
}

export default AutoProvisionPanel;
