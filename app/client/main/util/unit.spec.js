import { expect } from 'chai';
import * as Unit from './unit';

describe('unit', () => {
  describe('convertUnitShorthandToName', () => {
    it('should return correct values for convertUnitShorthandToName. If this fails, it is likely ' +
      'that a new UnitShortNames property was added, but the regex was not updated', () => {
      for (const key in Unit.UnitShortNames) {
        const value = Unit.convertUnitShorthandToName(`10:${key}`);
        expect(value).to.equal(`10:${Unit.UnitShortNames[key]}`);
      }
    });

    it('should replace units that contain Latin µ (ASCII code 181) with Greek μ (ASCII code 956)', () => {
      const LATIN_MU = 'µ'; // ASCII code 181
      let value = Unit.convertUnitShorthandToName(`10:${LATIN_MU}L`);
      expect(value).to.equal('10:microliter');
      value = Unit.convertUnitShorthandToName(`10:${LATIN_MU}g`);
      expect(value).to.equal('10:microgram');
    });

    it('should return undefined for invalid input', () => {
      const value = Unit.convertUnitShorthandToName('test');
      expect(value).to.be.undefined;
    });

    it('should return converted value from milligram to gram', () => {
      const value = Unit.convertValue(45, 'mass', 'milligram', 'gram');
      expect(value).to.be.equal(0.045);
    });

    it('should return undefined if from or to is invalid', () => {
      const value = Unit.convertValue(45, 'mass', 'milligram', 'seconds');
      expect(value).to.be.undefined;
    });

    it('should return with split value and unit', () => {
      let value = Unit.getValueAndUnit('45:milligram');
      expect(value[0]).to.be.equal('45');
      expect(value[1]).to.be.equal('milligram');

      value = Unit.getValueAndUnit('45:%');
      expect(value[0]).to.be.equal('45');
      expect(value[1]).to.be.equal('%');
    });

    it('should return a formatted value', () => {
      let value = Unit.formatValue('45:milligram');
      expect(value).to.be.equal('45mg');

      value = Unit.formatValue('45:%');
      expect(value).to.be.equal('45%');

      value = Unit.formatValue('45:abc');
      expect(value).to.be.equal('45abc');
    });

    it('should return undefined when value is invalid', () => {
      let value = Unit.getValueAndUnit('test:milligram');
      expect(value[0]).to.be.undefined;
      expect(value[1]).to.be.undefined;

      value = Unit.getValueAndUnit('test:%');
      expect(value[0]).to.be.undefined;
      expect(value[1]).to.be.undefined;
    });
  });
});
