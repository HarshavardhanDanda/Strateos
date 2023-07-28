import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { DataTable, ZeroState } from '@transcriptic/amino';

import DataObjectLcms from 'main/components/datasets/DataObjectLcms/DataObjectLcms';

class DataObjectLcmsDa extends React.Component {
  static get propTypes() {
    return {
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired,
      data: PropTypes.object.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      results: this.props.data.results
    };
  }

  getDataTableData() {
    const results = this.state.results;
    const tableData =  results && results.map((result) => {
      return {
        Barcode: result.barcode,
        RT: result.rt,
        Purity: result.purity,
        'Purity Code':  result.purity_code
      };
    });
    return tableData;
  }

  getDataTableComponent() {
    const tableData = this.getDataTableData();
    return (
      tableData && tableData.length > 0 ? (
        <DataTable
          headers={['Barcode', 'RT', 'Purity', 'Purity Code']}
          data={this.getDataTableData()}
          theme="grey"
          disableFormatHeader
        />
      ) : (
        <ZeroState
          title="There are no results present in this da lcms."
        />
      )

    );
  }

  render() {
    return (
      <DataObjectLcms
        dataObject={this.props.dataObject}
        lcmsComponent={this.getDataTableComponent()}
        data={this.props.data}
      />
    );
  }
}

export default DataObjectLcmsDa;
