import Hazards from 'main/util/Hazards';
import { CONTAINER_STATUS } from 'main/util/ContainerUtil';

// eslint-disable-next-line import/prefer-default-export
export const ContainerStatusOptions = [
  {
    queryTerm: 'available',
    display: CONTAINER_STATUS.available
  }, {
    queryTerm: 'all',
    display: CONTAINER_STATUS.all,
    allOption: true
  }, {
    queryTerm: 'will_be_destroyed',
    display: CONTAINER_STATUS.will_be_destroyed,
  }, {
    queryTerm: 'destroyed',
    display: CONTAINER_STATUS.destroyed,
  }, {
    queryTerm: 'returned',
    display: CONTAINER_STATUS.returned,
  }, {
    queryTerm: 'consumable',
    display: CONTAINER_STATUS.consumable,
  }, {
    queryTerm: 'will_be_returned',
    display: CONTAINER_STATUS.pending_return,
  }
];

export const CreatorOptions = [
  {
    queryTerm: 'all',
    display: 'All',
    allOption: true
  },
  {
    queryTerm: 'me',
    display: 'By me'
  }
];

export const SourceOptions = [
  {
    queryTerm: 'private',
    display: 'Proprietary'
  },
  {
    queryTerm: 'public',
    display: 'Public'
  },
  {
    queryTerm: 'all',
    display: 'Show all',
    allOption: true
  }
];

export const HazardOptions = Hazards;
