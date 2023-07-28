import { expect } from 'chai';
import ArrayUtil from './ArrayUtil';

describe('ArrayUtil', () => {
  describe('firstNonEmptyValue', () => {
    it('should return first value that is not nil or empty string', () => {
      expect(ArrayUtil.firstNonEmptyValue([null, undefined, '', 'string'])).to.equal('string');
      expect(ArrayUtil.firstNonEmptyValue([null, undefined, 0, 'string'])).to.equal(0);
      expect(ArrayUtil.firstNonEmptyValue(['string1', 'string2'])).to.equal('string1');
      expect(ArrayUtil.firstNonEmptyValue([null])).to.equal(undefined);
    });
  });
});
