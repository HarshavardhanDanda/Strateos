import Immutable from 'immutable';
import { expect } from 'chai';

// Disabling to allow hard coded json
/* eslint-disable quotes */
/* eslint-disable quote-props */

import AutoprotocolUtil from 'main/util/AutoprotocolUtil';
import containerFromRef from './containerFromRef';

const stampTransfer1 = {
  volume: '1.0:microliter',
  to: 'final_assembly_plate/0',
  from: 'annealed_oligo_plate/0'
};

const stampTransfer2 = {
  volume: '1.0:microliter',
  to: 'my_dna_container/0',
  from: 'your_dna_container/0'
};

describe('AutoprotocolUtil', () => {

  describe('#containerFromRef', () => {
    it('extracts container name', () => {
      expect(containerFromRef('my_dna/1')).to.eql('my_dna');
    });
  });

  describe('#containerNamesInOperation', () => {
    const { containerNamesInOperation } = AutoprotocolUtil;

    const test = (op, expectedNames) => {
      const actual = containerNamesInOperation(Immutable.fromJS(op));
      expect(actual.equals(Immutable.Set(expectedNames))).to.be.true;
    };

    it('pipette', () => {
      const operation = {
        op: 'pipette',
        groups: [{
          transfer: [{
            volume: '1.0:microliter',
            to: 'my_dna_container/1',
            from: 'duplicate_container/0'
          }]
        }, {
          mix: [{
            volume: '1.0:microliter',
            well: 'duplicate_container/1'
          }]
        }]
      };
      test(operation, ['duplicate_container', 'my_dna_container']);
    });

    it('stamp', () => {
      const operation = {
        op: 'stamp',
        groups: [{
          transfer: [stampTransfer1]
        }, {
          transfer: [stampTransfer2]
        }]
      };

      const expected = [
        'annealed_oligo_plate', 'final_assembly_plate',
        'your_dna_container', 'my_dna_container'
      ];

      test(operation, expected);
    });

    it('legacy stamp', () => {
      const operation = {
        op: 'stamp',
        transfers: [stampTransfer1, stampTransfer2]
      };

      const expected = [
        'annealed_oligo_plate', 'final_assembly_plate',
        'your_dna_container', 'my_dna_container'
      ];

      test(operation, expected);
    });

    it('gel_separate', () => {
      const operation = {
        "op": "gel_separate",
        "matrix": "agarose(96,2.0%)",
        "ladder": "ladder1",
        "objects": [
          "destination/0",
          "destination/1",
          "control/0",
          "control/1"
        ],
        "duration": "12:minute"
      };

      test(operation, ['destination', 'control']);
    });

    it('lcmrm', () => {
      const operation = {
        op: "lcmrm",
        wells: [
          "somename/0",
          "someothername/3",
          "someothername/4"
        ],
        dataref: "somerefname",
        injection_volume: '2:microliter',
        transitions: [
          {
            analyte: "H3K9",
            label: "substrate",
            precursor: 619.4,
            product: 70.1,
          },
          {
            analyte: "H3K9",
            label: "internal_standard",
            precursor: 608.02,
            product: 70.1,
          },
          {
            analyte: "H3K9",
            label: "product",
            precursor: 605,
            product: 70.1,
          },
        ],
        method_name: 'HDAC H3K9.m'
      };

      test(operation, ['somename', 'someothername']);
    });

    it('lcms', () => {
      const operation = {
        op: "lcms",
        objects: [
          "somename/0",
          "someothername/3",
          "someothername/4"
        ],
        dataref: "somerefname",
        injection_volume: '2:microliter',
        num_injections: 4,
        method_name: 'Gemini2_LowpH'
      };

      test(operation, ['somename', 'someothername']);
    });

    it('oligosynthesize', () => {
      const operation = {
        "op": "oligosynthesize",
        "oligos": [
          {
            "destination": "dna/A1",
            "sequence": "ccgg",
            "scale": "25nm",
            "purification": "standard"
          }
        ]
      };
      test(operation, ['dna']);
    });

    it('miniprep', () => {
      const operation = {
        "op": "miniprep",
        "groups": [{ "to": "to/0", "from": "from/0" }]
      };
      test(operation, ['from', 'to']);
    });

    it('spectrophotometry', () => {
      const operation = {
        object: "somename",
        groups: [
          {
            mode: "fluorescence",
            mode_params: {
              integration_time: "0.4:millisecond",
              excitation: [
                {
                  ideal: "337:nanometer"
                }
              ],
              emission: [
                {
                  ideal: "665:nanometer"
                },
                {
                  ideal: "620:nanometer"
                }
              ],
              wells: [
                "somename/0",
                "somename/1"
              ],
              read_position: "top",
              num_flashes: 1,
              settle_time: "0:millisecond"
            }
          }
        ],
        op: "spectrophotometry"
      };

      test(operation, ['somename']);
    });

    it('spread', () => {
      const operation = {
        "op": "spread",
        "volume": "20:microliter",
        "to": "to/0",
        "from": "from/0"
      };
      test(operation, ['from', 'to']);
    });

    it('autopick', () => {
      const operation = {
        "op": "autopick",
        "groups": [
          {
            "from": ["from1/0", "from2/0"],
            "to": ["to1/0", "to2/0"]
          }
        ]
      };
      test(operation, ['from1', 'from2', 'to1', 'to2']);
    });

    it('autopick without groups', () => {
      const operation = {
        "op": "autopick",
        "to": ["to1/0", "to2/0"],
        "from": "from/0",
        "dataref": "autopick_28"
      };
      test(operation, ['from', 'to1', 'to2']);
    });

    it('flow_analyze', () => {
      const operation = {
        "op": "flow_analyze",
        "negative_controls": [
          { "well": "neg1/0" }
        ],
        "positive_controls": [
          { "well": "pos1/0" },
          { "well": "pos2/0" }
        ],
        "samples": [
          { "well": "sample1/0" }
        ]
      };
      test(operation, ['neg1', 'pos1', 'pos2', 'sample1']);
    });

    it('provision', () => {
      const operation = {
        "op": "provision",
        "resource_id": "foo",
        "to": [
          {
            "well": "to1/0",
            "volume": "1.0:microliter"
          },
          {
            "well": "to2/0",
            "volume": "1.0:microliter"
          }
        ]
      };
      test(operation, ['to1', 'to2']);
    });

    it('magnetic_transfer', () => {
      const operation = {
        "op": "magnetic_transfer",
        "groups": [
          [
            {
              "mix": {
                "object": "obj1"
              }
            },
            {
              "collect": {
                "object": "obj2"
              }
            }
          ],
          [
            {
              "release": {
                "object": "obj1"
              }
            },
            {
              "mix": {
                "object": "obj3"
              }
            }
          ]
        ]
      };
      test(operation, ['obj1', 'obj2', 'obj3']);
    });

    it('dispense', () => {
      const operation = {
        "op": "dispense",
        "object": "obj"
      };
      test(operation, ['obj']);
    });

    it('dispense with reagent', () => {
      const operation = {
        "op": "dispense",
        "object": "obj",
        "reagent_source": "rsource"
      };
      test(operation, ['obj', 'rsource']);
    });

    it('operations with one object', () => {
      const ops = ['absorbance', 'envision', 'fluorescence', 'luminescence', 'incubate',
        'spin', 'thermocycle', 'seal', 'unseal', 'cover', 'uncover',
        'sanger_sequence', 'image_plate', 'flash_freeze',
        'mesoscale_sectors600', 'x_blue_wash'];
      ops.forEach((op) => {
        const operation = {
          "op": op,
          "object": "object"
        };
        test(operation, ['object']);
      });
    });

    it('measure', () => {
      const operation = {
        "op": "measure_mass",
        "object": "object/0"
      };
      test(operation, ['object']);
    });

    it('liquid_handle', () => {
      const operation = {
        "op": "liquid_handle",
        "locations": [
          {
            "location": "obj1/0"
          },
          {
            "location": "obj2/0"
          },
          {
            "location": "obj1/0"
          },
          {
            "location": "obj3/0"
          }
        ]
      };
      test(operation, ['obj1', 'obj2', 'obj3']);
    });
  });
});
