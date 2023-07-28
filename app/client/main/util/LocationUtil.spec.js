import { expect } from 'chai';
import LocationUtil from './LocationUtil';

describe('LocationUtil', () => {
  it('should set root and region child categories as same except for "region"', () => {
    const rootChildCategories = LocationUtil.addableChildCategories().toJS();
    const regionChildCategories = LocationUtil.addableChildCategories('region').toJS();

    expect(rootChildCategories).to.include('region');
    rootChildCategories.pop();
    expect(rootChildCategories).to.eql(regionChildCategories);
  });
});
