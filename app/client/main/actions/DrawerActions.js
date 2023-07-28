import Dispatcher from 'main/dispatcher';
import DrawerStore from 'main/stores/DrawerStore';

const ActionTypes = {
  open: 'DRAWER_OPENED',
  close: 'DRAWER_CLOSED',
  setHeight: 'DRAWER_HEIGHT'
};

const dispatch = (type, height) => Dispatcher.dispatch({ type, height });

const open = () => dispatch(ActionTypes.open);
const close = () => dispatch(ActionTypes.close);
const setHeight = (height) => {
  if (DrawerStore.getHeight() !== height) {
    dispatch(ActionTypes.setHeight, height);
  }
};

export default {
  ActionTypes,
  open,
  close,
  setHeight
};
