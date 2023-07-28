export const getMaxVolume = (containerType) => {
  const maxVolume = containerType && containerType.get('well_volume_ul');
  return containerType && (maxVolume * containerType.get('well_count'));
};

export const getMaxMass = (containerType) => {
  return containerType && (2 * getMaxVolume(containerType));
};
