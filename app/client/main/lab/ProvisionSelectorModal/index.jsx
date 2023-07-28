import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import ContainerTypeActions          from 'main/actions/ContainerTypeActions';
import ModalActions                  from 'main/actions/ModalActions';
import ResourceActions               from 'main/actions/ResourceActions';
import AliquotActions                from 'main/actions/AliquotActions';
import ContainerActions              from 'main/actions/ContainerActions';
import ProvisionSpecActions          from 'main/actions/ProvisionSpecActions';
import SplitStockModal               from 'main/inventory/SplitStockModal';
import LocationPath                  from 'main/components/LocationPath';
import CurrentProvisionSpec          from 'main/lab/CurrentProvisionSpec';
import Urls                          from 'main/util/urls';
import { SinglePaneModal, MultiStepModalPane }           from 'main/components/Modal';
import PagedStockView                from 'main/pages/PagedStockView';
import RowWrappedGrid                from 'main/components/grid';
import Unit                          from 'main/components/unit';
import ConnectToStores               from 'main/containers/ConnectToStoresHOC';
import ContainerTypeHelper           from 'main/helpers/ContainerType';
import AliquotStore                  from 'main/stores/AliquotStore';
import ContainerStore                from 'main/stores/ContainerStore';
import ProvisionSpecStore            from 'main/stores/ProvisionSpecStore';
import ResourceStore                 from 'main/stores/ResourceStore';
import { StockContainerSearchStore } from 'main/stores/search';
import ColorUtils                    from 'main/util/ColorUtils';
import ajax                          from 'main/util/ajax';
import { getScalarInDefaultUnits, getMeasurementUnitFromMode, getQuantity } from 'main/util/MeasurementUtil';

import { Spinner, Section, Validated, Select, DateTime } from '@transcriptic/amino';
import JsonAPIIngestor  from 'main/api/JsonAPIIngestor';
import LocationStore from 'main/stores/LocationStore';

import './ProvisionSelectorModal.scss';
// ### Helpers
const createContainerHelper = (ref) => {
  const containerType = ref.get('container_type');
  return new ContainerTypeHelper({
    well_count: containerType.get('well_count'),
    col_count: containerType.get('col_count')
  });
};

const MODAL_ID = 'PROVISION_SELECTOR_MODAL';

class ProvisionSelectorModal extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      loading: true,
      errors: [],
      showManualButton: false
    };
  }

  componentWillMount() {
    ResourceActions.loadMany([this.resourceId()]);
  }

  getProvisionSpec() {
    return ProvisionSpecStore.findByInstruction(this.props.instruction.get('id'));
  }

  setAliquotFields(containerParam) {
    const aliquots = AliquotStore.getByContainer(containerParam.get('id'));
    const volume_ul = aliquots.getIn([0, 'volume_ul']);
    const mass_mg = aliquots.getIn([0, 'mass_mg']);
    const aliquot_created_at = aliquots.getIn([0, 'created_at']);

    const container = containerParam.set('volume_ul', volume_ul);
    container.set('mass_mg', mass_mg);
    return container.set('aliquot_created_at', aliquot_created_at);
  }

  initialAutoProvisionFetch() {
    this.setState({ errors: [], showManualButton: false });

    if (this.getProvisionSpec()) {
      return this.loadContainers();
    }

    return this.fetchAutoProvision();
  }

  provisionSpecContainerIds() {
    if (!this.getProvisionSpec()) return undefined;

    return this.getProvisionSpec()
      .get('transfers')
      .map(transfer => transfer.get('from'))
      .toSet() || Immutable.Set();
  }

  fetchAutoProvision(mode = 'exhaust') {
    return this.setState(
      {
        loading: true
      },
      () => {
        return ProvisionSpecActions.autoProvision(
          this.props.runId,
          this.props.instruction.get('id'),
          mode
        )
          .done(() => this.loadContainers())
          .fail(xhr =>
            this.setState({
              loading: false,
              errors: xhr.responseJSON ? xhr.responseJSON.errors : [],
              showManualButton: xhr.responseJSON ? xhr.responseJSON.show_manual : false
            })
          );
      }
    );
  }

  hasDestroyedContainer(containers) {
    return _.find(containers, c => c.status === 'destroyed');
  }

  loadContainers() {
    const ids = this.provisionSpecContainerIds();
    if (!ids || ids.isEmpty()) {
      this.setState({ loading: false });
      return;
    }

    ContainerActions.loadManyContainers(ids.toJS())
      .done((container) => {
        const { containers } = JsonAPIIngestor.ingest(container);
        if (!this.props.runCompleted &&
            this.hasDestroyedContainer(containers) &&
            !this.props.instruction.get('completed_at')
        ) {
          return this.fetchAutoProvision();
        } else {
          const aliquots = containers.map(c =>
            AliquotActions.loadForContainer(c.id)
          );
          return ajax.when(...aliquots).done(() =>
            this.setState({
              loading: false
            })
          );
        }
      });
  }

  provisionSpecContainers() {
    const ids = this.provisionSpecContainerIds();
    if (!ids) {
      return Immutable.Iterable();
    }

    const containers = ContainerStore.getByIds(ids.toJS());
    const treatedContainers = containers.map(c => this.setAliquotFields(c));
    return Immutable.Iterable(treatedContainers);
  }

  resourceId() {
    return this.props.instruction.getIn(['operation', 'resource_id']);
  }

  resourceName() {
    const resource = ResourceStore.getById(this.resourceId());
    if (resource) {
      return resource.get('name');
    } else {
      return this.resourceId();
    }
  }

  render() {
    return (
      <SinglePaneModal
        modalId={this.props.modalId}
        modalSize="xlg"
        title={`Provision ${this.resourceName()} Containers`}
        modalClass="provision-selector-modal"
        onOpen={() => {
          ContainerTypeActions.loadAll();
          this.initialAutoProvisionFetch();
        }}
      >
        <Choose>
          <When condition={this.state.loading}>
            <Spinner />
          </When>
          <When condition={this.state.errors.length}>
            <div>
              {this.state.showManualButton ?
                (
                  <ProvisionSelector
                    modalId={this.props.modalId}
                    runId={this.props.runId}
                    instruction={this.props.instruction}
                    refsByName={this.props.refsByName}
                    runCompleted={this.props.completed}
                    provisionSpec={Immutable.Map()}
                    provisionSpecContainers={Immutable.Iterable()}
                    refetchAutoProvision={method => this.fetchAutoProvision(method)}
                    showManualButton={this.state.showManualButton}
                    errors={this.state.errors}
                  />
                ) :
                this.state.errors
              }
            </div>
          </When>
          <Otherwise>
            <div>
              <ProvisionSelector
                modalId={this.props.modalId}
                runId={this.props.runId}
                instruction={this.props.instruction}
                refsByName={this.props.refsByName}
                runCompleted={this.props.completed}
                provisionSpec={this.getProvisionSpec()}
                provisionSpecContainers={this.provisionSpecContainers()}
                refetchAutoProvision={method => this.fetchAutoProvision(method)}
                showManualButton={this.state.showManualButton}
              />
            </div>
          </Otherwise>
        </Choose>
      </SinglePaneModal>
    );
  }
}

ProvisionSelectorModal.propTypes = {
  runId: PropTypes.string.isRequired,
  instruction: PropTypes.instanceOf(Immutable.Map).isRequired,
  refsByName: PropTypes.instanceOf(Immutable.Map).isRequired,
  completed: PropTypes.bool.isRequired,
  modalId: PropTypes.string.isRequired,
  runCompleted: PropTypes.bool
};

class ProvisionSelector extends React.Component {
  static get navigation() {
    return ['CURRENT SPEC', 'CONTAINER EDIT', 'CONFIG', 'SUMMARY'];
  }

  constructor(props, context) {
    super(props, context);
    this.onActionClicked = this.onActionClicked.bind(this);
    this.onAddContainer = this.onAddContainer.bind(this);
    this.onBack = this.onBack.bind(this);
    this.onChangeSelectedContainers = this.onChangeSelectedContainers.bind(this);
    this.onContainerChosen = this.onContainerChosen.bind(this);
    this.onNext = this.onNext.bind(this);
    this.onRemoveContainer = this.onRemoveContainer.bind(this);
    this.onSplitClicked = this.onSplitClicked.bind(this);

    this.state = {
      navIndex: 0,
      selectedContainerIds: Immutable.Set(),
      addedContainerIds: Immutable.Set(),
      provisionMap: Immutable.Map(), // provisionId -> containerId
      defaultLocationId: undefined,
      forceValidate: false,
      waitingOnSubmit: false
    };
  }

  onSubmit() {
    const mode = this.getMode();
    if (this.isValid()) {
      const transfers = this.provisions().map((p) => {
        const [refName, to_well_idx] = Array.from(p.get('well').split('/'));

        const from = this.state.provisionMap.get(p.get('id'));
        const from_well_idx = 0;
        const to = refName;
        const quantity = getScalarInDefaultUnits(p, mode);
        const transfer = {
          from,
          from_well_idx,
          to,
          to_well_idx
        };
        transfer[mode] = quantity;
        return transfer;
      });

      return this.setState(
        {
          waitingOnSubmit: true
        },
        () => {
          const promise = ProvisionSpecActions.create(
            this.props.runId,
            this.props.instruction.get('id'),
            transfers
          );
          promise.always(() =>
            this.setState({
              waitingOnSubmit: false
            })
          );
          return promise.done(() => ModalActions.close(this.props.modalId));
        }
      );
    } else {
      return this.setState({
        forceValidate: true
      });
    }
  }

  onContainerChosen(provisionId, containerId) {
    const provisionMap = this.state.provisionMap.set(provisionId, containerId);
    return this.setState({
      provisionMap
    });
  }

  onBack() {
    if (this.navName() === 'CONFIG') {
      return this.setState({
        navIndex: ProvisionSelector.navigation.indexOf('CURRENT SPEC')
      });
    } else {
      return this.setState({
        navIndex: Math.max(0, this.state.navIndex - 1)
      });
    }
  }

  onNext(e) {
    e.stopPropagation();
    switch (this.navName()) {
      case 'CURRENT SPEC':
      case 'CONTAINER EDIT':
        return this.setState({
          navIndex: ProvisionSelector.navigation.indexOf('CONFIG')
        });
      case 'CONFIG':
        if (this.isValid()) {
          return this.setState({
            navIndex: this.state.navIndex + 1
          });
        } else {
          return this.setState({
            forceValidate: true
          });
        }
      case 'SUMMARY':
        return this.onSubmit();
      default:
        return undefined;
    }
  }

  onActionClicked(action) {
    this.provisionActions(action)(this.state.selectedContainerIds);
    if (action !== 'split') {
      return this.setState({
        selectedContainerIds: Immutable.Set()
      });
    }
  }

  onChangeSelectedContainers(selectedContainerIds) {
    return this.setState({
      selectedContainerIds: Immutable.Set(Object.keys(selectedContainerIds))
    });
  }

  onAddContainer(containerIds) {
    const mode = this.getMode();
    const addedContainerIds = this.state.addedContainerIds.concat(containerIds);
    let { provisionMap } = this.state;

    for (const containerId of containerIds) {
      // greedily use this new container to satisify provisions.
      const container = ContainerStore.getById(containerId);
      let remainingQuantity = Number(getQuantity(container.getIn(['aliquots', 0]), mode));
      let potentialProvisions = this.unsatisfiedProvisions(provisionMap);

      while (remainingQuantity > 0 && !potentialProvisions.isEmpty()) {
        // filter by quantity
        potentialProvisions = potentialProvisions.filter((p) => { // eslint-disable-line no-loop-func
          const quantity = getScalarInDefaultUnits(p, mode);
          return quantity <= remainingQuantity;
        });

        const provision = potentialProvisions.first();
        if (provision) {
          remainingQuantity -= getScalarInDefaultUnits(provision, mode);
          const provisionId = provision.get('id');
          provisionMap = provisionMap.set(provisionId, containerId);
          potentialProvisions = potentialProvisions.shift();
        }
      }
    }

    return this.setState({
      provisionMap,
      addedContainerIds
    });
  }

  onRemoveContainer(containerIds) {
    const addedContainerIds = this.state.addedContainerIds.filter((id) => {
      return !containerIds.includes(id);
    });
    const provisionMap = this.state.provisionMap.filter(
      _containerId => !containerIds.includes(_containerId)
    );
    return this.setState({
      provisionMap,
      addedContainerIds
    });
  }

  onSplitClicked() {
    return ModalActions.open(SplitStockModal.MODAL_ID);
  }

  onSplit(containerIds) {
    containerIds.map(id => this.onAddContainer(id));

    // refetch stock after split.
    return this.pagedStockView.reloadStock();
  }

  navName() {
    return ProvisionSelector.navigation[this.state.navIndex];
  }

  resourceId() {
    return this.props.instruction.getIn(['operation', 'resource_id']);
  }

  // TODO: All auto provision code should just use provision specs, shouldn't need to convert to map.
  provisionSpecToProvisionMap() {
    let provisionMap = Immutable.OrderedMap();
    const op = this.props.instruction.getIn(['operation', 'op']);

    this.props.provisionSpec.size > 0 && this.props.provisionSpec.get('transfers').map((transfer, i) => {
      const provision = Immutable.fromJS({
        id: op === 'provision' ? i : transfer.get('to_well_idx'),
        volume: `${transfer.get('volume')}:microliter`,
        mass: `${transfer.get('mass')}:milligram`,
        well: `${transfer.get('to')}/${transfer.get('to_well_idx')}`
      });

      const containerId = transfer.get('from');
      const containerProvisions = provisionMap
        .get(containerId, Immutable.OrderedSet())
        .add(provision);
      provisionMap = provisionMap.set(
        containerId,
        containerProvisions
      );
      return (provisionMap);
    });

    return provisionMap;
  }

  addedContainers() {
    return this.state.addedContainerIds.map(id => ContainerStore.getById(id));
  }

  provisions() {
    const op = this.props.instruction.getIn(['operation', 'op']);
    if (op === 'provision') {
      // List of provisions that need to be satisfied
      // We add an id field, which is just the index within the provision list
      // because we can't use wellName as a unique id.
      return this.props.instruction.getIn(['operation', 'to']).map((p, index) => p.set('id', index));
    } else if (op === 'dispense') {
      // Dynamically generate the individual transfers
      const refName = this.props.instruction.getIn(['operation', 'object']);
      const containerType = this.props.refsByName.getIn([
        refName,
        'container_type'
      ]);
      const wellCount = containerType.get('well_count');
      const colCount = containerType.get('col_count');
      const rowCount = wellCount / colCount;

      const columns = this.props.instruction.getIn(['operation', 'columns']);

      // convert columns into provision transfers.
      return columns
        .map((colData, _index) => {
          const col = colData.get('column');
          const vol = colData.get('volume');

          return Immutable.Range(0, rowCount).map((row) => {
            const wellIndex = (colCount * row) + col;
            return Immutable.Map({
              id: wellIndex,
              well: `${refName}/${wellIndex}`,
              volume: vol
            });
          });
        })
        .flatten(true);
    }

    return undefined;
  }

  provisionsByContainerId(provisionMap) {
    // convert provisionId -> containerId to
    //         containerId -> [provision, ...]
    //
    // Orders showing earliest referenced containers first.
    let resultMap = Immutable.OrderedMap();

    this.provisions().forEach((p) => {
      const provisionId = p.get('id');
      const provision = this.provisions().find(
        prov => prov.get('id') === provisionId
      );
      const containerId = provisionMap.get(provisionId);
      const containerProvisions = resultMap
        .get(containerId, Immutable.OrderedSet())
        .add(provision);
      resultMap = resultMap.set(containerId, containerProvisions);
      return (resultMap);
    });

    return resultMap;
  }

  unsatisfiedProvisions(provisionMap) {
    return this.provisions().filter(
      p => !provisionMap.get(p.get('id'))
    );
  }

  containerToUsableQuantity(measurementMode) {
    const measurementUnit = getMeasurementUnitFromMode(measurementMode);
    return this.addedContainers()
      .map((c) => {
        const quantity = Number(c.getIn(['aliquots', 0, measurementUnit]));
        return [c.get('id'), quantity];
      })
      .fromEntrySeq();
  }

  containerToUsedQuantity(measurementMode) {
    const provisions = this.provisions();

    const containerIdToProvisions = this.state.provisionMap
      .groupBy(containerId => containerId)
      .map((m) => {
        const provisionIds = m.keySeq();
        return provisionIds.map(id =>
          provisions.find(p => p.get('id') === id)
        );
      });

    return containerIdToProvisions.map(provs =>
      provs.reduce(
        (sum, p) => sum + getScalarInDefaultUnits(p, measurementMode),
        0
      )
    );
  }

  containerToRemainingQuantity(measurementMode) {
    const usableQuantity = this.containerToUsableQuantity(measurementMode);
    const usedQuantity = this.containerToUsedQuantity(measurementMode);
    return usableQuantity.map((quanity, cid) => quanity - usedQuantity.get(cid, 0));
  }

  provisionToError(measurementMode) {
    const remainingQuantity = this.containerToRemainingQuantity(measurementMode);

    return this.provisions()
      .map((p) => {
        const provisionId = p.get('id');
        const containerId = this.state.provisionMap.get(provisionId);
        let error;

        if (!containerId) {
          error = 'Must specify src container';
        } else if (remainingQuantity.get(containerId) < 0) {
          error = 'Quantity exceeded';
        }

        return [provisionId, error];
      })
      .fromEntrySeq()
      .toMap();
  }

  isValid() {
    const errors = this.provisionToError();
    return errors.valueSeq().every(error => !error);
  }

  provisionActions(action) {
    switch (action) {
      case 'add':
        return this.onAddContainer;
      case 'remove':
        return this.onRemoveContainer;
      case 'split':
        return this.onSplitClicked;
      default:
        return undefined;
    }
  }

  allContainersAddable() {
    return this.state.selectedContainerIds
      .subtract(this.state.addedContainerIds)
      .equals(this.state.selectedContainerIds);
  }

  allContainersRemovable() {
    return this.state.selectedContainerIds
      .intersect(this.state.addedContainerIds)
      .equals(this.state.selectedContainerIds);
  }

  canAdd() {
    return (
      this.state.selectedContainerIds.size > 0 && this.allContainersAddable()
    );
  }

  canRemove() {
    return (
      this.state.selectedContainerIds.size > 0 && this.allContainersRemovable()
    );
  }

  canSplit() {
    return this.state.selectedContainerIds.size === 1;
  }

  nextBtnName() {
    switch (this.navName()) {
      case 'CURRENT SPEC':
      case 'CONTAINER EDIT':
        return 'Manual';
      case 'CONFIG':
        return 'Next';
      case 'SUMMARY':
        return `Submit (${this.state.provisionMap.size})`;
      default:
        return undefined;
    }
  }

  showBack() {
    return this.navName() !== 'CURRENT SPEC';
  }

  nextBtnDisabled() {
    return (
      (this.navName() === 'CURRENT SPEC' ||
        this.navName() === 'CONTAINER EDIT') &&
      this.props.instruction.get('completed_at')
    );
  }

  currentSourceContainer() {
    if (
      this.state.selectedContainerIds === undefined ||
      this.state.selectedContainerIds.size !== 1
    ) {
      return Immutable.Map();
    }

    const containerId = this.state.selectedContainerIds.toList().get(0);
    return ContainerStore.getById(containerId);
  }

  getMode() {
    return this.props.instruction.getIn(['operation', 'measurement_mode'], 'volume');
  }

  getSelection() {
    const selection = {};
    this.state.selectedContainerIds.forEach((id) => {
      selection[id] = true;
    });
    return Immutable.fromJS(selection);
  }

  render() {
    const mode = this.getMode();
    return (
      <div className="provision-selector">
        {(() => {
          switch (this.navName()) {
            case 'CURRENT SPEC':
            case 'CONTAINER EDIT':
              return (
                <div className="current-specs-pane">
                  <CurrentProvisionSpec
                    provisionsByContainerId={this.provisionSpecToProvisionMap()}
                    refsByName={this.props.refsByName}
                    provisionSpecContainers={this.props.provisionSpecContainers}
                    refetchAutoProvision={this.props.refetchAutoProvision}
                    currentNavigation={this.navName()}
                    runCompleted={this.props.runCompleted}
                    instructionCompleted={!!this.props.instruction.get('completed_at')}
                    onEditContainer={() =>
                      this.setState({
                        navIndex: ProvisionSelector.navigation.indexOf('CONTAINER EDIT')
                      })}
                    measurementMode={mode}
                    showManualButton={this.props.showManualButton}
                    errors={this.props.errors}
                  />
                </div>
              );

            case 'CONFIG':
              return (
                <div className="configuration-pane">
                  <PagedStockView
                    ref={(node) => { this.pagedStockView = node; }}
                    selectedContainerIds={this.getSelection()}
                    onChangeSelectedContainers={this.onChangeSelectedContainers}
                    perPage={5}
                    loadStockAction={ContainerActions.loadStock}
                    searchStore={StockContainerSearchStore}
                    searchStoreQuery={this.resourceId()}
                    highlightedContainerIds={this.state.addedContainerIds}
                    searchParams={{
                      resource_id: this.resourceId(),
                      instruction_id: this.props.instruction.get('id')
                    }}
                    measurementMode={mode}
                    actions={[
                      {
                        title: 'Add',
                        action: () => this.onActionClicked('add'),
                        disabled: !this.canAdd()
                      },
                      {
                        title: 'Remove',
                        action: () => this.onActionClicked('remove'),
                        disabled: !this.canRemove()
                      },
                      {
                        title: 'Split',
                        action: () => this.onActionClicked('split'),
                        disabled: !this.canSplit()
                      }
                    ]}
                  />
                  <ProvisionToContainerList
                    provisions={this.provisions()}
                    provisionMap={this.state.provisionMap}
                    refsByName={this.props.refsByName}
                    addedContainers={this.addedContainers()}
                    provisionToError={this.provisionToError(mode)}
                    forceValidate={this.state.forceValidate}
                    onContainerChosen={this.onContainerChosen}
                    measurementMode={mode}
                  />
                  <SplitStockModal
                    sourceContainer={this.currentSourceContainer()}
                  />
                </div>
              );

            case 'SUMMARY':
              return (
                <Section title="Manual Provision Summary">
                  <ProvisionSummaryPane
                    provisionMap={this.state.provisionMap}
                    provisionsByContainerId={this.provisionsByContainerId(
                      this.state.provisionMap
                    )}
                    refsByName={this.props.refsByName}
                    addedContainers={this.addedContainers()}
                    measurementMode={mode}
                  />
                </Section>
              );

            default:
              return undefined;
          }
        })()}
        <MultiStepModalPane
          showBackButton={this.showBack()}
          onNavigateBack={this.onBack}
          onNavigateNext={this.onNext}
          nextBtnName={this.nextBtnName()}
          nextBtnDisabled={this.nextBtnDisabled()}
          waitingOnResponse={this.state.waitingOnSubmit}
          ref={(node) => { this.targetNode = node; }}
        />
      </div>
    );
  }
}

ProvisionSelector.propTypes = {
  runId: PropTypes.string.isRequired,
  instruction: PropTypes.instanceOf(Immutable.Map).isRequired,
  refsByName: PropTypes.instanceOf(Immutable.Map).isRequired,
  provisionSpec: PropTypes.instanceOf(Immutable.Map).isRequired,
  provisionSpecContainers: PropTypes.instanceOf(Immutable.Iterable),
  refetchAutoProvision: PropTypes.func.isRequired,
  runCompleted: PropTypes.bool.isRequired,
  modalId: PropTypes.string,
  showManualButton: PropTypes.bool.isRequired,
  errors: PropTypes.array
};

function TableRow({ container, measurementMode }) {
  const barcode = container.get('barcode');
  const label = container.get('label');
  const container_type_id = container.get('container_type_id');
  const id = container.get('id');
  let quantity = getQuantity(container.getIn(['aliquots', 0]), measurementMode);
  quantity = +Number(quantity).toFixed(2);
  const expiresAt = container.get('expires_at');
  const location = LocationStore.getById(container.get('location_id'));

  return (
    <tr>
      <td>
        <a href={Urls.container(id)}>
          {id}
        </a>
      </td>
      <td>
        <Choose>
          <When condition={barcode}>
            {barcode}
          </When>
          <Otherwise>-</Otherwise>
        </Choose>
      </td>
      <td>
        <Choose>
          <When condition={label}>
            {label}
          </When>
          <Otherwise>-</Otherwise>
        </Choose>
      </td>
      <td>
        <Choose>
          <When
            condition={container_type_id}
          >
            {container_type_id}
          </When>
          <Otherwise>-</Otherwise>
        </Choose>
      </td>
      <td>
        {quantity}
      </td>
      <td>
        <DateTime
          timestamp={container.getIn(['aliquots', 0, 'created_at'])}
        />
      </td>
      <td>
        <Choose>
          <When condition={expiresAt}>
            <DateTime timestamp={expiresAt} />
          </When>
          <Otherwise>-</Otherwise>
        </Choose>
      </td>
      <td className="wrap">
        <Choose>
          <When condition={location}>
            <LocationPath
              location={location}
              containerId={container.get('id')}
              position={container.getIn(['slot', 'row'])}
              withLinks
            />
          </When>
          <Otherwise>-</Otherwise>
        </Choose>
      </td>
    </tr>
  );
}

TableRow.propTypes = {
  container: PropTypes.instanceOf(Immutable.Map).isRequired,
  measurementMode: PropTypes.oneOf(['mass', 'volume'])
};

function ProvisionToContainerList({
  provisions,
  provisionMap,
  provisionToError,
  refsByName,
  addedContainers,
  forceValidate,
  onContainerChosen,
  measurementMode
}) {

  const refNames = () => {
    return provisions.map(p => p.get('well').split('/')[0]);
  };

  const refColorMap = () => {
    return ColorUtils.createColorMap(
      refNames(),
      ColorUtils.refColorPalette
    );
  };

  const provisionsByRefName = () => {
    return provisions.groupBy(v => v.get('well').split('/')[0]);
  };

  const selectOptions = (provision) => {
    const provisionQuantity = getScalarInDefaultUnits(provision, measurementMode);
    const usableContainers = addedContainers.filter((c) => {
      const measurementUnit = getMeasurementUnitFromMode(measurementMode);
      const quantity = Number(c.getIn(['aliquots', 0, measurementUnit]));
      return quantity >= provisionQuantity;
    });

    return usableContainers
      .map((c) => {
        const id = c.get('id');
        const barcode = c.get('barcode');
        const name = `id: ${id}, barcode: ${barcode}`;
        return {
          value: id,
          name
        };
      })
      .toJS();
  };

  const colorMap = refColorMap();

  return (
    <div className="provision-to-container-list">
      <h2>Choose Source Containers</h2>
      {provisionsByRefName().entrySeq().map((...args) => {
        const [refName, refProvisions] = Array.from(args[0]);
        const containerHelper = createContainerHelper(
          refsByName.get(refName)
        );
        return (
          <div className="ref-provisions-container" key={refName}>
            <div
              className="ref-name"
              style={{
                backgroundColor: colorMap.get(refName)
              }}
            >
              {refName}
            </div>
            <div className="ref-provisions">
              {refProvisions.map((provision, index) => {
                const provisionId = provision.get('id');
                const containerId = provisionMap.get(provisionId);
                const wellName = provision.get('well');
                const wellIndex = wellName.split('/')[1];

                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <div className="provision" key={index}>
                    <div className="destination">
                      <div className="name">
                        {`Well ${containerHelper.humanWell(wellIndex)}`}
                      </div>
                      <span className="volume">
                        <Unit value={provision.get(measurementMode)} />
                      </span>
                    </div>
                    <div className="source">
                      <Validated
                        error={provisionToError.get(provisionId)}
                        force_validate={forceValidate}
                      >
                        <Select
                          nullable
                          onChange={e =>
                            onContainerChosen(
                              provision.get('id'),
                              e.target.value
                            )}
                          options={selectOptions(provision)}
                          value={containerId}
                        />
                      </Validated>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

ProvisionToContainerList.propTypes = {
  provisions: PropTypes.instanceOf(Immutable.Iterable).isRequired, // list of {well, volume}
  provisionMap: PropTypes.instanceOf(Immutable.Map).isRequired, // provisionId -> containerId
  provisionToError: PropTypes.instanceOf(Immutable.Map).isRequired, // provisionId -> errorstr
  refsByName: PropTypes.instanceOf(Immutable.Map).isRequired, // refName -> ref
  addedContainers: PropTypes.instanceOf(Immutable.Iterable).isRequired, // list of usable containers
  forceValidate: PropTypes.bool,
  onContainerChosen: PropTypes.func.isRequired,
  measurementMode: PropTypes.oneOf(['mass', 'volume'])
};

function ProvisionSummaryPane({
  provisionMap,
  provisionsByContainerId,
  addedContainers,
  refsByName,
  measurementMode
}) {
  const srcColorMap = () => {
    const containerIds = provisionMap.valueSeq();
    return ColorUtils.createColorMap(containerIds, ColorUtils.refColorPalette);
  };

  const containerTable = (container) => {
    return (
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Barcode</th>
            <th>Label</th>
            <th>ContainerType</th>
            <th>Quantity</th>
            <th>Created</th>
            <th>Expiration</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          <TableRow container={container} measurementMode={measurementMode} />
        </tbody>
      </table>
    );
  };

  if (!addedContainers.size) {
    return <div className="empty">No containers found</div>;
  }

  const colorMap = srcColorMap();
  return (
    <div className="provision-summary">
      {provisionsByContainerId.entrySeq().map((...args) => {
        const [containerId, provisions] = Array.from(args[0]);
        const container = addedContainers.find(
          c => c.get('id') === containerId
        );
        return (
          <div className="container-section" key={containerId}>
            {containerTable(container)}
            <RowWrappedGrid gridClassname="container-provisions">
              {provisions.map((provision, index) => {
                const [refName, wellIndex] = Array.from(
                  provision.get('well').split('/')
                );
                const containerHelper = createContainerHelper(
                  refsByName.get(refName)
                );

                return (
                  <div
                    className="provision grid-element"
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    style={{
                      backgroundColor: colorMap.get(containerId)
                    }}
                  >
                    <div className="destination">
                      <div className="name">{`${containerId}`}</div>
                      <div className="name">
                        {`${refName}/${containerHelper.humanWell(wellIndex)}`}
                      </div>
                      <span className="volume">
                        <Unit value={provision.get('volume') || provision.get('mass')} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </RowWrappedGrid>
          </div>
        );
      })}
    </div>
  );
}

ProvisionSummaryPane.propTypes = {
  provisionMap: PropTypes.instanceOf(Immutable.Map).isRequired, // provisionId -> containerId
  provisionsByContainerId: PropTypes.instanceOf(Immutable.Iterable).isRequired, // containerId -> provisions
  refsByName: PropTypes.instanceOf(Immutable.Map).isRequired, // refName -> ref
  addedContainers: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  measurementMode: PropTypes.oneOf(['mass', 'volume'])
};

const ConnectedProvisionSelectorModal = ConnectToStores(
  ProvisionSelectorModal,
  () => {}
);
ConnectedProvisionSelectorModal.MODAL_ID = MODAL_ID;

export default ConnectedProvisionSelectorModal;
export { ProvisionToContainerList, ProvisionSelector };
