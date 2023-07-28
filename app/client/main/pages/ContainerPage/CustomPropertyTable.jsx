import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import _ from 'lodash';
import { TableLayout } from '@transcriptic/amino';
import EditableProperty from 'main/components/EditableProperty';

import './CustomPropertyTable.scss';

export default class CustomPropertyTable extends React.Component {

  getConfigDefType(config) {
    return config.getIn(['config_definition', 'type']);
  }

  getLabel(config) {
    return config.getIn(['config_definition', 'label']);
  }

  getDefaultValue(config) {
    return config.getIn(['config_definition', 'default']);
  }

  getEditable(config) {
    const editableFlag = config.getIn(['config_definition', 'editable']);
    return (typeof editableFlag === 'string') ? (editableFlag === 'true') : editableFlag;
  }

  getValidationRegexp(config) {
    return config.getIn(['config_definition', 'validation_regexp']);
  }

  getOptions(config) {
    return config.getIn(['config_definition', 'options']).toJS();
  }

  renderHeader(headerColor) {
    const headerClassName = headerColor === '' ? null : `custom-property-header--${headerColor}`;
    return (
      <TableLayout.Header className={headerClassName}>
        <TableLayout.Row className="custom-property-header-row">
          <TableLayout.HeaderCell className="custom-property-header-row__column">
            Property
          </TableLayout.HeaderCell>
          <TableLayout.HeaderCell className="custom-property-header-row__column">
            Value
          </TableLayout.HeaderCell>
        </TableLayout.Row>
      </TableLayout.Header>
    );
  }

  renderCustomPropertyInputValue(config, customProp, includeEmptyOption, readOnly) {
    const value = customProp.get('value') ? customProp.get('value') : '';
    const inputType = this.getConfigDefType(config);
    const editable = readOnly !== undefined ? !readOnly : this.getEditable(config);
    switch (inputType) {
      case 'choice': {
        const availableOptions = this.getOptions(config);
        const options = _.isEmpty(availableOptions) || includeEmptyOption
          ? [{ name: '-', value: '' }, ...availableOptions]
          : _.uniqBy(availableOptions, 'name');

        return (
          <EditableProperty
            value={value}
            showInitialValue
            options={options}
            fullWidth
            editable={editable}
            disableFormatText
            keyName={config.get('id')}
            onSave={(value) => {
              return this.props.onSaveCustomProperty(config.get('key'), value, this.getConfigDefType(config));
            }}
          />
        );
      }
      case 'multi-choice': {
        const options = this.getOptions(config);
        return (
          <EditableProperty
            multiSelect
            value={value ? value.split(';') : []} // values are stored in semi-colon separated form in the BE
            showInitialValue
            options={options}
            fullWidth
            editable={editable}
            disableFormatText
            keyName={config.get('id')}
            onSave={(value) => {
              this.props.onSaveCustomProperty(config.get('key'), value.join(';'), this.getConfigDefType(config));
            }}
          />
        );
      }
      case 'integer':
      case 'decimal':
      case 'string': {
        return (
          <EditableProperty
            value={value}
            showInitialValue
            fullWidth
            editable={editable}
            disableFormatText
            keyName={config.get('id')}
            errorMsg={'Invalid value for ' + inputType}
            validationRegex={this.getValidationRegexp(config)}
            onSave={(value) => {
              this.props.onSaveCustomProperty(config.get('key'), value, this.getConfigDefType(config));
            }}
          />
        );
      }
      case 'boolean': {
        return (
          <EditableProperty
            renderAsBool
            value={value}
            showInitialValue
            fullWidth
            editable={editable}
            disableFormatText
            keyName={config.get('id')}
            errorMsg={'Invalid value for ' + inputType}
            validationRegex={this.getValidationRegexp(config)}
            onSave={(value) => {
              this.props.onSaveCustomProperty(config.get('key'), value, this.getConfigDefType(config));
            }}
          />
        );
      }
      default:
        return undefined;
    }
  }

  renderRow(config, customProp, index, includeEmptyOption, readOnly) {
    return (
      <TableLayout.Row key={'custom-property-row-' + config.get('id')} className="custom-property-row">
        <TableLayout.BodyCell>
          {this.getLabel(config)}
        </TableLayout.BodyCell>
        <TableLayout.BodyCell multiline>
          {this.renderCustomPropertyInputValue(config, customProp, includeEmptyOption, readOnly)}
        </TableLayout.BodyCell>
      </TableLayout.Row>
    );
  }

  render() {
    const { customPropertiesConfigs, customProperties, headerColor = '', includeEmptyOption  = true, readOnly } = this.props;

    return (
      <div className="custom-property">
        <TableLayout.Block toggleRowColor>
          {this.renderHeader(headerColor)}
          <TableLayout.Body>
            {customPropertiesConfigs.map((config, index) => {
              const customProp = customProperties.find((customProperty) => {
                return config.get('key') === customProperty.get('key');
              }) || Immutable.fromJS({ value: '' });
              return this.renderRow(config, customProp, index, includeEmptyOption, readOnly);
            })}
          </TableLayout.Body>
        </TableLayout.Block>
      </div>
    );
  }

}

CustomPropertyTable.propTypes = {
  customPropertiesConfigs: PropTypes.instanceOf(Immutable.List).isRequired,
  customProperties: PropTypes.instanceOf(Immutable.List).isRequired,
  onSaveCustomProperty: PropTypes.func.isRequired,
  headerColor: PropTypes.string,
  includeEmptyOption: PropTypes.bool,
  readOnly: PropTypes.bool
};
