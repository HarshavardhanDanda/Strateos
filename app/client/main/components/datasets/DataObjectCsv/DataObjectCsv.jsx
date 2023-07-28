import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';

import { Card, CsvViewer, Divider, Banner, Button } from '@transcriptic/amino';

import './DataObjectCsv.scss';

import DataObjectFileHeader from 'main/components/datasets/DataObjectFileHeader';

class DataObjectCsv extends React.Component {
  static get propTypes() {
    return {
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired,
      data: PropTypes.string.isRequired,
      updatedCsvData: PropTypes.string,
      updateCsv: PropTypes.func,
      csvName: PropTypes.string,
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      data: props.data,
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.updatedCsvData !== this.props.updatedCsvData) {
      this.setState({ data: this.props.updatedCsvData });
    }
  }

  isCsvDataUpdated() {
    return !_.isEqual(this.state.data, this.props.data);
  }

  resetToOriginalDataObject() {
    this.setState({
      data: this.props.data,
    });
    this.props.updateCsv(this.props.data);
  }

  undoButton() {
    return (
      <Button
        link
        type="primary"
        onClick={() => this.resetToOriginalDataObject()}
      >
        Undo changes
      </Button>
    );
  }

  message() {
    return (
      <span className="update-banner__message">
        <span>
          CSV has been updated. Restarting will revert data back to the original.
        </span>
        {this.undoButton()}
      </span>
    );
  }

  render() {
    const { dataObject, csvName } = this.props;

    return (
      <Card container>
        {this.isCsvDataUpdated() && (
          <div className="update-banner">
            <Banner
              bannerType="info"
              bannerMessage={this.message()}
            />
          </div>
        )}
        <DataObjectFileHeader
          dataObject={dataObject}
          {...csvName && (
            {
              csv: this.state.data,
              csvName
            }
          )}
        />
        <Divider />
        <CsvViewer
          filename={dataObject.get('name') || 'data.csv'}
          data={this.state.data}
          hasHeader={false}
        />
      </Card>
    );
  }
}

export default DataObjectCsv;
