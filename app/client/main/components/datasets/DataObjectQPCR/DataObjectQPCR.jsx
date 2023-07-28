import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import {
  Button,
  Card,
  DataTable,
  Divider,
  PlateSelectLogic,
  Section,
  Select,
  Styles,
  QPCRChart,
  Tooltip,
} from '@transcriptic/amino';

import DataObjectContainerHeader from 'main/components/datasets/DataObjectContainerHeader';
import ContainerTypeHelper       from 'main/helpers/ContainerType';
import { toPrecision }           from 'main/util/Numbers';
import NotificationActions       from 'main/actions/NotificationActions';

import AmpCurvePlate  from './AmpCurvePlate';
import LineGraph      from './LineGraph';
import MeltCurvePlate from './MeltCurvePlate';

import getLineChartData from './util.jsx';

import './DataObjectQPCR.scss';

function AmpTable({
  threshold,
  data,
  addCTValues,
  showDefaultCTValues,
}) {

  return (
    <div className="data-object-qpcr__aliquot-info">
      <DataTable
        headers={['index', 'ct']}
        data={data}
      />
      <Button
        type="secondary"
        size="medium"
        height="standard"
        heavy
        label="Add CT values at the current threshold to the csv file"
        labelPlacement="top"
        onClick={() => {
          const update = _.reduce(data, (result, value) => {
            return { ...result, [value.index]: value.ct };
          }, {});
          update.threshold = `CT (${threshold})`;
          addCTValues(update);
        }}
        disabled={showDefaultCTValues}
      >
        Generate CSV
      </Button>
    </div>
  );
}

class DataObjectQPCR extends React.Component {
  static get propTypes() {
    return {
      container: PropTypes.instanceOf(Immutable.Map).isRequired,
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired,
      data: PropTypes.object.isRequired,
      updateCsv: PropTypes.func,
      updateCsvName: PropTypes.func,
      runID: PropTypes.string,
      updatedCsvData: PropTypes.string,
      rawCsvData: PropTypes.string
    };
  }

  static ctrlKeyPressed(e) {
    return e.ctrlKey || e.metaKey;
  }

  static parseSelectedWellMapToFocusedLines(wellMap) {
    const arrayOfNumIndices = wellMap.keySeq().toJS();
    const arrayOfStringIndices = arrayOfNumIndices.map(index => index.toString());

    return arrayOfStringIndices;
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (_.isEqual(nextProps.rawCsvData, nextProps.updatedCsvData)) {
      return ({ ...prevState, thresholds: new Set() });
    }
  }

  constructor(props, context) {
    super(props, context);

    this.onWellClick             = this.onWellClick.bind(this);
    this.onRowClick              = this.onRowClick.bind(this);
    this.onColClick              = this.onColClick.bind(this);
    this.onSelectAllClick        = this.onSelectAllClick.bind(this);
    this.onDetailsTableItemClick = this.onDetailsTableItemClick.bind(this);
    this.onAddCTValues           = this.onAddCTValues.bind(this);
    this.updateCsv               = this.updateCsv.bind(this);
    const containerType = this.props.container.get('container_type');

    this.ctypeHelper = new ContainerTypeHelper({
      col_count: containerType.get('col_count'),
      well_count: containerType.get('well_count'),
      shortname: containerType.get('shortname')
    });

    const { curve, dye } = this.findFirstValidCurve(props.data);
    this.defaultCsvName =  `${this.props.runID}_Default`;

    this.state = {
      dye: dye,
      curve: curve,
      visibleWells: undefined,
      visibleLines: undefined,
      focusedLines: [],
      chartFocusedLines: [],
      ctValues: {},
      threshold: undefined,
      thresholds: new Set()
    };
  }

  componentDidMount() {
    this.props.updateCsvName(this.defaultCsvName);
  }

  componentDidUpdate() {
    const { updatedCsvData, rawCsvData, csvName } = this.props;

    if (_.isEqual(updatedCsvData, rawCsvData) && csvName !== this.defaultCsvName) {
      this.props.updateCsvName(this.defaultCsvName);
    }
  }

  onWellClick(wellIndex, e, wellMap) {
    const wellMapWithSelectedWells = PlateSelectLogic.wellClicked(
      wellMap,
      wellIndex,
      DataObjectQPCR.ctrlKeyPressed(e)
    );

    this.updateFocusedLines(wellMapWithSelectedWells);
  }

  onRowClick(row, e, wellMap) {
    const { cols, rows } = this.containerDimensions();

    const wellMapWithSelectedRowWells = PlateSelectLogic.rowClicked(
      wellMap,
      row,
      rows,
      cols,
      DataObjectQPCR.ctrlKeyPressed(e)
    );

    this.updateFocusedLines(wellMapWithSelectedRowWells);
  }

  onColClick(col, e, wellMap) {
    const { cols, rows } = this.containerDimensions();

    const wellMapWithSelectedColWells = PlateSelectLogic.colClicked(
      wellMap,
      col,
      rows,
      cols,
      DataObjectQPCR.ctrlKeyPressed(e)
    );

    this.updateFocusedLines(wellMapWithSelectedColWells);
  }

  onSelectAllClick(e, wellMap) {
    const { cols, rows } = this.containerDimensions();

    const wellMapWithAllWellsSelected = PlateSelectLogic.selectAllClicked(
      wellMap,
      rows,
      cols,
      DataObjectQPCR.ctrlKeyPressed(e)
    );

    this.updateFocusedLines(wellMapWithAllWellsSelected);
  }

  onDetailsTableItemClick(wellIndex) {
    this.setState({ focusedLines: [wellIndex.toString()] });
  }

  containerDimensions() {
    const containerType = this.props.container.get('container_type');
    const wellCount     = containerType.get('well_count');
    const cols          = containerType.get('col_count');
    const rows          = wellCount / cols;

    return { cols, rows };
  }

  updateFocusedLines(wellMap) {
    const selectedWells   = PlateSelectLogic.selectedWells(wellMap);
    const newFocusedLines = DataObjectQPCR.parseSelectedWellMapToFocusedLines(selectedWells);

    this.setState({ focusedLines: newFocusedLines });

    if (/^amp/.test(this.state.curve)) {
      const { indices } = this.getQPCRData();
      const newChartFocusedLines = _.reduce(newFocusedLines, (a, e) => {
        const lineIndex = indices[e];
        return [...a, `${lineIndex}`];
      }, []);
      this.setState({ chartFocusedLines: newChartFocusedLines });
    }
  }

  curve() {
    if (/^melt/.test(this.state.curve)) {
      return 'melt';
    } else {
      return this.state.curve;
    }
  }

  curves(data) {
    const amps  = Object.keys(data.postprocessed_data).filter(x => /^amp/.test(x));
    const melts = Object.keys(data.postprocessed_data).filter(x => /^melt/.test(x));

    return amps.concat(melts);
  }

  dyes(data) {
    const obj = data.dye_coverage_map != undefined
      ? data.dye_coverage_map
      : data.postprocessed_data.amp0;

    return Object.keys(obj);
  }

  // Data used for the line graph.
  lineCurveData() {
    let data;
    if (/^amp/.test(this.state.curve)) {
      data = this.props.data.postprocessed_data[this.state.curve][this.state.dye].baseline_subtracted_curve_fit;
      return {
        data,
        x_label: 'Cycles',
        y_label: 'RFU',
        x_domain: [0, data[Object.keys(data)[0]].length - 1]
      };

    } else if (/^melt/.test(this.state.curve)) {
      const melt = this.props.data.postprocessed_data.melt[this.state.dye];
      const result = _.map(melt.melt_peak_data, (value, key) => [
        key,
        _.fromPairs(value.map((x, i) => [melt.adjusted_temps[i], x]))
      ]);

      return {
        data: _.fromPairs(result),
        x_label: 'Temperature (°C)',
        y_label: '-d(RFU)/dT',
        x_domain: [
          melt.adjusted_temps[0],
          melt.adjusted_temps[melt.adjusted_temps.length - 1]
        ]
      };
    }

    return undefined;
  }

  // Data used for the plate and table views.
  showDefaultCTValues() {
    return _.isEmpty(this.state.ctValues);
  }

  curveData() {
    const defaultCTs = this.props.data.postprocessed_data[this.state.curve][this.state.dye];
    const cts = this.state.ctValues;
    const updatedCTs = { ...defaultCTs, cts };
    return this.showDefaultCTValues() ? defaultCTs : updatedCTs;
  }

  ampTableData() {
    const data = _.map(this.curveData().cts, (ct, wellIndex) => {
      return {
        index: this.ctypeHelper.humanWell(wellIndex),
        ct: Number.isNaN(ct) ? 'n/a' : toPrecision(ct, 2),
        robotIndex: wellIndex
      };
    });

    return _.filter(data, datum => {
      if (this.state.visibleWells == undefined) {
        return true;
      }

      return _.includes(this.state.visibleWells, datum.robotIndex.toString());
    });

  }

  meltTableData() {
    const cdata = this.curveData();

    let peaks;
    if (!_.isEmpty(cdata.all_peak_heights)) {
      // mapping from wellIndex -> max_peak_height
      peaks = cdata.all_peak_heights;
    } else {
      peaks = _.mapValues(cdata.melt_peak_data, pts => _.max(pts));
    }

    const data = _.map(peaks, (peak, wellIndex) => {
      return {
        index: this.ctypeHelper.humanWell(wellIndex),
        melt_peak: toPrecision(peak, 2)
      };
    });

    return _.filter(data, (ct, wellIndex) => {
      if (this.state.visibleWells == undefined) {
        return true;
      }

      return _.includes(this.state.visibleWells, wellIndex.toString());
    });
  }

  // Chooses the first curve that is actually viewable.
  // With Melt curves for example, they usually come paired with Amp curves that have a single data point.
  //
  // The logic here is gross, but not sure of another way.
  findFirstValidCurve(data) {
    const curves = this.curves(data);
    const dyes   = this.dyes(data);

    for (let i = 0; i < curves.length; i++) {
      const curve = curves[i];

      for (let j = 0; j < dyes.length; j++) {
        const dye = dyes[j];

        if (/^amp/.test(curve)) {
          const cts = data.postprocessed_data[curve][dye].baseline_subtracted_curve_fit.cts;

          if (!_.isEmpty(cts)) {
            return { curve, dye };
          }
        } else if (/^melt/.test(curve)) {
          const mpData = data.postprocessed_data.melt[dye].melt_peak_data;

          if (!_.isEmpty(mpData)) {
            return { curve, dye };
          }
        }
      }
    }

    return {
      curve: curves[0],
      dye: dyes[0]
    };
  }

  // data for Amino qPCR Chart
  getQPCRData() {
    const { data } = this.lineCurveData();
    const { cts } = this.curveData();
    return getLineChartData(data, cts, this.ctypeHelper.humanWell);
  }

  updateCsv(updatedCts) {
    const thresholds = this.state.thresholds;
    const currentThreshold = updatedCts.threshold;
    if (_.isEmpty(updatedCts) || thresholds.has(currentThreshold)) return;
    const csvData = this.props.updatedCsvData ? this.props.updatedCsvData : this.props.rawCsvData;
    const result = csvData.split(/\n/);
    const update = result.map((e, i) => {
      if (i === result.length - 1) return e;
      const line = e.split(',');
      const humanWell = i === 0 ? 'threshold' : line[1];
      const ct = updatedCts[humanWell] ? updatedCts[humanWell] : 'n/a';
      line.splice(5, 0, ct);
      const updatedLine = line.join();
      return updatedLine;
    }).join('\n');
    this.setState({
      thresholds: thresholds.add(currentThreshold),
    });
    this.props.updateCsv(update);
    const csvName = `${this.props.runID}_${updatedCts.threshold || 'Default'}`;
    this.props.updateCsvName(csvName);
    NotificationActions.createNotification({
      text: `CSV has been updated with selected value of threshold ${this.state.threshold}`
    });
  }

  onAddCTValues(updatedCts) {
    this.updateCsv(updatedCts);
  }

  render() {
    const { container, dataObject } = this.props;
    const defaultThreshold = this.props.data.postprocessed_data[this.state.curve][this.state.dye].group_threshold;

    return (
      <Card container>
        <DataObjectContainerHeader container={container} dataObject={dataObject} />
        <Divider />

        <div className="row">
          <div className="col-md-12">
            <Section title="Plots">
              <div className="data-object-qpcr__filter-controls">
                <div className="data-object-qpcr__curve-selectors">
                  <Select
                    value={this.state.curve}
                    onChange={e => this.setState({ curve: e.target.value })}
                    options={this.curves(this.props.data).map((curve) => {
                      return { value: curve };
                    })}
                  />
                  <Select
                    value={this.state.dye}
                    onChange={e => this.setState({ dye: e.target.value })}
                    options={this.dyes(this.props.data).map((dyeName) => {
                      return { value: dyeName };
                    })}
                  />
                </div>
                <div className="data-object-qpcr__selection-actions">
                  {this.state.visibleWells && (
                    <Button
                      type="default"
                      onClick={() =>
                        this.setState({
                          visibleWells: undefined,
                          visibleLines: undefined
                        })
                      }
                    >
                      Remove Filter
                    </Button>
                  )}
                  {this.state.focusedLines.length > 0 && (
                    <div className="row">
                      <div className="col-lg-6">
                        <Button
                          type="primary"
                          onClick={() =>
                            this.setState({
                              focusedLines: [],
                              chartFocusedLines: []
                            })}
                        >
                          Clear Selection
                        </Button>
                      </div>
                      <div className="col-lg-6">
                        <Button
                          type="primary"
                          onClick={() =>
                            this.setState({
                              visibleWells: this.state.focusedLines,
                              visibleLines: this.state.chartFocusedLines,
                              focusedLines: [],
                              chartFocusedLines: []
                            })}
                        >
                          Filter to Selection
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <Tooltip
                  placement="left"
                  title="Click on a line to select the line. Drag over an area to make group selection of lines. Drag the threshold number to select a threshold."
                  invert
                >
                  <i className="fa fa-info-circle" />
                </Tooltip>
              </div>
              {/^melt/.test(this.state.curve) && (
                <LineGraph
                  well_data={this.lineCurveData()}
                  postprocessed_data={this.props.data.postprocessed_data[this.curve()][this.state.dye]}
                  container_type={this.ctypeHelper}
                  visibleWells={this.state.visibleWells}
                  focusedLines={this.state.focusedLines}
                  onFocusLines={lines => this.setState({ focusedLines: lines })
                  }
                />
              )}
              {/^amp/.test(this.state.curve) && (
                <QPCRChart
                  colors={[Styles.Colors.black60]}
                  highlightColors={[Styles.Colors.orange90]}
                  leftLegend
                  xAxisTitle={this.lineCurveData().x_label}
                  yAxisTitle={this.lineCurveData().y_label}
                  title="PCR Data"
                  tooltipFormat={value => `${parseInt((value * 100).toString(), 10) / 100}`}
                  data={this.getQPCRData().lineChartData}
                  selectLine={(cellIndex, lineIndex) => {
                    this.setState({
                      focusedLines: [...this.state.focusedLines, cellIndex],
                      chartFocusedLines: [...this.state.chartFocusedLines, `${lineIndex}`]
                    });
                  }}
                  focusedLines={this.state.chartFocusedLines}
                  filteredResults={this.state.visibleLines}
                  updateCts={(ctValues) => this.setState({ ctValues })}
                  groupSelect={(wellMapCells, chartLines) => {
                    this.setState({
                      focusedLines: [],
                      chartFocusedLines: []
                    });
                    this.setState({
                      focusedLines: wellMapCells,
                      chartFocusedLines: chartLines
                    });
                  }}
                  defaultThreshold={defaultThreshold}
                  updateThreshold={(threshold) => this.setState({ threshold })}
                />
              )}
            </Section>
          </div>
        </div>

        <div className="row">
          <div className="col-xs-12 col-lg-9">
            <Section title="Plate Map">
              {/^amp/.test(this.state.curve) && (
                <AmpCurvePlate
                  curveData={this.curveData()}
                  containerTypeHelper={this.ctypeHelper}
                  focusedWells={this.state.focusedLines}
                  visibleWells={this.state.visibleWells}
                  showSelectAll
                  onWellClick={this.onWellClick}
                  onRowClick={this.onRowClick}
                  onColClick={this.onColClick}
                  onSelectAllClick={this.onSelectAllClick}
                />
              )}
              {/^melt/.test(this.state.curve) && (
                <MeltCurvePlate
                  curveData={this.curveData()}
                  containerTypeHelper={this.ctypeHelper}
                  focusedWells={this.state.focusedLines}
                  visibleWells={this.state.visibleWells}
                  showSelectAll
                  onWellClick={this.onWellClick}
                  onWellsSelect={this.onWellsSelect}
                  onRowClick={this.onRowClick}
                  onColClick={this.onColClick}
                  onSelectAllClick={this.onSelectAllClick}
                />
              )}
            </Section>
          </div>

          <div className="col-xs-12 col-lg-3">
            <Section title="Aliquot Info">
              {/^amp/.test(this.state.curve) && (
                <AmpTable
                  data={this.ampTableData()}
                  threshold={this.state.threshold}
                  addCTValues={this.onAddCTValues}
                  showDefaultCTValues={this.showDefaultCTValues()}
                />
              )}
              {/^melt/.test(this.state.curve) && (
                <DataTable
                  headers={['index', 'melt_peak']}
                  data={this.meltTableData()}
                />
              )}
            </Section>
          </div>
        </div>
      </Card>

    );
  }
}

export default DataObjectQPCR;
