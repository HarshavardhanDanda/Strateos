const demo1 = {
  sources: {
    res1: {
      name: 'Glucose Tube 3',
      containerId: 'resouce1',
      onClick: undefined,
      volume: '2030:microliter',
      aliquots: 1
    },
    res2: {
      name: 'Glucose Tube 4',
      containerId: 'resouce2',
      onClick: undefined,
      volume: '2030:microliter',
      aliquots: 1
    },
    res3: {
      name: 'Glucose Tube 5 also has a very long long name',
      containerId: 'resouce3',
      onClick: undefined,
      volume: '350:microliter',
      aliquots: 1
    }
  },
  destinations: {
    cont4: {
      name: 'M9 glucose very long long name',
      containerId: 'container1',
      onClick: undefined,
      volume: '70:microliter',
      aliquots: 63
    }
  },
  edges: [
    {
      source: 'res1',
      destination: 'cont4'
    },
    {
      source: 'res2',
      destination: 'cont4'
    },
    {
      source: 'res3',
      destination: 'cont4'
    }
  ]
};

export default demo1;
