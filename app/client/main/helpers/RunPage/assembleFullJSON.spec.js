import { expect } from 'chai';
import Dispatcher from 'main/dispatcher';
import Immutable from 'immutable';

// Stores
import OrderableMaterialComponentStore from 'main/stores/OrderableMaterialComponentStore';
import ResourceStore from 'main/stores/ResourceStore';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import DeviceStore from 'main/stores/DeviceStore';
import LocationStore from 'main/stores/LocationStore';
import LocationTypeStore from 'main/stores/LocationTypeStore';
import ContainerStore from 'main/stores/ContainerStore';
import WarpStore from 'main/stores/WarpStore';

import
assembleFullJSON,
{
  mergeLocationTypesWithLocation,
  mergePropertiesWithContainer,
  mergeInstructionsWithWarps,
  mergeResourceOmcAndContainerWithRef,
  mergeResourceWithResourceOmc
}
  from './assembleFullJSON';

/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */

const purgeAllStores = () => {
  OrderableMaterialComponentStore._empty();
  ResourceStore._empty();
  ContainerTypeStore._empty();
  DeviceStore._empty();
  LocationStore._empty();
  LocationTypeStore._empty();
  ContainerStore._empty();
  WarpStore._empty();
};

const saveMockWarps = () => {
  Dispatcher.dispatch({
    type: 'WARPS_API_LIST',
    entities: [
      {
        id: 'warp0',
        instruction_id: 'instruction0',
        type: 'warps'
      },
      {
        id: 'warp1',
        instruction_id: 'instruction0',
        type: 'warps'
      },
      {
        id: 'warp2',
        instruction_id: 'instruction1',
        type: 'warps'
      }
    ]
  });
};

const saveMockLocationTypes = () => {
  Dispatcher.dispatch({
    type: 'LOCATION_TYPES_API_LIST',
    entities: [
      { id: 'locationType0', type: 'locationTypes' },
      { id: 'locationType1', type: 'locationTypes' }
    ]
  });
};

const saveMockLocations = () => {
  Dispatcher.dispatch({
    type: 'LOCATIONS_API_LIST',
    entities: [
      { id: 'location0', location_type_id: 'locationType0', type: 'locations' },
      { id: 'location1', location_type_id: 'locationType1', type: 'locations' }
    ]
  });
};

const saveMockResources = () => {
  Dispatcher.dispatch({
    type: 'RESOURCES_API_LIST',
    entities: [
      { id: 'resource0', type: 'resources' },
      { id: 'resource1', type: 'resources' }
    ]
  });
};

const saveMockContainers = () => {
  Dispatcher.dispatch({
    type: 'CONTAINERS_API_LIST',
    entities: [
      { id: 'container0', type: 'containers' },
      { id: 'container1', type: 'containers' }
    ]
  });
};

const saveMockDevices = () => {
  Dispatcher.dispatch({
    type: 'DEVICES_API_LIST',
    entities: [
      { id: 'device0', type: 'devices' },
      { id: 'device1', type: 'devices' }
    ]
  });
};

const saveMockContainerTypes = () => {
  Dispatcher.dispatch({
    type: 'CONTAINER_TYPES_API_LIST',
    entities: [
      { id: 'containerType0', type: 'containerTypes' },
      { id: 'containerType1', type: 'containerTypes' }
    ]
  });
};

const saveMockResourceOmc = () => {
  Dispatcher.dispatch({
    type: 'ORDERABLE_MATERIAL_COMPONENTS_API_LIST',
    entities: [
      { id: 'omc0', type: 'orderbaleMaterialComponent' },
      { id: 'omc1', type: 'orderbaleMaterialComponent' }
    ]
  });
};

describe('assembleFullJSON', () => {
  beforeEach(purgeAllStores);

  it('assembleFullJSON should inject information into run', () => {
    const instructions = Immutable.fromJS([{ id: 'instruction0' }]);
    const run = Immutable.fromJS({ id: 'someId', datasets: [], dependents: [] });
    const refs = Immutable.fromJS([{ name: 'ref0' }]);
    saveMockWarps();

    const fullJSON = assembleFullJSON({ run, instructions, refs });

    expect(fullJSON.get('instructions')).to.not.be.undefined;
    expect(fullJSON.getIn(['instructions', '0', 'warps']).count()).to.equal(2);
    expect(fullJSON.getIn(['refs', '0', 'name'])).to.equal('ref0');
  });

  it('assembleFullJSON should return minimal_json as soon as it is loaded', () => {
    const brokenRun = undefined;
    const run = Immutable.fromJS({ id: 'someId', datasets: [], dependents: [] });
    const instructions = Immutable.fromJS([{}, {}]);
    const refs = Immutable.fromJS([{}, {}, {}]);

    const unassembledFullJSON = assembleFullJSON({ run: brokenRun, instructions: undefined, refs: undefined });
    const fullJSONWithOnlyRun = assembleFullJSON({ run, instructions: undefined, refs: undefined });
    const fullJSONWithoutInstructions = assembleFullJSON({ run, instructions: undefined, refs });
    const fullJSONWithoutRefs = assembleFullJSON({ run, instructions, refs: undefined });

    expect(unassembledFullJSON).to.be.undefined;
    expect(fullJSONWithoutRefs).to.not.be.undefined;
    expect(fullJSONWithoutInstructions).to.not.be.undefined;
    expect(fullJSONWithOnlyRun).to.not.be.undefined;
  });

  it('assembleFullJSON should return undefined if nothing is loaded', () => {
    const fullJSON = assembleFullJSON({ run: undefined, instructions: undefined, refs: undefined });

    expect(fullJSON).to.be.undefined;
  });
});

describe('assembleFullJSON Internal Methods', () => {
  beforeEach(() => {
    purgeAllStores();
  });

  it('mergeInstructionsWithWarps should insert matching warps into each instruction', () => {
    const instructions = Immutable.fromJS([{ id: 'instruction0' }, { id: 'instruction1' }]);
    saveMockWarps();

    const mergedInstructions = mergeInstructionsWithWarps(instructions);

    expect(mergedInstructions.getIn(['0', 'warps']).count()).to.equal(2);
    expect(mergedInstructions.getIn(['1', 'warps']).count()).to.equal(1);
  });

  it('mergeLocationTypesWithLocation should insert matching LocationType into each Location', () => {
    saveMockLocationTypes();

    const location = Immutable.fromJS({ id: 'location0', location_type_id: 'locationType0' });
    const mergedLocation = mergeLocationTypesWithLocation(location);

    expect(mergedLocation.getIn(['location_type', 'id'])).to.equal('locationType0');
  });

  it('mergeResourceWithResourceOmc should insert matching resource into ResourceOmc', () => {
    saveMockResources();

    const resourceOmc = Immutable.fromJS({ id: 'rkt1', resource_id: 'resource1' });
    const mergedResourceOmc = mergeResourceWithResourceOmc(resourceOmc);

    expect(mergedResourceOmc.getIn(['resource', 'id'])).to.equal('resource1');
  });

  it('mergeResourceOmcAndContainerWithRef should insert ResourceOmc and container into ref', () => {
    saveMockContainers();
    saveMockResourceOmc();

    const refs = Immutable.fromJS([
      { container_id: 'container0', orderable_material_component_id: 'omc0' },
      { container_id: 'container1', orderable_material_component_id: 'omc1' }
    ]);

    const mergedRefs = mergeResourceOmcAndContainerWithRef(refs);

    expect(mergedRefs.getIn(['0', 'container', 'id'])).to.equal('container0');
    expect(mergedRefs.getIn(['0', 'resource_orderable_material_component', 'id'])).to.equal('omc0');
    expect(mergedRefs.getIn(['1', 'container', 'id'])).to.equal('container1');
    expect(mergedRefs.getIn(['1', 'resource_orderable_material_component', 'id'])).to.equal('omc1');
  });

  it('mergePropertiesWithContainer should insert org, device, containerType, and location into container', () => {
    saveMockDevices();
    saveMockLocations();
    saveMockContainerTypes();

    const container = Immutable.fromJS({
      device_id: 'device1',
      location_id: 'location0',
      container_type_id: 'containerType1'
    });

    const mergedContainer = mergePropertiesWithContainer(container);

    expect(mergedContainer.getIn(['device', 'id'])).to.equal('device1');
    expect(mergedContainer.getIn(['location', 'id'])).to.equal('location0');
    expect(mergedContainer.getIn(['container_type', 'id'])).to.equal('containerType1');
  });
});
