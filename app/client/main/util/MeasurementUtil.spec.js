import { expect } from 'chai';
import Immutable  from 'immutable';
import {
  getQuantity,
  getScalarInDefaultUnits,
  getRepresentationalQuantity,
  getQuantityInDefaultUnits,
  appendDefaultUnits,
  appendDefaultShortUnits,
  getMeasurementMode,
  getMeasurementUnitFromMode,
  getNumericRangeText
} from './MeasurementUtil';

describe('MeasurementUtil', () => {

  it('getScalarInDefaultUnits for mass and mass_mg', () => {
    expect(getScalarInDefaultUnits(Immutable.fromJS({ mass: '10:microgram' }), 'mass')).to.be.equal(0.01);
    expect(getScalarInDefaultUnits(Immutable.fromJS({ mass_mg: '10:microgram' }), 'mass')).to.be.equal(0.01);
  });

  it('getScalarInDefaultUnits for volume and volume_ul', () => {
    expect(getScalarInDefaultUnits(Immutable.fromJS({ volume: '10:microliter' }))).to.be.equal(10);
    expect(getScalarInDefaultUnits(Immutable.fromJS({ volume_ul: '1:milliliter' }))).to.be.equal(1000);
  });

  it('getQuantity for mass and mass_mg', () => {
    expect(getQuantity(Immutable.fromJS({ mass: 10 }), 'mass')).to.be.equal(10);
    expect(getQuantity(Immutable.fromJS({ mass_mg: 10 }), 'mass')).to.be.equal(10);
  });

  it('getQuantity for volume and volume_ul', () => {
    expect(getQuantity(Immutable.fromJS({ volume: 10 }))).to.be.equal(10);
    expect(getQuantity(Immutable.fromJS({ volume_ul: 1 }))).to.be.equal(1);
  });

  it('getRepresentationalQuantity for mass and volume', () => {
    expect(getRepresentationalQuantity(10, 'mass')).to.be.equal('10:milligram');
    expect(getRepresentationalQuantity(10848, 'mass')).to.be.equal('10.848:gram');
    expect(getRepresentationalQuantity(1000, 'mass')).to.be.equal('1:gram');
    expect(getRepresentationalQuantity(5, 'volume')).to.be.equal('5:microliter');
    expect(getRepresentationalQuantity(8000, 'volume')).to.be.equal('8:milliliter');
    expect(getRepresentationalQuantity(20500, 'volume')).to.be.equal('20.5:milliliter');
  });

  it('getQuantityInDefaultUnits for volume_ul and mass_mg', () => {
    expect(getQuantityInDefaultUnits(Immutable.fromJS({ volume_ul: '10' }), 'volume')).to.be.equal('10:microliter');
    expect(getQuantityInDefaultUnits(Immutable.fromJS({ mass_mg: '10' }), 'mass')).to.be.equal('10:milligram');
  });

  it('appendDefaultUnits for volume_ul and mass_mg', () => {
    expect(appendDefaultUnits('10', 'volume')).to.be.equal('10:microliter');
    expect(appendDefaultUnits('10', 'mass')).to.be.equal('10:milligram');
  });

  it('appendDefaultShortUnits for volume_ul and mass_mg', () => {
    expect(appendDefaultShortUnits('10', 'volume')).to.be.equal('10 μL');
    expect(appendDefaultShortUnits('10', 'mass')).to.be.equal('10 mg');
  });

  it('getMeasurementMode should return correct mode', () => {
    expect(getMeasurementMode(Immutable.fromJS({
      volume_per_container: 10
    }))).to.be.equal('volume');
    expect(getMeasurementMode(Immutable.fromJS({
      volume_per_container: 10,
      mass_mg: 10
    }))).to.be.equal('volume');
    expect(getMeasurementMode(Immutable.fromJS({
      mass_mg: 10
    }))).to.be.equal('mass');
  });

  it('getMeasurementUnitFromMode should return correct unit', () => {
    expect(getMeasurementUnitFromMode('volume')).to.be.equal('volume_ul');
    expect(getMeasurementUnitFromMode('mass')).to.be.equal('mass_mg');
  });

  it('getNumericRangeText should return correct range as string', () => {
    expect(getNumericRangeText({ min: 1, max: undefined })).to.be.equal('1-');
    expect(getNumericRangeText({ min: 1, max: '' })).to.be.equal('1-');
    expect(getNumericRangeText({ min: undefined, max: 1 })).to.be.equal('-1');
    expect(getNumericRangeText({ min: '', max: 1 })).to.be.equal('-1');
    expect(getNumericRangeText({ min: 1, max: 2 })).to.be.equal('1-2');
    expect(getNumericRangeText({ min: 0, max: 1 })).to.be.equal('0-1');
    expect(getNumericRangeText({ min: -1, max: 0 })).to.be.equal('-1-0');
    expect(getNumericRangeText({ min: '1', max: '2' })).to.be.equal('1-2');
    expect(getNumericRangeText({ min: undefined, max: undefined })).to.be.equal('Any');
    expect(getNumericRangeText({ min: '', max: '' })).to.be.equal('Any');
    expect(getNumericRangeText()).to.be.equal('Any');
  });
});
