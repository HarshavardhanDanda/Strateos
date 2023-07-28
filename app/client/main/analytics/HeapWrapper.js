// Utils for interacting with our Heap analytics library.

// TODO Instead of checking for window.heap we should instantiate
// heap in development mode and not as a global.
const track = (eventName, payload) => {
  if (window.heap) {
    window.heap.track(eventName, payload);
  }
};

export default track;
