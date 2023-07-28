import Chroma    from 'chroma-js';
import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import InteractivePlate from 'main/components/InteractivePlate';

// Renders a PlateMap, WellIndex/ct values table and allows for downloading altered CT values
class AmpCurvePlate extends React.Component {

  static get propTypes() {
    return {
      curveData:           PropTypes.object.isRequired,
      containerTypeHelper: PropTypes.object.isRequired,
      focusedWells:        PropTypes.array.isRequired,
      onWellClick:         PropTypes.func.isRequired,
      visibleWells:        PropTypes.array,
      showSelectAll:       PropTypes.bool,
      onRowClick:          PropTypes.func,
      onColClick:          PropTypes.func,
      onSelectAllClick:    PropTypes.func
    };
  }

  constructor() {
    super();

    _.bindAll(
      this,
      'onWellClick',
      'getWellMap',
      'getCts',
      'maxCt',
      'minCt'
    );

  }

  onWellClick(wellIndex, e) {
    if (this.getCts()[wellIndex] != undefined) {
      return this.props.onWellClick(wellIndex, e, this.getWellMap());
    }
    return undefined;
  }

  getWellMap() {
    const max = this.maxCt();
    const min = this.minCt();

    this.colorScale = Chroma.scale('YlGnBu').domain([max, min]);

    const { visibleWells } = this.props;

    const all = Immutable.Map(this.getCts()).mapEntries(([wellIndex, data]) => {
      const value = 10 + (80 * (1 - (data / max)));
      const color = this.colorScale(value).hex();
      const selected = Array.from(this.props.focusedWells).includes(wellIndex);

      return [
        Number(wellIndex),
        Immutable.Map({
          hasVolume: true,
          selected,
          color
        })
      ];
    });

    if (!visibleWells) return all;

    return all.filter((value, key) => {
      return _.includes(visibleWells, key.toString());
    });
  }

  getCts() {
    // mapping from wellIndex -> ct value
    return this.props.curveData.cts;
  }

  maxCt() {
    return _.max(_.values(this.getCts()));
  }

  minCt() {
    return _.min(_.values(this.getCts()));
  }

  render() {

    return (
      <InteractivePlate
        containerType={Immutable.Map(this.props.containerTypeHelper)}
        wellMap={this.getWellMap()}
        getWellData={wellIndex => `Ct: ${Number.isNaN(this.getCts()[wellIndex]) ? 'n/a' : this.getCts()[wellIndex].toFixed(2)}`}
        colorScale="YlGnBu"
        initialDomain={[this.minCt(), this.maxCt()]}
        units=""
        onWellClick={this.onWellClick}
        showSelectAll={this.props.showSelectAll}
        onRowClick={(row, e) => this.props.onRowClick(row, e, this.getWellMap())}
        onColClick={(col, e) => this.props.onColClick(col, e, this.getWellMap())}
        onSelectAllClick={e => this.props.onSelectAllClick(e, this.getWellMap())}
      />
    );
  }
}

export default AmpCurvePlate;
