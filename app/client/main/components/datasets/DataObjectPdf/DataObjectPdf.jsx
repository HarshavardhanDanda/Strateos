import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { PdfViewer, Card } from '@transcriptic/amino';

import DataObjectFileHeader from 'main/components/datasets/DataObjectFileHeader';
import './DataObjectPdf.scss';

class DataObjectPdf extends React.Component {
  static get propTypes() {
    return {
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  header = () => {
    return (
      <DataObjectFileHeader dataObject={this.props.dataObject} />
    );
  };

  render() {
    return (
      <Card container>
        <div className="data-object-pdf">
          <PdfViewer file={this.props.dataObject.get('url')} header={this.header()} disableBorder />
        </div>
      </Card>
    );
  }
}

export default DataObjectPdf;
