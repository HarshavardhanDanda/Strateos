const nodeLeftCenter = (node) => {
  return {
    x: node.x + node.width,
    y: node.y + (node.height / 2)
  };
};

const nodeRightCenter = (node) => {
  return {
    x: node.x,
    y: node.y + (node.height / 2)
  };
};

export {
  nodeLeftCenter,
  nodeRightCenter
};
