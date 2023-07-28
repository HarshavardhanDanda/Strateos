import Immutable from 'immutable';
import _         from 'lodash';
import Papa      from 'papaparse';
import PropTypes from 'prop-types';
import React     from 'react';

import NotificationActions                 from 'main/actions/NotificationActions';
import UserRunActions                      from 'main/actions/RunActions';
import { SinglePaneModal }                 from 'main/components/Modal';
import ContainerType                       from 'main/helpers/ContainerType';
import { splitRefObject, containerForRef } from 'main/util/RefUtil';
import * as Units from 'main/util/unit';

import { Button, DragDropFilePicker } from '@transcriptic/amino';

import MeasureData from './MeasureData';

import './MeasureDataModal.scss';

function valueToTyped(value, units) {
  if (value !== undefined) {
    if (!(value.length > 0)) { return ''; }
    if (units) { return `${value}:${units}`; }
    return value;
  }
  return undefined;
}

function valueFromTyped(typedValue) {
  if (typedValue) {
    return typedValue.split(':')[0];
  }
  return '';
}

class MeasureDataModal extends React.Component {

  static get propTypes() {
    return {
      title:               PropTypes.string.isRequired,
      run:                 PropTypes.instanceOf(Immutable.Map).isRequired,
      instruction:         PropTypes.instanceOf(Immutable.Map).isRequired,
      onInstructionUpdate: PropTypes.func.isRequired,
      modalId:             PropTypes.string.isRequired,
      closeOnClickOut:     PropTypes.bool
    };
  }

  constructor(props) {
    super(props);
    this.state = this.initialState();

    this.onInputChanged     = this.onInputChanged.bind(this);
    this.onSubmit           = this.onSubmit.bind(this);
    this.importFromCSV      = this.importFromCSV.bind(this);
    this.initialState       = this.initialState.bind(this);
    this.convertStateToData = this.convertStateToData.bind(this);
    this.measurementType    = this.measurementType.bind(this);
    this.isTwoPartMeasure   = this.isTwoPartMeasure.bind(this);
    this.isAliquotMeasure   = this.isAliquotMeasure.bind(this);
    this.measurements       = this.measurements.bind(this);
    this.onFileAdded        = this.onFileAdded.bind(this);
    this.shouldConfirm      = this.shouldConfirm.bind(this);
    this.supportsCSVUpload  = this.supportsCSVUpload.bind(this);
    this.getInputValues     = this.getInputValues.bind(this);
    this.getInstructionRefs = this.getInstructionRefs.bind(this);
    this.normalizeWellData  = this.normalizeWellData.bind(this);
    this.abortUpload        = this.abortUpload.bind(this);
    this.onRetry            = this.onRetry.bind(this);
    this.handleFile         = this.handleFile.bind(this);

    /**
     * Static data for measurements that support CSV bulk import. The entry in the object
     * is the type of measurement. The value is an object  with the following properties:
     *
     *  accepts: A function that takes an instruction and returns a boolean indicating whether or
     *           not this parser can handle this instruction type
     *  headers: The header rows for the CSV file. These will be used to generate the template and
     *           also to validate uploaded CSV data files
     */
    this.CSVImportTypes = {
      concentration: {
        accepts: instruction => instruction.getIn(['operation', 'measurement']) !== 'protein',
        headers: _instruction => ['Ref', 'Well', 'Concentration (ng/uL)', 'Quality (A260/A280)']
      },
      count_cells: {
        accepts: instruction => instruction.getIn(['operation', 'op']) === 'count_cells',

        // [Ref, Well, LABEL1_stained, LABEL1_unstained, ...]
        headers: (instruction) => {
          const results = ['Ref', 'Well'];

          const labels = this.getLabels(instruction);

          labels.forEach((label) => {
            switch (label) {
              case 'default': {
                results.push(`unlabeled_${label}`);
                break;
              }
              case 'trypan_blue': {
                results.push(`labeled_${label}_dead`);
                results.push(`unlabeled_${label}_alive`);
                break;
              }
              default: {
                results.push(`labeled_${label}`);
                results.push(`unlabeled_${label}`);
              }
            }
          });

          return results;
        }
      }
    };
  }

  getLabels(instruction) {
    let labels = instruction.getIn(['operation', 'labels']).toJS();

    if (!labels || labels.length === 0) {
      labels = ['default'];
    }

    return labels;
  }

  /**
   * Imports form data from CSV. This method does not need to check that CSV import is
   * supported, as it would not be called for such cases.
   */
  importFromCSV(data) {
    const inputs = {};

    switch (this.measurementType()) {
      case 'concentration': {
        const { headers } = this.CSVImportTypes.concentration;

        data.forEach((entry) => {
          const [ref, well, concentration, qualityScore] = headers(this.props.instruction).map(h => entry[h]);
          const values = [concentration, qualityScore];

          this.measurements().forEach((measurement, idx) => {
            if (ref != undefined && well != undefined && values[idx] !== undefined) {
              // set deeply with defaults.
              _.setWith(inputs,
                [ref, well, measurement.type],
                valueToTyped(values[idx], measurement.dataUnits),
                Object);
            }
          });
        });
        break;
      }

      case 'count_cells': {
        const { headers } = this.CSVImportTypes.count_cells;
        data.forEach((entry) => {
          const [ref, well, ...labels] = headers(this.props.instruction).map(h => entry[h]);

          this.measurements().forEach((measurement, idx) => {
            if (ref != undefined && well != undefined && labels[idx] !== undefined) {
              // set deeply with defaults.
              _.setWith(inputs,
                [ref, well, measurement.type],
                valueToTyped(labels[idx], measurement.dataUnits),
                Object);
            }
          });
        });
        break;
      }

      default:
        throw new Error(`importFromCSV called for unsupported data type ${this.measurementType()}`);
    }

    this.setState({ inputs });
  }

  onInputChanged(ref, well, type, value) {
    const inputs = _.clone(this.state.inputs);

    if (this.isAliquotMeasure()) {
      inputs[ref][well][type] = value;
    } else {
      inputs[ref][type] = value;
    }

    return this.setState({ inputs });
  }

  onSubmit() {
    const { instructionData } = this.convertStateToData();
    const actions = UserRunActions;
    return actions.attachInstructionData(this.props.instruction.get('id'), instructionData)
      .done((instruction) => {
        this.props.onInstructionUpdate(instruction);
      });
  }

  initialState() {
    const refs = this.getInstructionRefs();
    const inputs = {};

    // Build Inputs
    // Either Inputs[RefName], or Inputs[RefName][WellIdx]
    if (this.isAliquotMeasure()) {
      refs.forEach((ref) => {
        const [refName, wellIdx] = Array.from(splitRefObject(ref));

        if (inputs[refName] === undefined) { inputs[refName] = {}; }

        if (this.isAliquotMeasure()) {
          const container        = containerForRef(refName, this.props.run);
          const containerType    = new ContainerType(container.container_type);
          const humanizedWellIdx = containerType.humanWell(wellIdx);

          inputs[refName][humanizedWellIdx] = {};
        }
      });
    } else {
      refs.forEach((ref) => {
        const [refName, _wellIdx] = Array.from(splitRefObject(ref));
        inputs[refName] = {};
      });
    }

    return {
      loadedDataFromCSV: false,
      csvParsingErrors: [],
      inputs: inputs,
      file: undefined
    };
  }

  // fetch Immutable array of container refs OR aliquot refs
  // [foo, bar, baz] OR [foo/1, bar/2, baz/3]
  getInstructionRefs() {
    const op = this.props.instruction.getIn(['operation', 'op']);

    if (op === 'count_cells') {
      return this.props.instruction.getIn(['operation', 'wells']);
    } else if (op === 'measure_mass') {
      return Immutable.List([this.props.instruction.getIn(['operation', 'object'])]);
    } else {
      return this.props.instruction.getIn(['operation', 'object']);
    }

  }

  shouldConfirm() {
    return this.convertStateToData().isMissingEntries;
  }

  // normalizes well data before converting to state
  // for example, count cells needs to edit the user's input value before submission.
  normalizeWellData(wellData) {
    const wData = _.clone(wellData);
    const inst  = this.props.instruction;

    // For trypan_blue labels we must divide by half.  As the machine reports double for these labels.
    if (this.measurementType() === 'count_cells' && _.includes(this.getLabels(inst), 'trypan_blue')) {
      const scalarDeadStr  = valueFromTyped(wData.labeled_trypan_blue_dead);
      const scalarAliveStr = valueFromTyped(wData.unlabeled_trypan_blue_alive);
      const scalarDead     = Number(scalarDeadStr);
      const scalarAlive    = Number(scalarAliveStr);

      if (!_.isEmpty(scalarDeadStr) && !isNaN(scalarDead)) {
        const scalarStr = (scalarDead / 2.0).toString();
        wData.labeled_trypan_blue_dead = valueToTyped(scalarStr, 'cells/milliliter');
      }

      if (!_.isEmpty(scalarAliveStr) && !isNaN(scalarAlive)) {
        const scalarStr = (scalarAlive / 2.0).toString();
        wData.unlabeled_trypan_blue_alive = valueToTyped(scalarStr, 'cells/milliliter');
      }
    }

    return wData;
  }

  convertStateToData() {
    // converts nested objects into lists of objects (and tracks whether any data is missing for quick validation)
    let isMissingEntries = false;

    const measureData = _.map(this.state.inputs, (refData, refName) => {
      const container = containerForRef(refName, this.props.run);

      if (this.isAliquotMeasure()) {
        const containerType = new ContainerType(container.container_type);

        const wells = _.map(refData, (wellData, well) => {
          if (!isMissingEntries) { isMissingEntries = this.isMissingData(wellData); }

          const normalizedWellData = this.normalizeWellData(wellData);

          return _.extend(normalizedWellData, { well, wellIndex: containerType.robotWell(well) });
        });

        return { refName, wells, containerId: container.id };
      } else {
        if (!isMissingEntries) { isMissingEntries = this.isMissingData(refData); }
        return _.extend(_.clone(refData), { refName, containerId: container.id });
      }
    });

    const instructionData = {
      parameters: {
        measurement: this.measurementType()
      },
      data: {
        data: measureData // datasets expect their data attribute to have a top-level key
      }
    };

    if (this.props.instruction.getIn(['operation', 'measurement']) !== undefined) {
      instructionData.parameters.type = this.props.instruction.getIn(['operation', 'measurement']);
    }

    return { instructionData, isMissingEntries };
  }

  isMissingData(data) {
    const numericWithUnits = /^\d+(?:\.\d+)?:[A-Za-z0-9/]+$/;

    const measurmentKeys = this.measurements().map(m => m.type);
    const values         = measurmentKeys.map(k => data[k]);

    // check that all values are valid
    const valid  = _.every(values, value => numericWithUnits.test(value));

    return !valid;
  }

  measurementType() {
    const op = this.props.instruction.getIn(['operation', 'op']);

    if (op.startsWith('measure_')) {
      return op.replace('measure_', '');
    }
    return op;
  }

  isTwoPartMeasure() {
    const measurement = this.props.instruction.getIn(['operation', 'measurement']);
    return measurement && measurement !== 'protein';
  }

  isAliquotMeasure() {
    return _.includes(['count_cells', 'concentration', 'volume'], this.measurementType());
  }

  /**
   * Generates a CSV template for manual data collection. This file will be downloaded, populated, and
   * then re-uploaded to populate the data entry form
   */
  getCSVTemplate() {
    const importDetails = this.CSVImportTypes[this.measurementType()];
    if (importDetails) {
      const rows = [];

      _.forEach(this.state.inputs, (wells, refName) => {
        _.forEach(wells, (wellData, well) => {
          rows.push([refName, well, '', '']);
        });

        // Add an emptyt line between data refs
        rows.push([]);
      });

      return _.map([importDetails.headers(this.props.instruction)].concat(rows), row => row.join(',')).join('\n');
    }
    return undefined;
  }

  supportsCSVUpload() {
    const importDetails = this.CSVImportTypes[this.measurementType()];
    return importDetails && importDetails.accepts(this.props.instruction);
  }

  measurements() {
    switch (this.measurementType()) {
      case 'count_cells': {

        const labels = this.getLabels(this.props.instruction);

        const measurements = [];

        labels.forEach((label) => {
          switch (label) {
            case 'default': {
              measurements.push(
                {
                  label: 'Unlabeled (No Stain)',
                  type: `unlabeled_${label}`,
                  dataUnits: 'cells/milliliter',
                  displayUnits: Units.UnitNames['cells/milliliter']
                }
              );
              break;
            }
            case 'trypan_blue': {
              // stained
              measurements.push(
                {
                  label: `Dead (${label})`,
                  type: `labeled_${label}_dead`,
                  dataUnits: 'cells/milliliter',
                  displayUnits: Units.UnitNames['cells/milliliter']
                }
              );

              // unstained
              measurements.push(
                {
                  label: `Alive (${label})`,
                  type: `unlabeled_${label}_alive`,
                  dataUnits: 'cells/milliliter',
                  displayUnits: Units.UnitNames['cells/milliliter']
                }
              );
              break;
            }
            default: {
              // stained
              measurements.push(
                {
                  label: 'Labeled',
                  type: `labeled_${label}`,
                  dataUnits: 'cells/milliliter',
                  displayUnits: Units.UnitNames['cells/milliliter']
                }
              );

              // unstained
              measurements.push(
                {
                  label: 'Unlabeled',
                  type: `unlabeled_${label}`,
                  dataUnits: 'cells/milliliter',
                  displayUnits: Units.UnitNames['cells/milliliter']
                }
              );
            }
          }
        });

        return measurements;
      }
      case 'concentration':
        switch (this.props.instruction.getIn(['operation', 'measurement'])) {
          case 'protein':
            return [
              {
                label: 'Concentration',
                type: 'concentration',
                dataUnits: 'milligrams/milliliter',
                displayUnits: Units.UnitNames['milligrams/milliliter']
              }
            ];
          case 'DNA':
            return [
              {
                label: 'Concentration',
                type: 'concentration',
                dataUnits: 'nanograms/microliter',
                displayUnits: Units.UnitNames['nanograms/microliter']
              },
              {
                label: 'Quality Score',
                type: 'qualityScore',
                dataUnits: 'A260/A280',
                displayUnits: Units.UnitNames['A260/A280'],
                validRange: {
                  min: 1.7, max: 1.9
                }
              }
            ];
          case 'RNA':
            return [
              {
                label: 'Concentration',
                type: 'concentration',
                dataUnits: 'nanograms/microliter',
                displayUnits: Units.UnitNames['nanograms/microliter']
              },
              {
                label: 'Quality Score',
                type: 'qualityScore',
                dataUnits: 'A260/A280',
                displayUnits: Units.UnitNames['A260/A280'],
                validRange: {
                  min: 1.9, max: 2.1
                }
              }
            ];
          default: {
            const message = `Measurement type "${
              this.props.instruction.getIn(['operation', 'measurement'])
            }" is not one of "Protein", "DNA", or "RNA".`;
            console.warn(message);
            NotificationActions.createNotification({
              text: message,
              isError: true
            });
            return [];
          }
        }
      case 'volume':
        return [
          { type: 'volume', dataUnits: 'microliter', displayUnits: Units.UnitNames.microliter }
        ];
      case 'mass':
        return [
          { type: 'mass', dataUnits: 'gram', displayUnits: Units.UnitNames.gram }
        ];
      default:
        return undefined;
    }
  }

  /**
   * Event handler when a CSV file has been uploaded. This method is responsible for coordinating
   * parsing the data, validating the format, displaying any errors that occured, and ultimately
   * populating the form
   */
  onFileAdded(files) {
    const file = files[0];
    this.handleFile(file);
  }

  handleFile(file) {
    const uploadFile = file.file;
    const options = {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors.length > 0) {
          const updatedFile = { ...file, status: 'fail', file: file.file };
          this.setState({ csvParsingErrors: errors, loadedDataFromCSV: false, file: updatedFile });
        } else {
          this.importFromCSV(data);
          const updatedFile = { ...file, status: 'success', file: file.file };
          this.setState({ csvParsingErrors: [], loadedDataFromCSV: true, file: updatedFile });
        }
      }
    };

    Papa.parse(uploadFile, options);
  }

  abortUpload() {
    this.setState(this.initialState());
  }

  onRetry() {
    const file = [...this.state.file];
    this.handleFile(file);
  }

  getInputValues(refName, well) {
    let values;
    if (this.isAliquotMeasure()) {
      // Fetch values from path [refname, well, measurement_type]
      values = this.measurements().map((measurement) => {
        return valueFromTyped(this.state.inputs[refName][well][measurement.type]);
      });
    } else {
      // Fetch values from path [refname, measurement_type]
      values = this.measurements().map((measurement) => {
        return valueFromTyped(this.state.inputs[refName][measurement.type]);
      });
    }

    return values;
  }

  render() {
    return (
      <SinglePaneModal
        title={this.props.title}
        modalId={this.props.modalId}
        acceptConfirm="Some wells have missing or non-numeric data. Submit anyway?"
        shouldConfirm={this.shouldConfirm}
        closeOnClickOut={this.props.closeOnClickOut}
        onAccept={this.onSubmit}
        modalSize="xlg"
        onDismissed={() => this.setState(this.initialState())}
      >
        <div className="tx-stack tx-stack--xlg measure-data-modal">
          {this.supportsCSVUpload() && (
            <div
              className="tx-stack tx-stack--sm measure-data-modal__header"
            >
              {/* Top level alert if major issue parsing CSV upload */}

              <If condition={this.state.csvParsingErrors.length > 0}>
                <div id="danger" className="alert alert-danger" role="alert">
                  <h4 className="alert-heading">There were one or more errors parsing your CSV upload.</h4>
                  <p>Please check that the file you uploaded is a valid CSV file.</p>
                </div>
              </If>

              <If condition={this.state.loadedDataFromCSV}>
                <div id="success" className="alert alert-success" role="alert">
                  <h4 className="alert-heading">Successfully Imported Data</h4>
                  <p>We sucessfully populated the form with data from your CSV upload.</p>
                </div>
              </If>
              <div className="measure-data-modal__instructions row">
                <div className="measure-data-modal__instruction">
                  <h3>Want to fill in a spreadsheet and upload later?</h3>
                  <Button
                    type="info"
                    size="medium"
                    download={`${this.props.instruction.get('id')}_measure_data_template.csv`}
                    to={`data:text/plain;charset=utf-8,${this.getCSVTemplate()}`}
                    tagLink
                    icon="fa fa-download"
                  >Download The Template
                  </Button>
                </div>
                <div className="measure-data-modal__transition">
                  <i className="fal fa-arrow-down" />
                </div>
                <div className="measure-data-modal__instruction">
                  <h3>{"When you're finished, upload the template."}</h3>
                  <div className="measure-data-modal__uploader">
                    <DragDropFilePicker
                      onDrop={this.onFileAdded}
                      abortUpload={this.abortUpload}
                      retryUpload={this.onRetry}
                      multiple={false}
                      files={this.state.file ? [this.state.file] : []}
                      accept=".csv"
                      size="auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <hr />
          {
            _.map(this.state.inputs, (wells, refName) => {
              const container = containerForRef(refName, this.props.run);

              return (
                <div className="measure-group" key={refName}>
                  <div className="measure-group__header">
                    <h3>{container.label !== undefined ? container.label : refName}</h3>
                    <span className="tx-inline tx-inline--xxs">
                      <i className="fa fa-barcode-read" />
                      <p className="measure-group__barcode">{container.barcode || 'No Barcode'}</p>
                    </span>
                  </div>
                  <div className="measure-group__measure-objects">
                    <div className="measure-group__column-headers">
                      {this.measurements().map((measurement, index) => {
                        return (
                          <div
                            className="measure-group__column-header"
                            key={`${measurement.label}-${index}`}
                          >
                            <h4>{measurement.label}</h4>
                          </div>
                        );
                      })}
                    </div>
                    <Choose>
                      <When condition={this.isAliquotMeasure()}>
                        {
                          _.map(wells, (wellData, well) => {
                            return (
                              <MeasureData
                                key={well}
                                refName={refName}
                                well={well}
                                values={this.getInputValues(refName, well)}
                                measurements={this.measurements()}
                                onInputChanged={this.onInputChanged}
                                loadedDataFromCSV={this.state.loadedDataFromCSV}
                              />
                            );
                          })
                        }
                      </When>
                      <Otherwise>
                        <MeasureData
                          refName={refName}
                          values={this.getInputValues(refName)}
                          measurements={this.measurements()}
                          onInputChanged={this.onInputChanged}
                          loadedDataFromCSV={this.state.loadedDataFromCSV}
                        />
                      </Otherwise>
                    </Choose>
                  </div>
                </div>
              );
            })
          }
        </div>
      </SinglePaneModal>
    );
  }

}

export default MeasureDataModal;
