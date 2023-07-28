import { expect } from 'chai';

import { PAGE_SIZE_OPTION_1, PAGE_SIZE_OPTION_2, PAGE_SIZE_OPTION_3, PAGE_SIZE_OPTION_4, PAGE_SIZE_OPTIONS,
  getDefaultSearchPerPage } from './List';

describe('List', () => {
  it('should have correct page size option values', () => {
    expect(PAGE_SIZE_OPTION_1).to.equal(10);
    expect(PAGE_SIZE_OPTION_2).to.equal(25);
    expect(PAGE_SIZE_OPTION_3).to.equal(50);
    expect(PAGE_SIZE_OPTION_4).to.equal(100);
  });

  it('should have correct page size options', () => {
    expect(PAGE_SIZE_OPTIONS).to.deep.equal([10, 25, 50, 100]);
  });

  it('should have correct search per page value', () => {
    expect(getDefaultSearchPerPage()).to.equal(10);
  });
});
