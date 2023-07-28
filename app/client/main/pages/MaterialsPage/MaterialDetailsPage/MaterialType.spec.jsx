import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import MaterialType from './MaterialType';

describe('MaterialType', () => {
  let wrapper;

  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  it('should display Type dropdown with 1st option as Individual and 2nd as Group', () => {
    wrapper = shallow(
      <MaterialType
        type="individual"
        onChange={() => {}}
      />
    );
    const select = wrapper.find('Select');
    expect(wrapper.find('LabeledInput').at(0).prop('label')).to.equal('TYPE');
    expect(select.prop('options')).to.have.length(2);
    expect(select.prop('options')[0].value).to.equal('individual');
    expect(select.prop('options')[0].name).to.equal('Individual');
    expect(select.prop('options')[1].value).to.equal('group');
    expect(select.prop('options')[1].name).to.equal('Group');
  });
});
