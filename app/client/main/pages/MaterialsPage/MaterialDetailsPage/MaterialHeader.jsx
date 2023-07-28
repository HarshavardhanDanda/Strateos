import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import _ from 'lodash';
import {
  Divider,
  LabeledInput,
  TextInput,
  Toggle,
  InputWithUnits,
  Validated,
  Popover,
  TextBody
} from '@transcriptic/amino';
import MaterialFormHOC from './MaterialFormHOC';

function MaterialHeaderForm(props) {
  const isEmpty = value => {
    return !value;
  };

  const validateCost = () => {
    if (isEmpty(props.material.get('cost'))) {
      return 'Required Field';
    } else if (_.toNumber(props.material.get('cost')) <= 0) {
      return 'Material cost should be greater than 0';
    } else {
      return '';
    }
  };

  const renderTextInput = (value, placeholder, onChange, onBlur) => {
    return (
      <Choose>
        <When condition={props.disabled}>
          <TextBody color="secondary">
            <Popover
              content={value}
              placement="bottom"
              showWhenOverflow
            >
              {value}
            </Popover>
          </TextBody>
        </When>
        <Otherwise>
          <TextInput
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            onBlur={onBlur}
          />
        </Otherwise>
      </Choose>
    );
  };

  return (
    <div className="container-fluid">
      <Divider id="group-divider" />
      <div className="row">
        <div className="material-details-page__toggle-with-label col-sm-12">
          <Toggle
            name="private-flag-toggle"
            value={props.material.get('is_private') ? 'on' : 'off'}
            onChange={e => props.onMaterialChange(props.material.set('is_private', e.target.value === 'on'))}
            readOnly={props.disabled}
          />
          <span>Private material</span>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-3">
          <LabeledInput label="NAME">
            <Validated
              error={isEmpty(props.material.get('name')) ? 'Required Field' : ''}
              force_validate={props.forceValidation}
            >
              {renderTextInput(
                props.material.get('name'),
                'Name of the material',
                e => props.onMaterialChange(props.material.set('name', e.target.value)),
                () => props.setFormValidState())
              }
            </Validated>
          </LabeledInput>
        </div>
        <div className="col-sm-3">
          <LabeledInput label="VENDOR">
            <Validated
              error={isEmpty(props.material.getIn(['vendor', 'id'])) ? 'Required Field' : ''}
              force_validate={props.forceValidation}
            >
              {props.renderVendor(props.disabled)}
            </Validated>
          </LabeledInput>
        </div>
        {props.material.get('vendor') && (
          <div className="col-sm-3">
            <LabeledInput label="SUPPLIER">
              {props.renderSupplier(props.disabled)}
            </LabeledInput>
          </div>
        )}
        <div className="col-sm-3">
          <LabeledInput label="SKU">
            {renderTextInput(
              props.material.get('sku'),
              'Enter supplier SKU',
              e => props.onMaterialChange(props.material.set('sku', e.target.value))
            )}
          </LabeledInput>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-3">
          <LabeledInput label="CATEGORY">
            {props.renderCategory(props.disabled)}
          </LabeledInput>
        </div>
        <div className="col-sm-3">
          <LabeledInput label="URL">
            {renderTextInput(
              props.material.get('url'),
              'Name URL',
              e => props.onMaterialChange(props.material.set('url', e.target.value))
            )}
          </LabeledInput>
        </div>
        <div className="col-sm-2">
          <LabeledInput label="TIER">
            {renderTextInput(
              props.material.get('tier'),
              'Enter tier',
              e => props.onMaterialChange(props.material.set('tier', e.target.value))
            )}
          </LabeledInput>
        </div>
        <div className="col-sm-2">
          {props.isValidMaterial && (
            <LabeledInput label="COST">
              {props.disabled ? (
                <TextBody color="secondary">
                  {props.material.get('cost') && `$${props.material.get('cost')}`}
                </TextBody>
              ) : (
                <Validated
                  error={validateCost()}
                  force_validate={props.forceValidation}
                >
                  <InputWithUnits
                    dimension="money"
                    value={props.material.get('cost')}
                    onChange={e => props.onMaterialChange(props.material.set('cost', e.target.value.split(':')[0] || null))}
                    onBlur={() => props.setFormValidState()}
                    placeholder="Cost of the group"
                  />
                </Validated>
              )}
            </LabeledInput>
          )}
        </div>
        <div className="col-sm-2">
          {props.isValidMaterial && (
            <LabeledInput label="MARGIN">
              {renderTextInput(
                props.material.get('margin'),
                'Profit margin',
                e => props.onMaterialChange(props.material.set('margin', e.target.value))
              )}
            </LabeledInput>
          )}
        </div>
      </div>
      <div className="row">
        <div className="col-sm-12 material-details-page__note">
          <LabeledInput label="NOTE">
            {props.renderNote(props.disabled)}
          </LabeledInput>
        </div>
      </div>
    </div>
  );
}

MaterialHeaderForm.propTypes = {
  material: PropTypes.instanceOf(Immutable.Map).isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, path: PropTypes.array })
  ).isRequired,
  vendors: PropTypes.arrayOf(
    PropTypes.shape({ name: PropTypes.string })
  ).isRequired,
  onMaterialChange: PropTypes.func.isRequired,
  renderCategory: PropTypes.func.isRequired,
  renderVendor: PropTypes.func.isRequired,
  renderSupplier: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  isValidMaterial: PropTypes.bool,
  forceValidation: PropTypes.bool,
  setFormValidState: PropTypes.func.isRequired
};

const MaterialHeader = MaterialFormHOC(MaterialHeaderForm);

export default {
  Group: MaterialHeader
};
