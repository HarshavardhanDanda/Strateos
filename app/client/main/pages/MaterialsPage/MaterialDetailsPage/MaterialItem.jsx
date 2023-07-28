import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import Classnames from 'classnames';
import _ from 'lodash';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import {
  LabeledInput,
  TextInput,
  Toggle,
  MoleculeViewer,
  InputWithUnits,
  Button,
  Molecule,
  Unit,
  Validated,
  Tooltip,
  Popover,
  TextBody
} from '@transcriptic/amino';
import Urls from 'main/util/urls';
import CostTable from 'main/pages/MaterialsPage/CostTable';
import * as UnitUtil from 'main/util/unit';
import './MaterialDetailsPage.scss';
import ModalActions from 'main/actions/ModalActions';
import ResourceActions from 'main/actions/ResourceActions';
import OrderableMaterialComponentActions from 'main/actions/OrderableMaterialComponentActions';
import AddResourceModal from 'main/pages/ResourcesPage/modals/AddResourceModal';
import ContainerTypeSelector from 'main/components/ContainerTypeSelector';
import MaterialFormHoc from './MaterialFormHOC';

const TIPS = {
  PROVISIONABLE: 'Enables this Material item to be used with a Provision Autoprotocol Instruction',
  RESERVABLE: 'Enables this Material item to track reserved quantities based on Runs in the Run queue',
  DISPENSABLE: 'Enables this Material item to be used with a Liquid Handle - Dispense Autoprotocol Instruction',
  INDIVISIBLE: 'Makes this Material item single use, where the entire quantity in a container must be consumed at once'
};

const stockSuffix = (orderableMaterialComponent) => {
  if (orderableMaterialComponent.get('volume_per_container')) {
    return 'microliter';
  } else if (orderableMaterialComponent.get('mass_per_container')) {
    return 'milligram';
  } else {
    return 'microliter';
  }
};

const renderStockAmount = (orderableMaterialComponent, globalStats) => {
  const unit = stockSuffix(orderableMaterialComponent);
  const stockVolume = _.toNumber(_.get(globalStats, 'stock_volume', 0));
  const stockMass = _.toNumber(_.get(globalStats, 'stock_mass', 0));
  const amount = (stockVolume || stockMass).toFixed(2);

  if (!unit) {
    return amount;
  }

  return (
    <Unit
      value={`${amount || 0}:${unit}`}
      shortUnits
    />
  );
};

const renderContainerTypes = (onChange, item) => {
  return (
    <ContainerTypeSelector
      value={item.get('container_type_id', '')}
      onChange={(e) => { onChange(item.set('container_type_id', e.target.value)); }}
    />
  );
};

const renderTextInput = (value, placeholder, onChange, disabled, onBlur) => {
  return (
    <Choose>
      <When condition={disabled}>
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

const onCompoundClick = (id, router) => {
  router.history.push(Urls.compound(id));
};

const renderMolecule = (compound, router) => {
  const SMILES = compound && compound.get('smiles');
  return (
    <div className={compound ? 'material-details-page__compound-click' : ''} onClick={() => compound && onCompoundClick(compound.get('id'), router)}>
      <Molecule
        SMILES={SMILES}
        width={250}
        height={150}
        size={SMILES === null ? 'small' : null}
      />
    </div>
  );
};

const renderToggle = (labelName, toggleName, value, onChange, disabled, tip) => {
  return (
    <LabeledInput label={labelName} tip={tip} icon="info">
      <Toggle
        name={toggleName}
        value={value}
        onChange={onChange}
        readOnly={disabled}
      />
    </LabeledInput>
  );
};

const validateConcentration = (forceValidation, concentration) => {
  if (forceValidation) {

    if (!concentration) {
      return '';
    }

    const [value, _] = concentration.split(/:/);

    if (value.length > 0 && parseFloat(value) <= 0) {
      return 'Must be greater than 0';
    }
  }
  return '';
};

class Group extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      globalStats: {}
    };
  }

  componentDidMount() {
    const id = this.props.component.get('id');

    if (id) {
      OrderableMaterialComponentActions.loadOmcGlobalStats(id)
        .done((resp) => {
          this.setState({ globalStats: resp[0] });
        });
    }
  }

  validateVolumeOrMass(field) {
    if (this.props.forceValidation) {
      const volume = this.props.component.get('volume_per_container');
      const mass = this.props.component.get('mass_per_container');
      if (!volume && !mass) {
        return 'Volume or Mass is required';
      }
      if (field === 'volume_per_container') {
        return volume < 0 ? 'Must be greater than 0' : '';
      } else if (field === 'mass_per_container') {
        return mass < 0 ? 'Must be greater than 0' : '';
      }
    }
    return '';
  }

  isGroupComponentConcentrationDisable() {
    return this.props.component.get('material_component_concentration') && !this.props.component.get('isConcentrationSetNow');
  }

  renderName() {
    return (
      this.props.disabled ? (
        <h3 className="material-details-page__item-header">
          {this.props.component.get('name')} ({this.props.component.get('id')})
        </h3>
      ) : (
        <div className="row">
          <div className="col-xs-8">
            <LabeledInput label="NAME">
              <Validated
                error={!this.props.component.get('name') ? 'Required Field' : ''}
                force_validate={this.props.forceValidation}
              >
                <TextInput
                  placeholder="Name"
                  value={this.props.component.get('name')}
                  onChange={(e) => this.props.onComponentChange(
                    this.props.component.set('name', e.target.value)
                  )}
                />
              </Validated>
            </LabeledInput>
          </div>
        </div>
      )
    );
  }

  render() {
    const purity = this.props.component.getIn(['resource', 'purity']);
    const sensitivities = this.props.component.getIn(['resource', 'sensitivities'], Immutable.List()).toJS();
    const toggleId = this.props.component.get('id') || this.props.index;
    const resourceCompound = this.props.component.getIn(['resource', 'compound', 'model']) || this.props.component.getIn(['resource', 'compound']);
    const resourceKind = this.props.component.getIn(['resource', 'kind']);

    return (
      <div className="material-details-page__item container-fluid">
        <div className="row">
          <div className="col-sm-12">
            <div className="row">
              <div className="col-xs-11">
                {this.renderName()}
              </div>
              <div className="material-details-page__delete col-xs-1">
                {!this.props.disabled && (
                  <Button
                    link
                    type="info"
                    icon="far fa-trash-alt"
                    onClick={() => this.props.onDeleteComponent()}
                    label="Delete"
                  />
                )}
              </div>
            </div>
            <div className="row">
              <div className="col-sm-3">
                <LabeledInput label="RESOURCE">
                  <TextBody color="secondary">
                    {this.props.component.getIn(['resource', 'name'])}
                  </TextBody>
                </LabeledInput>
              </div>
              <div className="col-xs-3 col-sm-2">
                {renderToggle(
                  'PROVISIONABLE',
                  'provisionable-flag-toggle-' + toggleId,
                  this.props.component.get('provisionable') ? 'on' : 'off',
                  e => this.props.onComponentChange(this.props.component.set('provisionable', e.target.value === 'on')),
                  this.props.disabled,
                  TIPS.PROVISIONABLE
                )}
              </div>
              <div className="col-xs-3 col-sm-2">
                {renderToggle(
                  'RESERVABLE',
                  'reservable-flag-toggle-' + toggleId,
                  this.props.component.get('reservable') ? 'on' : 'off',
                  e => this.props.onComponentChange(this.props.component.set('reservable', e.target.value === 'on')),
                  this.props.disabled,
                  TIPS.RESERVABLE
                )}
              </div>
              <div className="col-xs-3 col-sm-2">
                {renderToggle(
                  'DISPENSABLE',
                  'dispensable-flag-toggle-' + toggleId,
                  this.props.component.get('dispensable') ? 'on' : 'off',
                  e => this.props.onComponentChange(this.props.component.set('dispensable', e.target.value === 'on')),
                  this.props.disabled,
                  TIPS.DISPENSABLE
                )}
              </div>
              <div className="col-xs-3 col-sm-2">
                {renderToggle(
                  'INDIVISIBLE',
                  'indivisible-flag-toggle-' + toggleId,
                  this.props.component.get('indivisible') ? 'on' : 'off',
                  e => this.props.onComponentChange(this.props.component.set('indivisible', e.target.value === 'on')),
                  this.props.disabled,
                  TIPS.INDIVISIBLE
                )}
              </div>
            </div>
            <div className="row">
              <div className="col-xs-3">
                <LabeledInput label="VOLUME PER CONTAINER">
                  <Choose>
                    <When condition={this.props.disabled}>
                      <TextBody color="secondary">
                        <Unit
                          value={`${this.props.component.get('volume_per_container') || 0}:microliter`}
                          shortUnits
                        />
                      </TextBody>
                    </When>
                    <Otherwise>
                      <Validated
                        error={this.validateVolumeOrMass('volume_per_container')}
                        force_validate={this.props.forceValidation}
                      >
                        <InputWithUnits
                          dimension="volume"
                          value={this.props.component.get('volume_per_container')}
                          onChange={e => this.props.onComponentChange(this.props.component.set('volume_per_container', e.target.numericValue))}
                          preserveUnit
                        />
                      </Validated>
                    </Otherwise>
                  </Choose>
                </LabeledInput>
              </div>
              <div className="col-xs-3">
                <LabeledInput label="MASS PER CONTAINER">
                  <Choose>
                    <When condition={this.props.disabled}>
                      <TextBody color="secondary">
                        <Unit
                          value={`${this.props.component.get('mass_per_container') || 0}:milligram`}
                          shortUnits
                        />
                      </TextBody>
                    </When>
                    <Otherwise>
                      <Validated
                        error={this.validateVolumeOrMass('mass_per_container')}
                        force_validate={this.props.forceValidation}
                      >
                        <InputWithUnits
                          dimension="mass"
                          value={`${this.props.component.get('mass_per_container')}:milligram`}
                          onChange={e => this.props.onComponentChange(this.props.component.set('mass_per_container', e.target.numericValue))}
                          preserveUnit
                        />
                      </Validated>
                    </Otherwise>
                  </Choose>
                </LabeledInput>
              </div>
              <div className="col-xs-3">
                <LabeledInput label="QUANTITY">
                  {renderTextInput(
                    this.props.component.get('no_of_units'),
                    '',
                    e => this.props.onComponentChange(this.props.component.set('no_of_units', e.target.value)),
                    this.props.disabled
                  )}
                </LabeledInput>
              </div>
              <div className="col-xs-3">
                <LabeledInput label="CONCENTRATION">
                  <Choose>
                    <When condition={this.props.disabled}>
                      {this.props.component.get('material_component_concentration') && (
                        <TextBody color="secondary">
                          <Unit
                            value={this.props.component.get('material_component_concentration')}
                            shortUnits
                          />

                        </TextBody>
                      )}
                    </When>
                    <Otherwise>
                      <Validated
                        error={validateConcentration(this.props.forceValidation, this.props.component.get('material_component_concentration'))}
                        force_validate={this.props.forceValidation}
                      >
                        <InputWithUnits
                          dimension="amount_concentration"
                          value={this.props.component.get('material_component_concentration')}
                          onChange={e => {
                            this.props.onComponentChange(
                              this.props.component
                                .set('isConcentrationSetNow', true)
                                .set('material_component_concentration', e.target.value)
                            );
                          }}
                          disabled={this.isGroupComponentConcentrationDisable()}
                        />
                      </Validated>
                    </Otherwise>
                  </Choose>

                </LabeledInput>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-2">
                <LabeledInput label="KIND">
                  <TextBody color="secondary">
                    {this.props.component.getIn(['resource', 'kind'], '-')}
                  </TextBody>
                </LabeledInput>
              </div>
              {this.props.component.getIn(['resource', 'kind']) === 'ChemicalStructure' && (
                <div className="col-sm-2">
                  <LabeledInput label="PURITY">
                    <TextBody color="secondary">
                      {purity ? `${purity}%` : '-'}
                    </TextBody>
                  </LabeledInput>
                </div>
              )}
              <div className="col-sm-2">
                <LabeledInput label="CONTAINER TYPE">
                  <Choose>
                    <When condition={this.props.disabled}>
                      <TextBody color="secondary">
                        <Popover
                          content={this.props.component.get('container_type_id')}
                          placement="bottom"
                          showWhenOverflow
                        >
                          {this.props.component.get('container_type_id')}
                        </Popover>
                      </TextBody>
                    </When>
                    <Otherwise>
                      <Validated
                        error={_.isEmpty(this.props.component.get('container_type_id')) ? 'Required Field' : ''}
                        force_validate={this.props.forceValidation}
                      >
                        {renderContainerTypes(this.props.onComponentChange, this.props.component)}
                      </Validated>
                    </Otherwise>
                  </Choose>
                </LabeledInput>
              </div>
              <div className="col-sm-2">
                <LabeledInput label="STORAGE">
                  <TextBody color="secondary">
                    {this.props.component.getIn(['resource', 'storage_condition'])}
                  </TextBody>
                </LabeledInput>
              </div>
              <div className="col-sm-2">
                <LabeledInput label="STOCK AMOUNT">
                  <TextBody color="secondary">
                    {renderStockAmount(this.props.component, this.state.globalStats)}
                  </TextBody>
                </LabeledInput>
              </div>
              <div className="col-sm-4">
                <LabeledInput label="SENSITIVITIES">
                  <TextBody color="secondary">
                    {sensitivities.length ? sensitivities.join(', ') : '-'}
                  </TextBody>
                </LabeledInput>
              </div>
            </div>
            {this.props.displayViewStock && this.props.isValidMaterial && (
              <div className="row">
                <div className="col-xs-12">
                  <Button
                    type="secondary"
                    onClick={this.props.onViewStockButtonClick}
                    height="short"
                    size="small"
                  >
                    View Stock
                  </Button>
                </div>
              </div>
            )}
            {(resourceKind === 'ChemicalStructure') && resourceCompound && (
              <div className="row">
                <div className="col-sm-3">
                  <LabeledInput label="COMPOUND">
                    <div className="material-details-page__molecule">
                      <MoleculeViewer
                        name={resourceCompound.get('name')}
                        size="tiny"
                        SMILES={resourceCompound.get('smiles')}
                      />
                    </div>
                  </LabeledInput>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

Group.propTypes = {
  component: PropTypes.instanceOf(Immutable.Map).isRequired,
  onDeleteComponent: PropTypes.func.isRequired,
  onComponentChange: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  isValidMaterial: PropTypes.bool,
  disabled: PropTypes.bool.isRequired,
  displayViewStock: PropTypes.bool.isRequired,
  onViewStockButtonClick: PropTypes.func,
  forceValidation: PropTypes.bool
};

class IndividualForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showCopy: undefined
    };

    this.onCostChange = this.onCostChange.bind(this);
    this.onResourceIdClick = this.onResourceIdClick.bind(this);
  }

  isEmpty(value) {
    return !value;
  }

  validateCostTable(forceValidation, costDetails) {
    if (forceValidation && costDetails.size === 0) {
      return 'Please add cost item';
    } else if (forceValidation && costDetails.size > 0) {
      if (costDetails.some(costDetail =>
        this.isEmpty(costDetail.get('amount')) || this.isEmpty(costDetail.get('unit')) || this.isEmpty(costDetail.get('cost')))) {
        return 'One or more cost item rows is missing Amount, Unit and/or Cost information';
      } else if (costDetails.some(costDetail => _.toNumber(costDetail.get('amount')) <= 0 || _.toNumber(costDetail.get('cost')) <= 0)) {
        return 'One or more cost item rows contains an Amount or Cost that is 0 or less';
      }
    }
    return '';
  }

  onCostChange(data) {
    this.props.onMaterialChange(this.props.material.set('components', data));
  }

  onResourceIdClick(resourceId) {
    ResourceActions.load(resourceId).then(
      (resource) => {
        ModalActions.openWithData(AddResourceModal.MODAL_ID, { resource, readOnly: true });
      }
    );
  }

  render() {
    const purity = this.props.material.getIn(['resource', 'purity']);
    const sensitivities = this.props.material.getIn(['resource', 'sensitivities'], Immutable.List()).toJS();
    const resourceId = this.props.material.getIn(['resource', 'id']);
    const kind = this.props.material.getIn(['resource', 'kind']);
    const storage = this.props.material.getIn(['resource', 'storage_condition']);
    const resourceCompound = this.props.material.getIn(['resource', 'compound', 'model']) || this.props.material.getIn(['resource', 'compound']);
    const materialComponentConcentration = this.props.material.getIn(['components', 0, 'material_component_concentration'], null);

    return (
      <div className="row material-details-page__item individual-item">
        <div className="row">
          <div className="col-xs-11">
            <h3 className="material-details-page__item-header">
              {resourceCompound && resourceCompound.get('name')}
            </h3>
          </div>
          <div className="material-details-page__delete col-xs-1">
            {!this.props.disabled && (
              <Button
                link
                type="info"
                icon="far fa-trash-alt"
                onClick={() => this.props.onDeleteMaterial()}
                label="Delete"
              />
            )}
          </div>
        </div>
        <div className="col-sm-3">
          <div className="compound-detail__segment">
            {renderMolecule(resourceCompound, this.props.router)}
          </div>
        </div>
        <div className="col-sm-9">
          <div className="row">
            <div className="material-details-page__toggle-with-label col-sm-12">
              <Toggle
                name={'private-flag-toggle-' + this.props.index}
                value={this.props.material.get('is_private') ? 'on' : 'off'}
                onChange={e => this.props.onMaterialChange(this.props.material.set('is_private', e.target.value === 'on'))}
                readOnly={this.props.disabled}
              />
              <span>Private material</span>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-3">
              <LabeledInput label="NAME">
                <Validated
                  error={this.isEmpty(this.props.material.get('name')) ? 'Required Field' : ''}
                  force_validate={this.props.forceValidation}
                >
                  {renderTextInput(
                    this.props.material.get('name'),
                    'Name of the material',
                    e => {
                      this.props.onMaterialChange(this.props.material.set('name', e.target.value));
                    },
                    this.props.disabled,
                    () => this.props.setFormValidState()
                  )}
                </Validated>
              </LabeledInput>
            </div>
            <div className="col-sm-3">
              <LabeledInput label="RESOURCE ID">
                <div className="material-details-page__resource-viewer-section">
                  <TextBody
                    className="material-details-page__resource-data-section"
                    color="secondary"
                    onClick={() => {
                      this.onResourceIdClick(resourceId);
                    }}
                  >
                    {resourceId}
                  </TextBody>
                  {(resourceId !== '-') && (
                  <div className="material-details-page__resource-copy-section">
                    <Tooltip
                      placement="top"
                      title="Copy to Clipboard"
                      slim
                    >
                      <CopyToClipboard
                        text={resourceId}
                        onCopy={() => {
                          this.setState({ showCopy: true },
                            () => setTimeout(
                              () => this.setState({ showCopy: false }),
                              1000
                            ));
                        }}
                      >
                        <div role="button" tabIndex={-1} className="material-details-page__resource-copy-button">
                          <i className="fal fa-fw fa-clipboard" aria-hidden="true" />
                        </div>
                      </CopyToClipboard>
                    </Tooltip>
                    <i className={
                      Classnames('fal', 'fa-fw', 'fa-check', 'material-details-page__resource-copy-check-icon', {
                        'material-details-page__resource-copy-check-icon-opaque': this.state.showCopy
                      })}
                    />
                  </div>
                  )}
                </div>
              </LabeledInput>
            </div>
            <div className="col-sm-2">
              <LabeledInput label="CATEGORY">
                {this.props.renderCategory(this.props.disabled)}
              </LabeledInput>
            </div>
            <div className="col-xs-3 col-sm-2">
              <LabeledInput label="VENDOR">
                <Validated
                  error={this.isEmpty(this.props.material.getIn(['vendor', 'id'])) ? 'Required Field' : ''}
                  force_validate={this.props.forceValidation}
                >
                  {this.props.renderVendor(this.props.disabled || this.props.editing)}
                </Validated>
              </LabeledInput>
            </div>
            {this.props.material.get('vendor') && (
              <div className="col-xs-3 col-sm-2">
                <LabeledInput label="SUPPLIER">
                  {this.props.renderSupplier(this.props.disabled || this.props.editing)}
                </LabeledInput>
              </div>
            )}
          </div>
          <div className="row">
            <div className="col-sm-3">
              <LabeledInput label="URL">
                {renderTextInput(
                  this.props.material.get('url'),
                  'Name URL',
                  e => {
                    this.props.onMaterialChange(this.props.material.set('url', e.target.value));
                  },
                  this.props.disabled
                )}
              </LabeledInput>
            </div>
            <div className="col-sm-3">
              <LabeledInput label="TIER">
                {renderTextInput(
                  this.props.material.get('tier'),
                  'Enter tier',
                  e => {
                    this.props.onMaterialChange(this.props.material.set('tier', e.target.value));
                  },
                  this.props.disabled
                )}
              </LabeledInput>
            </div>
            <div className="col-xs-3 col-sm-2">
              {renderToggle(
                'PROVISIONABLE',
                'provisionable-flag-toggle-' + this.props.index,
                this.props.material.get('provisionable') ? 'on' : 'off',
                e => this.props.onMaterialChange(this.props.material.set('provisionable', e.target.value === 'on')),
                this.props.disabled,
                TIPS.PROVISIONABLE
              )}
            </div>
            <div className="col-xs-3 col-sm-2">
              {renderToggle(
                'RESERVABLE',
                'reservable-flag-toggle-' + this.props.index,
                this.props.material.get('reservable') ? 'on' : 'off',
                e => this.props.onMaterialChange(this.props.material.set('reservable', e.target.value === 'on')),
                this.props.disabled,
                TIPS.RESERVABLE
              )}
            </div>
            <div className="col-xs-3 col-sm-2">
              {renderToggle(
                'INDIVISIBLE',
                'indivisible-flag-toggle-' + this.props.index,
                this.props.material.get('indivisible') ? 'on' : 'off',
                e => this.props.onMaterialChange(this.props.material.set('indivisible', e.target.value === 'on')),
                this.props.disabled,
                TIPS.INDIVISIBLE
              )}
            </div>
          </div>
          <div className="row">
            <div className="col-sm-2">
              <LabeledInput label="KIND">
                <TextBody color="secondary">
                  {kind || '-'}
                </TextBody>
              </LabeledInput>
            </div>
            <div className="col-sm-2">
              <LabeledInput label="PURITY">
                <TextBody color="secondary">
                  {purity ? `${purity}%` : '-'}
                </TextBody>
              </LabeledInput>
            </div>
            <div className="col-sm-2">
              <LabeledInput label="SENSITIVITIES">
                <TextBody color="secondary">
                  {sensitivities.length ? sensitivities.join(', ') : '-'}
                </TextBody>
              </LabeledInput>
            </div>
            <div className="col-sm-2">
              <LabeledInput label="CONTAINER TYPE">
                <Choose>
                  <When condition={this.props.disabled}>
                    <TextBody color="secondary">
                      <Popover
                        content={this.props.material.get('container_type_id')}
                        placement="bottom"
                        showWhenOverflow
                      >
                        {this.props.material.get('container_type_id')}
                      </Popover>
                    </TextBody>
                  </When>
                  <Otherwise>
                    <Validated
                      error={_.isEmpty(this.props.material.get('container_type_id')) ? 'Required Field' : ''}
                      force_validate={this.props.forceValidation}
                    >
                      {renderContainerTypes(this.props.onMaterialChange, this.props.material)}
                    </Validated>
                  </Otherwise>
                </Choose>
              </LabeledInput>
            </div>
            <div className="col-sm-2">
              <LabeledInput label="STORAGE">
                <TextBody color="secondary">
                  {storage || '-'}
                </TextBody>
              </LabeledInput>
            </div>
            <div className="col-sm-2">
              <LabeledInput label="CONCENTRATION">
                {
                  this.props.disabled || (this.props.editing && materialComponentConcentration) ? (
                    <TextBody color="secondary">
                      {
                         materialComponentConcentration ? (
                           <Unit
                             value={`${UnitUtil.convertUnitShorthandToName(materialComponentConcentration)}`}
                             shortUnits
                           />
                         ) :
                           '-'
                        }
                    </TextBody>
                  )
                    :
                    (
                      <Validated
                        error={validateConcentration(this.props.forceValidation, this.props.material.get('material_component_concentration'))}
                        force_validate={this.props.forceValidation}
                      >
                        <InputWithUnits
                          dimension="amount_concentration"
                          value={materialComponentConcentration || this.props.material.get('material_component_concentration')}
                          onChange={e =>
                            this.props.onMaterialChange(this.props.material.set('material_component_concentration', e.target.value).set('isConcentrationSetNow', true))
                            }
                          disabled={this.props.disabled || !_.isNull(materialComponentConcentration)}
                        />
                      </Validated>
                    )
                }
              </LabeledInput>
            </div>
          </div>
          <div className="row material-details-page__note">
            <div className="col-sm-12">
              <LabeledInput label="NOTE">
                {this.props.renderNote(this.props.disabled)}
              </LabeledInput>
            </div>
          </div>
          <div className="row">
            {this.props.isValidMaterial && (
              <LabeledInput label="COST">
                <Validated
                  error={this.validateCostTable(this.props.forceValidation, this.props.material.get('components'))}
                  force_validate={this.props.forceValidation}
                >
                  <CostTable
                    data={this.props.material.get('components')}
                    isValidMaterial={this.props.isValidMaterial}
                    editable={!this.props.disabled}
                    onChange={this.onCostChange}
                    displayViewStock={this.props.displayViewStock}
                    onViewStockButtonClick={this.props.onViewStockButtonClick}
                    displayCheckIn={this.props.displayCheckIn}
                    onCheckIn={this.props.onCheckIn}
                  />
                </Validated>
              </LabeledInput>
            )}
          </div>
        </div>
      </div>
    );
  }
}

IndividualForm.propTypes = {
  material: PropTypes.instanceOf(Immutable.Map).isRequired,
  onMaterialChange: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, path: PropTypes.array })
  ).isRequired,
  vendors: PropTypes.arrayOf(
    PropTypes.shape({ name: PropTypes.string })
  ).isRequired,
  index: PropTypes.number.isRequired,
  renderCategory: PropTypes.func.isRequired,
  renderVendor: PropTypes.func.isRequired,
  isValidMaterial: PropTypes.bool,
  renderSupplier: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  editing: PropTypes.bool,
  forceValidation: PropTypes.bool,
  setFormValidState: PropTypes.func.isRequired,
  displayViewStock: PropTypes.bool.isRequired,
  onViewStockButtonClick: PropTypes.func,
  displayCheckIn: PropTypes.bool,
  onCheckIn: PropTypes.func,
  router: PropTypes.object
};

const Individual = MaterialFormHoc(IndividualForm);

export default { Group, Individual };
