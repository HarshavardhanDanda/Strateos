import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';
import _ from 'lodash';
import Papa from 'papaparse';
import BaseTableTypes from 'main/components/BaseTableTypes';
import Chroma from 'chroma-js';
import { range } from 'main/util/Numbers';

import { Card, Column, Divider, Section,
  Table, TopFilterBar, Button,
  Select, Radio, RadioGroup, Plate, Legend, DataTable } from '@transcriptic/amino';
import ContainerAPI from 'main/api/ContainerAPI';
import NotificationActions from 'main/actions/NotificationActions';
import DataObjectFileHeader from 'main/components/datasets/DataObjectFileHeader';
import ContainerType from 'main/helpers/ContainerType';
import LcmrmCSV from './LcmrmCSV';

import './DataObjectLcmrm.scss';

class DataObjectLcmrm extends React.Component {
  static get propTypes() {
    return {
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired,
      data: PropTypes.object.isRequired,
      runID: PropTypes.string.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      firstAnalyteInRatio: '',
      secondAnalyteInRatio: '',
      ratioTableData: [],
      reasonToDisableCalculate: 'Numerator and denominator must be selected',
      hoveredRecordId: undefined,
      analyteLabel: this.getDefaultAnalyteLabel(),
      areaOrRTButton: 'area',
      well_count: undefined,
      col_count: undefined,
      min: Math.min(),
      max: Math.max(),
      dataWithWellIndex: Immutable.Map(),
      samples: this.getSamples(),
      defaultColumns: ['sample_name', 'well_name', 'area']
    };

    _.bindAll(
      this,
      'getWellTitle',
      'getWellData',
      'calculateMinAndMaxValue',
      'getDropDownOptions'
    );
  }

  componentDidMount() {
    const barcode = this.props.data.barcode;
    const options = {
      filters: {
        barcode: barcode,
        run_id: this.props.runID
      },
      includes: ['container_type']
    };
    ContainerAPI.index(options)
      .done((response) => {
        if (response.data.length === 1 && response.included.length === 1) {
          const containerType = new ContainerType(response.included[0].attributes);
          const dataWithWellIndex = {};
          _.has(this.props.data, 'samples') && this.props.data.samples.forEach(sample => {
            const index = containerType.robotWell(sample.well_name.toUpperCase());
            dataWithWellIndex[index] = sample;
          });
          this.calculateMinAndMaxValue();
          this.setState({ well_count: containerType.well_count, col_count: containerType.col_count, dataWithWellIndex: dataWithWellIndex });
        } else {
          NotificationActions.createNotification({
            text: 'Container with the given barcode or run_id is not present',
            isError: true
          });
        }
      });
  }

  generateName() {
    const { dataObject } = this.props;
    const dataObjectName = dataObject.get('name');
    const name = dataObjectName.substring(0, dataObjectName.lastIndexOf('.'));
    return name + '_computed.csv';
  }

  calculateMinAndMaxValue() {
    let min = Math.min();
    let max = Math.max();
    _.has(this.props.data, 'samples') && this.props.data.samples.forEach(sample => {
      if (sample[this.state.analyteLabel][this.state.areaOrRTButton] < min) {
        min = sample[this.state.analyteLabel][this.state.areaOrRTButton];
      }
      if (sample[this.state.analyteLabel][this.state.areaOrRTButton] > max) {
        max = sample[this.state.analyteLabel][this.state.areaOrRTButton];
      }
    });
    this.setState({ min: min - (min / 10), max: max + (max / 10) });
  }

  getDefaultAnalyteLabel() {
    const transitionLabels = this.props.data && this.props.data.transition_labels;
    const analyteLabel = transitionLabels && Object.keys(transitionLabels);
    return analyteLabel && analyteLabel[0];
  }

  getSamples() {
    const samplesData = this.props.data && this.props.data.samples;
    return samplesData || [];
  }

  isDisableRTValueRadio() {
    let disable = false;
    this.state.ratioTableData.length && this.state.ratioTableData.forEach(data => {
      if (data.id === this.state.analyteLabel) {
        disable = true;
      }
    });
    return disable;
  }

  headerArray() {
    let headers = ['Samples', null];
    const labels = _.values(this.props.data.transition_labels);
    if (labels.length > 0) {
      const newRatioHeaders = _.map(this.state.ratioTableData, 'label');
      headers = _.concat(headers, labels, newRatioHeaders);
    }
    return headers;
  }

  subheaderArray() {
    const labelsLength = _.keys(this.props.data.transition_labels).length;
    const dynamicLabelsColumn = _.concat(...new Array(labelsLength).fill(['Area']));
    const newRatioColumn = _.concat(...new Array(this.state.ratioTableData.length).fill(['Area ratio']));
    return _.concat(['Name', 'Pos.'], dynamicLabelsColumn, newRatioColumn);
  }

  toCSV() {
    const  { samples: data, defaultColumns }  = this.state;

    if (data) {
      const csvData = data.map((sampleData) => {
        const flattenedData = [];
        _.forEach(sampleData, (value, key) => {
          if (_.isObject(value)) {
            const objectKeys = _.keys(value);
            const objectValues = [];
            objectKeys.forEach((k) => {
              if (defaultColumns.includes(k)) {
                objectValues.push(value[k]);
              }
            });
            flattenedData.push(objectValues);
          } else if (defaultColumns.includes(key)) {
            flattenedData.push(value);
          }
        });
        return flattenedData;
      });

      csvData.unshift(this.headerArray(), this.subheaderArray());
      return Papa.unparse(csvData);
    } else {
      return '';
    }
  }

  header = () => {
    return (
      <DataObjectFileHeader dataObject={this.props.dataObject} />
    );
  };

  getWellTitle(wellIndex) {
    if (_.has(this.state.dataWithWellIndex, wellIndex)) {
      return this.state.dataWithWellIndex[wellIndex].well_name;
    }
  }

  getWellData(wellIndex) {
    if (_.has(this.state.dataWithWellIndex, wellIndex)) {
      return this.state.dataWithWellIndex[wellIndex][this.state.analyteLabel][this.state.areaOrRTButton];
    }
  }

  getWellMap(rows, cols) {
    const max = this.state.max;
    const min = this.state.min;
    this.colorScale = Chroma.scale('YlGnBu').domain([min, max]);

    return Immutable.Map([...range(0, rows * cols)].map((wellIndex) => {
      if (_.has(this.state.dataWithWellIndex, wellIndex)) {
        const value = this.state.dataWithWellIndex[wellIndex][this.state.analyteLabel][this.state.areaOrRTButton];
        const color = this.colorScale(value).hex();

        return [
          wellIndex,
          Immutable.Map({
            hasVolume: true,
            color: color
          })
        ];
      }
      return undefined;
    }));
  }

  getTableData(analyteLabel, areaOrRTButton) {
    const aliquots = this.props.data && this.props.data.samples ? _.values(this.props.data.samples) : [];
    const tableData = aliquots && aliquots.map((sample) => {
      const label = areaOrRTButton === 'rt' ? 'RT(min)' : 'a.u.';
      return {
        Well: sample.well_name.toUpperCase(),
        [label]: sample[analyteLabel][areaOrRTButton]
      };

    });
    return tableData;
  }

  getTableHeader(areaOrRTButton) {
    return areaOrRTButton === 'rt' ?  ['Well', 'RT(min)'] : ['Well', 'a.u.'];
  }

  getDropDownOptions() {
    const transitionLabels = this.props.data.transition_labels;
    const transitionLabelKeys = transitionLabels && Object.keys(transitionLabels);
    const analyteOptions = [{ value: 'Analyte', name: 'Analyte', isHeader: true }];
    transitionLabelKeys && transitionLabelKeys.map((label, index) => {
      analyteOptions[index + 1] = {
        value: label,
        name: index + 1 + '. ' + transitionLabels[label]
      };
      return analyteOptions;
    });
    const ratioOptions = [{ value: 'Ratio History', name: 'Ratio History', isHeader: true }];
    this.state.ratioTableData && this.state.ratioTableData.map((ratio, index) => {
      ratioOptions[index + 1] = {
        value: ratio.id,
        name: index + 1 + '. ' + ratio.label
      };
      return ratioOptions;
    });
    return  this.state.ratioTableData.length && this.state.areaOrRTButton !== 'rt' ?
      _.concat(ratioOptions, analyteOptions) : analyteOptions;
  }

  ratioDropDownOptions = () => {
    const data = this.props.data;
    const transitionDetails = data && data.transition_details;
    const transitionDetailsKeys = transitionDetails && Object.keys(transitionDetails);
    return transitionDetailsKeys && transitionDetailsKeys.map((key, index) => ({
      value: key,
      name: `${index + 1}. ${transitionDetails[key].analyte} (${transitionDetails[key].label})`
    }));
  };

  firstRatioDropDownOptions = () => {
    let options = this.ratioDropDownOptions();
    const removeThese = this.state.ratioTableData.map((data) => {
      if (data.denominator === this.state.secondAnalyteInRatio) {
        return data.numerator;
      }
      return null;
    });
    removeThese.push(this.state.secondAnalyteInRatio);
    options = options.filter((data) => removeThese.indexOf(data.value) === -1);
    removeThese.pop();
    return options;
  };

  secondRatioDropDownOptions = () => {
    let options = this.ratioDropDownOptions();
    const removeThese = this.state.ratioTableData.map((data) => {
      if (data.numerator === this.state.firstAnalyteInRatio) {
        return data.denominator;
      }
      return null;
    });
    removeThese.push(this.state.firstAnalyteInRatio);
    options = options.filter((data) => removeThese.indexOf(data.value) === -1);
    removeThese.pop();
    return options;
  };

  addRatio = () => {
    const data = this.props.data;
    const transitionLabels = data && data.transition_labels;
    const numerator = transitionLabels ? transitionLabels[this.state.firstAnalyteInRatio] : '';
    const denominator = transitionLabels ? transitionLabels[this.state.secondAnalyteInRatio] : '';
    const newEntry = {
      id: `${this.state.firstAnalyteInRatio}-${this.state.secondAnalyteInRatio}`,
      numerator: this.state.firstAnalyteInRatio,
      denominator: this.state.secondAnalyteInRatio,
      label: (numerator && denominator) ? `${numerator} / ${denominator}` : ''
    };
    const isAlreadyExist = _.find(this.state.ratioTableData, newEntry);
    if (isAlreadyExist) {
      NotificationActions.createNotification({
        text: 'Ratio already exists in the table',
        isError: true
      });
    } else {
      this.setState((prevState) => ({
        ratioTableData: [...prevState.ratioTableData, newEntry]
      }));
      this.setState((prevState) => ({
        samples: this.getUpdatedSamples(prevState.samples, newEntry)
      }));
    }
    this.setState({ firstAnalyteInRatio: '', secondAnalyteInRatio: '', reasonToDisableCalculate: 'Numerator and denominator must be selected' });
  };

  getUpdatedSamples = (samples, newEntry) => {
    const updatedSamples = samples && samples.map((sample) => {
      const ratio = _.isNumber(sample[newEntry.numerator].area) && _.isNumber(sample[newEntry.denominator].area) ?
        (sample[newEntry.numerator].area / sample[newEntry.denominator].area).toFixed(4) : '-';
      sample[newEntry.id] = { area: Number(ratio) };
      return sample;
    });
    return updatedSamples;
  };

  setCalculateButtonState = () => {
    const { firstAnalyteInRatio, secondAnalyteInRatio } = this.state;
    if (!firstAnalyteInRatio || !secondAnalyteInRatio) {
      this.setState({ reasonToDisableCalculate: 'Numerator and denominator must be selected' });
    } else {
      this.setState({ reasonToDisableCalculate: '' });
    }
  };

  deleteRatio = (id) => {
    const prevRatioTableData = [...this.state.ratioTableData];
    _.remove(prevRatioTableData, (ratio) => { return ratio.id === id; });
    this.state.analyteLabel === id &&
    this.setState({ analyteLabel: this.getDefaultAnalyteLabel() }, () => { this.calculateMinAndMaxValue(); });

    this.setState((prevState) => ({
      samples: prevState.samples.map((sample) => {
        delete sample[id];
        return sample;
      })
    }));

    this.setState({ ratioTableData: prevRatioTableData, hoveredRecordId: undefined });
  };

  renderAnalyte(record) {
    return <BaseTableTypes.Text data={record.get('analyte')} />;
  }

  renderLabel(record) {
    return <BaseTableTypes.Text data={record.get('label')} />;
  }

  renderPrecursor(record) {
    return <BaseTableTypes.Text data={record.get('precursor')} />;
  }

  renderProductIon(record) {
    return <BaseTableTypes.Text data={record.get('product')} />;
  }

  renderIndex(record, rowIndex) {
    return <BaseTableTypes.Text data={rowIndex + 1} />;
  }

  renderTransitionTableColumns() {
    return [
      <Column
        renderCellContent={this.renderIndex}
        id="index-column"
        key="index-column"
        relativeWidth={1}
      />,
      <Column
        renderCellContent={this.renderAnalyte}
        header="Analyte"
        id="analyte-column"
        key="analyte-column"
        relativeWidth={2}
      />,
      <Column
        renderCellContent={this.renderLabel}
        header="Label"
        id="label-column"
        key="label-column"
        relativeWidth={2}
      />,
      <Column
        renderCellContent={this.renderPrecursor}
        header="Precursor"
        id="precursor-column"
        key="precursor-column"
        relativeWidth={2}
      />,
      <Column
        renderCellContent={this.renderProductIon}
        header="Product ion"
        id="product-column"
        key="product-column"
        relativeWidth={2}
      />
    ];
  }

  renderRatioAnalyteLabel = (record) => {
    return <BaseTableTypes.Text data={record.get('label')} />;
  };

  renderDeleteIcon = (record) => {
    return (
      this.state.hoveredRecordId === record.get('id') && (
        <Button
          icon="fas fa-trash"
          link
          onClick={() => this.deleteRatio(record.get('id'))}
          label="Remove ratio"
          type="secondary"
        />
      )
    );
  };

  render() {
    const { dataObject, data } = this.props;
    const transitionTableData = data ? Immutable.fromJS(_.values(data.transition_details)) : Immutable.List();
    const row_count = this.state.well_count / this.state.col_count;
    const dropDownOptions = this.getDropDownOptions();

    const getWellInfo = (index) => {
      return {
        title: this.getWellTitle(index),
        body: this.getWellData(index)
      };
    };

    return (
      <Card container>
        <div className="data-object-lcmrm">
          <DataObjectFileHeader dataObject={dataObject} />
          <Divider />
          <Section title="Transition pairs" type="secondary">
            <Table
              data={transitionTableData}
              loaded
              disabledSelection
              emptyMessage="There are no transitions"
              id="lcmrm-transition-table"
            >
              {this.renderTransitionTableColumns()}
            </Table>
          </Section>
          <Section title="Calculate ratios" type="secondary">
            <div className="data-object-lcmrm__ratio-buttons">
              <TopFilterBar>
                <TopFilterBar.Wrapper grow={2}>
                  <Select
                    placeholder="Select analyte"
                    value={this.state.firstAnalyteInRatio}
                    onChange={e => this.setState({ firstAnalyteInRatio: e.target.value }, this.setCalculateButtonState)}
                    options={this.firstRatioDropDownOptions()}
                    disabled={this.firstRatioDropDownOptions().length < 1}
                  />
                </TopFilterBar.Wrapper>
                <TopFilterBar.Wrapper grow={false}>
                  <span className="data-object-lcmrm__slash-icon">
                    /
                  </span>
                </TopFilterBar.Wrapper>
                <TopFilterBar.Wrapper grow={2}>
                  <Select
                    placeholder="Select analyte"
                    value={this.state.secondAnalyteInRatio}
                    onChange={e => this.setState({ secondAnalyteInRatio: e.target.value }, this.setCalculateButtonState)}
                    options={this.secondRatioDropDownOptions()}
                    disabled={this.secondRatioDropDownOptions().length < 1}
                  />
                </TopFilterBar.Wrapper>
                <TopFilterBar.Wrapper grow={4}>
                  <Button
                    type="success"
                    onClick={this.addRatio}
                    disabled={!!this.state.reasonToDisableCalculate}
                    label={this.state.reasonToDisableCalculate}
                  >
                    Calculate
                  </Button>
                </TopFilterBar.Wrapper>
              </TopFilterBar>
            </div>
            { this.state.ratioTableData.length > 0 && (
              <Table
                loaded
                data={Immutable.fromJS(this.state.ratioTableData)}
                disabledSelection
                id="ratio-table"
                onRowHover={(record, isHovered) => {
                  if (isHovered) {
                    this.setState({ hoveredRecordId: record.get('id') });
                  } else {
                    this.setState({ hoveredRecordId: undefined });
                  }
                }}
              >
                <Column
                  renderCellContent={this.renderIndex}
                  id="ratio-table-index"
                  relativeWidth={1}
                />
                <Column
                  renderCellContent={this.renderRatioAnalyteLabel}
                  header="Analyte-label"
                  id="ratio-table-label"
                  relativeWidth={7}
                  sortable
                  autoSort
                />
                <Column
                  renderCellContent={this.renderDeleteIcon}
                  id="ratio-table-delete"
                  relativeWidth={2}
                  alignContentRight
                />
              </Table>
            )}
          </Section>
          <Section title="Plate map">
            <Select
              id="analyte-single-select-input"
              name="analyte-single-select-input"
              value={this.state.analyteLabel}
              onChange={e => this.setState({ analyteLabel: e.target.value }, () => this.calculateMinAndMaxValue())}
              options={dropDownOptions}
            />
            <div className="data-object-lcmrm__radio-group">
              <RadioGroup
                name="radio-input-group"
                value={this.state.areaOrRTButton}
                onChange={e => this.setState({ areaOrRTButton: e.target.value }, () => this.calculateMinAndMaxValue())}
                inline
              >
                <Radio
                  id="peak-area"
                  name="peak-area"
                  value="area"
                  label="Peak area"
                />
                <Radio
                  id="rt-value"
                  name="rt-value"
                  value="rt"
                  label="RT value"
                  disabled={this.isDisableRTValueRadio()}
                />
              </RadioGroup>
            </div>
            <Plate
              showBorder
              rows={row_count}
              cols={this.state.col_count}
              getWellInfo={getWellInfo}
              wellMap={this.getWellMap(row_count, this.state.col_count)}
            >
              <Legend
                colorScale={Chroma.scale('YlGnBu').domain([this.state.max, this.state.min])}
                overrideDomain={[this.state.min, this.state.max]}
                units={this.state.areaOrRTButton === 'area' ? 'a.u.' : 'RT(min)'}
              />
            </Plate>
          </Section>
          <Section title="Aliquot">
            <DataTable
              data={this.getTableData(this.state.analyteLabel, this.state.areaOrRTButton)}
              headers={this.getTableHeader(this.state.areaOrRTButton)}
              disableFormatHeader
              theme="white"
            />
          </Section>
          <div className="data-object-lcmrm__csv-table">
            <LcmrmCSV name={this.generateName()} csvData={this.toCSV()} />
          </div>
        </div>
      </Card>
    );
  }
}

export default DataObjectLcmrm;
