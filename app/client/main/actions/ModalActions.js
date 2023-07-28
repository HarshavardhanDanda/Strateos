import Dispatcher    from 'main/dispatcher';

const create = (id, open) => {
  const modal = { id, open };
  Dispatcher.dispatch({ type: 'MODAL_DATA', modal });
};

const open = (id) => {
  const modal = { id, open: true, data: undefined };
  Dispatcher.dispatch({ type: 'MODAL_DATA', modal });
};

const openWithData = (id, data) => {
  const modal = { id, open: true, data };
  Dispatcher.dispatch({ type: 'MODAL_DATA', modal });
};

const close = (id) => {
  const modal = { id, open: false };
  Dispatcher.dispatch({ type: 'MODAL_DATA', modal });
};

const remove = (id) => {
  Dispatcher.dispatch({ type: 'MODAL_REMOVED', id });
};

export default { create, open, close, remove, openWithData };
