import _ from 'lodash';

import NotificationActions from 'main/actions/NotificationActions';
import Dispatcher from 'main/dispatcher';
import RunStore from 'main/stores/RunStore';
import SessionStore from 'main/stores/SessionStore';
import ShippingCartStore from 'main/stores/ShippingCartStore';

const ShippingCartActions = {
  add(container) {
    const openStates = ['pending', 'accepted', 'in_progress'];
    // soft in-browser check of status here, server-side check before shipment lock-in
    const openRuns = RunStore.getByContainerId(container.get('id'))
      .find(run => _.includes(openStates, run.get('status')));

    if (openRuns) {
      NotificationActions.createNotification({
        text: "Container has pending runs and can't be returned yet",
        isError: true
      });
    } else {
      Dispatcher.dispatch({
        type: 'SHIPPING_CART_ADD',
        id: container.get('id')
      });
    }
  },

  addAll(containers) {
    containers.forEach(c => ShippingCartActions.add(c));
  },

  empty() {
    Dispatcher.dispatch({
      type: 'SHIPPING_CART_EMPTY'
    });
  },

  remove(id) {
    Dispatcher.dispatch({
      type: 'SHIPPING_CART_REMOVE',
      id
    });
  },

  isOrgSame(containers) {
    if (SessionStore.isAdmin()) {
      return true;
    }
    const userOrg = SessionStore.getOrg();
    return !containers.some(container => container.get('organization_id') !== userOrg.get('id'));
  },

  isLabAllowed(containers) {
    //  newly created containers do not have lab associated with them.
    //  we should not allow shipment of such containers.
    //  this check can be removed later when new containers are associated with lab.
    const labNotPresent = containers.some(container => container.get('lab') === null);
    if (labNotPresent) {
      return false;
    }
    const labs = containers.map(container => container.getIn(['lab', 'id']));
    const labIdOfContainersInCart = ShippingCartStore.getContainers().getIn(['0', 'lab', 'id']);
    if (labIdOfContainersInCart) {
      return _.uniq(labs).length === 1 && labs[0] === labIdOfContainersInCart;
    } else {
      return _.uniq(labs).length === 1;
    }
  },

  canContainersBeShipped(containers) {
    return this.isOrgSame(containers) && this.isLabAllowed(containers);
  }
};

export default ShippingCartActions;
