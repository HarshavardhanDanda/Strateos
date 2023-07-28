import React from 'react';
import Immutable from 'immutable';
import { find, bindAll, includes } from 'lodash';
import PropTypes from 'prop-types';
import { Button, TagInput } from '@transcriptic/amino';
import { pubSub } from '@strateos/micro-apps-utils';
import shortid from 'shortid';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import ContainerTypeHelper from 'main/helpers/ContainerType';
import AliquotStore from 'main/stores/AliquotStore';
import ContainerStore from 'main/stores/ContainerStore';
import { ContainerSearchStore } from 'main/stores/search';
import InventorySelectorModal from 'main/inventory/InventorySelector/InventorySelectorModal';
import { InventorySelectorModalAliquotActions, InventorySelectorModalContainerActions } from 'main/inventory/inventory/InventoryActions';
import AddContainerModal from 'main/pages/InventoryPage/AddContainerModal';
import SessionStore from 'main/stores/SessionStore';
import ModalActions from 'main/actions/ModalActions';
import './inputs.scss';

const getContainer = (containerId) => {
  if (ContainerStore.getById(containerId) != undefined) {
    return ContainerStore.getByIdWithContainerType(containerId);
  } else {
    return containerId;
  }
};

const containerName = (container) => {
  if (!Immutable.Map.isMap(container)) {
    return `${container}`;
  }
  const label = container.get('label');
  if (label) {
    return label;
  }

  return container.get('id');
};

const containerAliquot = (container, wellIndex) => {
  const aliquots = AliquotStore.getByContainer(container.get('id'));
  return aliquots.find(a => a.get('well_idx') === wellIndex);
};

const aliquotName = (container, wellIndex) => {
  if (!Immutable.Map.isMap(container)) {
    return `${container}`;
  }
  const aliquot = containerAliquot(container, wellIndex);
  if (container.getIn(['container_type', 'well_count']) === 1) {
    return containerName(container);
  } else if (aliquot && aliquot.get('name') != undefined) {
    return `${containerName(container)}/${aliquot.get('name')}`;
  } else {
    const col_count = container.getIn(['container_type', 'col_count']);
    const helper = new ContainerTypeHelper({ col_count });
    return `${containerName(container)}/${helper.humanWell(wellIndex)}`;
  }
};

class InventorySelectInput extends React.Component {
  constructor() {
    super();
    this.state = {
      modalOpen: false
    };
    bindAll(
      this,
      'showSelector',
      'hideSelector',
      'onSelectionChange',
      'onContainerCreation',
      'onSelectionChangePubSub'
    );
    this.onSelectionChangeSubscription = null;
  }

  componentDidMount() {
    if (this.canUseInventoryBrowserMicroApp) {
      this.onSelectionChangeSubscription = pubSub.subscribe(`INVENTORY_BROWSER_MODAL_ONSELECTIONCHANGE_${this.props.pubSubKey}`, this.onSelectionChangePubSub);
    }
  }

  componentWillUnmount() {
    if (this.canUseInventoryBrowserMicroApp) {
      this.onSelectionChangeSubscription && this.onSelectionChangeSubscription.remove();
    }
  }

  canUseInventoryBrowserMicroApp = SessionStore.getOrg() && SessionStore.getOrg().get('feature_groups').includes('inventory_browser_microapp');

  isSelectingContainer() {
    return includes(this.props.selectionType, 'CONTAINER');
  }

  getActions() {
    return this.isSelectingContainer() ? InventorySelectorModalContainerActions : InventorySelectorModalAliquotActions;
  }

  getModalTitle() {
    return this.isSelectingContainer() ? 'Container Selection' : 'Aliquot Selection';
  }

  getSelectionTypeText() {
    switch (this.props.selectionType) {
      case 'ALIQUOT':
        return 'aliquot';
      case 'ALIQUOT+':
        return 'aliquots';
      case 'CONTAINER':
        return 'container';
      case 'CONTAINER+':
        return 'containers';
    }
  }

  onSelectionChange(newSelectionMap) {
    this.props.onSelectionChange(newSelectionMap);
  }

  onSelectionChangePubSub({ selectionMap }) {
    this.props.onSelectionChange(selectionMap);
  }

  hideSelector() {
    this.setState({ modalOpen: false });
  }

  showSelector() {
    if (this.canUseInventoryBrowserMicroApp) {
      pubSub.publish('INVENTORY_BROWSER_MODAL_SHOW', {
        version: 'V1',
        labId: this.props.labId,
        organizationId: this.props.organizationId,
        selectionType: this.props.selectionType,
        testMode: this.props.test_mode,
        title: this.getModalTitle(),
        pubSubKey: this.props.pubSubKey,
        selectionMap: this.props.selectionMap
      });
    } else {
      this.setState({ modalOpen: true });
    }
  }

  onContainerCreation(containers) {
    const newCreatedContainers = containers
      .toMap()
      .mapKeys((k, container) => container.get('id'));

    this.getActions().updateState({
      createdContainers: newCreatedContainers
    });

    return containers.forEach(container =>
      ContainerSearchStore.prependResult(container)
    );
  }

  render() {
    const { segments } = this.props;

    return (
      <div className="inventory-select-input">
        <div style={{ cursor: 'pointer' }}>
          <div className="inventory-select-input--buttons tx-stack tx-stack--xs">
            {this.canUseInventoryBrowserMicroApp ? (
              <Button
                onClick={this.showSelector}
                height="short"
                type="secondary"
              >
                {`Select ${this.getSelectionTypeText()} (${segments.size})`}
              </Button>
            ) : (
              <TagInput
                onClick={this.showSelector}
                emptyText={this.props.emptyText}
                scrollFocus
              >
                {
                  segments.map(
                    (name, id) => {
                      return (
                        <TagInput.Tag
                          key={id}
                          text={name}
                          onRemove={() => {
                            this.props.onSegmentDeleted(id);
                          }}
                        />
                      );
                    }).valueSeq()
                  }
              </TagInput>
            )}
            {this.isSelectingContainer() && (
              <Button
                height="short"
                type="primary"
                size="small"
                link
                icon="fa-plus"
                iconColor="inherit"
                onClick={() => ModalActions.open('ADD_CONTAINER_MODAL')}
                className="inventory-select-input--add-container-button"
              >
                Add new container
              </Button>
            )}
          </div>
        </div>
        {(!this.canUseInventoryBrowserMicroApp) && (
          <InventorySelectorModal
            title={this.getModalTitle()}
            testMode={this.props.test_mode}
            modalOpen={this.state.modalOpen}
            beforeDismiss={this.hideSelector}
            selectionType={this.props.selectionType}
            selectionMap={this.props.selectionMap}
            onSelectionChange={this.onSelectionChange}
            organizationId={this.props.organizationId}
            labId={this.props.labId}
          />
        )}
        <AddContainerModal
          test_mode={this.props.test_mode}
          key="AddContainerModal"
          onContainerCreation={this.onContainerCreation}
          closeOnClickOut={false}
        />
      </div>
    );
  }
}

InventorySelectInput.propTypes = {
  selectionMap: PropTypes.instanceOf(Immutable.Map),
  selectionType: PropTypes.string.isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  segments: PropTypes.instanceOf(Immutable.Map),
  emptyText: PropTypes.string,
  test_mode: PropTypes.bool,
  onSegmentDeleted: PropTypes.func,
  organizationId: PropTypes.string,
  labId: PropTypes.string,
  pubSubKey: PropTypes.string.isRequired,
};

InventorySelectInput.defaultProps = {
  selectionMap: Immutable.Map(),
  emptyText: 'Choose...',
  test_mode: false,
  segments: Immutable.Map()
};

const ConnectedInventorySelectInput = ConnectToStores(InventorySelectInput, () => {});

class AliquotSelectInput extends React.Component {
  constructor() {
    super();
    bindAll(
      this,
      'onSegmentDeleted',
      'onSelectionChange'
    );
    this.state = {
      pubSubKey: shortid.generate()
    };
  }

  onSelectionChange(selectionMap) {
    const containerId = selectionMap.keySeq().get(0, undefined);
    const wellIndex = selectionMap.getIn([containerId, 0], undefined);

    if (containerId == undefined || wellIndex == undefined) {
      return this.props.onAliquotSelected(undefined);
    } else {
      return this.props.onAliquotSelected({
        containerId,
        wellIndex
      });
    }
  }

  onSegmentDeleted() {
    return this.props.onAliquotSelected(undefined);
  }

  segments() {
    const { aliquot } = this.props;

    if (aliquot == undefined) {
      return Immutable.Map();
    }

    const { containerId, wellIndex } = aliquot;
    const container = getContainer(containerId);
    const segment = aliquotName(container, wellIndex);

    return Immutable.Map([[containerId, segment]]);
  }

  selectionMap() {
    const { aliquot } = this.props;
    if (aliquot != undefined) {
      const { containerId, wellIndex } = aliquot;
      return Immutable.fromJS({
        [containerId]: [wellIndex]
      });
    } else {
      return Immutable.Map();
    }
  }

  render() {
    return (
      <div className="aliquot-select-input">
        <ConnectedInventorySelectInput
          emptyText="Choose Aliquot..."
          segments={this.segments()}
          onSegmentDeleted={this.onSegmentDeleted}
          selectionType="ALIQUOT"
          selectionMap={this.selectionMap()}
          onSelectionChange={this.onSelectionChange}
          test_mode={this.props.test_mode}
          organizationId={this.props.organizationId}
          labId={this.props.labId}
          pubSubKey={this.state.pubSubKey}
        />
      </div>
    );
  }
}

AliquotSelectInput.defaultProps = {
  test_mode: false
};

AliquotSelectInput.propTypes = {
  aliquot: PropTypes.shape({
    containerId: PropTypes.string,
    wellIndex: PropTypes.number
  }),
  onAliquotSelected: PropTypes.func.isRequired,
  test_mode: PropTypes.bool,
  organizationId: PropTypes.string,
  labId: PropTypes.string
};

class AliquotsSelectInput extends React.Component {
  constructor(props) {
    super(props);
    bindAll(
      this,
      'onSegmentDeleted',
      'onSelectionChange'
    );
    this.state = {
      pubSubKey: shortid.generate()
    };
  }

  onSelectionChange(selectionMap) {
    const aliquots = [];
    selectionMap.entrySeq().forEach((...args) => {
      const [containerId, wells] = Array.from(args[0]);
      return wells.forEach(wellIndex => aliquots.push({
        containerId,
        wellIndex
      }));
    });
    return this.props.onAliquotsSelected(aliquots);
  }

  onSegmentDeleted(containerId) {
    const aliquots = this.props.aliquots
      .filter(aliquot => aliquot.containerId !== containerId)
      .map(aliquot =>
        Immutable.Map({
          containerId: aliquot.containerId,
          wellIndex: aliquot.wellIndex
        })
      );
    return this.props.onAliquotsSelected(aliquots);
  }

  segments() {
    let counts = Immutable.Map();
    this.props.aliquots.forEach((aliquot) => {
      const { containerId } = aliquot;
      const count = counts.get(containerId, 0);
      counts = counts.set(containerId, count + 1);
      return counts;
    });

    let segments = Immutable.Map();
    counts.entrySeq().forEach((...args) => {
      let segment;
      const [containerId, count] = Array.from(args[0]);
      const container = getContainer(containerId);

      if (count === 1) {
        const aliquot = find(this.props.aliquots, a => (
          a.containerId === containerId
        ));
        segment = aliquotName(container, aliquot.wellIndex);
      } else {
        segment = `${containerName(container)}/${count} wells`;
      }
      segments = segments.set(containerId, segment);
      return segments;
    });

    return segments;
  }

  selectionMap(aliquots) {
    let sMap = Immutable.Map();
    const trueAliquots = aliquots || this.props.aliquots;

    trueAliquots.forEach(({ containerId, wellIndex }) => {
      const wells = sMap.get(containerId, Immutable.List());
      sMap = sMap.set(containerId, wells.push(wellIndex));
      return sMap;
    });
    return sMap;
  }

  render() {
    return (
      <div className="aliquots-select-input">
        <ConnectedInventorySelectInput
          emptyText="Choose Aliquots..."
          segments={this.segments()}
          onSegmentDeleted={this.onSegmentDeleted}
          selectionType="ALIQUOT+"
          selectionMap={this.selectionMap()}
          onSelectionChange={this.onSelectionChange}
          test_mode={this.props.test_mode}
          organizationId={this.props.organizationId}
          labId={this.props.labId}
          pubSubKey={this.state.pubSubKey}
        />
      </div>
    );
  }
}

AliquotsSelectInput.defaultProps = {
  test_mode: false,
  aliquots: []
};

AliquotsSelectInput.propTypes = {
  aliquots: PropTypes.array, // [{ containerId, wellIndex }]
  onAliquotsSelected: PropTypes.func.isRequired,
  test_mode: PropTypes.bool,
  organizationId: PropTypes.string,
  labId: PropTypes.string
};

class ContainerSelectInput extends React.Component {
  constructor(props) {
    super(props);
    bindAll(
      this,
      'onSelectionChange'
    );
    this.state = {
      pubSubKey: shortid.generate()
    };
  }

  onSelectionChange(selectionMap) {
    const containerId = selectionMap.keySeq().get(0, undefined);
    return this.props.onContainerSelected(containerId);
  }

  segments() {
    const m = Immutable.Map();
    if (this.props.containerId != undefined) {
      const container = getContainer(this.props.containerId);
      return m.set(this.props.containerId, containerName(container));
    } else {
      return m;
    }
  }

  selectionMap() {
    const { containerId } = this.props;
    if (containerId != undefined) {
      return Immutable.fromJS({
        [containerId]: []
      });
    } else {
      return Immutable.Map();
    }
  }

  render() {
    return (
      <div className="container-select-input">
        <ConnectedInventorySelectInput
          emptyText="Choose Container..."
          segments={this.segments()}
          onSegmentDeleted={() => this.props.onContainerSelected(undefined)}
          selectionType="CONTAINER"
          selectionMap={this.selectionMap()}
          onSelectionChange={this.onSelectionChange}
          test_mode={this.props.test_mode}
          organizationId={this.props.organizationId}
          labId={this.props.labId}
          pubSubKey={this.state.pubSubKey}
        />
      </div>
    );
  }
}

ContainerSelectInput.defaultProps = {
  test_mode: false
};

ContainerSelectInput.propTypes = {
  containerId: PropTypes.string,
  onContainerSelected: PropTypes.func.isRequired,
  test_mode: PropTypes.bool,
  organizationId: PropTypes.string,
  labId: PropTypes.string
};

class ContainersSelectInput extends React.Component {
  constructor(props) {
    super(props);
    bindAll(
      this,
      'onSegmentDeleted',
      'onSelectionChange',
      'segments',
      'selectionMap'
    );
    this.state = {
      pubSubKey: shortid.generate()
    };
  }

  onSelectionChange(selectionMap) {
    const containers = selectionMap.keySeq().toJS();
    return this.props.onContainersSelected(containers);
  }

  onSegmentDeleted(containerId) {
    const containers = this.props.containers.filter(
      _containerId => _containerId !== containerId
    );
    return this.props.onContainersSelected(containers);
  }

  segments() {
    const pairs = this.props.containers.map((containerId) => {
      const container = getContainer(containerId);
      return [containerId, containerName(container)];
    });

    return Immutable.Map(pairs);
  }

  selectionMap(containers) {
    let smap = Immutable.Map();
    const trueContainers = containers || this.props.containers;

    trueContainers.forEach((containerId) => {
      smap = smap.set(containerId, []);
      return smap;
    });
    return smap;
  }

  render() {
    return (
      <div className="containers-select-input">
        <ConnectedInventorySelectInput
          emptyText="Choose Containers..."
          segments={this.segments()}
          onSegmentDeleted={this.onSegmentDeleted}
          selectionType="CONTAINER+"
          selectionMap={this.selectionMap()}
          onSelectionChange={this.onSelectionChange}
          test_mode={this.props.test_mode}
          organizationId={this.props.organizationId}
          labId={this.props.labId}
          pubSubKey={this.state.pubSubKey}
        />
      </div>
    );
  }
}

ContainersSelectInput.defaultProps = {
  selectionMap: Immutable.Map(),
  containers: Immutable.List(),
  test_mode: false
};

ContainersSelectInput.propTypes = {
  containers: PropTypes.instanceOf(Immutable.List).isRequired,
  onContainersSelected: PropTypes.func.isRequired,
  test_mode: PropTypes.bool,
  organizationId: PropTypes.string,
  labId: PropTypes.string
};

export {
  AliquotSelectInput,
  AliquotsSelectInput,
  ContainerSelectInput,
  ContainersSelectInput,
  InventorySelectInput
};
