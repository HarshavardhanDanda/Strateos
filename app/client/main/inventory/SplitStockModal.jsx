import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';
import isBlank   from 'underscore.string/isBlank';

import ContainerActions                                from 'main/actions/ContainerActions';
import LocationSelectInput from 'main/components/LocationSelectInput';
import { SinglePaneModal }                             from 'main/components/Modal';
import { VerticalButtonGroup }                         from 'main/components/button';
import SelectStorage                                   from 'main/components/Input';
import { Card, FormGroup, Validated, Select, InputWithUnits, LabeledInput, TextInput } from '@transcriptic/amino';
import { validators }                                  from 'main/components/validation';
import ContainerStore                                  from 'main/stores/ContainerStore';
import ContainerTypeStore                              from 'main/stores/ContainerTypeStore';
import LocationStore                                   from 'main/stores/LocationStore';
import ajax                                            from 'main/util/ajax';
import * as Unit                                       from 'main/util/unit';
import ConnectToStoresHOC                              from 'main/containers/ConnectToStoresHOC';
import './SplitStockModal.scss';
/* eslint-disable jsx-a11y/label-has-for */

const SplitLogic = {
  initialContainersAttrs(sourceContainer) {
    // intially create one container that loads source's container's location.
    const container = this.newContainer().set('defaultLocationId', sourceContainer.get('location_id'));
    return Immutable.List([container]);
  },

  addContainer(containersAttrs, initialAttrs = Immutable.Map()) {
    const container = this.newContainer().merge(initialAttrs);
    return containersAttrs.push(container);
  },

  usedQuantityReducer(type) {
    return function(total, c) {
      const scalar = Unit.toScalar(c.get(type, '0'), type === 'volume' ? 'microliter' : 'milligram');
      return scalar != undefined ? (total + scalar) : 0;
    };
  },

  newContainer() {
    return Immutable.Map({
      barcode: undefined,
      label: undefined,
      storage: 'cold_4',
      volume: undefined,
      mass: ':milligram',
      containerType: 'micro-1.5', // For now must be a tube
      locationId: undefined,
      defaultLocationId: undefined // when goes to a particular location without selecting.
    });
  },

  errors(containersAttrs, sourceAliquot) {
    return containersAttrs.map(container => this.error(container, sourceAliquot));
  },

  errorBooleans(containersAttrs, sourceAliquot) {
    const usedQuantities = {};
    if (sourceAliquot && sourceAliquot.get('volume_ul')) {
      usedQuantities.mass = sourceAliquot.get('volume_ul') - containersAttrs.reduce(this.usedQuantityReducer('volume', 0));
    }
    if (sourceAliquot && sourceAliquot.get('mass_mg')) {
      usedQuantities.mass = sourceAliquot.get('mass_mg') - containersAttrs.reduce(this.usedQuantityReducer('mass', 0));
    }
    const errors = this.errors(containersAttrs, sourceAliquot, usedQuantities);
    return errors.map(cErrors => cErrors.some(error => error));
  },

  error(container, sourceAliquot, usedQuantities) {
    const maxVolume       = sourceAliquot && usedQuantities && (sourceAliquot.get('volume_ul') - usedQuantities.volume);
    const maxMass       = sourceAliquot && usedQuantities && (sourceAliquot.get('mass_mg') - usedQuantities.mass);
    const volume          = Unit.toScalar(container.get('volume'), 'microliter');
    const mass          = Unit.toScalar(container.get('mass'), 'milligram');
    const volumeValidator = maxVolume != undefined ? validators.between(0, maxVolume) : validators.positive_float;
    const massValidator = maxMass != undefined ? validators.between(0, maxMass) : validators.positive_float;
    const errorBody = {
      barcode:    this.errorMsg(container.get('barcode'), [validators.non_empty, validators.not_too_long], true),
      label:      this.errorMsg(container.get('label'), [validators.non_empty, validators.not_too_long], true),
      locationId: this.errorMsg(container.get('locationId'), [validators.non_empty])
    };
    if (volume) {
      errorBody.volume = this.errorMsg(volume, [volumeValidator]);
    } else {
      errorBody.mass = this.errorMsg(mass, [massValidator]);
    }
    return Immutable.fromJS(errorBody);
  },

  errorMsg(value, validatorsArr, optional = false) {
    if (optional && isBlank(value)) {
      return undefined;
    }

    for (const validator of validatorsArr) { // eslint-disable-line no-restricted-syntax
      const msg = validator(value);

      if (msg != undefined) {
        return msg;
      }
    }

    return undefined;
  },

  forceErrors(containersAttrs, index) {
    return containersAttrs.setIn([index, 'force_validate'], true);
  },

  forceAllErrors(containersAttrs) {
    return containersAttrs.map(c => c.set('force_validate', true));
  },

  buildContainers(containersAttrs, source_container_omc_id, sourceAliquot) {
    const sourceMass = sourceAliquot && sourceAliquot.get('mass_mg');
    const sourceVolume = sourceAliquot && sourceAliquot.get('volume_ul');
    return containersAttrs.map((c) => {
      const volume = Unit.toScalar(c.get('volume'), 'microliter');
      const mass = sourceMass ? (volume ? ((volume * sourceMass) / sourceVolume) : Unit.toScalar(c.get('mass'), 'milligram')) : undefined;

      return {
        barcode: c.get('barcode'),
        label: c.get('label'),
        storage_condition: c.get('storage'),
        container_type: c.get('containerType'),
        location_id: c.get('locationId'),
        orderable_material_component_id: source_container_omc_id,
        aliquots: {
          0: {
            well_idx: 0,
            volume_ul: volume,
            mass_mg: mass
          }
        }
      };
    });
  }
};

const propTypes = {
  sourceContainer: PropTypes.instanceOf(Immutable.Map).isRequired,
  onSplit:         PropTypes.func, // A function that returns the containerIds of the newly created containers
  isLoaded:        PropTypes.bool.isRequired
};

const MODAL_ID = 'SPLIT_STOCK_MODAL';

class SplitStockModal extends React.Component {
  constructor(props, context) {
    super(props, context);

    _.bindAll(
      this,
      'onUpdateCurrentContainer',
      'onAddContainer',
      'onDeleteContainer',
      'onContainerSelected',
      'onSubmit'
    );

    this.state = {
      containersAttrs: SplitLogic.initialContainersAttrs(this.props.sourceContainer),
      selectedContainerIndex: 0
    };
  }

  componentDidUpdate(prevProps) {

    if (prevProps.sourceContainer.get('id') !== this.props.sourceContainer.get('id')) {
      this.setState({
        containersAttrs: SplitLogic.initialContainersAttrs(this.props.sourceContainer),
        selectedContainerIndex: 0,
      });
    }
  }

  onUpdateCurrentContainer(container) {
    const containersAttrs = this.state.containersAttrs.set(this.state.selectedContainerIndex, container);

    return this.setState({
      containersAttrs
    });
  }

  onAddContainer() {
    // copy current container's attributes.
    const currentContainer  = this.currentContainer();
    const defaultLocationId = currentContainer.get('locationId') || currentContainer.get('defaultLocationId');

    const location     = LocationStore.getById(defaultLocationId);
    const nextLocation = LocationStore.nearestAvailableLocation(location, this.unavailableLocations());

    let container         = currentContainer.filterNot((v, k) => _.includes(['barcode', 'locationId'], k));
    container             = container.set('defaultLocationId', defaultLocationId);
    container             = container.set('locationId', nextLocation.get('id'));
    const containersAttrs = SplitLogic.addContainer(this.state.containersAttrs, container);

    const selectedContainerIndex = this.state.containersAttrs.size;
    this.setState({ containersAttrs, selectedContainerIndex });
  }

  onDeleteContainer(index) {
    const containersAttrs = this.state.containersAttrs.delete(index);
    let { selectedContainerIndex } = this.state;

    if (selectedContainerIndex >= containersAttrs.size) {
      selectedContainerIndex = containersAttrs.size - 1;
    }

    this.setState({ containersAttrs, selectedContainerIndex });
  }

  onContainerSelected(selectedContainerIndex) {
    this.setState({ selectedContainerIndex });
  }

  onSubmit() {
    const sourceAliquot = this.props.sourceContainer && this.props.sourceContainer.getIn(['aliquots', 0]);
    const errorBooleans = sourceAliquot && SplitLogic.errorBooleans(this.state.containersAttrs, sourceAliquot);
    const isValid       = errorBooleans.every(e => !e);
    if (isValid) {
      const sourceId        = this.props.sourceContainer.get('id');
      const builtContainers = SplitLogic.buildContainers(this.state.containersAttrs, this.props.sourceContainer.get('orderable_material_component_id'), sourceAliquot);
      const promise         = ContainerActions.split(sourceId, builtContainers);

      promise.done((containers) => {
        const allIds = containers.map(c => c.id);
        const ids    = Immutable.List(allIds).filter(id => id !== sourceId);

        if (this.props.onSplit) {
          this.props.onSplit(ids);
        }
      });

      return promise;
    } else {
      const selectedContainerIndex = errorBooleans.indexOf(true);
      const containersAttrs        = SplitLogic.forceAllErrors(this.state.containersAttrs);

      this.setState({ containersAttrs, selectedContainerIndex });

      // SinglePaneModal requires a promise/deferred.
      return (new ajax.Deferred()).reject();
    }
  }

  currentContainer() {
    if (this.state.selectedContainerIndex != undefined) {
      return this.state.containersAttrs.get(this.state.selectedContainerIndex);
    }

    return undefined;
  }

  prohibitedLocations() {
    const locationIds = this.state.containersAttrs.map(container => container.get('locationId'));
    const locations   = LocationStore.getByIds(locationIds);

    return LocationStore.filterSingleCapacity(locations)
      .map(l => l.get('id'))
      .toSet();
  }

  unavailableLocations(locationId) {
    // positions that the current container cannot select.
    const filledLocations = ContainerStore.containersAt(locationId)
      .map(container => container.get('location'))
      .toSet();

    return filledLocations.concat(this.prohibitedLocations());
  }

  render() {
    if (!this.props.isLoaded) {
      return null; // eslint-disable-line no-null/no-null
    }

    const sourceAliquot = this.props.sourceContainer.getIn(['aliquots', 0]);

    const errors        = sourceAliquot && SplitLogic.errors(this.state.containersAttrs, sourceAliquot);
    const errorBooleans = sourceAliquot && SplitLogic.errorBooleans(this.state.containersAttrs, sourceAliquot);
    const hasVolume = this.props.sourceContainer.getIn(['aliquots', '0', 'volume_ul']) > 0;

    return (
      <SinglePaneModal
        modalId={MODAL_ID}
        title="Split Stock"
        acceptText="Submit"
        onAccept={this.onSubmit}
        modalSize="large"
      >
        <div className="split-stock">
          <div className="stock-description">
            <SourceContainerInfo
              container={this.props.sourceContainer}
              containersAttrs={this.state.containersAttrs}
              type={hasVolume ? 'volume' : 'mass'}
            />
          </div>
          <div className="create-containers-list-pane">
            <div className="create-containers-list-pane__title">
              <label>New Containers</label>
              <a onClick={_e => this.onAddContainer()}>
                <i className="fa fa-plus" />
              </a>
            </div>
            <VerticalButtonGroup
              onClick={i => this.onContainerSelected(i)}
              onDelete={i => this.onDeleteContainer(i)}
              deleteEnabled={this.state.containersAttrs.size > 1}
              values={this.state.containersAttrs.map((c, i) =>
                Immutable.Map({
                  value: _.isEmpty(c.get('label'))
                    ? `Unnamed (${i})`
                    : c.get('label'),
                  active: i === this.state.selectedContainerIndex,
                  hasError:
                    errorBooleans && errorBooleans.get(i) && c.get('force_validate')
                })
              )}
            />
          </div>
          <div className="container-pane">
            <p className="desc">
              <label>Details</label>
            </p>
            <If condition={this.currentContainer()}>
              <AdminTubeCreate
                inputValues={this.currentContainer()}
                errors={errors && errors.get(this.state.selectedContainerIndex)}
                prohibitedLocations={this.prohibitedLocations()}
                onInputValuesChange={this.onUpdateCurrentContainer}
                disabled={false}
                type={hasVolume ? 'volume' : 'mass'}
                containerLabId={this.props.sourceContainer.getIn(['lab', 'id'])}
              />
            </If>
          </div>
        </div>
      </SinglePaneModal>
    );
  }
}

class SourceContainerInfo extends React.PureComponent {

  static get propTypes() {
    return {
      container:       PropTypes.instanceOf(Immutable.Map),
      containersAttrs: PropTypes.instanceOf(Immutable.Collection),
      type: PropTypes.string.isRequired
    };
  }

  aliquot() {
    // assume tubes
    return this.props.container.getIn(['aliquots', '0']);
  }

  initialVolume() {
    return Number(this.aliquot().get('volume_ul', 0));
  }

  initialMass() {
    return Number(this.aliquot().get('mass_mg', 0));
  }

  usedVolume() {
    return this.props.containersAttrs.reduce(SplitLogic.usedQuantityReducer('volume'), 0);
  }

  usedMass() {
    return this.props.containersAttrs.reduce(SplitLogic.usedQuantityReducer('mass'), 0);
  }

  remainingVolume() {
    return this.initialVolume() - this.usedVolume();
  }

  remainingMass() {
    return this.initialMass() - this.usedMass();
  }

  render() {
    const remainingValue = this.props.type === 'volume' ? this.remainingVolume() : this.remainingMass();

    return (
      <div className="source-container-info">
        <FormGroup label="Source Name">
          <p>
            {this.props.container.get('label') || this.props.container.get('id')}
          </p>
        </FormGroup>
        <FormGroup label="Source ContainerType">
          <p>{this.props.container.getIn(['container_type', 'id'], '-')}</p>
        </FormGroup>
        <FormGroup label="Source Resource">
          <p>{this.aliquot().getIn(['resource', 'name'], '-')}</p>
        </FormGroup>
        <FormGroup label={`Source Initial ${_.capitalize(this.props.type)}`}>
          <p>{this.props.type === 'volume' ? this.initialVolume() : this.initialMass()}</p>
        </FormGroup>
        <Validated
          force_validate
          error={isNaN(remainingValue) || remainingValue < 0 ? `Warning: ${this.props.type} exceeded` : undefined}
        >
          <FormGroup label={`Source Remaining ${_.capitalize(this.props.type)}`}>
            <p>{remainingValue}</p>
          </FormGroup>
        </Validated>
      </div>
    );
  }
}

class AdminTubeCreate extends React.PureComponent {

  static get propTypes() {
    return {
      inputValues:         PropTypes.instanceOf(Immutable.Map).isRequired,
      errors:              PropTypes.instanceOf(Immutable.Map).isRequired,
      onInputValuesChange: PropTypes.func,
      disabled:            PropTypes.bool,
      prohibitedLocations: PropTypes.instanceOf(Immutable.Set),
      containerLabId:      PropTypes.string,
      type:      PropTypes.string.isRequired
    };
  }

  onInputChange(name, value) {
    this.props.onInputValuesChange(
      this.props.inputValues.set(name, value)
    );
  }

  render() {
    const force_validate = this.props.inputValues.get('force_validate');

    return (
      <Card>
        <div className="tube-create">
          <p>
            <span><strong>Instructions: </strong></span>Tell us a little about your tube.
          </p>
          <div className="tube-details-container">
            <img alt="tube" src="/images/icons/inventory_browser_icons/tube-large.svg" />
            <div className="tube-details">
              <Validated error={this.props.errors.get('label')} force_validate={force_validate}>
                <LabeledInput label="Label">
                  <TextInput
                    placeholder="Label"
                    disabled={this.props.disabled}
                    value={this.props.inputValues.get('label')}
                    onChange={e => this.onInputChange('label', e.target.value)}
                  />
                </LabeledInput>
              </Validated>
              <Validated error={this.props.errors.get('barcode')} force_validate={force_validate}>
                <LabeledInput label="Barcode">
                  <TextInput
                    placeholder="Barcode"
                    disabled={this.props.disabled}
                    value={this.props.inputValues.get('barcode')}
                    onChange={e => this.onInputChange('barcode', e.target.value)}
                  />
                </LabeledInput>
              </Validated>
              <div className="row">
                <div className="col-md-6">
                  <FormGroup label="Storage Temp">
                    <SelectStorage
                      disabled={this.props.disabled}
                      value={this.props.inputValues.get('storage')}
                      onChange={e => this.onInputChange('storage', e.target.value)}
                    />
                  </FormGroup>
                </div>
                <div className="col-md-6">
                  <FormGroup label="Container Type">
                    <Select
                      options={ContainerTypeStore.tubes().map(ctype => ({
                        name: ctype.get('id'),
                        value: ctype.get('id')
                      })).toJS()}
                      value={this.props.inputValues.get('containerType')}
                      onChange={e => this.onInputChange('containerType', e.target.value)}
                    />
                  </FormGroup>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Validated error={this.props.errors.get('locationId')} force_validate={force_validate}>
                    <FormGroup label="Location">
                      <LocationSelectInput
                        locationId={this.props.inputValues.get('locationId')}
                        defaultLocationId={this.props.inputValues.get(
                          'defaultLocationId'
                        )}
                        prohibitedLocations={this.props.prohibitedLocations}
                        onLocationSelected={(locationId) => {
                          const inputValues = this.props.inputValues.set('locationId', locationId);
                          this.props.onInputValuesChange(inputValues);
                        }}
                        labIdForFilter={this.props.containerLabId}
                      />
                    </FormGroup>
                  </Validated>
                </div>
                <div className="col-md-6">
                  <Validated error={this.props.errors.get(this.props.type)} force_validate={force_validate}>
                    <FormGroup label={_.capitalize(this.props.type)}>
                      <InputWithUnits
                        dimension={this.props.type}
                        disabled={this.props.disabled}
                        value={this.props.inputValues.get(this.props.type)}
                        onChange={e => this.onInputChange(this.props.type, e.target.value)}
                      />
                    </FormGroup>
                  </Validated>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }
}

SplitStockModal.propTypes = propTypes;

// The component uses stores, so we need to force re-render anytime stores change.
const ConnectedSplitStockModal = ConnectToStoresHOC(SplitStockModal, () => {
  const isLoaded = ContainerTypeStore.isLoaded() && ContainerStore.isLoaded();

  return {
    isLoaded
  };
});

ConnectedSplitStockModal.MODAL_ID = MODAL_ID;

export default ConnectedSplitStockModal;
