import classNames from 'classnames';
import Immutable  from 'immutable';
import _          from 'lodash';
import Papa       from 'papaparse';
import PropTypes  from 'prop-types';
import React      from 'react';

import Manifest                 from 'main/util/Manifest';
import AliquotActions           from 'main/actions/AliquotActions';
import ContainerStore           from 'main/stores/ContainerStore';
import ThermocycleParameters    from 'main/components/thermocycle/ThermocycleParameters';
import ContainerComposition     from 'main/pages/ContainerPage/ContainerComposition';
import {
  AliquotSelectInput,
  AliquotsSelectInput,
  ContainerSelectInput,
  ContainersSelectInput
}                               from 'main/inventory/selector/inputs';
import {
  Tooltip,
  Select,
  LabeledInput,
  HelpIcon,
  Button,
  InputWithUnits,
  TextInput,
  MultiSelect
} from '@transcriptic/amino';
import CompoundInput           from 'main/components/Compounds/CompoundInput';

class CSVFileUpload extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.clearFile = this.clearFile.bind(this);
    this.onCSVFileChosen = this.onCSVFileChosen.bind(this);

    this.state = {
      csv_data: undefined,
      fileName: undefined,
      incorrectFormat: undefined,
      uploading: false
    };
  }

  onCSVFileChosen(e) {
    this.setState({
      uploading: true
    });

    const fileInput = e.target.files[0];
    const reader = new FileReader();
    reader.readAsText(fileInput);

    reader.onload = () => {
      try {
        const csv = Papa.parse(reader.result, {
          skipEmptyLines: true,
          header: true
        });

        // trim all whitespace from the csv values
        let csvData = csv.data.map(row =>
          _.mapValues(row, value => value.trim())
        );

        // remove lines where all fields are empty
        csvData = csvData.filter((row) => {
          const fields = _.values(row);
          return _.some(fields, field => !_.isEmpty(field));
        });

        // validate header names
        Object.keys(csvData[0]).forEach((header) => {
          if (
            !Array.from(this.props.template.header).includes(header) &&
            this.props.template.header.length > 0
          ) {
            this.setState({
              incorrectFormat: true
            });
          }
        });

        if (this.shouldValidateColTypes()) {
          if (this.isValidCSVTableData(csvData)) {
            csvData = this.transformCSVData(csvData);
          } else {
            this.setState({
              incorrectFormat: true
            });
          }
        }

        this.props.onChange(csvData, fileInput);
        this.setState({
          fileName: fileInput.name,
          uploading: false
        });
      } catch (error) {
        alert(error.message);
      }
    };
  }

  clearFile() {
    this.setState({
      fileName: undefined,
      incorrectFormat: undefined
    });

    if (this.props.onChange) {
      this.props.onChange(undefined, undefined);
    }
  }

  dataHref() {
    const data = {
      fields: this.props.template.header,
      data: this.props.template.rows
    };

    const payload = Papa.unparse(data);

    return `data:txt/csv,${encodeURIComponent(payload)}`;
  }

  shouldValidateColTypes() {
    // validate column types if the template specifies them.
    return this.props.template.col_type;
  }

  correctAliquotFormat(value) {
    return value.match(/^ct(\w{12})\/(\d{1,4})$/i);
  }

  correctContainerFormat(value) {
    return value.match(/^ct(\w{12})$/i);
  }

  headerToType() {
    const headerColTypeMap = {};

    for (let index = 0; index < this.props.template.header.length; index += 1) {
      const header = this.props.template.header[index];
      headerColTypeMap[header] = this.props.template.col_type[index];
    }

    return headerColTypeMap;
  }

  isValidCSVTableData(csvData) {
    const headerColTypeMap = this.headerToType();

    return _.every(_.range(0, csvData.length), (index) => {
      const row = csvData[index];

      return _.every(Object.keys(row), (header) => {
        const value = row[header];
        switch (headerColTypeMap[header]) {
          case 'integer':
            if (isNaN(parseInt(value, 10))) {
              return false;
            }
            break;
          case 'decimal':
            if (isNaN(parseFloat(value))) {
              return false;
            }
            break;
          case 'aliquot':
            if (!this.correctAliquotFormat(value)) {
              return false;
            }
            break;
          case 'container':
            if (!this.correctContainerFormat(value)) {
              return false;
            }
            break;
          default:
            return true;
        }

        return true;
      });
    });
  }

  transformCSVData(csvData) {
    const headerColTypeMap = this.headerToType();

    return csvData.map(row =>
      _.mapValues(row, (value, header) => {
        switch (headerColTypeMap[header]) {
          case 'integer':
            return parseInt(value, 10);
          case 'decimal':
            return parseFloat(value);
          default:
            return value;
        }
      })
    );
  }

  render() {
    return (
      <div>
        <div className="csv-selector">
          <div className="bubbled-segmented-input">
            <div className="file-upload">
              <Choose>
                <When condition={this.state.uploading}>
                  <div className="btn btn-default btn-file">Uploading...</div>
                </When>
                <When condition={this.state.fileName}>
                  <div className="file-attached">
                    <div className="unattach">
                      <a onClick={this.clearFile}>
                        <i className="fa fa-times" />
                      </a>
                    </div>
                    <div className="filename">
                      <a target="_blank" rel="noopener noreferrer">
                        <i className="fa fa-paperclip" /> {this.state.fileName}
                      </a>
                    </div>
                  </div>
                </When>
                <Otherwise>
                  <div className="btn btn-default btn-file">
                    {this.props.uploadLabel}
                    <input
                      className="btn-file"
                      type="file"
                      accept="text/csv"
                      onChange={this.onCSVFileChosen}
                    />{' '}
                  </div>
                </Otherwise>
              </Choose>
            </div>
          </div>
        </div>
        <div className="csv-text">
          <Choose>
            <When condition={this.state.incorrectFormat}>
              <div className="protocol-input validation-group has-error">
                <div className="help-block">
                  {` That's not what we were expecting. Please make sure
                  you're using `}
                  <a href={this.dataHref()} download="template.csv">
                    this template.
                  </a>
                </div>
              </div>
            </When>
            <Otherwise>
              <div>
                {' '}Need the correct format? Use{' '}
                <a href={this.dataHref()} download="template.csv">
                  this template.
                </a>
              </div>
            </Otherwise>
          </Choose>
        </div>
      </div>
    );
  }
}

CSVFileUpload.defaultProps = {
  uploadLabel: 'Upload a CSV',
  value: [],
  template: {
    header: [],
    rows: [[]]
  }
};

CSVFileUpload.propTypes = {
  onChange: PropTypes.func.isRequired,
  template: PropTypes.shape({
    header: PropTypes.array.isRequired,
    keys: PropTypes.array,
    col_type: PropTypes.array,
    rows: PropTypes.array.isRequired
  }),
  uploadLabel: PropTypes.string
};

class AliquotGroups extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.csvFileChosen = this.csvFileChosen.bind(this);
    this.state = {
      loadingCSV: false
    };
  }

  groupChanged(newGroup, oldGroup) {
    this.props.onChange(
      this.props.value.map((g) => {
        if (g === oldGroup) {
          return newGroup;
        } else {
          return g;
        }
      })
    );
  }

  remove(g) {
    this.props.onChange(this.props.value.filter(og => og !== g));
  }

  csvFileChosen(e) {
    this.setState({
      loadingCSV: true
    });
    const reader = new FileReader();
    reader.readAsText(e.target.files[0]);

    reader.onload = () => {
      const csv = Papa.parse(reader.result, {
        skipEmptyLines: true
      });

      const headersRemoved = csv.data.slice();
      headersRemoved.shift();

      const names = _.flattenDeep(headersRemoved).filter(name => Boolean(name));

      AliquotActions.find_by_names(names)
        .always(() =>
          this.setState({
            loadingCSV: false
          })
        )
        .done((aliquots) => {
          try {
            const aliquotGroups = csv.data.slice(1).map((row) => {
              return row.map((name) => {
                const aq = aliquots.find(aliquot => aliquot.name === name);

                if (!aq) {
                  throw new Error(
                    `couldn't find aliquot with name ${name}`
                  );
                }

                return aq;
              });
            });

            const containers = {};

            _.flattenDeep(aliquotGroups).forEach((aq) => {
              const c =
                containers[aq.container_id] ||
                (containers[aq.container_id] = _.extend({}, aq.container));
              (c.aliquots || (c.aliquots = {}))[aq.well_idx] = aq;
            });

            Object.values(containers).forEach((value) => {
              value.aliquots = _.values(value.aliquots);
            });

            ContainerStore._receiveData(_.values(containers));

            const wellGroups = Array.from(aliquotGroups).map(group =>
              group.map(aq => ({
                containerId: aq.container_id,
                wellIndex: aq.well_idx
              }))
            );

            this.props.onChange(
              this.props.value.filter(x => x.length).concat(wellGroups)
            );
          } catch (error) {
            alert(error.message);
          }
        });
    };
  }

  render() {
    return (
      <div className="aliquot-groups">
        {this.props.value.map((aliquots, index) => {
          return (
            <div key={`aliquots-select-input-${index}`} className="group">
              <AliquotsSelectInput
                aliquots={aliquots}
                onAliquotsSelected={newAliquots => this.groupChanged(newAliquots, aliquots)}
                test_mode={this.props.test_mode}
              />
              <Button type="primary" link icon="fa fa-minus" onClick={() => this.remove(aliquots)} />
            </div>
          );
        })}
        <div style={{ textAlign: 'right' }}>
          <a className="btn btn-link btn-file" disabled={this.state.loadingCSV}>
            <Choose>
              <When condition={this.state.loadingCSV}>Loading...</When>
              <Otherwise>
                <div>
                  From CSV<input
                    type="file"
                    accept="text/csv"
                    onChange={this.csvFileChosen}
                  />
                </div>
              </Otherwise>
            </Choose>
          </a>
          {' '}
          <Button
            type="primary"
            link
            icon="fa fa-plus"
            onClick={() => this.props.onChange(this.props.value.concat([[]]))}
          />
        </div>
      </div>
    );
  }
}

AliquotGroups.defaultProps = {
  value: [[]]
};

AliquotGroups.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.array,
  test_mode: PropTypes.bool
};

function InfoHeader(props) {
  if (props.isRoot) {
    return (
      <h2 className="tx-stack__block tx-stack__block--xxs tx-type--secondary">
        {props.children}
      </h2>
    );
  }

  return (
    <h3 className="tx-type--secondary">
      {props.children}
    </h3>
  );
}

InfoHeader.propTypes = {
  isRoot: PropTypes.bool,
  children: PropTypes.node
};

const getContainerList = inputTypes => {
  return _.keys(inputTypes).filter(key => inputTypes[key].type === 'container' && inputTypes[key].show_compounds);
};

class Group extends React.Component {
  render() {
    const { showErrors, typeDesc, value, updateValue, test_mode, csvValue } = this.props;
    return (
      <div className="section tx-stack tx-stack--sm" key={this.props.name}>
        <InfoHeader isRoot={this.props.isRoot}>
          <span className="tx-inline tx-inline--xxxs">
            <span>
              {this.props.typeDesc.label || this.props.name}
            </span>
            <If condition={this.props.typeDesc.description}>
              <Tooltip
                title={this.props.typeDesc.description}
                placement="left"
                className="tx-inline__item--xxs"
              >
                <HelpIcon />
              </Tooltip>
            </If>
          </span>
        </InfoHeader>
        <div>
          <LaunchRunInputs
            showErrors={showErrors}
            inputTypes={typeDesc.inputs}
            inputs={value}
            onChange={updateValue}
            isRoot={false}
            test_mode={test_mode}
            csvInputs={csvValue}
            organizationId={this.props.organizationId}
            labId={this.props.labId}
          />
          {
            getContainerList(typeDesc.inputs).map(key =>
              value[key] &&  <ContainerComposition id={value[key]} key={value[key]} />
            )
          }
        </div>
      </div>
    );
  }
}

Group.propTypes = {
  typeDesc: PropTypes.object.isRequired,
  showErrors: PropTypes.bool.isRequired,
  isRoot: PropTypes.bool,
  value: PropTypes.object.isRequired,
  updateValue: PropTypes.func.isRequired,
  test_mode: PropTypes.bool,
  name: PropTypes.string,
  csvValue: PropTypes.object.isRequired,
  organizationId: PropTypes.string,
  labId: PropTypes.string
};

class MultiGroup extends React.Component {
  remove(index) {
    this.props.onChange(
      this.props.inputs.filter((v, i) => i !== index),
      this.props.csvInputs.filter((v, i) => i !== index)
    );
  }

  update(index, newValue, csvInput) {
    this.props.onChange(
      this.props.inputs.map((v, i) => {
        if (i === index) {
          return newValue;
        } else {
          return v;
        }
      }),

      this.props.csvInputs.map((v, i) => {
        if (i === index) {
          return csvInput;
        } else {
          return v;
        }
      })
    );
  }

  addGroup() {
    const val = Manifest.defaults(this.props.inputTypes).toJS();

    const csvInputs = Manifest.csvInputs(this.props.inputTypes);
    const csvVal = Manifest.defaults(csvInputs, true);

    this.props.onChange(this.props.inputs.concat([val]), this.props.csvInputs.concat([csvVal]));
  }

  render() {
    const { inputTypes, showErrors, test_mode, csvInputs } = this.props;
    return (
      <div className="multi-group">
        <div className="section">
          <InfoHeader isRoot={this.props.isRoot}>
            <span className="tx-line">
              {this.props.title}
              <If condition={this.props.description}>
                <Tooltip
                  title={this.props.description}
                  placement="left"
                  className="tx-inline__item--xxs"
                >
                  <HelpIcon />
                </Tooltip>
              </If>
            </span>
          </InfoHeader>
          {this.props.inputs.map((inputs, i) => {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <div className="nested-group" key={i}>
                <div className="actions">
                  <Choose>
                    <When condition={this.props.inputs.length > 1}>
                      <a onClick={() => this.remove(i)}>
                        <i className="fa fa-trash-alt" />
                      </a>
                    </When>
                    <Otherwise>
                      <a>
                        <i className="fa" />
                      </a>
                    </Otherwise>
                  </Choose>
                </div>
                <div className="parameters">
                  <LaunchRunInputs
                    showErrors={showErrors}
                    inputTypes={inputTypes}
                    inputs={inputs}
                    onChange={(v, csvInput) => this.update(i, v, csvInput)}
                    isRoot={false}
                    test_mode={test_mode}
                    csvInputs={csvInputs[i]}
                    organizationId={this.props.organizationId}
                    labId={this.props.labId}
                  />
                  {
                    getContainerList(inputTypes).map(key =>
                      inputs[key] &&  <ContainerComposition id={inputs[key]} key={inputs[key]} />
                    )
                  }
                </div>
              </div>
            );
          })}
        </div>
        <a
          className="add-group"
          onClick={() => this.addGroup()}
        >
          {`Add ${this.props.title}`}
        </a>
      </div>
    );
  }
}
MultiGroup.defaultProps = {
  csvInputs: []
};

MultiGroup.propTypes = {
  title: PropTypes.string.isRequired,
  inputTypes: PropTypes.object.isRequired,
  inputs: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  showErrors: PropTypes.bool,
  isRoot: PropTypes.bool,
  description: PropTypes.string,
  test_mode: PropTypes.bool,
  csvInputs: PropTypes.array.isRequired,
  organizationId: PropTypes.string,
  labId: PropTypes.string
};

class LaunchRunInputs extends React.Component {

  labeledInput(name, typeDesc, children) {
    return (
      <LabeledInput
        key={name}
        label={typeDesc.label || name}
        tip={typeDesc.description}
        error={this.errors.get(name)}
        showDelay={250}
        hideDelay={250}
        disableFormatLabel
      >
        {children}
      </LabeledInput>
    );
  }

  inputFor(typeDesc, name) {
    const value = this.props.inputs[name];
    const csvValue = this.props.csvInputs[name];
    switch (typeDesc.type) {
      case 'aliquot':
        return this.labeledInput(
          name,
          typeDesc,
          <div className="input-wide">
            <AliquotSelectInput
              aliquot={value}
              onAliquotSelected={aliquot => this.updateValue(name, aliquot)}
              test_mode={this.props.test_mode}
              organizationId={this.props.organizationId}
              labId={this.props.labId}
            />
          </div>
        );
      case 'aliquot+':
        return this.labeledInput(
          name,
          typeDesc,
          <div className="input-wide">
            <AliquotsSelectInput
              aliquots={value}
              onAliquotsSelected={aliquots => this.updateValue(name, aliquots)}
              test_mode={this.props.test_mode}
              organizationId={this.props.organizationId}
              labId={this.props.labId}
            />
          </div>
        );
      case 'aliquot++':
        return this.labeledInput(
          name,
          typeDesc,
          <AliquotGroups
            value={value}
            onChange={v => this.updateValue(name, v)}
            test_mode={this.props.test_mode}
            organizationId={this.props.organizationId}
            labId={this.props.labId}
          />
        );
      case 'container':
        return this.labeledInput(
          name,
          typeDesc,
          <div className="tx-stack tx-stack--xlg">
            <div className="input-wide">
              <ContainerSelectInput
                containerId={value}
                onContainerSelected={containerId =>
                  this.updateValue(name, containerId)}
                test_mode={this.props.test_mode}
                organizationId={this.props.organizationId}
                labId={this.props.labId}
              />
            </div>
            <If condition={this.props.isRoot && typeDesc.show_compounds}>
              <ContainerComposition id={value} />
            </If>
          </div>
        );
      case 'container+':
        return this.labeledInput(
          name,
          typeDesc,
          <div className="input-wide">
            <ContainersSelectInput
              containers={Immutable.List(value)}
              onContainersSelected={containers =>
                this.updateValue(name, containers)}
              test_mode={this.props.test_mode}
              organizationId={this.props.organizationId}
              labId={this.props.labId}
            />
          </div>
        );
      case 'csv':
      case 'csv-table':
        return this.labeledInput(
          name,
          typeDesc,
          <div className="input-wide csv-input">
            <CSVFileUpload
              template={typeDesc.template}
              uploadLabel={typeDesc.template.label}
              value={value}
              onChange={(v, csvInput) => this.updateValue(name, v, csvInput)}
            />
          </div>
        );
      case 'bool':
        return this.labeledInput(
          name,
          typeDesc,
          <div className="checkbox">
            <label htmlFor="boolCheckbox">
              <input
                id="boolCheckbox"
                type="checkbox"
                checked={value}
                onChange={e => this.updateValue(name, e.target.checked)}
              />
            </label>
          </div>
        );
      case 'group':
        return (
          <Group
            key={name}
            name={name}
            isRoot={this.props.isRoot}
            typeDesc={typeDesc}
            showErrors={this.props.showErrors}
            value={value}
            updateValue={(v, csvInput) => this.updateValue(name, v, csvInput)}
            test_mode={this.props.test_mode}
            csvValue={csvValue}
            organizationId={this.props.organizationId}
            labId={this.props.labId}
          />
        );

      case 'group+':
        return (
          <MultiGroup
            key={name}
            title={typeDesc.label ? typeDesc.label : name}
            description={typeDesc.description}
            showErrors={this.props.showErrors}
            inputTypes={typeDesc.inputs}
            inputs={value}
            onChange={(v, csvInput) => this.updateValue(name, v, csvInput)}
            isRoot={this.props.isRoot}
            test_mode={this.props.test_mode}
            csvInputs={csvValue}
            organizationId={this.props.organizationId}
            labId={this.props.labId}
          />
        );

      case 'group-choice': {
        const selected_option = _.find(
          typeDesc.options,
          x => x.value === (value ? value.value : undefined)
        );

        const error = this.errors.get(name);
        const subinputs = selected_option ? selected_option.inputs : undefined;

        return (
          <div className="section tx-stack" key={name}>
            <h2 className="tx-stack__block tx-stack__block--sm tx-inline tx-type--secondary">
              <span className="tx-inline__item--xxs">
                <Choose>
                  <When condition={typeDesc.label}>
                    {typeDesc.label}
                  </When>
                  <Otherwise>
                    {name}
                  </Otherwise>
                </Choose>
              </span>
              <If condition={typeDesc.description}>
                <Tooltip
                  title={typeDesc.description}
                  placement="left"
                  className="tx-inline__item--xxs"
                >
                  <HelpIcon />
                </Tooltip>
              </If>
            </h2>
            <div
              className={classNames({
                'has-error': typeof error === 'string',
                'validation-group': true
              })}
              style={{
                marginBottom: 20
              }}
            >
              <Select
                options={typeDesc.options}
                value={value.value}
                nullable
                onChange={(e) => {
                  this.updateValue(name, {
                    value: e.target.value,
                    inputs: value.inputs
                  }, csvValue && {
                    inputs: csvValue.inputs
                  });
                }}
              />
              <If condition={typeof error === 'string'}>
                <div className="help-block">
                  {error}
                </div>
              </If>
            </div>
            <If condition={subinputs}>
              <LaunchRunInputs
                showErrors={this.props.showErrors}
                inputTypes={subinputs}
                inputs={value.inputs[value.value]}
                csvInputs={csvValue && csvValue.inputs[value.value]}
                isRoot={false}
                test_mode={this.props.test_mode}
                onChange={(v, csvInput) => {
                  this.updateValue(name, {
                    value: value.value,
                    inputs: _.extend({}, value.inputs, {
                      [value.value]: v
                    })
                  }, csvValue && {
                    inputs: _.extend({}, csvValue.inputs, (csvInput && {
                      [value.value]: csvInput
                    }))
                  });
                }}
                organizationId={this.props.organizationId}
                labId={this.props.labId}
              />
            </If>
          </div>
        );
      }
      case 'choice':
        return this.labeledInput(
          name,
          typeDesc,
          <div className="input-wide">
            <Select
              options={typeDesc.options}
              value={value}
              nullable
              onChange={(e) => {
                this.updateValue(name, e.target.value);
              }}
            />
          </div>
        );
      case 'multi-select': {
        return this.labeledInput(
          name,
          typeDesc,
          <MultiSelect
            value={value}
            onChange={(e) => {
              this.updateValue(name, e.target.value);
            }}
            options={typeDesc.options}
          />
        );
      }
      case 'thermocycle':
        return this.labeledInput(
          name,
          typeDesc,
          <div>
            <ThermocycleParameters
              mix={typeDesc.label && typeDesc.label.split ? typeDesc.label.split(' ')[0] : undefined}
              showErrors={this.props.showErrors}
              groups={value}
              onChange={v => this.updateValue(name, v)}
            />
          </div>
        );
      case 'amount_concentration':
      case 'frequency':
      case 'length':
      case 'mass':
      case 'mass_concentration':
      case 'temperature':
      case 'time':
      case 'volume':
        return this.labeledInput(
          name,
          typeDesc,
          <div className="input">
            <InputWithUnits
              dimension={typeDesc.type}
              value={value}
              onChange={e => this.updateValue(name, e.target.value)}
            />
          </div>
        );
      case 'integer':
      case 'decimal':
        return this.labeledInput(
          name,
          typeDesc,
          <div className="input">
            <TextInput
              placeholder={`(${typeDesc.type})`}
              value={value}
              onChange={e => this.updateValue(name, e.target.value)}
            />
          </div>
        );
      case 'string':
        return this.labeledInput(
          name,
          typeDesc,
          <div className="input-wide">
            <TextInput
              value={value}
              onChange={e => this.updateValue(name, e.target.value)}
            />
          </div>
        );
      case 'compound':
        return (
          <CompoundInput
            key={name}
            message={typeDesc.message || 'You haven\'t selected a compound yet'}
            compounds={value}
            isSingleCompound
            onCompoundsSelected={compound => {
              this.updateValue(name, compound);
            }}
          />
        );
      case 'compound+':
        return (
          <CompoundInput
            key={name}
            message={typeDesc.message || 'You haven\'t selected a compound yet'}
            compounds={Immutable.List(value)}
            onCompoundsSelected={compounds => {
              this.updateValue(name, compounds);
            }}
          />
        );
      default:
        return undefined;
    }
  }

  updateValue(name, v, v2) {
    const { inputs, csvInputs } = this.props;
    let opts, csvOpts, csvUploads;
    (opts = {})[name] = v;

    if (_.has(csvInputs, name)) {
      (csvOpts = {})[name] = v2;
      csvUploads = _.extend(_.clone(csvInputs), csvOpts);
    }

    this.props.onChange(_.extend(_.clone(inputs), opts), csvUploads);
  }

  render() {
    if (this.props.showErrors) {
      this.errors = Manifest.errors(this.props.inputTypes, this.props.inputs);
    } else {
      this.errors = Immutable.Map();
    }

    return (
      <div className="launch-run">
        {_.map(this.props.inputTypes, (typeDesc, name) => {
          return this.inputFor(Manifest.normalizeTypeDesc(typeDesc).toJS(), name);
        })}
      </div>
    );
  }
}

LaunchRunInputs.defaultProps = {
  showErrors: false,
  isRoot: true,
  test_mode: false,
  csvInputs: {}
};

LaunchRunInputs.propTypes = {
  inputTypes: PropTypes.object.isRequired,
  inputs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  showErrors: PropTypes.bool,
  isRoot: PropTypes.bool,
  test_mode: PropTypes.bool,
  csvInputs: PropTypes.object,
  organizationId: PropTypes.string,
  labId: PropTypes.string
};

export default LaunchRunInputs;
export { Group };
