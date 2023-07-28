const demo3 = {
  sources: {
    res1: {
      name: 'Glucose Tube 1',
      onClick: undefined,
      volume: '200:microliter',
      aliquots: 1,
      color: undefined,
      selected: false
    }
  },
  destinations: {
    group1: {
      name: 'M9 glucose g8x',
      containerId: 'container1',
      onClick: () => { console.log('Hello World'); },
      volume: '20:microliter',
      aliquots: 10,
      color: undefined,
      selected: false
    }
  },
  edges: [
    {
      source: 'res1',
      destination: 'group1'
    }
  ]
};

export default demo3;
