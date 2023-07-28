import React from 'react';
import _ from 'lodash';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import DiagnosticsStore from 'main/diagnostics/DiagnosticsStore';
import DiagnosticsActions from 'main/diagnostics/DiagnosticsActions';
import SensorDataChartHOC from 'main/diagnostics/SensorDataChart';
import TimeAxisFilter from 'main/diagnostics/TimeAxisFilter';
import { warpsStartEnd } from 'main/util/DiagnosticsUtil';
import { relevantWarps } from 'main/util/InstructionUtil';

import { Spinner, PageLoading } from '@transcriptic/amino';

const propTypes = {
  sensorTypes: PropTypes.array.isRequired, // Influx sensor data, e.g. ['humidity', blockTemp', ...]
  instruction: PropTypes.object
};

/*
  For a given in instruction and array of sensor types,
  this will render a time series for each sensor type.
*/

class InstructionDiagnostics extends React.Component {
  constructor(props) {
    super(props);

    this.state = this.initialState(props);

    // https://developers.strateos.com/docs/incubation
    this.targetTemperatures = {
      ambient: [19.5, 22],
      warm_37: [36, 38],
      warm_35: [34, 36],
      cold_4: [0, 10],
      cold_20: [-18, -22],
      cold_80: [-76, -84],
      plate_read: [3, 45]
    };
    this.targetHumidity = [0.4, 1];
    this.targetCO2 = [0, 10];

    _.bindAll(
      this,
      'initialState',
      'initialFetch',
      'fetch',
      'dataFetched',
      'selectedNewEpochRange',
      'friendlySensorType',
      'sensorTypeToLabel',
      'angularSpeedToGs',
      'renderChartForSensorType'
    );
  }

  componentWillMount() {
    DiagnosticsStore.initialize();
    return this.initialFetch();
  }

  componentDidUpdate(prevProps) {
    const instructionHasChanged = this.props.instruction.id !== prevProps.instruction.id;
    const sensorTypesChanged = _.some(
      this.props.sensorTypes,
      s => !_.includes(prevProps.sensorTypes, s)
    );

    if (instructionHasChanged || sensorTypesChanged) {
      const newState = this.initialState(this.props);
      this.setState(newState, this.initialFetch);
    }
  }

  initialState(props) {
    const warps = relevantWarps(props.instruction);
    const fullEpochRange = warpsStartEnd(warps);
    const preferredGrouping = DiagnosticsStore.calculateResolutionFromEpochs(
      fullEpochRange
    );

    const groupings = {};

    props.sensorTypes.forEach((sensorType) => {
      groupings[sensorType] = preferredGrouping;
    });

    return {
      fullEpochRange: Immutable.fromJS(fullEpochRange),
      filterRange: fullEpochRange,
      filteredData: Immutable.Map(),
      fetchErrors: {},
      loading: {},
      groupings,
      warps
    };
  }

  initialFetch() {
    const initialGrouping = DiagnosticsStore.calculateResolutionFromEpochs(
      this.state.filterRange
    );
    return this.fetch(initialGrouping, this.state.filterRange);
  }

  fetch(grouping, ...rest) {
    const [start_time, end_time] = Array.from(rest[0]);

    return _.each(this.props.sensorTypes, (sensorType) => {
      let fetchErrors;
      let { loading } = this.state;
      loading[sensorType] = true;

      return DiagnosticsActions.getSensorData({
        data_name: sensorType,
        start_time,
        end_time,
        grouping,
        instructionId: this.props.instruction.id
      })
        .done(() => {
          ({ fetchErrors } = this.state);

          fetchErrors[sensorType] = false;
          this.setState({ fetchErrors });
          this.dataFetched(grouping, sensorType);
        })
        .fail(() => {
          ({ fetchErrors } = this.state);

          fetchErrors[sensorType] = true;
          this.setState({ fetchErrors });
        })
        .always(() => {
          ({ loading } = this.state);

          loading[sensorType] = false;
          this.setState({ loading });
        });
    });
  }

  dataFetched(grouping, sensorType) {
    const { filterRange } = this.state;
    const { groupings } = this.state;
    const preferredGrouping = DiagnosticsStore.calculateResolutionFromEpochs(
      filterRange
    );

    if (grouping === preferredGrouping) {
      const filtered = DiagnosticsStore.filterByEpochs({
        grouping,
        sensorType,
        epochRange: filterRange,
        instructionId: this.props.instruction.id
      });

      const filteredData = this.state.filteredData.set(sensorType, filtered);
      groupings[sensorType] = preferredGrouping;

      this.setState({ groupings, filteredData });
    }
  }

  selectedNewEpochRange(epochRange) {
    const { groupings, filterRange } = this.state;
    const preferredGrouping = DiagnosticsStore.calculateResolutionFromEpochs(
      epochRange
    );
    let filteredData = Immutable.Map();

    this.fetch(preferredGrouping, epochRange);

    this.props.sensorTypes.map((sensorType) => {
      let data;
      let grouping;

      const dataForPreferredGroup = DiagnosticsStore.filterByEpochs({
        grouping: preferredGrouping,
        sensorType,
        epochRange: filterRange,
        instructionId: this.props.instruction.id
      });

      if (dataForPreferredGroup.size > 0) {
        grouping = preferredGrouping;
        data = dataForPreferredGroup;
      } else {
        grouping = this.state.groupings[sensorType];
        data = DiagnosticsStore.filterByEpochs({
          grouping,
          sensorType,
          epochRange: filterRange,
          instructionId: this.props.instruction.id
        });
      }

      filteredData = filteredData.set(sensorType, data);
      groupings[sensorType] = grouping;

      return grouping;
    });

    this.setState({
      groupings,
      filteredData,
      filterRange: epochRange
    });
  }

  friendlySensorType(sensorType) {
    switch (sensorType) {
      case 'blockTemp':
        return 'Block Temperature';
      case 'lidTemp':
        return 'Lid Temperature';
      case 'temperature':
        return 'Temperature';
      case 'humidity':
        return 'Relative Humidity';
      case 'angularSpeed':
        return 'Force'; // We convert angularSpeed to Gs
      case 'co2':
        return 'Carbon Dioxide';
      case 'pressure':
        return 'Tip Pressure';
      default:
        return sensorType;
    }
  }

  sensorTypeToLabel(sensorType) {
    const friendly = this.friendlySensorType(sensorType);
    let unit;
    switch (sensorType) {
      case 'temperature':
      case 'blockTemp':
      case 'lidTemp':
        unit = '(˚C)';
        break;
      case 'humidity':
      case 'co2':
        unit = '(%)';
        break;
      case 'angularSpeed':
        unit = '(G)'; // We convert angularSpeed to Gs
        break;
      default:
        unit = '';
        break;
    }
    return `${friendly} ${unit}`;
  }

  angularSpeedToGs(speed) {
    const gravity = 9.8;
    const deviceRadius = 0.11; // assumed device radius
    return ((speed ** 2) * deviceRadius) / gravity;
  }

  renderChartForSensorType(sensorType) {
    const data = this.state.filteredData.get(sensorType, Immutable.Map());

    return (
      <div className="chart-container" key={sensorType}>
        <span className="sensor-description">
          <span className="sensor-label">
            {this.sensorTypeToLabel(sensorType)}
            <If condition={this.state.loading[sensorType]}>
              <div className="spinner-container"><Spinner size="small" /></div>
            </If>
          </span>
        </span>
        <div className="chart">
          <Choose>
            <When condition={this.state.fetchErrors[sensorType]}>
              <div className="chart-warning-message">
                {`The server failed to retrieve data for ${this.friendlySensorType(sensorType)}`}
              </div>
            </When>

            <When condition={data.count()}>
              {(() => {
                switch (sensorType) {
                  case 'humidity':
                    return (
                      <SensorDataChartHOC
                        data={data}
                        sensorType={sensorType}
                        didSelectRange={this.selectedNewEpochRange}
                        epochRange={this.state.filterRange}
                      />
                    );
                  case 'temperature':
                    return (
                      <SensorDataChartHOC
                        data={data}
                        sensorType={sensorType}
                        didSelectRange={this.selectedNewEpochRange}
                        epochRange={this.state.filterRange}
                      />
                    );
                  case 'angularSpeed':
                    return (
                      <SensorDataChartHOC
                        data={data.map(p =>
                          p.set('value', this.angularSpeedToGs(p.get('value')))
                        )}
                        sensorType="gForce"
                        didSelectRange={this.selectedNewEpochRange}
                        epochRange={this.state.filterRange}
                        includeInY={[0, 1]}
                      />
                    );
                  case 'co2':
                    return (
                      <SensorDataChartHOC
                        data={data}
                        sensorType={sensorType}
                        didSelectRange={this.selectedNewEpochRange}
                        epochRange={this.state.filterRange}
                      />
                    );
                  default:
                    return (
                      <SensorDataChartHOC
                        data={data}
                        sensorType={sensorType}
                        didSelectRange={this.selectedNewEpochRange}
                        epochRange={this.state.filterRange}
                      />
                    );
                }
              })()}
            </When>

            <Otherwise>
              <Choose>
                <When condition={this.state.loading[sensorType]}>
                  <PageLoading />
                </When>

                <Otherwise>
                  <div className="chart-warning-message">
                    There is no data for this time period.
                  </div>
                </Otherwise>
              </Choose>
            </Otherwise>
          </Choose>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="diagnostics">
        <div className="charts-and-filters">
          <div className="charts-and-filters">
            <div className="slider-container">
              <TimeAxisFilter
                fullTimeRange={this.state.fullEpochRange.toJS()}
                sliderValue={this.state.filterRange}
                onAfterChange={this.selectedNewEpochRange}
              />
            </div>
            <div className="charts">
              {this.props.sensorTypes.map(type => this.renderChartForSensorType(type, true))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

InstructionDiagnostics.propTypes = propTypes;

export default ConnectToStores(InstructionDiagnostics, () => {});
