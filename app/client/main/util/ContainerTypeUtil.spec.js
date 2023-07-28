import { expect } from 'chai';
import Immutable from 'immutable';
import * as ContainerTypeUtil from 'main/util/ContainerTypeUtil';

describe('ContainerTypeUtil', () => {
  const containerType = Immutable.fromJS({
    id: 'vendor-tube',
    well_volume_ul: '3500',
    well_count: 1
  });

  it('should get maximum volume for the given container type', () => {
    expect(ContainerTypeUtil.getMaxVolume(containerType)).to.be.equal(3500);
  });

  it('should get maximum mass for the given container type', () => {
    expect(ContainerTypeUtil.getMaxMass(containerType)).to.be.equal(7000);
  });

  it('should return undefined if containerType is undefined for getMaxVolume', () => {
    expect(ContainerTypeUtil.getMaxVolume(undefined)).to.be.undefined;
  });

  it('should return undefined if containerType is undefined for getMaxMass', () => {
    expect(ContainerTypeUtil.getMaxMass(undefined)).to.be.undefined;
  });
});
