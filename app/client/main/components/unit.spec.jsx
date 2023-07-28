import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import Unit from './unit';

describe('Unit', () => {
  let wrapper;
  afterEach(() => {
    wrapper.unmount();
  });

  it('should correctly display values without decimals and corresponding mass units', () => {
    wrapper = shallow(<Unit value={'100:milligram'} />);
    expect(wrapper.find('span').text()).equals('100 mg');
  });

  it('should correctly display values with decimals if original value has decimals', () => {
    wrapper = shallow(<Unit value={'100.0123:milligram'} />);
    expect(wrapper.find('span').text()).equals('100.0123 mg');
  });

  it('should correctly display values without decimals and corresponding volume units', () => {
    wrapper = shallow(<Unit value={'10:microliter'} />);
    expect(wrapper.find('span').text()).equals('10 μL');
  });

  describe('convertForDisplay is sent as a prop', () => {
    it('should display entire values with decimals if original value has decimals', () => {
      wrapper = shallow(<Unit value={'123456.0789:milligram'} convertForDisplay />);
      expect(wrapper.find('span').text()).equals('123.4560789 g');
    });
  });
});
