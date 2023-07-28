import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { DataTable, ZeroState } from '@transcriptic/amino';

import DataObjectLcms from '../DataObjectLcms';

class DataObjectLcmsRm extends React.Component {
  static get propTypes() {
    return {
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired,
      data: PropTypes.object.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      isobars: this.props.data.isobars
    };
  }

  getDataTableData() {
    const isobars = this.state.isobars;
    const tableData = isobars && isobars.map((r) => {
      return {
        Isobar: r.isobar,
        Centroid: r.centroid,
        Height: r.height,
        'Area Abs': r.area_abs,
        'Area percent..': r.area_perc,
        'Relative COI Isomer..': r.isobar_relative_amt_coi,
        BPMPos: r.bpm_pos,
        BPMNeg: r.bpm_pos
      };
    });
    return tableData;
  }

  getDataTableComponent() {
    const tableData = this.getDataTableData();
    return (
      tableData && tableData.length > 0 ? (
        <DataTable
          headers={['Isobar', 'Centroid', 'Height', 'Area Abs',
            'Area percent..', 'Relative COI Isomer..',
            'BPMPos', 'BPMNeg']}
          data={this.getDataTableData()}
          theme="grey"
          disableFormatHeader
        />
      ) : (
        <ZeroState
          title="There are no isobars to display for this reaction monitoring."
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

export default DataObjectLcmsRm;
