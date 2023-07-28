import React, { PureComponent } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { CsvViewer, Popover, Button } from '@transcriptic/amino';
import CSVUtil from 'main/util/CSVUtil';

import './LcmrmCSV.scss';

export default class LcmrmCSV extends PureComponent {
  static get propTypes() {
    return {
      csvData: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    };
  }

  renderHeader() {
    const { csvData, name } = this.props;
    return (
      <div className="lcmrm-csv-header-content">
        <Popover
          content={<span>{name}</span>}
          placement="top"
          trigger="hover"
          showWhenOverflow
        >
          <h3 className="tx-type--heavy">{name}</h3>
        </Popover>

        <Button
          icon="fa fa-download"
          size="small"
          type="secondary"
          link
          heavy
          newTab
          tagLink
          onClick={csvData ? () => CSVUtil.downloadCSV(csvData, name.split('.')[0], true) : null}
        />
      </div>
    );
  }

  render() {
    const { csvData } = this.props;
    return (
      <CsvViewer
        data={csvData}
        hasHeader={false}
        headerComponent={this.renderHeader()}
      />
    );
  }
}
