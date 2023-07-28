import ProvisionUtil from './ProvisionUtil';

const provisionSpec1 = {
  transfers: [
    {
      to: 'testDest1',
      to_well_idx: 0,
      volume: 900.0,
      from: 'testCID1',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 0,
      volume: 900.0,
      from: 'testCID1',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 0,
      volume: 100.0,
      from: 'testCID1',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 1,
      volume: 50.0,
      from: 'testCID1',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 2,
      volume: 50.0,
      from: 'testCID1',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 3,
      volume: 50.0,
      from: 'testCID1',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 4,
      volume: 50.0,
      from: 'testCID2',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 5,
      volume: 50.0,
      from: 'testCID2',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 4,
      volume: 50.0,
      from: 'testCID3',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 6,
      volume: 50.0,
      from: 'testCID3',
      from_well_idx: 0
    },
    {
      to: 'testDest2',
      to_well_idx: 0,
      volume: 50.0,
      from: 'testCID4',
      from_well_idx: 0
    },
    {
      to: 'testDest2',
      to_well_idx: 1,
      volume: 50.0,
      from: 'testCID4',
      from_well_idx: 0
    }
  ]
};

const refsByName1 = {
  testDest1: {
    container_id: 'testDestCID1',
    container_type: {
      well_count: 10,
      col_count: 10
    }
  },
  testDest2: {
    container_id: 'testDestCID2',
    container_type: {
      well_count: 10,
      col_count: 10
    }
  }
};

const sourceContainers1 = {
  testCID1: {
    label: 'testSource1'
  },
  testCID2: {
    label: 'testSource2'
  },
  testCID3: {
    label: 'testSource3'
  },
  testCID4: {
    label: 'testSource4'
  }
};

const charts1 = [{
  sources: {
    testCID1: {
      name: 'testSource1',
      containerId: 'testCID1',
      quantity: '2050:microliter',
      aliquots: 1
    }
  },
  destinations: {
    0: {
      name: 'testDest1',
      containerId: 'testDestCID1',
      quantity: '50:microliter',
      aliquots: 3
    },
    1: {
      name: 'testDest1/A1',
      containerId: 'testDestCID1',
      quantity: '1900:microliter',
      aliquots: 1
    }
  },
  edges: [{
    source: 'testCID1',
    destination: 0
  },
  {
    source: 'testCID1',
    destination: 1
  }
  ]
},
{
  sources: {
    testCID2: {
      name: 'testSource2',
      containerId: 'testCID2',
      quantity: '100:microliter',
      aliquots: 1
    },
    testCID3: {
      name: 'testSource3',
      containerId: 'testCID3',
      quantity: '100:microliter',
      aliquots: 1
    }
  },
  destinations: {
    0: {
      name: 'testDest1',
      quantity: '50:microliter',
      containerId: 'testDestCID1',
      aliquots: 3
    }
  },
  edges: [{
    source: 'testCID2',
    destination: 0
  },
  {
    source: 'testCID3',
    destination: 0
  }
  ]
},
{
  sources: {
    testCID4: {
      name: 'testSource4',
      containerId: 'testCID4',
      quantity: '100:microliter',
      aliquots: 1
    }
  },
  destinations: {
    0: {
      name: 'testDest2',
      containerId: 'testDestCID2',
      quantity: '50:microliter',
      aliquots: 2
    }
  },
  edges: [{
    source: 'testCID4',
    destination: 0
  }]
}];

const provisionSpec3 = {
  transfers: [
    {
      to: 'testDest1',
      to_well_idx: 0,
      mass: 900.0,
      from: 'testCID1',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 0,
      mass: 900.0,
      from: 'testCID1',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 0,
      mass: 100.0,
      from: 'testCID1',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 1,
      mass: 50.0,
      from: 'testCID1',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 2,
      mass: 50.0,
      from: 'testCID1',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 3,
      mass: 50.0,
      from: 'testCID1',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 4,
      mass: 50.0,
      from: 'testCID2',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 5,
      mass: 50.0,
      from: 'testCID2',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 4,
      mass: 50.0,
      from: 'testCID3',
      from_well_idx: 0
    },
    {
      to: 'testDest1',
      to_well_idx: 6,
      mass: 50.0,
      from: 'testCID3',
      from_well_idx: 0
    },
    {
      to: 'testDest2',
      to_well_idx: 0,
      mass: 50.0,
      from: 'testCID4',
      from_well_idx: 0
    },
    {
      to: 'testDest2',
      to_well_idx: 1,
      mass: 50.0,
      from: 'testCID4',
      from_well_idx: 0
    }
  ]
};

const refsByName3 = {
  testDest1: {
    container_id: 'testDestCID1',
    container_type: {
      well_count: 10,
      col_count: 10
    }
  },
  testDest2: {
    container_id: 'testDestCID2',
    container_type: {
      well_count: 10,
      col_count: 10
    }
  }
};

const sourceContainers3 = {
  testCID1: {
    label: 'testSource1'
  },
  testCID2: {
    label: 'testSource2'
  },
  testCID3: {
    label: 'testSource3'
  },
  testCID4: {
    label: 'testSource4'
  }
};

const charts3 = [{
  sources: {
    testCID1: {
      name: 'testSource1',
      containerId: 'testCID1',
      quantity: '2050:milligram',
      aliquots: 1
    }
  },
  destinations: {
    0: {
      name: 'testDest1',
      containerId: 'testDestCID1',
      quantity: '50:milligram',
      aliquots: 3
    },
    1: {
      name: 'testDest1/A1',
      containerId: 'testDestCID1',
      quantity: '1900:milligram',
      aliquots: 1
    }
  },
  edges: [{
    source: 'testCID1',
    destination: 0
  },
  {
    source: 'testCID1',
    destination: 1
  }
  ]
},
{
  sources: {
    testCID2: {
      name: 'testSource2',
      containerId: 'testCID2',
      quantity: '100:milligram',
      aliquots: 1
    },
    testCID3: {
      name: 'testSource3',
      containerId: 'testCID3',
      quantity: '100:milligram',
      aliquots: 1
    }
  },
  destinations: {
    0: {
      name: 'testDest1',
      quantity: '50:milligram',
      containerId: 'testDestCID1',
      aliquots: 3
    }
  },
  edges: [{
    source: 'testCID2',
    destination: 0
  },
  {
    source: 'testCID3',
    destination: 0
  }
  ]
},
{
  sources: {
    testCID4: {
      name: 'testSource4',
      containerId: 'testCID4',
      quantity: '100:milligram',
      aliquots: 1
    }
  },
  destinations: {
    0: {
      name: 'testDest2',
      containerId: 'testDestCID2',
      quantity: '50:milligram',
      aliquots: 2
    }
  },
  edges: [{
    source: 'testCID4',
    destination: 0
  }]
}];

const chartData = new ProvisionUtil({
  refsByName: refsByName1,
  sourceContainers: sourceContainers1,
  provisionSpec: provisionSpec1
}).charts;

export {
  refsByName1,
  provisionSpec1,
  sourceContainers1,
  charts1,
  refsByName3,
  provisionSpec3,
  sourceContainers3,
  charts3,
  chartData
};
