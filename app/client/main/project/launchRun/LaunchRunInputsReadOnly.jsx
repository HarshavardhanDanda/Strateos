import classNames from 'classnames';
import Immutable  from 'immutable';
import _          from 'lodash';
import Papa       from 'papaparse';
import PropTypes  from 'prop-types';
import React      from 'react';
import UploadAPI  from 'main/api/UploadAPI';

import Manifest                 from 'main/util/Manifest';
import ThermocycleParametersReadOnly    from 'main/components/thermocycle/ThermocycleParametersReadOnly';
import {
  Tooltip,
  Select,
  LabeledInput,
  HelpIcon,
  InputWithUnits,
  Spinner
} from '@transcriptic/amino';

import CompoundInput from 'main/components/Compounds/CompoundInput';

class CSVFileDownload extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      isLoading: true
    };
  }

  componentDidMount() {
    const { value } = this.props;

    if (_.isArray(value)) {
      return;
    }

    value && UploadAPI.get(value).done(resp =>
      this.setState({
        isLoading: false,
        url: resp.data.attributes.url,
        name: resp.data.attributes.file_name
      })
    );
  }

  dataHref() {
    const payload = Papa.unparse(this.props.value);
    return `data:txt/csv,${encodeURIComponent(payload)}`;
  }

  render() {
    const { isLoading, url, name } = this.state;
    if (_.isArray(this.props.value)) {
      // download csv from data instead of s3
      return (
        <a href={this.dataHref()} download={name}>
          {this.props.downloadLabel}
        </a>
      );
    } else {
      return isLoading ? <Spinner /> : <a href={url} download={name}>{this.props.downloadLabel}</a>;
    }
  }
}

CSVFileDownload.defaultProps = {
  downloadLabel: 'Download'
};

CSVFileDownload.propTypes = {
  fileName: PropTypes.string,
  downloadLabel: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.string
  ]).isRequired
};

class AliquotGroups extends React.Component {

  render() {
    return (
      <div className="aliquot-groups">
        {this.props.value.map((aliquots, index) => {
          return (
            <div  key={`aliquots-key-${index}`}className="group">
              <div className="bubbled-segmented-input" style={{ border: 'none' }}>
                <div className="segments">
                  {aliquots.map(val => <div key={val} className="segment">{val}</div>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

AliquotGroups.defaultProps = {
  value: [[]]
};

AliquotGroups.propTypes = {
  value: PropTypes.array
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

class Group extends React.Component {
  render() {
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
          <LaunchRunInputsReadOnly
            inputTypes={this.props.typeDesc.inputs}
            inputs={this.props.value}
            isRoot={false}
            organizationId={this.props.organizationId}
          />
        </div>
      </div>
    );
  }
}

Group.propTypes = {
  typeDesc: PropTypes.object.isRequired,
  value: PropTypes.object.isRequired,
  name: PropTypes.string,
  isRoot: PropTypes.bool,
  organizationId: PropTypes.string
};

class MultiGroup extends React.Component {

  render() {
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
                <div className="parameters">
                  <LaunchRunInputsReadOnly
                    inputTypes={this.props.inputTypes}
                    inputs={inputs}
                    isRoot={false}
                    organizationId={this.props.organizationId}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

MultiGroup.propTypes = {
  title: PropTypes.string.isRequired,
  inputTypes: PropTypes.object.isRequired,
  inputs: PropTypes.array.isRequired,
  isRoot: PropTypes.bool,
  description: PropTypes.string,
  organizationId: PropTypes.string
};

class LaunchRunInputsReadOnly extends React.Component {
  labeledInput(name, typeDesc, children) {
    return (
      <LabeledInput
        key={name}
        label={typeDesc.label || name}
        tip={typeDesc.description}
        error={this.errors.get(name)}
        showDelay={250}
        hideDelay={250}
      >
        {children}
      </LabeledInput>
    );
  }

  inputFor(typeDesc, name) {
    let value = this.props.inputs[name];
    switch (typeDesc.type) {
      case 'aliquot':
        if (value == undefined) {
          value = 'No Aliquot';
        }
        return this.labeledInput(
          name,
          typeDesc,
          <div className="bubbled-segmented-input" style={{ border: 'none' }}>
            <div className="segments">
              <div className="segment">{value}</div>
            </div>
          </div>
        );
      case 'aliquot+':
        if (value == undefined) {
          value = ['No Aliquots'];
        }
        return this.labeledInput(
          name,
          typeDesc,
          <div className="bubbled-segmented-input" style={{ border: 'none' }}>
            <div className="segments">
              {value.map(val => <div key={val} className="segment">{val}</div>)}
            </div>
          </div>
        );
      case 'aliquot++':
        return this.labeledInput(
          name,
          typeDesc,
          <AliquotGroups
            value={value}
          />
        );
      case 'container':
        if (value == undefined) {
          value = 'No Container';
        }
        return this.labeledInput(
          name,
          typeDesc,
          <div className="bubbled-segmented-input" style={{ border: 'none' }}>
            <div className="segments">
              <div className="segment">{value}</div>
            </div>
          </div>
        );
      case 'container+':
        if (value == undefined) {
          value = ['No Containers'];
        }
        return this.labeledInput(
          name,
          typeDesc,
          <div className="bubbled-segmented-input" style={{ border: 'none' }}>
            <div className="segments">
              {value.map(val => <div key={val} className="segment">{val}</div>)}
            </div>
          </div>
        );
      case 'csv':
      case 'csv-table':
        return this.labeledInput(
          name,
          typeDesc,
          <Choose>
            <When condition={value}>
              <div className="input-wide csv-input">
                <CSVFileDownload
                  fileName={name}
                  value={value}
                />
              </div>
            </When>
            <Otherwise>
              <p>No CSV file was uploaded</p>
            </Otherwise>
          </Choose>
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
                disabled
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
            value={value}
            organizationId={this.props.organizationId}
          />
        );
      case 'group+':
        return (
          <MultiGroup
            key={name}
            title={typeDesc.label ? typeDesc.label : name}
            description={typeDesc.description}
            inputTypes={typeDesc.inputs}
            inputs={value}
            isRoot={this.props.isRoot}
            organizationId={this.props.organizationId}
          />
        );

      case 'group-choice': {
        const opt = value && value.value;
        const selected_option = _.find(typeDesc.options, x => x.value === opt);
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
                'validation-group': true
              })}
              style={{
                marginBottom: 20
              }}
            >
              <Select
                options={typeDesc.options}
                value={opt}
                disabled
              />
            </div>
            <If condition={subinputs}>
              <LaunchRunInputsReadOnly
                isRoot={false}
                inputTypes={subinputs}
                inputs={value.inputs[value.value]}
                organizationId={this.props.organizationId}
              />
            </If>
          </div>
        );
      }
      case 'choice':
        return this.labeledInput(
          name,
          typeDesc,
          <div className="input">
            <Select
              options={typeDesc.options}
              value={value}
              readOnly
            />
          </div>
        );
      case 'thermocycle':
        return this.labeledInput(
          name,
          typeDesc,
          <div>
            <ThermocycleParametersReadOnly
              mix={typeDesc.label && typeDesc.label.split ? typeDesc.label.split(' ')[0] : undefined}
              groups={value}
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
              name={name}
              dimension={typeDesc.type}
              value={value}
              disabled
              preserveUnit
            />
          </div>
        );
      case 'integer':
      case 'decimal':
        return this.labeledInput(
          name,
          typeDesc,
          <div className="input">
            <p>{value}</p>
          </div>
        );
      case 'string':
        return this.labeledInput(
          name,
          typeDesc,
          <div className="input-wide">
            <p>{value}</p>
          </div>
        );
      case 'compound':
      case 'compound+':
        return this.labeledInput(
          '',
          {},
          <CompoundInput compounds={value} organizationId={this.props.organizationId} readOnly />
        );
      default:
        return undefined;
    }
  }

  render() {
    this.errors = Immutable.Map();
    return (
      <div className="launch-run">
        {_.map(this.props.inputTypes, (typeDesc, name) => {
          return this.inputFor(Manifest.normalizeTypeDesc(typeDesc).toJS(), name);
        })}
      </div>
    );
  }
}

LaunchRunInputsReadOnly.defaultProps = {
  showErrors: false,
  isRoot: true
};

LaunchRunInputsReadOnly.propTypes = {
  inputTypes: PropTypes.object.isRequired,
  inputs: PropTypes.object.isRequired,
  isRoot: PropTypes.bool,
  organizationId: PropTypes.string
};

export default LaunchRunInputsReadOnly;
export { Group };
