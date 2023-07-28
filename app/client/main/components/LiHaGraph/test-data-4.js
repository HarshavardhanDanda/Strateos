const demo4 = {
  sources: {
    res1: {
      name: 'Glucose Tube 1',
      containerId: 'resource1',
      onClick: undefined,
      volume: '40:microliter',
      aliquots: 5,
      color: undefined,
      selected: false
    }
  },
  destinations: {
    aliquot1: {
      name: 'M9 glucose g8x/A1',
      containerId: 'container1',
      onClick: undefined,
      volume: '200:microliter',
      aliquots: 1,
      color: undefined,
      selected: false
    }
  },
  edges: [
    {
      source: 'res1',
      destination: 'aliquot1'
    }
  ]
};

export default demo4;
