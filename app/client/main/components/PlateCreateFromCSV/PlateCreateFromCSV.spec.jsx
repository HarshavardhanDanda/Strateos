import { expect } from 'chai';
import Immutable from 'immutable';

import { createWellMap, payload } from './PlateCreateFromCSV';

describe('PlateCreateFromCSV', () => {
  it('Should transform well data to well map with proper order', () => {
    const wellData = [{
      'Well Index': 'A1',
      'Well Label': 'my well1',
      'Vol (uL)': '10'
    },
    {
      'Well Index': 'B2',
      'Well Label': 'my well4',
      'Vol (uL)': '40'
    },
    {
      'Well Index': 'A2',
      'Well Label': 'my well2',
      'Vol (uL)': '20'
    },
    {
      'Well Index': 'B1',
      'Well Label': 'my well3',
      'Vol (uL)': '30'
    },
    {
      'Well Index': 'AA2',
      'Well Label': 'my well5',
      'Vol (uL)': '15'
    }];

    const mockContainerType = Immutable.Map({ well_volume_ul: 50, well_count: 54, col_count: 2 });
    const wellMap = createWellMap(wellData, mockContainerType).toJS();

    expect(wellMap).to.eql({
      0: {
        name: 'my well1',
        volume: '10:microliter',
        properties: {},
        hasError: undefined,
        hasVolume: true,
        mass: undefined
      },
      1: {
        name: 'my well2',
        volume: '20:microliter',
        properties: {},
        hasError: undefined,
        hasVolume: true,
        mass: undefined
      },
      2: {
        name: 'my well3',
        volume: '30:microliter',
        properties: {},
        hasError: undefined,
        hasVolume: true,
        mass: undefined
      },
      3: {
        name: 'my well4',
        volume: '40:microliter',
        properties: {},
        hasError: undefined,
        hasVolume: true,
        mass: undefined
      },
      53: {
        name: 'my well5',
        volume: '15:microliter',
        properties: {},
        hasError: undefined,
        hasVolume: true,
        mass: undefined
      }
    });
  });

  it('Should fail when no mass or volume is defined', () => {
    const wellData = [{
      'Well Index': 'A1',
      'Well Label': 'my well1'
    }];
    const mockContainerType = Immutable.Map({ well_volume_ul: 50, well_count: 4, col_count: 2 });
    const wellMap = createWellMap(wellData, mockContainerType).toJS();
    expect(wellMap).to.eql({
      0: {
        name: 'my well1',
        volume: undefined,
        properties: {},
        hasError: 'Must be between 0 and 50',
        hasVolume: true,
        mass: undefined
      }
    });
  });

  it('Should pass when no volume is defined but mass is defined', () => {
    const wellData = [{
      'Well Index': 'A1',
      'Well Label': 'my well1',
      'Mass (mg)': '25'
    }];
    const mockContainerType = Immutable.Map({ well_volume_ul: 50, well_count: 4, col_count: 2 });
    const wellMap = createWellMap(wellData, mockContainerType).toJS();
    expect(wellMap).to.eql({
      0: {
        name: 'my well1',
        volume: undefined,
        properties: {},
        hasError: undefined,
        hasVolume: true,
        mass: '25:milligram'
      }
    });
  });

  it('Should pass when no mass is defined but volume is defined', () => {
    const wellData = [{
      'Well Index': 'A1',
      'Well Label': 'my well1',
      'Vol (uL)': '25'
    }];
    const mockContainerType = Immutable.Map({ well_volume_ul: 50, well_count: 4, col_count: 2 });
    const wellMap = createWellMap(wellData, mockContainerType).toJS();
    expect(wellMap).to.eql({
      0: {
        name: 'my well1',
        volume: '25:microliter',
        properties: {},
        hasError: undefined,
        hasVolume: true,
        mass: undefined
      }
    });
  });

  it('Should add non-empty properties', () => {
    const wellData = [{
      'Well Index': 'A1',
      'Well Label': 'my well1',
      'Vol (uL)': '10',
      someColName: 'FOO',
      someOtherColName: undefined,
      someThirdCol: 'abc'
    },
    {
      'Well Index': 'A2',
      'Well Label': 'my well2',
      'Vol (uL)': '20',
      someOtherColName: 'BAR',
      someThirdCol: '123'
    }];

    const mockContainerType = Immutable.Map({ well_volume_ul: 50, well_count: 2, col_count: 2 });
    const wellMap = createWellMap(wellData, mockContainerType).toJS();

    expect(wellMap).to.eql({
      0: {
        name: 'my well1',
        volume: '10:microliter',
        properties: {
          someColName: 'FOO',
          someThirdCol: 'abc'
        },
        hasError: undefined,
        hasVolume: true,
        mass: undefined
      },
      1: {
        name: 'my well2',
        volume: '20:microliter',
        properties: {
          someOtherColName: 'BAR',
          someThirdCol: '123'
        },
        hasError: undefined,
        hasVolume: true,
        mass: undefined
      }
    });
  });

  it('Should generate error when volume out of bounds', () => {
    const wellData = [{
      'Well Index': 'A1',
      'Well Label': 'my well1',
      'Vol (uL)': '10'
    },
    {
      'Well Index': 'A2',
      'Well Label': 'my well2',
      'Vol (uL)': '200'
    },
    {
      'Well Index': 'B1',
      'Well Label': 'my well3',
      'Vol (uL)': '-10'
    }];

    const mockContainerType = Immutable.Map({ well_volume_ul: 50, well_count: 4, col_count: 2 });
    const wellMap = createWellMap(wellData, mockContainerType).toJS();

    expect(wellMap).to.eql({
      0: {
        name: 'my well1',
        volume: '10:microliter',
        properties: {},
        hasError: undefined,
        hasVolume: true,
        mass: undefined
      },
      1: {
        name: 'my well2',
        volume: '200:microliter',
        properties: {},
        hasError: 'Must be between 0 and 50',
        hasVolume: true,
        mass: undefined
      },
      2: {
        name: 'my well3',
        volume: '-10:microliter',
        properties: {},
        hasError: 'Must be between 0 and 50',
        hasVolume: true,
        mass: undefined
      }
    });
  });

  it('Should give the correct plate csv payload', () => {
    const mockContainerType = Immutable.Map({ well_volume_ul: 50, well_count: 4, col_count: 2 });
    const csvPayload = payload(mockContainerType);
    expect(csvPayload).to.eql(
      'Well Index,Well Label,Vol (uL),Mass (mg)\n' +
      'A1,,,\n' +
      'A2,,,\n' +
      'B1,,,\n' +
      'B2,,,'
    );
  });
});
