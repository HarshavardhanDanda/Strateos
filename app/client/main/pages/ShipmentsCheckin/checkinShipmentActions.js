import _ from 'lodash';

import ShipmentAPI from 'main/api/ShipmentAPI';
import LabAPI from 'main/api/LabAPI';
import { checkinShipmentPageState, checkinShipmentStateDefaults } from './checkinShipmentState';

const checkinShipmentActions = {
  searchOptions() {
    return _.pick(
      this.stateStore.get(),
      ...Array.from(Object.keys(checkinShipmentStateDefaults))
    );
  },

  updateState(nextState) {
    const currentState = this.stateStore.get();
    const newState = _.extend(currentState, nextState);
    this.stateStore.set(newState);
  },

  resetState() {
    const defaultStateWithDefinedValues =  _.pickBy(checkinShipmentStateDefaults, value => !!value);
    this.stateStore.set(defaultStateWithDefinedValues);
  },

  loadLabs(labIds) {
    LabAPI.getMany(labIds);
  },

  onSearchPageChange(page) {
    const options = {
      ...this.searchOptions(),
      page
    };

    this.updateState({ page });
    return this.doSearch(options);
  },

  onSearchFilterChange(options) {
    this.updateState(options);

    const mergedOptions = {
      ...this.searchOptions(),
      ...options,
      page: 1
    };

    return this.doSearch(mergedOptions);
  },

  doSearch(filterOptions) {
    const filterOptionsWithDefinedValues = _.pickBy(filterOptions, value => !!value);
    const request = {
      includes: ['containers', 'containers.location'],
      page: filterOptionsWithDefinedValues.page,
      limit: filterOptionsWithDefinedValues.per_page
    };

    request.filters = _.pick(filterOptionsWithDefinedValues, [
      'checked_in',
      'organization_id',
      'shipment_type',
      'lab_id'
    ]);

    return ShipmentAPI.index(request).done(shipments => {
      this.updateState({ ...filterOptionsWithDefinedValues });
      return shipments;
    });
  }
};

const checkinShipmentPageActions = _.extend({}, checkinShipmentActions, {
  stateStore: checkinShipmentPageState
});

export { checkinShipmentPageActions };
