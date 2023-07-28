import Classnames from 'classnames';
import Immutable  from 'immutable';
import _          from 'lodash';
import PropTypes  from 'prop-types';
import React      from 'react';

import { GriddleTable, Section, Button, ButtonGroup, Unit, Utilities } from '@transcriptic/amino';
import AliquotActions            from 'main/actions/AliquotActions';
import LocationPath              from 'main/components/LocationPath';
import UserContainerDetails      from 'main/inventory/locations/UserContainerDetails';
import BaseTableTypes            from 'main/components/BaseTableTypes';
import RowWrappedGrid            from 'main/components/grid';
import ContainerTypeHelper       from 'main/helpers/ContainerType';
import { getScalarInDefaultUnits, getRepresentationalQuantity } from 'main/util/MeasurementUtil';
import LocationStore from 'main/stores/LocationStore';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import ContainerActions from 'main/actions/ContainerActions';
import { LocationAssignmentModal } from 'main/models/LocationSelectorModal/LocationSelectorModal';
import ModalActions from 'main/actions/ModalActions';

const { ManualLiHaDisplayScale } = Utilities.Units;

class CurrentProvisionSpec extends React.Component {
  static get propTypes() {
    return {
      provisionsByContainerId: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      refsByName: PropTypes.instanceOf(Immutable.Map).isRequired, // refName -> ref
      provisionSpecContainers: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      refetchAutoProvision: PropTypes.func.isRequired,
      currentNavigation: PropTypes.string.isRequired,
      onEditContainer: PropTypes.func.isRequired,
      runCompleted: PropTypes.bool.isRequired,
      instructionCompleted: PropTypes.bool.isRequired,
      measurementMode: PropTypes.oneOf(['mass', 'volume'])
    };
  }

  static get defaultProps() {
    return {
      measurementMode: 'volume'
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      editingContainerId: undefined,
      editingVolumeContainerId: undefined,
      showContainerDetails: false
    };
  }

  componentDidUpdate(prevProps, _prevState) {
    if (prevProps.currentNavigation === 'CONTAINER EDIT' &&
        this.props.currentNavigation === 'CURRENT SPEC' &&
        this.state.editingContainerId) {
      this.resetEditingContainerId();
    }

    return undefined;
  }

  onChangeProvisionableVolume(provisionableVolume) {
    const container = this.props.provisionSpecContainers.find(c => c.get('id') === this.state.editingVolumeContainerId);

    // Source containers for provision are all tubes therefore only have one aliquot with wellIndex 0
    return AliquotActions.updateWellIdx(0, container.get('id'), {
      volume_ul: provisionableVolume
    }).done(() => {
      this.setState({
        editingVolumeContainerId: undefined
      });
      return this.props.refetchAutoProvision();
    });
  }

  onEditContainer(containerId) {
    this.setState({
      editingContainerId: containerId
    });
    return this.props.onEditContainer();
  }

  onEditVolume(containerId) {
    if (this.state.editingVolumeContainerId === containerId) {
      return this.setState({
        editingVolumeContainerId: undefined
      });
    } else {
      return this.setState({
        editingVolumeContainerId: containerId
      });
    }
  }

  resetEditingContainerId() {
    this.setState({
      editingContainerId: undefined
    });
  }

  render() {
    return (
      <div className="current-provision-spec">
        <Choose>
          <When condition={this.state.editingContainerId}>
            <ContainerEditView
              container={this.props.provisionSpecContainers.find(c => c.get('id') === this.state.editingContainerId)}
              onContainerEdited={this.props.refetchAutoProvision}
            />
          </When>
          <Otherwise>
            <div className="provision-summary-view">
              { this.props.showManualButton && this.props.errors }
              {!this.props.instructionCompleted && !this.props.showManualButton && (
                <ButtonGroup>
                  <Button size="large" type="primary" onClick={() => this.props.refetchAutoProvision('exhaust')}>
                    Generate Provisions (Exhaust Inventory)
                  </Button>
                  <Button size="large" type="primary" onClick={() => this.props.refetchAutoProvision('large')}>
                    Generate Provisions (Large Containers)
                  </Button>
                </ButtonGroup>
              )}
              <RowWrappedGrid gridClassname="provisions-summary">
                {this.props.provisionsByContainerId.entrySeq().map((...args) => {
                  const [containerId, provisions] = Array.from(args[0]);
                  const container = this.props.provisionSpecContainers.find(c => c.get('id') === containerId);

                  return (
                    <ContainerProvisions
                      key={containerId}
                      container={container}
                      provisions={provisions}
                      refsByName={this.props.refsByName}
                      editingVolume={containerId === this.state.editingVolumeContainerId}
                      runCompleted={this.props.runCompleted}
                      onEditContainer={cid => this.onEditContainer(cid)}
                      onEditVolume={cid => this.onEditVolume(cid)}
                      onChangeProvisionableVolume={volume => this.onChangeProvisionableVolume(volume)}
                      measurementMode={this.props.measurementMode}
                    />
                  );

                })}
              </RowWrappedGrid>
              <a
                className="container-details"
                onClick={() => this.setState({
                  showContainerDetails: !this.state.showContainerDetails
                })}
              >
                Show/Hide Container Details
              </a>
              <If
                condition={this.state.showContainerDetails}
              >
                <GriddleTable
                  tableTypes={BaseTableTypes}
                  results={this.props.provisionSpecContainers.toJS().map((c) => {
                    const container = _.pick(c, 'id', 'label');
                    const container_type = ContainerTypeStore.getById(c.container_type_id).toJS();
                    const location = LocationStore.getById(c.location_id).toJS();
                    return { container, ...c, container_type, location };
                  })}
                  resultsPerPage={this.props.provisionSpecContainers.count()}
                  showPager={false}
                  showSettings={false}
                  columns={[
                    { columnName: 'container', type: 'ContainerUrl', sortable: true },
                    { columnName: 'barcode', type: 'Text', sortable: true },
                    { columnName: 'container_type_id', type: 'Text', sortable: true },
                    { columnName: 'volume_ul', type: 'Text', sortable: true },
                    { columnName: 'created_at', type: 'Time', sortable: true },
                    { columnName: 'expires_at', type: 'Time', sortable: true },
                    { columnName: 'status', type: 'Text', sortable: true },
                    { columnName: 'location', type: 'Location', sortable: true }
                  ]}
                />
              </If>
            </div>
          </Otherwise>
        </Choose>
      </div>
    );
  }
}

// ### Helpers
const createContainerHelper = function(ref) {
  const containerType = ref.get('container_type');
  return new ContainerTypeHelper({
    well_count: containerType.get('well_count'),
    col_count: containerType.get('col_count')
  });
};

function ContainerProvisions(props) {
  const wellIndexGroupedProvisions = () => {
    return props.provisions.groupBy(provision => provision.get('well').split('/')[1]);
  };

  const containerHelper = () => {
    const refName = props.provisions.first().get('well').split('/')[0];
    return createContainerHelper(props.refsByName.get(refName));
  };

  const humanWellIndex = (wellIndex) => {
    return containerHelper().humanWell(wellIndex);
  };

  const wellIndexQuantitySum = (provisions, mode) => {
    return provisions.reduce((sum, provision) => {
      const quantity = getScalarInDefaultUnits(provision, mode);
      return sum + quantity;
    }, 0);
  };

  const containerProvisionableVolume = (wellIndex) => {
    return wellIndexGroupedProvisions().entrySeq().reduce((sum, ...rest) => {
      const [index, provisions] = Array.from(rest[0]);
      if (parseInt(index, 10) < parseInt(wellIndex, 10)) {
        return sum + wellIndexQuantitySum(provisions, props.measurementMode);
      } else {
        return sum;
      }
    }, 0);
  };

  const { onChangeProvisionableVolume } = props;

  return (
    <div className="container-provisions">
      <If condition={props.editingVolume}>
        <div className="select-prompt">
          {"Select the first well that can't be provisioned to"}
        </div>
      </If>
      <div className="container-provisions-summary">
        <dl className="dl-horizontal">
          <dt>Id</dt>
          <dd>
            {props.container && props.container.get('id')}
          </dd><dt>Name</dt>
          <dd>
            {props.container.get('label', '-')}
          </dd><dt>Barcode</dt>
          <dd>
            {props.container.get('barcode', '-')}
          </dd><dt>Location</dt>
          <dd>
            <Choose>
              <When condition={LocationStore.getById(props.container.get('location_id'))}>
                <LocationPath
                  location={LocationStore.getById(props.container.get('location_id'))}
                  containerId={props.container.get('id')}
                  position={props.container.getIn(['slot', 'row'])}
                  withLinks
                />
              </When>
              <Otherwise>
                -
              </Otherwise>
            </Choose>
          </dd><dt>Provisions</dt>
          {wellIndexGroupedProvisions().entrySeq().map((...args) => {
            const [wellIndex, provisions] = Array.from(args[0]);
            const quantityWithDefaultUnit = wellIndexQuantitySum(provisions, props.measurementMode);
            const quantityWithUnit = getRepresentationalQuantity(quantityWithDefaultUnit, props.measurementMode);
            return (
              <dd
                role="button" // eslint-disable-line jsx-a11y/no-noninteractive-element-to-interactive-role
                className={
                  Classnames('tx-inline', 'tx-inline--xxs', {
                    selectable: props.editingVolume,
                    'provision-info': true
                  })}
                key={wellIndex}
                onClick={
                  () => {
                    if (props.editingVolume) {
                      return onChangeProvisionableVolume(containerProvisionableVolume(wellIndex));
                    }

                    return undefined;
                  }}
              >
                <Unit value={quantityWithUnit} shortUnits scale={ManualLiHaDisplayScale} />
                <i className="fa fa-long-arrow-alt-right" />
                <span>{humanWellIndex(wellIndex)}</span>
              </dd>
            );
          })}
        </dl>
      </div>
      <If condition={!props.runCompleted}>
        <div className="edit-buttons">
          <a onClick={() => props.onEditContainer(props.container.get('id'))}>
            <i className="far fa-edit" />
          </a>
          <a onClick={() => props.onEditVolume(props.container.get('id'))}>
            <i
              className={Classnames('fa', 'fa-flask', {
                editing: props.editingVolume
              })}
            />
          </a>
        </div>
      </If>
    </div>
  );
}

ContainerProvisions.propTypes = {
  container: PropTypes.instanceOf(Immutable.Map).isRequired,
  provisions: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  refsByName: PropTypes.instanceOf(Immutable.Map).isRequired, // refName -> ref
  onEditContainer: PropTypes.func.isRequired,
  onEditVolume: PropTypes.func.isRequired,
  onChangeProvisionableVolume: PropTypes.func.isRequired,
  editingVolume: PropTypes.bool.isRequired,
  runCompleted: PropTypes.bool.isRequired,
  showManualButton: PropTypes.bool,
  errors: PropTypes.array
};

function ContainerEditView(props) {
  const onDestroyContainer = () => {
    const { container } = props;
    if (confirm(`Delete container ${container.get('label') ? container.get('label') : container.get('id')}?`)) {
      return ContainerActions.destroyContainer(container.get('id'), false).done(() => props.onContainerEdited());
    }

    return undefined;
  };

  const onRelocateContainer = (locationId) => {
    const { container } = props;
    if (
      confirm(`Relocate container ${container.get('label') ? container.get('label') : container.get('id')}
               to location ${locationId}?`)
    ) {
      return ContainerActions.relocate(container.get('id'), locationId).done(() => props.onContainerEdited());
    }

    return undefined;
  };

  return (
    <div className="container-edit-pane">
      <Section title="Container Edit">
        <div className="container-edit">
          <ButtonGroup>
            <Button
              type="primary"
              size="small"
              className="primary"
              onClick={() => ModalActions.open(`${LocationAssignmentModal.MODAL_ID}${props.container.get('id')}`)}
            >
              Relocate
            </Button>
            <Button type="danger" size="small" onClick={onDestroyContainer}>
              Destroy
            </Button>
          </ButtonGroup>
          <UserContainerDetails container={props.container} onContainerEdited={props.onContainerEdited} />
          <LocationAssignmentModal
            container={props.container}
            initialLocationId={props.container.get('location_id')}
            onLocationSelected={locationId => onRelocateContainer(locationId)}
            labIdForFilter={props.container.get('lab') && props.container.get('lab').get('id')}
          />
        </div>
      </Section>
    </div>
  );
}

ContainerEditView.propTypes = {
  container: PropTypes.instanceOf(Immutable.Map).isRequired,
  onContainerEdited: PropTypes.func.isRequired
};

export default CurrentProvisionSpec;
