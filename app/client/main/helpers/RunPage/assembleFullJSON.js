import OrderableMaterialComponentStore from 'main/stores/OrderableMaterialComponentStore';
import ResourceStore from 'main/stores/ResourceStore';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import DeviceStore from 'main/stores/DeviceStore';
import LocationStore from 'main/stores/LocationStore';
import LocationTypeStore from 'main/stores/LocationTypeStore';
import ContainerStore from 'main/stores/ContainerStore';
import WarpStore from 'main/stores/WarpStore';
import {
  instructionsLoadStatus,
  runLoadStatus,
  refsLoadStatus
} from './loadStatus';

const mergeLocationTypesWithLocation = (location) => {
  if (location == undefined) return undefined;
  const locationTypeId = location.get('location_type_id');
  const locationType = LocationTypeStore.getById(locationTypeId);

  return location.set('location_type', locationType);
};

const mergePropertiesWithContainer = (container) => {
  if (container == undefined) return undefined;

  // Device
  const deviceId = container.get('device_id');
  const device = DeviceStore.getById(deviceId);

  // Location
  const locationId = container.get('location_id');
  const location = LocationStore.getById(locationId);
  const locationMergedWithLocationType = mergeLocationTypesWithLocation(location);

  // ContainerType
  const containerTypeId = container.get('container_type_id');
  const containerType = ContainerTypeStore.getById(containerTypeId);

  return container
    .set('device', device)
    .set('location', locationMergedWithLocationType)
    .set('container_type', containerType);
};

const mergeResourceWithResourceOmc = (resourceOmc) => {
  if (resourceOmc == undefined) return undefined;

  const resourceId = resourceOmc.get('resource_id');
  const resource = ResourceStore.getById(resourceId);

  return resourceOmc.set('resource', resource);
};

const mergeInstructionsWithWarps = (instructions) => {
  return instructions.map((instruction) => {
    const instructionId = instruction.get('id');
    const warpsBelongingToInstruction = WarpStore.filterByInstructionId(instructionId);

    return instruction.set('warps', warpsBelongingToInstruction);
  });
};

const mergeResourceOmcAndContainerWithRef = (refs) => {
  return refs.map((ref) => {
    const containerId = ref.get('container_id');
    const container = ContainerStore.getById(containerId);
    const containerMergedWithProperties = mergePropertiesWithContainer(container);

    const resourceOmcId = ref.get('orderable_material_component_id');
    const resourceOmc = OrderableMaterialComponentStore.getById(resourceOmcId);
    const resourceOmcMergedWithResource = mergeResourceWithResourceOmc(resourceOmc);

    return ref
      .set('resource_orderable_material_component', resourceOmcMergedWithResource)
      .set('container', containerMergedWithProperties);
  });
};

const assembleFullJSON = ({ run, instructions, refs }) => {
  if (runLoadStatus(run)) {
    let processedRun = run;

    if (instructionsLoadStatus(instructions)) {
      const mergedInstructions = mergeInstructionsWithWarps(instructions);
      processedRun = processedRun.set('instructions', mergedInstructions);
    }

    if (refsLoadStatus(refs)) {
      const mergedRefs = mergeResourceOmcAndContainerWithRef(refs);
      processedRun = processedRun.set('refs', mergedRefs);
    }

    return processedRun;
  }

  return undefined;
};

export {
  mergeLocationTypesWithLocation,
  mergePropertiesWithContainer,
  mergeResourceWithResourceOmc,
  mergeInstructionsWithWarps,
  mergeResourceOmcAndContainerWithRef
};

export default assembleFullJSON;
