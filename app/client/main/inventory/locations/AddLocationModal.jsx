import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Spinner, LabeledInput, Select, Validated, TextInput } from '@transcriptic/amino';

import LocationActions from 'main/actions/LocationActions';
import LocationTypeActions from 'main/actions/LocationTypeActions';
import LocationUtil from 'main/util/LocationUtil';
import { SinglePaneModal } from 'main/components/Modal';
import { SimpleInputsValidator, validators } from 'main/components/validation';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import ContainerStore from 'main/stores/ContainerStore';
import LocationTypeStore from 'main/stores/LocationTypeStore';
import ajax from 'main/util/ajax';
import LocationBlacklistForm from 'main/components/LocationBlacklistForm';
import LabAPI from 'main/api/LabAPI';
import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';

// These represent different rack types. We manually measure
// the height of the cell and hard code them here.
const RACK_CELL_OPTIONS = [
  {
    value: 116.84,
    name: '116mm - large'
  },
  {
    value: 85,
    name: '85mm - small'
  },
  {
    value: 57,
    name: '57mm - x-small'
  }
];

const TISO_COLUMN_OPTIONS = _.range(10).map((value) => {
  return {
    name: value,
    value
  };
});

const MODAL_ID = 'ADD_LOCATION_MODAL';

class AddLocationModal extends React.Component {
  static get propTypes() {
    return {
      parentLocation: PropTypes.instanceOf(Immutable.Map)
    };
  }

  constructor(props) {
    super(props);

    this.locationTypeOptions = this.locationTypeOptions.bind(this);
    this.onModalOpen = this.onModalOpen.bind(this);

    this.state = {
      cellHeightMM: null,
      rows: '',
      cols: '',
      environment: 'None',
      forceValidate: false,
      loading: false,
      locationType: undefined,
      position: '0',
      name: undefined,
      submitting: false,
      blacklist: [],
      labs: [],
      selectedLab: this.props.parentLocation && this.props.parentLocation.get('lab_id')
    };
  }

  onModalOpen() {
    this.setState({
      loading: true
    });

    LocationTypeActions.loadAll()
      .fail(() => this.setState({
        loading: false
      }))
      .done(() => {
        const env = this.props.parentLocation
          ? this.props.parentLocation.getIn(['merged_properties', 'environment'])
          : undefined;

        this.setState({
          environment: env,
          locationType: this.validChildLocationTypes().first(),
          loading: false
        });
      });

    LabAPI.loadAllLabWithFeature(FeatureConstants.MANAGE_CONTAINER_LOCATIONS)
      .fail(() => {
      }).done((response) => {
        const labsWithPermission =  response.data.map((lab) => {
          return {
            id: lab.id,
            ...lab.attributes
          };
        });
        const labs = [];
        let selectedLab;

        labsWithPermission.forEach((tempLab, index) => {

          const lab = Immutable.Map(tempLab);
          const labId = lab.get('id');
          labs.push({
            value: labId,
            name: lab.get('name')
          });
          if (index === 0) {
            selectedLab = labId;
          }
        });
        this.setState({
          labs: labs,
          selectedLab: selectedLab
        });
      });
  }

  validChildLocationTypes() {
    const category = this.props.parentLocation.getIn(['location_type', 'category']);
    let categories = LocationUtil.addableChildCategories(category);

    const labId = this.props.parentLocation.get('lab_id');
    const canManageTisos = FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_TISOS, labId);
    if (!canManageTisos) {
      categories = categories.filter(category => category !== 'tiso');
    }
    return LocationTypeStore.getAllByCategories(categories);
  }

  locationTypeOptions() {
    const options = this.validChildLocationTypes().map((type) => {
      const name = `${type.get('name')} (category: ${type.get('category')})`;
      const value = type.get('id');

      return {
        name,
        value
      };
    });

    return options.toJS();
  }

  onAddLocationClicked() {
    if (this.validator().isValid(Immutable.Map(this.state))) {
      const properties = this.state.environment === 'None' || this.environmentDisabled() ? {} : {
        environment: this.state.environment
      };

      const location = {
        location_type_id: this.state.locationType ? this.state.locationType.get('id') : undefined,
        name: this.state.name,
        parent_id: this.props.parentLocation ? this.props.parentLocation.get('id') : undefined,
        properties,
        blacklist: this.state.blacklist,
        lab_id: (this.props.parentLocation && this.props.parentLocation.get('id')) ? this.props.parentLocation.get('lab_id') : this.state.selectedLab
      };

      let dimensions = [];

      if (this.boxIsSelected()) {
        dimensions = [parseInt(this.state.rows, 10), parseInt(this.state.cols, 10)];
      } else if (this.rackIsSelected()) {
        dimensions = [
          parseInt(this.state.rows, 10),
          parseInt(this.state.cols, 10),
          parseInt(this.state.cellHeightMM, 10)
        ];
      } else if (this.tisoColumnIsSelected()) {
        location.position = this.state.position;
      }

      const [rows, cols, cellHeightMM] = Array.from(dimensions);

      return LocationActions.createLocation(location, rows, cols, cellHeightMM)
        .always(() => this.setState({
          submitting: false
        }));
    } else {
      this.setState({
        forceValidate: true
      });

      return (new ajax.Deferred()).reject();
    }
  }

  onUpdateLocationType(locationType) {
    this.setState({
      locationType
    }, () => {
      if (this.boxIsSelected()) {
        const { rows, cols } = LocationUtil.defaultTubeBoxConfig();

        this.setState({
          rows,
          cols
        });
      } else if (this.rackIsSelected()) {
        const { rows, cols, cellHeightMM } = LocationUtil.defaultRackConfig();

        this.setState({
          rows,
          cols,
          cellHeightMM
        });
      }
    });
  }

  onUpdateLab(labId) {
    this.setState({
      selectedLab: labId
    });
  }

  validator() {
    const validatorsForPositiveIntegerFields = [validators.non_empty, validators.positive_integer];
    const validatorsForNumericFields = [validators.non_empty, validators.numeric];
    const dimensionValidators = (this.boxIsSelected() || this.rackIsSelected()) ? validatorsForPositiveIntegerFields : [];
    const cellHeightValidators = this.rackIsSelected() ? validatorsForNumericFields : [];

    return SimpleInputsValidator({
      name: {
        validators: [validators.non_empty]
      },
      locationType: {
        validators: [validators.non_null]
      },
      rows: {
        validators: dimensionValidators
      },
      cols: {
        validators: dimensionValidators
      },
      cellHeightMM: {
        validators: cellHeightValidators
      }
    });
  }

  locationType() {
    return this.state.locationType;
  }

  boxIsSelected() {
    return this.locationType() && this.locationType().get('category') === LocationUtil.categories.box;
  }

  rackIsSelected() {
    return this.locationType() && this.locationType().get('category') === LocationUtil.categories.rack;
  }

  tisoColumnIsSelected() {
    return this.locationType() && this.locationType().get('category') === LocationUtil.categories.tiso_column;
  }

  environmentDisabled() {
    return this.props.parentLocation
      ? this.props.parentLocation.hasIn(['merged_properties', 'environment'])
      : undefined;
  }

  environmentOptions() {
    return [
      {
        value: undefined,
        name: 'None'
      }
    ].concat(ContainerStore.validStorageConditions);
  }

  render() {
    const errors = this.validator().errors(Immutable.Map(this.state));

    return (
      <SinglePaneModal
        modalId={MODAL_ID}
        title="Add New Location"
        acceptText={this.state.submitting ? 'Adding...' : 'Add Location'}
        acceptBtnDisabled={this.state.submitting}
        onAccept={() => this.onAddLocationClicked()}
        onOpen={this.onModalOpen}
      >
        <Choose>
          <When condition={this.state.loading}>
            <Spinner />
          </When>
          <Otherwise>
            <div className="modal-body tx-stack tx-stack--xxs">
              <Validated error={errors.name} force_validate={this.state.forceValidate}>
                <LabeledInput label="Name">
                  <TextInput
                    value={this.state.name}
                    onChange={e => this.setState({
                      name: e.target.value
                    })}
                  />
                </LabeledInput>
              </Validated>
              <LabeledInput label="Environment (optional)">
                <Select
                  value={this.state.environment}
                  disabled={this.environmentDisabled()}
                  options={this.environmentOptions()}
                  onChange={e => this.setState({
                    environment: e.target.value
                  })}
                />
              </LabeledInput>
              <Validated
                error={errors.locationType}
                force_validate={this.state.forceValidate}
                form_group
              >
                <LabeledInput label="Location Type">
                  <Select
                    value={this.state.locationType ? this.state.locationType.get('id') : undefined}
                    options={this.locationTypeOptions()}
                    onChange={e => this.onUpdateLocationType(LocationTypeStore.getById(e.target.value))}
                  />
                </LabeledInput>
              </Validated>

              <If condition={!(this.props.parentLocation && this.props.parentLocation.get('id'))}>
                <Validated
                  error={validators.non_empty(this.state.selectedLab)}
                  force_validate={this.state.forceValidate}
                  form_group
                >
                  <LabeledInput label="Lab">
                    <Select
                      value={this.state.selectedLab}
                      options={this.state.labs}
                      onChange={e => this.onUpdateLab(e.target.value)}
                    />
                  </LabeledInput>
                </Validated>
              </If>
              <If condition={this.tisoColumnIsSelected()}>
                <Validated
                  error={validators.non_empty(this.state.position) || validators.numeric(this.state.position)}
                  force_validate={this.state.forceValidate}
                >
                  <LabeledInput label="Position">
                    <Select
                      value={this.state.position}
                      options={TISO_COLUMN_OPTIONS}
                      onChange={e => this.setState({
                        position: _.toString(e.target.value)
                      })}
                    />
                  </LabeledInput>
                </Validated>
              </If>

              <div>
                <If condition={this.boxIsSelected() || this.rackIsSelected()}>
                  <Validated
                    error={validators.non_empty(this.state.rows) || validators.positive_integer(this.state.rows)}
                    force_validate={this.state.forceValidate}
                  >
                    <LabeledInput label="Number of rows">
                      <TextInput
                        value={this.state.rows}
                        onChange={e => this.setState({
                          rows: e.target.value
                        })}
                      />
                    </LabeledInput>
                  </Validated>
                  <Validated
                    error={validators.non_empty(this.state.cols) || validators.positive_integer(this.state.cols)}
                    force_validate={this.state.forceValidate}
                  >
                    <LabeledInput label="Number of columns">
                      <TextInput
                        value={this.state.cols}
                        onChange={e => this.setState({
                          cols: e.target.value
                        })}
                      />
                    </LabeledInput>
                  </Validated>
                </If>

                <If condition={this.rackIsSelected()}>
                  <Validated
                    error={validators.non_empty(this.state.cellHeightMM) || validators.numeric(this.state.cellHeightMM)}
                    force_validate={this.state.forceValidate}
                  >
                    <LabeledInput label="Cell Height (mm)">
                      <Select
                        value={this.state.cellHeightMM}
                        options={RACK_CELL_OPTIONS}
                        onChange={e => this.setState({
                          cellHeightMM: parseFloat(e.target.value)
                        })}
                      />
                    </LabeledInput>
                  </Validated>
                </If>

                <LabeledInput label="Blacklisted hazard">
                  <LocationBlacklistForm
                    ancestorBlacklist={
                      this.props.parentLocation
                        ? [...this.props.parentLocation.get('blacklist', []), ...this.props.parentLocation.get('ancestor_blacklist', [])]
                        : []}
                    onChange={blacklist => this.setState({
                      blacklist
                    })}
                  />
                </LabeledInput>
              </div>
            </div>
          </Otherwise>
        </Choose>
      </SinglePaneModal>
    );
  }
}

const ConnectedAddLocationModal = ConnectToStores(AddLocationModal, () => {});
ConnectedAddLocationModal.MODAL_ID = MODAL_ID;

export default ConnectedAddLocationModal;
