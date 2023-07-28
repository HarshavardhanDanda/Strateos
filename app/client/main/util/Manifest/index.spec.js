import Manifest from 'main/util/Manifest';

import { expect } from 'chai';
import Immutable from 'immutable';

describe('util/manifest', () => {
  it('calculates aliquot parameter names', () => {
    const inputTypes = {
      a: 'aliquot',
      b: {
        type: 'aliquot+'
      },
      c: 'aliquot++',
      d: {
        type: 'group',
        inputs: {
          e: 'aliquot'
        }
      },
      f: {
        type: 'group+',
        inputs: {
          g: 'aliquot'
        }
      },
      h: {
        type: 'group-choice',
        options: [{
          value: 'foo',
          inputs: {
            i: 'aliquot'
          }
        }, {
          value: 'bar',
          inputs: {
            j: 'aliquot'
          }
        }, {
          value: 'baz'
        }]
      },
      k: {
        type: 'container'
      },
      l: {
        type: 'container+'
      }
    };

    const names = Manifest.sampleInputNames(inputTypes).toJS();
    expect(names).to.eql(['a', 'b', 'c', 'e', 'g', 'i', 'j', 'k', 'l']);
  });

  it('finds all containers referenced in protocol inputs', () => {
    const inputTypes = {
      container: 'container',
      aliquot: 'aliquot',
      'aliquot+': 'aliquot+',
      'aliquot++': 'aliquot++',
      group: {
        type: 'group',
        inputs: {
          container: 'container'
        }
      },
      'group+': {
        type: 'group+',
        inputs: {
          container: 'container'
        }
      },
      'group-choice': {
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
    };
    const inputs = {
      container: 'ct1a',
      aliquot: {
        containerId: 'ct1b'
      },
      'aliquot+': [{
        containerId: 'ct1c'
      }, {
        containerId: 'ct1d'
      }],
      'aliquot++': [[{
        containerId: 'ct1e'
      }, {
        containerId: 'ct1f'
      }], [{
        containerId: 'ct1g'
      }], []],
      group: {
        container: 'ct1h'
      },
      'group+': [{
        container: 'ct1i'
      }],
      'group-choice': {
        value: '1',
        inputs: {
          1: {
            container1: 'ct1j'
          },
          2: {
            container1: 'ct1k'
          }
        }
      }
    };

    expect(Manifest.internalIdsForManifest({
      inputs: inputTypes
    }, inputs).toJS()).to.eql([
      // Not 'ct1k'
      'ct1a', 'ct1b', 'ct1c',
      'ct1d', 'ct1e', 'ct1f',
      'ct1g', 'ct1h', 'ct1i', 'ct1j'
    ]);
  });

  it('inputs value could be null or undefined', () => {
    const types = [
      'container+',
      'group',
      'group+',
      'aliquot+',
      'aliquot++'
    ];

    types.forEach(type => {
      expect(Manifest.internalIdsForManifest({
        inputs: {
          foobar: { type }
        }
      }, {
        foobar: null
      }).toJS()).to.eql([]);
      expect(Manifest.internalIdsForManifest({
        inputs: {
          foobar: { type }
        }
      }, {
        foobar: undefined
      }).toJS()).to.eql([]);
    });
  });

  it('gets data-generating instructions from a preview', () => {
    const preview = {
      refs: {},
      instructions: [{
        op: 'pipette'
      }, {
        op: 'image_plate',
        dataref: 'test'
      }, {
        op: 'image_plate',
        dataref: 'test2'
      }, {
        op: 'thermocycle',
        dataref: 'test3'
      }]
    };
    expect(Manifest.dataTypes(preview).toJS()).to.eql(['image_plate', 'thermocycle']);
  });

  it('generates defaults for group-choice', () => {
    const inputTypes = {
      test_choice: {
        type: 'group-choice',
        options: [{
          value: 'test1',
          inputs: {
            foo: {
              type: 'length',
              default: '20:nanometer'
            }
          }
        }, {
          value: 'test2',
          inputs: {
            bar: {
              type: 'volume',
              default: '20:microliter'
            }
          }
        }, {
          value: 'test3'
        }]
      }
    };
    expect(Manifest.defaults(inputTypes).toJS()).to.eql({
      test_choice: {
        value: undefined,
        inputs: {
          test1: {
            foo: '20:nanometer'
          },
          test2: {
            bar: '20:microliter'
          }
        }
      }
    });
  });

  it('does not error on empty required field in an unselected group-choice branch', () => {
    const choice_description = {
      type: 'group-choice',
      options: [{
        value: 'option1',
        inputs: {
          a1: {
            type: 'aliquot',
            required: true
          }
        }
      }, {
        value: 'option2',
        inputs: {
          a2: {
            type: 'aliquot',
            required: false
          }
        }
      }]
    };

    const choice_value = {
      value: 'option2',
      inputs: {
        option1: {
          a1: undefined
        },
        option2: {
          a2: undefined
        }
      }
    };

    expect(Manifest.errorFor(choice_description, choice_value).toJS()).to.eql({
      a2: undefined
    });
  });

  it('generates errors for required fields inside a group choice', () => {
    const choice_description = {
      type: 'group-choice',
      options: [{
        value: 'option1',
        inputs: {
          a1: {
            type: 'aliquot',
            required: true
          }
        }
      }]
    };

    const choice_value = {
      value: 'option1',
      inputs: {
        option1: {
          a1: undefined
        }
      }
    };

    expect(Manifest.errorFor(choice_description, choice_value).toJS()).to.eql({
      a1: 'Required Field'
    });
  });

  it('generates an error if a group-choice is required but not specified', () => {
    const choice_description = {
      type: 'group-choice',
      required: true,
      options: [{
        value: 'option1',
        inputs: {
          a1: {
            type: 'aliquot'
          }
        }
      }]
    };

    const choice_value = {
      value: undefined,
      inputs: {
        option1: {
          a1: undefined
        }
      }
    };

    expect(Manifest.errorFor(choice_description, choice_value)).to.be.equal('Required Field');
  });

  it('generates appropriate errors for integer-type fields', () => {
    expect(Manifest.errorFor({
      type: 'integer',
      required: true
    }, '')).to.be.equal('Required Field');
    expect(Manifest.errorFor({
      type: 'integer',
      required: true
    }, ' ')).to.be.equal('Required Field');
    expect(Manifest.errorFor({
      type: 'integer',
      required: true
    }, undefined)).to.be.equal('Required Field');
    expect(Manifest.errorFor({
      type: 'integer',
      required: true
    }, 'aoeu')).to.be.equal('Must be an integer');
    expect(Manifest.errorFor({
      type: 'integer',
      required: true
    }, '1aoeu')).to.be.equal('Must be an integer');
    expect(Manifest.errorFor({
      type: 'integer',
      required: true
    }, ' 1aoeu')).to.be.equal('Must be an integer');
    expect(Manifest.errorFor({
      type: 'integer',
      required: true
    }, ' 1')).to.be.equal(undefined);
    expect(Manifest.errorFor({
      type: 'integer',
      required: true
    }, '1 ')).to.be.equal(undefined);
    expect(Manifest.errorFor({
      type: 'integer',
      required: true
    }, ' 1 ')).to.be.equal(undefined);
    expect(Manifest.errorFor({
      type: 'integer',
      required: true
    }, '1.23')).to.be.equal('Must be an integer');
    expect(Manifest.errorFor({
      type: 'integer',
      required: true
    }, '-1')).to.be.equal(undefined);
    expect(Manifest.errorFor({
      type: 'integer',
      required: true
    }, '-40000')).to.be.equal(undefined);
  });

  it('does not error when selected option is undefined', () => {
    const choice_description = {
      type: 'group-choice',
      options: [{
        value: 'option2',
        inputs: {
          a1: {
            type: 'aliquot',
            required: true
          }
        }
      }]
    };

    const choice_value = {
      value: 'option1',
      inputs: {
        option1: {
          a1: undefined
        }
      }
    };

    expect(Manifest.errorFor(choice_description, choice_value)).to.be.equal(Immutable.Map({}));
  });

  it('filter csv inputTypes from inputTypes ', () => {
    const inputTypes =  {
      initial: {
        type: 'group',
        inputs: {
          sample_plate: {
            type: 'container'
          },
          target_volume: {
            type: 'volume'
          }
        }
      },
      map: {
        type: 'group+',
        inputs: {
          volume_map: {
            type: 'csv',
            template: {
              label: 'Upload CSV'
            }
          },
          sample_plate: {
            type: 'container'
          }
        }
      },
      cap: {
        type: 'group',
        inputs: {
          volume_map: {
            type: 'csv',
            template: {
              label: 'Upload CSV'
            }
          },
          sample_plate: {
            type: 'container'
          }
        }
      },
      cleanup: {
        type: 'group',
        inputs: {
          seal_last: {
            type: 'bool',
            default: true
          }
        }
      },
      samples: {
        type: 'group-choice',
        label: 'Samples to Aliquot',
        description: '',
        default: 'simple_form',
        options: [
          {
            name: 'Simple Aliquot Method via Strateos Console',
            value: 'simple_form',
            inputs: {
              racks: {
                type: 'group+',
                inputs: {
                  sample_volume: {
                    type: 'volume'
                  },
                  num_plates: {
                    type: 'decimal'
                  },
                  sample_name: {
                    type: 'string'
                  }
                }
              }
            }
          },
          {
            name: 'Aliquot Method via CSV Upload to Strateos Console',
            value: 'csv_form',
            inputs: {
              csv_info: {
                type: 'csv-table',
                template: {
                  header: [
                    'Rack Number'
                  ],
                  keys: [
                    'rack_num'
                  ],
                  col_type: [
                    'integer'
                  ],
                  rows: [
                    [
                      '1'
                    ],
                    [
                      '2'
                    ],
                    [
                      '3'
                    ]
                  ],
                  label: 'Click here to upload CSV.'
                }
              },
              sample_name: 'string'
            }
          }
        ]
      }
    };

    const csvInputTypes = {
      map: {
        type: 'group+',
        inputs: {
          volume_map: {
            type: 'csv',
            template: {
              label: 'Upload CSV'
            }
          }
        }
      },
      cap: {
        type: 'group',
        inputs: {
          volume_map: {
            type: 'csv',
            template: {
              label: 'Upload CSV'
            }
          }
        }
      },
      samples: {
        type: 'group-choice',
        label: 'Samples to Aliquot',
        description: '',
        default: 'simple_form',
        options: [
          {
            name: 'Aliquot Method via CSV Upload to Strateos Console',
            value: 'csv_form',
            inputs: {
              csv_info: {
                type: 'csv-table',
                template: {
                  header: [
                    'Rack Number'
                  ],
                  keys: [
                    'rack_num'
                  ],
                  col_type: [
                    'integer'
                  ],
                  rows: [
                    [
                      '1'
                    ],
                    [
                      '2'
                    ],
                    [
                      '3'
                    ]
                  ],
                  label: 'Click here to upload CSV.'
                }
              }
            }
          }
        ]
      }
    };
    expect(Manifest.csvInputs(inputTypes)).to.deep.eql(csvInputTypes);
  });

});
