import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { DataTable, ZeroState } from '@transcriptic/amino';

import DataObjectLcms from '../DataObjectLcms';

class DataObjectLcmsSpe extends React.Component {
  static get propTypes() {
    return {
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired,
      data: PropTypes.object.isRequired,
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      fractions: this.props.data.fractions
    };
  }

  getDataTableData() {
    const fractions = this.state.fractions;
    const tableData = fractions && fractions.map((fraction) => {
      return {
        Fraction: fraction.fraction,
        Barcode: fraction.barcode,
        Isobar: fraction.isobar,
        RT: fraction.RT,
        Amount: fraction.amount,
        Command: fraction.command
      };
    });
    return tableData;
  }

  getDataTableComponent() {
    const tableData = this.getDataTableData();
    return (
      tableData && tableData.length > 0 ? (
        <DataTable
          headers={['Fraction', 'Barcode', 'Isobar', 'RT', 'Amount', 'Command']}
          data={this.getDataTableData()}
          theme="grey"
          disableFormatHeader
        />
      ) : (
        <ZeroState
          title="There are no fractions to display for this fractional analysis."
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

export default DataObjectLcmsSpe;
