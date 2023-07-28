import StringUtil from 'main/util/String';

import { expect } from 'chai';

describe('StringUtil', () => {
  it('compares semantic versions', () => {
    expect(StringUtil.semanticCompare('0.0.1', '0.0.2')).to.be.equal(-1);
    expect(StringUtil.semanticCompare('0.0.3', '0.0.2')).to.be.equal(1);
    expect(StringUtil.semanticCompare('0.0.1', '0.0.1')).to.be.equal(0);
    expect(StringUtil.semanticCompare('1.0.1', '0.2.2')).to.be.equal(1);
  });

  it('splitting string by default regex expression', () => {
    const splitArray = ['123', '124'];
    expect(StringUtil.splitWithRegex('123 124')).to.deep.equal(splitArray);
    expect(StringUtil.splitWithRegex('123\n124')).to.deep.equal(splitArray);
    expect(StringUtil.splitWithRegex('123,124')).to.deep.equal(splitArray);
  });

  it('splitting string by regex passed in params', () => {
    const splitArray = ['123', '124'];
    expect(StringUtil.splitWithRegex('123;124', ';')).to.deep.equal(splitArray);
  });

  it('remove non-printable ASCII Chars by regex passed in', () => {
    const expectedText = 'A foo bar 2020';
    const text1 = 'äÄçÇéÉ' + expectedText + 'êöÖÐþúÚ';
    expect(StringUtil.removeNonPrintableAscii(text1)).to.deep.equal(expectedText);
    const text2 = String.fromCharCode(0, '7C', 20) + expectedText;
    expect(StringUtil.removeNonPrintableAscii(text2)).to.deep.equal(expectedText);
    const controlCodes = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x7F];
    const text3 = String.fromCharCode(...controlCodes) + expectedText;
    expect(StringUtil.removeNonPrintableAscii(text3)).to.deep.equal(expectedText);
  });
});
