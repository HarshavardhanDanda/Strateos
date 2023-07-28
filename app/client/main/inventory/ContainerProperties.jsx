import _ from 'lodash';
import { HierarchyPath, Popover } from '@transcriptic/amino';
import React from 'react';
import LocationStore from 'main/stores/LocationStore';
import Urls from 'main/util/urls';
import ContainerStore from 'main/stores/ContainerStore';
import { readableHazards } from 'main/util/Hazards';
import UserProfile from 'main/components/UserProfile/UserProfile';
import UserStore from 'main/stores/UserStore';
import './ContainerProperties.scss';

export const Id = container => container.get('id', '-');
export const IntakeCode = container => container.get('shipment_code', '-');
export const Label = container => container.get('label', '-');
export const Code = container => container.get('shipment_code', '-');
export const ContainerType = container => container.getIn(['container_type', 'shortname'], '-');
export const Storage = container => container.get('storage_condition', '-');
export const Cover = container => container.get('cover', 'uncovered') || 'uncovered';
export const LocationPath = (container) => {
  let ancestors = container.getIn(['location', 'ancestors']);
  let location = container.getIn(['location']) || [];
  const containerLocation = LocationStore.getById(container.get('location_id'));
  if (container.get('location_id') && containerLocation && containerLocation.get('ancestors')) {
    ancestors = containerLocation.get('ancestors');
    location = containerLocation;
  }
  const ancestorLocations = ancestors ? [...ancestors] : [];
  const locationPaths = ancestorLocations.concat(location);
  return locationPaths.map((loc) => {
    return {
      name: loc.get('name', '-'),
      id: loc.get('id')
    };
  });
};
export function Location(container, horizontalDisplay = true) {
  const pathNames = LocationPath(container);
  if (_.isEmpty(pathNames)) {
    return '-';
  }
  return (
    <HierarchyPath steps={pathNames} spacingPx={1} isTruncate horizontalDisplay={horizontalDisplay} />
  );
}
export function LocationName(container) {
  const hierarchyPath = Location(container, false);
  const location = container.get('location');
  return (
    <Popover
      placement="bottom"
      content={hierarchyPath}
      onModal
    >
      <a
        href={Urls.location(location.get('id'))}
      >{location.get('name', '-')}
      </a>
    </Popover>
  );
}
export const CurrentLocation = container => container.get('public_location_description', '-');
export const Barcode = container => {
  if (container.get('barcode')) {
    return container.get('barcode');
  }

  return '-';
};
export const SuggestedBarcode = container => {
  if (container.get('suggested_user_barcode')) {
    return container.get('suggested_user_barcode');
  }
  return '-';
};
export const StorageTemp = container => {
  const rawStorageCondition = container.get('storage_condition');
  if (rawStorageCondition) {
    const foundStorageCondition = ContainerStore.validStorageConditions.find((condition) => {
      return condition.value === rawStorageCondition;
    });

    return foundStorageCondition && foundStorageCondition.name;
  }

  return '-';
};
export const Hazard = container => readableHazards(container.get('hazards', []));
export const CurrentMass = container => (container.get('current_mass_mg') ? `${container.get('current_mass_mg')} mg` : '-');
export const EmptyContainerMass = container => (container.get('empty_mass_mg') ? `${container.get('empty_mass_mg')} mg` : '-');
export const Properties = container => (container.get('properties') ? container.get('properties') : '-');
export function CreatedBy(container) {
  const user = UserStore.getById(container.get('created_by'));
  return (user ?  <UserProfile user={user} showDetails /> : '-');
}
export const CatalogNo = containerType => containerType.get('catalog_number', '-');
export const Vendor = containerType => containerType.get('vendor', '-');
