import Immutable   from 'immutable';
import { inflect } from 'inflection';
import PropTypes   from 'prop-types';
import React       from 'react';

class ShipmentContainersSummary extends React.Component {

  static get propTypes() {
    return {
      containers: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      onEditContainers: PropTypes.func.isRequired
    };
  }

  render() {
    const sampleCount = this.props.containers.count();

    return (
      <div className="sample-summary">
        <h3>{`${sampleCount} ${inflect('sample', sampleCount)} in this shipment`}</h3>
        <a onClick={this.props.onEditContainers}>Edit</a>
        <div className="sample-list">
          {this.props.containers.map((container) => {
            return (
              <div key={container.get('id')}>
                {container.get('label') || container.get('id')}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default ShipmentContainersSummary;
