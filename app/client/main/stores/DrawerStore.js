import Dispatcher from 'main/dispatcher';
import rootNode from 'main/state/rootNode';
import DrawerActions from 'main/actions/DrawerActions';

/*
  Stores the global open/close state of all Drawer components.
  NOTE: This does not stop you from accidentally rendering multiple Drawers on screen at once.
        All Drawer components use this store, so it is up to you to not render them simultaneously.
*/
const DrawerStore = {
  node: rootNode.sub('drawer-ui', false),

  isOpen() {
    return this.node.get('isOpen');
  },

  getHeight() {
    return this.node.get('drawerHeight') || 0;
  },

  act(action) {
    switch (action.type) {
      case DrawerActions.ActionTypes.open: {
        this.node.setIn('isOpen', true);
        break;
      }
      case DrawerActions.ActionTypes.close: {
        this.node.setIn('isOpen', false);
        break;
      }
      case DrawerActions.ActionTypes.setHeight: {
        this.node.setIn('drawerHeight', action.height);
        break;
      }
      default:
    }
  }
};

Dispatcher.register(DrawerStore.act.bind(DrawerStore));

export default DrawerStore;
