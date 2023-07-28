import Chroma    from 'chroma-js';
import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import {
  Card,
  DataTable,
  Divider,
  Section
} from '@transcriptic/amino';

import InteractivePlate          from 'main/components/InteractivePlate';
import DataObjectContainerHeader from 'main/components/datasets/DataObjectContainerHeader';
import PlateColors               from 'main/components/datasets/components/PlateColors';
import PlateToggles              from 'main/components/datasets/components/PlateToggles';
import ContainerTypeHelper       from 'main/helpers/ContainerType';
import { toPrecision }           from 'main/util/Numbers';

class DataObjectEnvisionPlateReader extends React.Component {
  static get propTypes() {
    return {
      container:  PropTypes.instanceOf(Immutable.Map).isRequired,
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired,
      data:       PropTypes.object.isRequired
    };
  }

  constructor(props) {
    super(props);

    const containerType = this.props.container.get('container_type');

    this.ctypeHelper = new ContainerTypeHelper({
      col_count: containerType.get('col_count'),
      well_count: containerType.get('well_count'),
      shortname: containerType.get('shortname')
    });

    this.getGroupedData = this.getGroupedData.bind(this);
    this.getToggleList  = this.getToggleList.bind(this);
    this.getWellMap     = this.getWellMap.bind(this);
    this.onClickToggle  = this.onClickToggle.bind(this);
    this.getWellData    = this.getWellData.bind(this);

    this.state = this.initializeState(this.props.data);
  }

  initializeState(data) {
    const toggleList  = this.getToggleList(data);
    const groupedData = this.getGroupedData(data);
    const toggleId    = toggleList[0].id;
    const colorScale  = PlateColors.getColorScale(toggleId, _.values(groupedData[toggleId]));

    return {
      colorScale,
      groupedData,
      toggleId,
      toggleList
    };
  }

  getToggleList(data) {
    const readings = data.readings;

    const result = {};

    readings.forEach((v) => {
      const id = v.index;

      if (!result[id] && v.type === 'CalcMeas') {
        const color = PlateColors.getColorAsHex(id);
        const label = `Read ${id}`;

        result[id] = { id, label, color };
      }
    });

    // return sorted toggles
    return _.sortBy(_.values(result), v => v.id);
  }

  onClickToggle(toggleId) {
    const colorScale = PlateColors.getColorScale(
      toggleId,
      _.values(this.state.groupedData[toggleId])
    );

    this.setState({ toggleId, colorScale });
  }

  // Converts raw data_object to mapping like:
  // {
  //   READING_INDEX: {
  //     WELL_IDX_1: VALUE,
  //     WELL_IDX_2: VALUE,
  //     ...
  //   }, ...
  // }
  getGroupedData(data) {
    const readings = data.readings;
    const result   = {};

    readings.forEach((v) => {
      const id         = v.index;
      const well_index = this.ctypeHelper.robotWell(v.well);
      const value      = v.value;

      // Only store the CalcMeas values as those are the only ones that make sense.
      if (v.type === 'CalcMeas') {
        // Must use setWith to force creating objects when well_index is an int.
        _.setWith(result, [id, well_index], value, Object);
      }
    });

    return result;
  }

  getWellMap() {
    const data = this.state.groupedData[this.state.toggleId];
    const colorScale = Chroma.scale(this.state.colorScale.colors).domain(this.state.colorScale.domain);

    const wellMap = _.mapValues(data, (value) => {
      return {
        hasVolume: true,
        selected: false,
        color: colorScale(value).hex()
      };
    });

    // Convert to immutable and also convert keys to numbers as InteractivePlate requires this.
    // Since groupedData is stored as JS maps we have coerced the number keys to strings, this converts back.
    return Immutable.fromJS(wellMap)
      .mapKeys(k => Number(k));
  }

  getWellData(wellIndex) {
    const d = this.state.groupedData[this.state.toggleId][wellIndex];

    return InteractivePlate.formatData(d);
  }

  getDataTableData() {
    const result = [];

    _.forEach(this.props.data.readings, (r) => {
      if (r.index === this.state.toggleId) {
        result.push({ index: r.well, value: toPrecision(r.value, 3), reading: r.index });
      }
    });

    return result;
  }

  render() {
    const { container, dataObject } = this.props;

    const containerType = container.get('container_type');

    return (
      <Card container>
        <DataObjectContainerHeader container={container} dataObject={dataObject} />

        <Divider />

        <div>
          <div className="row">
            <div className="col-xs-12 col-lg-9">
              <Section title="Plate Map">
                <InteractivePlate
                  key={this.state.toggleId}
                  containerType={containerType}
                  getWellData={this.getWellData}
                  wellMap={this.getWellMap()}
                  colorScale={this.state.colorScale.colors}
                  initialDomain={this.state.colorScale.domain}
                  units=""
                >
                  <PlateToggles
                    title="Readings"
                    selectedId={this.state.toggleId}
                    toggleList={this.state.toggleList}
                    onClickToggle={this.onClickToggle}
                  />
                </InteractivePlate>
              </Section>
            </div>
            <div className="col-xs-12 col-lg-3">
              <Section title="Aliquot Info">
                <DataTable
                  headers={['index', 'value', 'reading']}
                  data={this.getDataTableData()}
                />
              </Section>
            </div>
          </div>
        </div>
      </Card>
    );
  }
}

export default DataObjectEnvisionPlateReader;
