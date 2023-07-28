import { expect } from 'chai';
import sinon from 'sinon';

import ContainerTypeStore from './ContainerTypeStore';

const containerTypes = [{
  shortname: 'bottle-250',
  retired_at: null,
  name: '250mL Bottle',
  is_tube: true,
  type: 'container_types',
  id: 'bottle-250',
  well_count: 1
}, {
  shortname: '384-pcr',
  vendor: 'Eppendorf',
  retired_at: null,
  name: '384-Well twin.tec PCR Plate',
  is_tube: false,
  type: 'container_types',
  id: '384-pcr',
  well_count: 384
}, {
  shortname: 'pcr-0.5',
  vendor: 'USA Scientific',
  retired_at: '2018-02-27T11:34:55.457-08:00',
  name: '0.5mL PCR tube',
  is_tube: true,
  type: 'container_types',
  id: 'pcr-0.5',
  well_count: 1
}];

describe('ContainerTypeStore', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    ContainerTypeStore._empty();
    ContainerTypeStore.initialize(containerTypes);
  });

  afterEach(() => {
    if (sandbox) { sandbox.restore(); }
  });

  it('should return usable (non-retired) container types', () => {
    const usableContainerTypes = ContainerTypeStore.usableContainerTypes();
    expect(usableContainerTypes.toJS()).to.deep.equal([containerTypes[0], containerTypes[1]]);
  });

  it('should return tubes', () => {
    const tubes = ContainerTypeStore.tubes();
    expect(tubes.toJS()).to.deep.equal([containerTypes[0], containerTypes[2]]);
  });

  it('should return true if container type is a tube when checking for tubes', () => {
    const isTube = ContainerTypeStore.isTube('bottle-250');
    expect(isTube).to.be.true;
  });

  it('should return false if container type is a not tube when checking for tubes', () => {
    const isTube = ContainerTypeStore.isTube('384-pcr');
    expect(isTube).to.be.false;
  });

  it('should return true if container type is a plate when checking for plates', () => {
    const isPlate = ContainerTypeStore.isPlate('384-pcr');
    expect(isPlate).to.be.true;
  });

  it('should return false if container type is not a plate when checking for plates', () => {
    const isPlate = ContainerTypeStore.isPlate('bottle-250');
    expect(isPlate).to.be.false;
  });

  it('should get container types filtered by well count', () => {
    const containerTypesByWellCount = ContainerTypeStore.getContainerTypesByWellCount(1);
    expect(containerTypesByWellCount.toJS()).to.deep.equal([containerTypes[0], containerTypes[2]]);
  });

  it('should get container type Ids filtered by well count', () => {
    const containerTypeIDsByWellCount = ContainerTypeStore.getContainerTypeIDsByWellCount(384);
    expect(containerTypeIDsByWellCount.toJS()).to.deep.equal([containerTypes[1].id]);
  });
});
