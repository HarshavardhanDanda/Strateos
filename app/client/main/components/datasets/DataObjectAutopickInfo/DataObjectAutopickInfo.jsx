import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { Card } from '@transcriptic/amino';

import DataObjectContainerHeader from 'main/components/datasets/DataObjectContainerHeader';

class DataObjectAutopickInfo extends React.Component {
  static get propTypes() {
    return {
      container:  PropTypes.instanceOf(Immutable.Map).isRequired,
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired,
      data: PropTypes.object.isRequired
    };
  }

  getColonies() {
    if (this.props.data) {
      return this.props.data.colonies_picked;
    } else {
      return '-';
    }
  }

  render() {
    const { container, dataObject } = this.props;

    return (
      <Card container>
        <DataObjectContainerHeader
          valueTitle="Colonies"
          value={this.getColonies()}
          container={container}
          dataObject={dataObject}
        />
      </Card>
    );
  }
}

export default DataObjectAutopickInfo;
