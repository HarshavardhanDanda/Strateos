import Chroma    from 'chroma-js';
import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import InteractivePlate from 'main/components/InteractivePlate';

// Renders a PlateMap
class MeltCurvePlate extends React.Component {

  static get propTypes() {
    return {
      curveData:           PropTypes.object.isRequired,
      containerTypeHelper: PropTypes.object.isRequired,
      focusedWells:        PropTypes.array.isRequired,
      visibleWells:        PropTypes.array,
      onWellClick:         PropTypes.func.isRequired,
      showSelectAll:       PropTypes.bool,
      onRowClick:          PropTypes.func,
      onColClick:          PropTypes.func,
      onSelectAllClick:    PropTypes.func
    };
  }

  getPeaks() {
    // Sometimes TCLE will NOT include the peak heights if the data is above/below some threshold.
    // They probably should though.  For now, recalculate, the peak information and cache it.
    if (this.all_peak_heights) {
      return this.all_peak_heights;
    }

    if (!_.isEmpty(this.props.curveData.all_peak_heights)) {
      // mapping from wellIndex -> max_peak_height
      this.all_peak_heights = this.props.curveData.all_peak_heights;
    } else {
      this.all_peak_heights = _.mapValues(this.props.curveData.melt_peak_data, pts => _.max(pts));
    }

    return this.all_peak_heights;
  }

  getWellMap() {
    const max = this.maxPeak();
    const min = this.minPeak();
    this.colorScale = Chroma.scale('YlGnBu').domain([min, max]);

    let wellMap = Immutable.Map();
    _.forEach(this.getPeaks(), (data, wellIndex) => {
      // return early if not visible
      if (this.props.visibleWells && !_.includes(this.props.visibleWells, wellIndex)) {
        return;
      }

      const color    = this.colorScale(data).hex();
      const selected = Array.from(this.props.focusedWells).includes(wellIndex);
      const wellData =  Immutable.Map({ hasVolume: true, selected, color });

      wellMap = wellMap.set(Number(wellIndex), wellData);
    });

    return wellMap;
  }

  maxPeak() {
    return _.max(_.values(this.getPeaks()));
  }

  minPeak() {
    return _.min(_.values(this.getPeaks()));
  }

  render() {
    return (
      <InteractivePlate
        containerType={Immutable.Map(this.props.containerTypeHelper)}
        wellMap={this.getWellMap()}
        getWellData={wellIndex => `Melt Peak: ${this.getPeaks()[wellIndex].toFixed(2)}`}
        colorScale="YlGnBu"
        initialDomain={[this.minPeak(), this.maxPeak()]}
        units=""
        onWellClick={(wellIndex, e) => {
          if (this.getPeaks()[wellIndex] != undefined) {
            return this.props.onWellClick(wellIndex, e, this.getWellMap());
          }
          return undefined;
        }}
        showSelectAll={this.props.showSelectAll}
        onRowClick={(row, e) => this.props.onRowClick(row, e, this.getWellMap())}
        onColClick={(col, e) => this.props.onColClick(col, e, this.getWellMap())}
        onSelectAllClick={e => this.props.onSelectAllClick(e, this.getWellMap())}
      />
    );
  }
}

export default MeltCurvePlate;
