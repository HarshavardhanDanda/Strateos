import { expect } from 'chai';
import ProvisionUtil from './ProvisionUtil';
import { instruction0, refsByName0, charts0, instruction2, refsByName2, charts2 } from './instruction-only-data';
import { provisionSpec1, refsByName1, sourceContainers1, charts1, provisionSpec3, refsByName3, sourceContainers3, charts3 } from './provision-spec-data';

describe('ProvisionUtil', () => {
  it('generates instruction only charts correctly when measurement mode is not specified(default should be volume)', () => {
    const data = new ProvisionUtil({
      instruction: instruction0,
      refsByName: refsByName0
    }).charts;

    expect(data).to.eql(charts0);
  });

  it('generates full provision spec charts correctly when measurement mode is not specified(default should be volume)', () => {
    const data = new ProvisionUtil({
      refsByName: refsByName1,
      provisionSpec: provisionSpec1,
      sourceContainers: sourceContainers1
    }).charts;

    expect(data).to.eql(charts1);
  });

  it('generates instruction only charts correctly when measurement mode is volume', () => {
    const data = new ProvisionUtil({
      instruction: instruction0,
      refsByName: refsByName0,
      measurementMode: 'volume'
    }).charts;

    expect(data).to.eql(charts0);
  });

  it('generates full provision spec charts correctly when measurement mode volume', () => {
    const data = new ProvisionUtil({
      refsByName: refsByName1,
      provisionSpec: provisionSpec1,
      sourceContainers: sourceContainers1,
      measurementMode: 'volume'
    }).charts;

    expect(data).to.eql(charts1);
  });

  it('generates instruction only charts correctly when measurement mode is mass', () => {
    const data = new ProvisionUtil({
      instruction: instruction2,
      refsByName: refsByName2,
      measurementMode: 'mass'
    }).charts;

    expect(data).to.eql(charts2);
  });

  it('generates full provision spec charts correctly when measurement mode is mass', () => {
    const data = new ProvisionUtil({
      refsByName: refsByName3,
      provisionSpec: provisionSpec3,
      sourceContainers: sourceContainers3,
      measurementMode: 'mass'
    }).charts;

    expect(data).to.eql(charts3);
  });
});
