import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import {
  Card,
  Divider,
  FileViewer
} from '@transcriptic/amino';

import DataObjectFileHeader from 'main/components/datasets/DataObjectFileHeader';

class DataObjectJson extends React.Component {
  static get propTypes() {
    return {
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired,
      data: PropTypes.string.isRequired
    };
  }

  render() {
    const { dataObject, data } = this.props;

    return (
      <Card container>
        <DataObjectFileHeader dataObject={dataObject} />
        <Divider />
        <FileViewer
          text={data}
          filetype="json"
          filename={dataObject.get('name') || 'data.json'}
        />
      </Card>
    );
  }
}

export default DataObjectJson;
