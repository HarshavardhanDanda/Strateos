import { expect } from 'chai';
import moment from 'moment';

import { todayInFormat } from './TimeUtil';

describe('TimeUtil', () => {
  it('todayInFormat should return in the provided format', () => {
    expect(todayInFormat('MM_DD_YY')).to.eql(moment().format('MM_DD_YY'));
    expect(todayInFormat('DD_YYYY')).to.eql(moment().format('DD_YYYY'));
  });

  it('todayInFormat should return in DD_MM_YYYY when no format is provided', () => {
    expect(todayInFormat()).to.eql(moment().format('DD_MM_YYYY'));
  });
});
