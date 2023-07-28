import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { Card } from '@transcriptic/amino';

import { toPrecision } from 'main/util/Numbers';

import DataObjectContainerHeader from 'main/components/datasets/DataObjectContainerHeader';

class DataObjectMeasureMass extends React.Component {
  static get propTypes() {
    return {
      container:  PropTypes.instanceOf(Immutable.Map).isRequired,
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired,
      data:       PropTypes.object.isRequired
    };
  }

  getMass() {
    const massWithUnits = this.props.data[0].mass;
    const mass          = massWithUnits.split(':')[0];

    return `${toPrecision(mass, 2)} grams`;
  }

  render() {
    const { container, dataObject } = this.props;

    return (
      <Card container>
        <DataObjectContainerHeader
          value={this.getMass()}
          container={container}
          dataObject={dataObject}
        />
      </Card>
    );
  }
}

export default DataObjectMeasureMass;
