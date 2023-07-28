const instruction0 = {
  op: 'provision',
  operation: {
    to: [
      { well: 'testRef/0', volume: '900.0:microliter' },
      { well: 'testRef/0', volume: '900.0:microliter' },
      { well: 'testRef/0', volume: '100.0:microliter' },
      { well: 'testRef/1', volume: '50.0:microliter' },
      { well: 'testRef/2', volume: '50.0:microliter' }
    ]
  }
};

const refsByName0 = {
  testRef: {
    container_id: 'testContainer',
    container_type: {
      well_count: 10,
      col_count: 10
    }
  }
};

const charts0 = [{
  sources: {
    unprovisioned: {
      name: 'Unprovisioned',
      containerId: 'unprovisioned',
      quantity: '2000:microliter',
      aliquots: 1
    }
  },
  destinations: {
    0: {
      name: 'testRef',
      containerId: 'testContainer',
      quantity: '50:microliter',
      aliquots: 2
    },
    1: {
      name: 'testRef/A1',
      containerId: 'testContainer',
      quantity: '1900:microliter',
      aliquots: 1
    }
  },
  edges: [{
    source: 'unprovisioned',
    destination: 0
  },
  {
    source: 'unprovisioned',
    destination: 1
  }
  ]
}];

const instruction2 = {
  op: 'provision',
  operation: {
    to: [
      { well: 'testRef/0', mass: '900.0:milligram' },
      { well: 'testRef/0', mass: '900.0:milligram' },
      { well: 'testRef/0', mass: '100.0:milligram' },
      { well: 'testRef/1', mass: '50.0:milligram' },
      { well: 'testRef/2', mass: '50.0:milligram' }
    ]
  }
};

const refsByName2 = {
  testRef: {
    container_id: 'testContainer',
    container_type: {
      well_count: 10,
      col_count: 10
    }
  }
};

const charts2 = [{
  sources: {
    unprovisioned: {
      name: 'Unprovisioned',
      containerId: 'unprovisioned',
      quantity: '2000:milligram',
      aliquots: 1
    }
  },
  destinations: {
    0: {
      name: 'testRef',
      containerId: 'testContainer',
      quantity: '50:milligram',
      aliquots: 2
    },
    1: {
      name: 'testRef/A1',
      containerId: 'testContainer',
      quantity: '1900:milligram',
      aliquots: 1
    }
  },
  edges: [{
    source: 'unprovisioned',
    destination: 0
  },
  {
    source: 'unprovisioned',
    destination: 1
  }
  ]
}];

export {
  instruction0,
  refsByName0,
  charts0,
  instruction2,
  refsByName2,
  charts2
};
