import RunValidator from 'main/project/launchRun/RunValidator';

import { expect } from 'chai';

describe('run_validator', () => {
  it('transforms a basic input set', () => {
    const rv = new RunValidator({
      manifest: {
        inputs: {
          int: 'integer',
          vol: 'volume',
          temp: 'temperature',
          len: 'length',
          dur: 'time'
        }
      },
      inputs: {
        int: '3',
        vol: '2:microliter',
        temp: '4:celsius',
        len: '3:nanometer',
        dur: '5:second'
      }
    });
    const transformed = rv.transformedParameters();
    expect(transformed).to.eql({
      int: 3,
      vol: '2:microliter',
      temp: '4:celsius',
      len: '3:nanometer',
      dur: '5:second'
    });
  });

  it('transforms an aliquot input', () => {
    const rv = new RunValidator({
      manifest: {
        inputs: {
          aq: 'aliquot'
        }
      },
      inputs: {
        aq: {
          containerId: 'ct1xxxx',
          wellIndex: 3
        }
      }
    });
    const transformed = rv.transformedParameters();
    expect(transformed).to.eql({
      aq: {
        containerId: 'ct1xxxx',
        wellIndex: 3
      }
    });
  });

  it('transforms a container input', () => {
    const rv = new RunValidator({
      manifest: {
        inputs: {
          ct: 'container'
        }
      },
      inputs: {
        ct: 'ct1xxxx'
      }
    });
    const transformed = rv.transformedParameters();
    expect(transformed).to.eql({
      ct: 'ct1xxxx'
    });
  });

  it('transforms a container input within a group-choice', () => {
    const rv = new RunValidator({
      manifest: {
        inputs: {
          'sweet-choice': {
            type: 'group-choice',
            options: [{
              value: '1',
              inputs: {
                container1: 'container'
              }
            }, {
              value: '2',
              inputs: {
                container2: 'container'
              }
            }]
          }
        }
      },
      inputs: {
        'sweet-choice': {
          value: '1',
          inputs: {
            1: {
              container1: 'ct1xxxx'
            },
            2: {}
          }
        }
      }
    });
    const transformed = rv.transformedParameters();
    expect(transformed['sweet-choice'].value).to.eql('1');
    expect(transformed['sweet-choice'].inputs['1']).to.eql({
      container1: 'ct1xxxx'
    });
  });

  it('sorts aliquot+ by containerId and wellIndex', () => {
    const rv = new RunValidator({
      manifest: {
        inputs: {
          sweet_aliquots: 'aliquot+'
        }
      },
      inputs: {
        sweet_aliquots: [{
          containerId: 'ct1xxxx',
          wellIndex: 2
        }, {
          containerId: 'ct1xxxx',
          wellIndex: 10
        }, {
          containerId: 'ct1xxxx',
          wellIndex: 1
        }, {
          containerId: 'ct2xxxx',
          wellIndex: 1
        }]
      }
    });
    const transformed = rv.transformedParameters();
    expect(transformed).to.eql({
      sweet_aliquots: [{
        containerId: 'ct1xxxx',
        wellIndex: 1
      }, {
        containerId: 'ct1xxxx',
        wellIndex: 2
      }, {
        containerId: 'ct1xxxx',
        wellIndex: 10
      }, {
        containerId: 'ct2xxxx',
        wellIndex: 1
      }]
    });
  });

  it('transforms a csv-table input', () => {
    const rv = new RunValidator({
      manifest: {
        inputs: {
          csvt: {
            type: 'csv-table',
            template: {
              header: ['Destination Well', 'Source Well', 'Final concentration in ug/ml'],
              keys: ['dest_well', 'source_well', 'final_concentration_ugml'],
              col_type: ['integer', 'aliquot', 'decimal']
            }
          }
        }
      },
      inputs: {
        csvt: [{
          'Destination Well': '0',
          'Source Well': 'ct18tj5x5ttbkp/0',
          'Final concentration in ug/ml': '1.5'
        }]
      }
    });
    const transformed = rv.transformedParameters();
    expect(transformed).to.eql({
      csvt: [{
        dest_well: 0,
        source_well: {
          containerId: 'ct18tj5x5ttbkp',
          wellIndex: 0
        },
        final_concentration_ugml: 1.5
      }]
    });
  });
});
