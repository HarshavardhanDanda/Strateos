import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Immutable from 'immutable';

import { CopyToClipboard } from 'react-copy-to-clipboard';
import Classnames from 'classnames';
import { InputsController, LabeledInput, Select, TextInput, CheckboxGroup, Validated, MoleculeViewer, Button, InputWithUnits, Tooltip } from '@transcriptic/amino';
import { SimpleInputsValidator, validators } from 'main/components/validation';
import SelectStorage     from 'main/components/Input';
import ResourceStore     from 'main/stores/ResourceStore';
import { getHazardsFromCompound } from 'main/util/Hazards';
import HazardPopoverTags  from 'main/components/Hazards/HazardPopoverTags';
import ContainerStore from 'main/stores/ContainerStore';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import './EditResource.scss';

class EditResource extends React.Component {
  static get propTypes() {
    return {
      resource: PropTypes.shape({
        name: PropTypes.string,
        kind: PropTypes.string,
        sensitivities: PropTypes.instanceOf(Array),
        storage_condition: PropTypes.string,
        purity: PropTypes.number,
        compound_id: PropTypes.string,
        compound: PropTypes.object
      }).isRequired,
      update: PropTypes.func.isRequired,
      isCompact: PropTypes.bool,
      getCompound: PropTypes.func,
      getEditResource: PropTypes.func,
      data: PropTypes.object,
      onSelectCompound: PropTypes.func
    };
  }

  constructor(props) {
    super(props);
    const resourceData = this.props.data && this.props.data.toJS();
    const resource = resourceData ? resourceData.resource : undefined;
    this.state = {
      readOnly: resourceData ? resourceData.readOnly : false,
      showCopy: undefined
    };

    this.validator = SimpleInputsValidator({
      name: { validators: [validators.non_empty, validators.non_null] },
      purity: { validators: [validators.between(0, 100)] }
    });
    this.onDrawerClick = this.onDrawerClick.bind(this);
    this.props.getEditResource({ resource: resource, readOnly: this.state.readOnly });
  }

  defaultState(resource) {
    return {
      id: resource ? resource.id : '',
      name: resource ? resource.name : '',
      kind: resource ? resource.kind : ResourceStore.defaultKind,
      storage_condition: resource ? resource.storage_condition : ContainerStore.defaultStorageCondition,
      sensitivities: resource ? resource.sensitivities : [],
      purity: resource ? resource.purity : ''
    };
  }

  onDrawerClick() {
    this.props.onSelectCompound();
  }

  action() {
    return {
      icon: 'far fa-unlink',
      onRemove: () => {
        this.props.getCompound(null);
      }
    };
  }

  getCompoundAcs() {
    return AcsControls.isFeatureEnabled(FeatureConstants.VIEW_COMPOUNDS) || AcsControls.isFeatureEnabled(FeatureConstants.VIEW_LAB_COMPOUNDS);
  }

  render() {
    const sensitivities = {};
    ResourceStore.validSensitivities.forEach((sensitivity) => {
      sensitivities[sensitivity] = {
        value: sensitivity,
        label: _.capitalize(sensitivity),
        name: `sensitivities-option-${sensitivity}`,
        disabled: this.state.readOnly
      };
    });
    const resource = this.props.resource;
    const errors = this.validator.errors(Immutable.fromJS(resource));
    const compound = resource.compound ? Immutable.fromJS(resource.compound) : undefined;
    const compound_name = compound && (compound.get('name') || compound.get('public_compound_name'));
    const properties = {};

    if (compound) {
      properties.formula = compound.get('formula');
      properties.molecular_weight = compound.get('molecular_weight');
      properties.clogp = compound.get('clogp');
      properties.tpsa = compound.get('tpsa');
      properties.exact_molecular_weight = compound.get('exact_molecular_weight');
      properties.cas_number = compound.get('cas_number');
    }

    return (
      <div className="edit-resource row">
        <div className={`${resource.kind === 'ChemicalStructure' ? 'col-sm-7' : 'col-sm-12'} tx-stack tx-stack--sm tx-inline tx-inline--xlg`}>
          <div className="row">
            <div className="col-sm-6">
              <LabeledInput label="Name">
                <Validated error={errors && errors.name}>
                  <TextInput
                    name="name"
                    value={resource.name}
                    placeholder="Name of the resource"
                    onChange={e =>
                      this.props.update({
                        name: e.target.value
                      })
                    }
                    disabled={this.state.readOnly}
                  />
                </Validated>
              </LabeledInput>
            </div>
            <div className="col-sm-6">
              <LabeledInput label="Kind">
                <Select
                  name="kind"
                  value={resource.kind}
                  options={ResourceStore.validKinds.map(value => ({
                    value
                  }))}
                  onChange={(e) => {
                    return this.props.update({
                      kind: e.target.value
                    });
                  }}
                  disabled={this.state.readOnly}
                />
              </LabeledInput>
            </div>
          </div>
          {(resource.id) && (
            <div className="row">
              <div className="col-sm-6">
                <LabeledInput label="RESOURCE ID">
                  <div className="edit-resource__resource-viewer-section">
                    <p
                      className="tx-type--secondary"
                    >
                      {resource.id}
                    </p>
                    <div className="edit-resource__resource-copy-section">
                      <Tooltip
                        placement="top"
                        title="Copy to Clipboard"
                        slim
                      >
                        <CopyToClipboard
                          text={resource.id}
                          onCopy={() => {
                            this.setState({ showCopy: true },
                              () => setTimeout(
                                () => this.setState({ showCopy: false }),
                                1000
                              ));
                          }}
                        >
                          <div role="button" tabIndex={-1} className="edit-resource__resource-copy-button">
                            <i className="fal fa-fw fa-clipboard" />
                          </div>
                        </CopyToClipboard>
                      </Tooltip>
                      <i className={
                        Classnames('fal', 'fa-fw', 'fa-check', 'edit-resource__resource-copy-check-icon', {
                          'edit-resource__resource-copy-check-icon-opaque': this.state.showCopy
                        })}
                      />
                    </div>
                  </div>
                </LabeledInput>
              </div>
            </div>
          )}
          <div className="row">
            <div className="col-sm-6">
              <LabeledInput label="Sensitivities">
                <InputsController
                  inputChangeCallback={(state) => { this.props.update(state); }}
                  defaultState={{ sensitivities: resource.sensitivities }}
                >
                  <CheckboxGroup
                    name="sensitivities"
                    options={sensitivities}
                    size="large"
                  />
                </InputsController>
              </LabeledInput>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-6">
              <LabeledInput label="Storage">
                <SelectStorage
                  name="storage_condition"
                  value={resource.storage_condition}
                  onChange={(e) => {
                    return this.props.update({
                      storage_condition: e.target.value
                    });
                  }}
                  disabled={this.state.readOnly}
                />
              </LabeledInput>
            </div>
            {(resource.kind === 'ChemicalStructure') && (
              <div className="col-sm-6">
                <LabeledInput label="purity">
                  <Validated error={errors && errors.purity}>
                    <InputWithUnits
                      name="purity"
                      dimension="symbol"
                      symbol="%"
                      value={resource.purity ? _.toNumber(resource.purity) : ''}
                      onChange={(e) => {
                        this.props.update({
                          purity: e.target.numericValue
                        });
                      }}
                      disabled={this.state.readOnly}
                    />
                  </Validated>
                </LabeledInput>
              </div>
            )}
          </div>
          <div className="row">
            {(resource.kind === 'ChemicalStructure') && (
              <div className="col-sm-2">
                <LabeledInput label="hazard">
                  {compound && (
                    <HazardPopoverTags hazards={getHazardsFromCompound(compound)} />
                  )}
                </LabeledInput>
              </div>
            )}
          </div>
        </div>
        <div className="col-sm-5">
          {(resource.kind === 'ChemicalStructure') && (
            compound ? (
              <LabeledInput label="compound">
                <div className="edit-resource__molecule-viewer">
                  <MoleculeViewer
                    size="small"
                    SMILES={compound.get('smiles')}
                    name={compound_name}
                    properties={properties}
                    action={resource.readOnly ? undefined : this.action()}
                  />
                </div>
              </LabeledInput>
            ) : (
              (this.getCompoundAcs()) && (
                <LabeledInput label="compound">
                  <Button
                    type="secondary"
                    size="medium"
                    heavy
                    onClick={this.onDrawerClick}
                    disabled={this.state.readOnly}
                  >
                    Link compound
                  </Button>
                </LabeledInput>
              )
            )
          )}
        </div>
      </div>
    );
  }
}

export default EditResource;
