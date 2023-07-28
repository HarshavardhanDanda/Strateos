import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import {
  Card,
  Divider,
  FileViewer
} from '@transcriptic/amino';

import DataObjectContainerHeader from 'main/components/datasets/DataObjectContainerHeader';
import DataObjectFileHeader      from 'main/components/datasets/DataObjectFileHeader';
import S3Util                    from 'main/util/S3Util';

// Downloads the dataset data and checks for errors
class DataObjectWrapper extends React.Component {
  static get propTypes() {
    return {
      Component:      PropTypes.func.isRequired,
      container:      PropTypes.instanceOf(Immutable.Map),
      dataObject:     PropTypes.instanceOf(Immutable.Map).isRequired,
      op:             PropTypes.string,
      shouldFetch:    PropTypes.bool,
      shouldFetchRaw: PropTypes.bool,
      updatedCsvData: PropTypes.string,
      updateCsv:      PropTypes.func,
      csvName:        PropTypes.string,
      updateCsvName:  PropTypes.func,
      setRawCsvData:  PropTypes.func,
      rawCsvData:     PropTypes.string,
      runID:          PropTypes.string,
    };
  }

  static get defaultProps() {
    return {
      shouldFetch: true,
      shouldFetchRaw: false // otherwise converts to JSON
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      data: undefined
    };
  }

  componentDidMount() {
    if (!this.shouldDownload()) return;

    const url     = this.props.dataObject.getIn(['s3_info', 'url']);
    const headers = this.props.dataObject.getIn(['s3_info', 'headers']).toJS();
    const dataObject = this.props.dataObject;

    S3Util
      .get(url, headers)
      .then((json, status, xhr) => {
        let data;
        if (this.props.shouldFetchRaw) {
          data = xhr.responseText;
        } else {
          data = JSON.parse(xhr.responseText);
        }

        this.setState({ data });
        // Initilize csvData state in parent
        if (dataObject.get('format') == 'csv' || dataObject.get('content_type') == 'text/csv') {
          this.props.setRawCsvData(data);
        }
      });
  }

  hasErrors() {
    const errors = this.props.dataObject.get('validation_errors');
    return errors && errors.count() > 0;
  }

  shouldDownload() {
    const { shouldFetch }  = this.props;

    if (this.hasErrors()) {
      return false;
    }

    if (!shouldFetch) {
      return false;
    }

    return true;
  }

  render() {
    const { Component, container, dataObject, runID } = this.props;

    const errors = dataObject.get('validation_errors');

    let header;
    if (container) {
      header = (
        <DataObjectContainerHeader container={container} dataObject={dataObject} />
      );
    } else {
      header = (
        <DataObjectFileHeader dataObject={dataObject} />
      );
    }

    // If errors, exit early
    if (this.hasErrors()) {
      return (
        <Card container>
          {header}

          <Divider />

          <div style={{ maxHeight: '400' }}>
            <FileViewer
              text={JSON.stringify(errors, undefined, 2)}
              fileType="json"
              fileName="Validation Errors"
            />
          </div>
        </Card>
      );
    }

    // If still loading, just show the errors
    if (this.shouldDownload() && this.state.data == undefined) {
      return (
        <Card container>
          {header}
        </Card>
      );
    }

    // We have the children render the card and headers again because they sometimes
    // need control of the header, as is the case with measuremass.
    return (
      <Component
        op={this.props.op}
        container={this.props.container}
        dataObject={this.props.dataObject}
        data={this.state.data}
        csvName={this.props.csvName}
        updatedCsvData={this.props.updatedCsvData}
        updateCsv={this.props.updateCsv}
        updateCsvName={this.props.updateCsvName}
        rawCsvData={this.props.rawCsvData}
        runID={runID}
      />
    );
  }
}

export default DataObjectWrapper;
