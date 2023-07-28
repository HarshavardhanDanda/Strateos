import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { Card } from '@transcriptic/amino';

import DataObjectFileHeader from 'main/components/datasets/DataObjectFileHeader';

class DataObjectFile extends React.Component {
  static get propTypes() {
    return {
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  render() {
    return (
      <Card container>
        <DataObjectFileHeader dataObject={this.props.dataObject} />
      </Card>
    );
  }
}

export default DataObjectFile;
