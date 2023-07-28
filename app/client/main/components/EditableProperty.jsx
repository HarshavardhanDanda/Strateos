import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import _ from 'lodash';

import ajax from 'main/util/ajax';
import {
  Button,
  TextInput,
  InplaceInput,
  InputsController,
  Select,
  MultiSelect,
  Unit,
  TypeAheadInput,
  AddInplace,
  LabeledInput,
  RadioGroup,
  Radio
} from '@transcriptic/amino';
import NotificationActions from 'main/actions/NotificationActions';

const UPDATED_VALUE = 'updatedValueForm';
const UPDATED_VALUE_NAME = 'updatedNameForm';
const ADDED_VALUE = 'addedValueForm';

class EditableProperty extends React.Component {
  constructor(props) {
    super(props);

    this.state = this.getDefaultState();

    this.onChange = this.onChange.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.checkIllegalChars = this.checkIllegalChars.bind(this);
    this.onSaveNewProperty = this.onSaveNewProperty.bind(this);
  }

  getDefaultState() {
    return {
      isAdding: false,
      [ADDED_VALUE]: '',
      [UPDATED_VALUE]: this.props.showInitialValue ? this.props.value : '',
      [UPDATED_VALUE_NAME]: '',
      error: ''
    };
  }

  onChange(formValue = {}) {
    const { validationRegex, errorMsg } = this.props;
    let isValid = true;

    if (formValue.updatedValueForm && validationRegex) {
      const re = new RegExp(validationRegex);
      isValid = !!re.test(formValue.updatedValueForm);
    }

    const error = isValid ? '' : errorMsg;
    if (formValue.updatedValueForm === '') {
      formValue.updatedValueForm = undefined;
    }
    this.setState({ ...formValue, error });
    this.props.onChange ? this.props.onChange(formValue) : undefined;
  }

  onDelete() {
    this.setState({
      ...this.getDefaultState(),
      [UPDATED_VALUE]: undefined,
      [UPDATED_VALUE_NAME]: this.props.name
    });
    this.props.onDelete();
  }

  onEdit() {
    this.setState({
      ...this.getDefaultState(),
      [UPDATED_VALUE]: this.props.searchable ? '' : this.props.value,
      [UPDATED_VALUE_NAME]: this.props.name
    });
  }

  onCancel() {
    this.setState(this.getDefaultState());

    return Promise.resolve(
      this.props.onCancel ? this.props.onCancel() : undefined
    );
  }

  async onSave() {
    if (this.state.error) {
      return Promise.reject();
    }

    if (this.state.isAdding) {
      const addedValue = this.state[ADDED_VALUE];

      await Promise.resolve(
        this.setState({
          ...this.getDefaultState(),
          [UPDATED_VALUE]: addedValue
        })
      );

      await Promise.resolve(
        this.props.onAdd ? this.props.onAdd(addedValue) : undefined
      );
    }

    const key = this.state[UPDATED_VALUE_NAME];
    const value = this.state.selected || this.state[UPDATED_VALUE];

    return this.checkIllegalChars(key, value);
  }

  onSaveNewProperty(values) {
    this.setState({
      ...this.getDefaultState(),
      [UPDATED_VALUE_NAME]: values[1],
      [UPDATED_VALUE]: values[2]
    });
    return this.props.onSave({
      key: values[1],
      value: values[2]
    });
  }

  checkIllegalChars(key, value) {
    const { illegalChars } = this.props;
    let hasIllegalChar = false;
    illegalChars && illegalChars.forEach((char) => {
      if (value.indexOf(char) !== -1) {
        hasIllegalChar = true;
      }
    });
    if (hasIllegalChar) {
      NotificationActions.createNotification({
        text: `Characters like ${illegalChars} are not allowed`,
        isError: true
      });
      return Promise.reject();
    }  else {
      return Promise.resolve(
        this.props.onSave(this.props.nameEditable ?
          { key, value } : value)
      );
    }
  }

  getOptionName(selected) {
    const { multiSelect, options } = this.props;

    const getNameFromOption = (value) => {
      const option = options.find(option => option.value === value);
      if (!option) return '';
      return option.name || option.value;
    };

    return multiSelect ?
      selected.map(getNameFromOption).join(', ') :
      getNameFromOption(selected);
  }

  renderViewComponent(value, type) {
    const getValueString = () => {
      if (type === 'value') {
        if (this.props.options) {
          // choice and multi-choice
          return this.getOptionName(value);
        }
        if (this.props.renderAsBool && value) {
          // boolean
          return (value === 'true') ? 'Yes' : 'No';
        }
      }
      return _.toString(value);
    };
    const valueStr = getValueString();

    const content = (
      <Choose>
        <When condition={!valueStr.length}>-</When>
        <When condition={this.props.renderViewValue}>
          {this.props.renderViewValue(value)}
        </When>
        <When condition={this.props.unit}>
          <Unit value={`${valueStr}:${this.props.unit}`} shortUnits />
        </When>
        <When condition={this.props.isUrl}>
          <a href={valueStr}>{valueStr}</a>
        </When>
        <When condition={this.props.suffix && type === 'value'}>
          {valueStr} {this.props.suffix}
        </When>
        <When condition={type === 'value'}>
          {valueStr}
        </When>
        <When condition={type === 'returnEmptyString'} />
        <Otherwise>{valueStr}</Otherwise>
      </Choose>
    );

    return this.props.disableFormatText || this.props.displayColonSeparated ? (
      content
    ) : (
      <p className={classnames('editable-property__view-component', { 'tx-type--secondary': !valueStr.length })}>
        {content}
      </p>
    );
  }

  renderNameEditComponent() {
    const props = {
      name: UPDATED_VALUE_NAME,
      value: this.state[UPDATED_VALUE_NAME]
    };

    return (
      <TextInput {...props} placeholder="Enter name" />
    );
  }

  renderValueEditComponent() {
    const { isAdding } = this.state;
    const {
      name,
      placeholderSuffix,
      options,
      multiSelect,
      addable,
      searchable,
      suggestions,
      onSuggestedSelect,
      renderAsBool,
      keyName
    } = this.props;

    const props = {
      name: UPDATED_VALUE,
      value: this.state[UPDATED_VALUE]
    };

    const PLACEHOLDER_SUFFIX = (placeholderSuffix || name) ? ` ${placeholderSuffix || name}` : '...';
    return (
      <React.Fragment>
        {!isAdding && (options ?
          (!multiSelect ? (
            <Select
              {...props}
              placeholder={`Select${PLACEHOLDER_SUFFIX}`}
              options={options}
            />
          ) : (
            <MultiSelect
              {...props}
              placeholder={`Select${PLACEHOLDER_SUFFIX}`}
              options={options}
            />
          ))
          : (searchable && suggestions) ? (
            <TypeAheadInput
              {...props}
              placeholder={`Search${PLACEHOLDER_SUFFIX}`}
              suggestions={suggestions.map(s => s.name)}
              onSuggestedSelect={selectedName => {
                const selected = suggestions.find(s => s.name === selectedName);
                onSuggestedSelect ? onSuggestedSelect(selected) : undefined;
                this.setState({
                  [UPDATED_VALUE]: selectedName,
                  selected
                });
              }}
            />
          ) : (renderAsBool) ? (
            <RadioGroup
              id={keyName}
              {...props}
              size="small"
            >
              <Radio id={keyName + '-yes'} value="true" checked={props.value === 'true'} name={props.name} label="Yes" />
              <Radio id={keyName + '-no'} value="false" checked={props.value === 'false'} name={props.name} label="No" />
            </RadioGroup>
          ) : (
            <TextInput
              {...props}
              placeholder={`Enter${PLACEHOLDER_SUFFIX}`}
              type={this.props.type || (this.props.unit ? 'number' : 'text')}
            />
          ))
        }

        {(addable &&
            (isAdding ? (
              <TextInput
                name={ADDED_VALUE}
                value={this.state[ADDED_VALUE]}
                placeholder={`Add new${PLACEHOLDER_SUFFIX}`}
              />
            ) : (
              <Button
                type="primary"
                link
                icon="fa fa-plus"
                onClick={() => this.setState({ isAdding: true })}
              >
                {`Add${PLACEHOLDER_SUFFIX}`}
              </Button>
            ))
        )}
      </React.Fragment>
    );
  }

  render() {
    const { name, value, nameEditable } = this.props;

    return (
      <InputsController inputChangeCallback={this.onChange}>
        {!this.props.canAddNewKeyValuePair ? (
          <InplaceInput
            {...this.props}
            disabled={!this.props.editable}
            onSave={this.onSave}
            onCancel={this.onCancel}
            onEdit={this.onEdit}
            onDelete={this.props.onDelete ? () =>
              Promise.resolve(this.onDelete())
              : null}
            content={
            [
              ...(
                name !== undefined && [{
                  id: 1,
                  viewComponent: (this.props.displayColonSeparated ?
                    this.renderViewComponent(name, 'returnEmptyString') :
                    this.renderViewComponent(name)),
                  editComponent: nameEditable ?
                    this.renderNameEditComponent() :
                    this.renderViewComponent(name, this.props.showLabeledInput ?
                      'returnEmptyString' : '')
                }]
              ),
              {
                id: 2,
                viewComponent: (this.props.displayColonSeparated ?
                  `${this.renderViewComponent(name)}: ${this.renderViewComponent(value, 'value')}` :
                  this.renderViewComponent(value, 'value')),
                editComponent: (
                  this.props.showLabeledInput ? (
                    <LabeledInput label={name}>
                      {this.renderValueEditComponent()}
                    </LabeledInput>
                  ) :
                    this.renderValueEditComponent()
                ),
                error: this.state.error
              }
            ]
          }
          />
        ) : (
          <AddInplace
            onAdd={this.onSaveNewProperty}
            content={
              [
                {
                  id: 1
                },
                {
                  id: 2
                }
              ]
            }
            fullWidth={false}
          />
        )}
      </InputsController>
    );
  }
}

EditableProperty.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.string, PropTypes.array, PropTypes.number]),
  showInitialValue: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  isUrl: PropTypes.bool,
  name: PropTypes.string,
  unit: PropTypes.string,
  addable: PropTypes.bool,
  onAdd: PropTypes.func,
  onCancel: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
    name: PropTypes.string,
    disabled: PropTypes.bool
  })),
  searchable: PropTypes.bool,
  suggestions: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string
  })),
  onSuggestedSelect: PropTypes.func,
  illegalChars: PropTypes.any,
  editable: PropTypes.bool,
  disableFormatText: PropTypes.bool,
  renderViewValue: PropTypes.func,
  type: PropTypes.string,
  validationRegex: PropTypes.string,
  nameEditable: PropTypes.bool,
  suffix: PropTypes.string,
  onEdit: PropTypes.func,
  canAddNewKeyValuePair: PropTypes.bool, // Add a new key and value for a property
  displayColonSeparated: PropTypes.bool,
  showLabeledInput: PropTypes.bool,
  keyName: PropTypes.string
};

EditableProperty.defaultProps = {
  editable: true,
  canAddNewKeyValuePair: false,
  nameEditable: false
};
export class SearchableEditableProperty extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      suggestions: []
    };
  }

  componentDidMount() {
    this._mounted = true;
    this.request_queue = ajax.singly();
  }

  query(q) {
    this.request_queue((done) => {
      if (!this._mounted) {
        done();
        return;
      }

      this.props.engine.query(q, (data) => {
        done();

        if (!this._mounted) {
          return;
        }

        this.setState({
          suggestions: data.results
        });
      });
    });
  }

  render() {
    const { _engine, ...otherProps } = this.props;

    return (
      <EditableProperty
        {...otherProps}
        searchable
        suggestions={this.state.suggestions}
        onChange={formValue => this.query(formValue[UPDATED_VALUE])}
        onSuggestedSelect={() => this.setState({ suggestions: [] })}
      />
    );
  }
}

SearchableEditableProperty.propTypes = {
  ...EditableProperty.propTypes,
  engine: PropTypes.object
};

export default EditableProperty;
