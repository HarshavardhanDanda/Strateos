const demo2 = {
  sources: {
    res1: {
      name: 'Glucose Tube 1',
      onClick: undefined,
      volume: '5070:microliter',
      aliquots: 1,
      color: undefined,
      selected: false
    }
  },
  destinations: {
    aliquot2: {
      name: 'M9 glucose g8x/A1',
      containerId: 'container1',
      onClick: undefined,
      volume: '700:microliter',
      aliquots: 1,
      color: undefined,
      selected: true
    },
    aliquot3: {
      name: 'M9 glucose g8x/A2',
      containerId: 'container1',
      onClick: undefined,
      volume: '300:microliter',
      aliquots: 1,
      color: undefined,
      selected: false
    },
    aliquot4: {
      name: 'M9 glucose g8x/A3',
      containerId: 'container1',
      onClick: undefined,
      volume: '200:microliter',
      aliquots: 1,
      color: undefined,
      selected: false
    },
    'container1:1': {
      name: 'M9 glucose',
      containerId: 'container1',
      onClick: undefined,
      volume: '70:microliter',
      aliquots: 28,
      color: undefined,
      selected: false
    },
    'container1:2': {
      name: 'M9 glucose',
      containerId: 'container1',
      onClick: undefined,
      volume: '90:microliter',
      aliquots: 15,
      color: undefined,
      selected: false
    },
    aliquot6: {
      name: 'Tubular',
      containerId: 'container2',
      onClick: undefined,
      volume: '200:microliter',
      aliquots: 1,
      color: undefined,
      selected: false
    },
    'container2:1': {
      name: 'Very Cool Plate',
      containerId: 'container3',
      onClick: undefined,
      volume: '40:microliter',
      aliquots: 9,
      color: undefined,
      selected: false
    }
  },
  edges: [
    {
      source: 'res1',
      destination: 'aliquot2'
    },
    {
      source: 'res1',
      destination: 'aliquot3'
    },
    {
      source: 'res1',
      destination: 'aliquot4'
    },
    {
      source: 'res1',
      destination: 'container1:1'
    },
    {
      source: 'res1',
      destination: 'container1:2'
    },
    {
      source: 'res1',
      destination: 'container2:1'
    },
    {
      source: 'res1',
      destination: 'aliquot6'
    }
  ]
};

export default demo2;
