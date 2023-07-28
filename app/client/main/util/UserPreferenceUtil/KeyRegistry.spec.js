import { expect } from 'chai';
import _ from 'lodash';
import KeyRegistry from './KeyRegistry';

describe('KeyRegistry test', () => {

  it('should not contain duplicate values to serve as keys in local storage', () => {
    const values = [];
    for (const key in KeyRegistry) {
      values.push(KeyRegistry[key]);
    }
    const uniqueValues = new Set(values);
    expect(uniqueValues.size === values.length).to.be.true;
  });
});
