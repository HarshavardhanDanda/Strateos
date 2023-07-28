import { expect } from 'chai';
import AdminUrls from './urls';

describe('AdminUrls', () => {
  it('should return the correct base url', () => {
    expect(AdminUrls.base()).to.equal('/admin');
  });
});
