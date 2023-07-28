import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import AjaxedAutocomplete from './Autocomplete';

describe('Autocomplete', () => {
  let wrapper;
  const props = {
    value: 'value1',
    id: 'autocomplete',
    onChange: (value) => wrapper.setProps({ value }),
    onSearch: () => {}
  };

  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  it('should update value prop when onchange in input', () => {
    wrapper = mount(<AjaxedAutocomplete {...props} />);
    expect(wrapper.find('input').props().value).to.equals('value1');

    wrapper.find('input').props().onChange({ target: { value: 'value2' } });
    expect(wrapper.find('input').props().value).to.equals('value2');
  });

  it('should update value when selected from drop down', () => {
    wrapper = mount(<AjaxedAutocomplete {...props} data={['value12', 'value13']} />);

    expect(wrapper.find('input').props().value).to.equals('value1');
    expect(wrapper.find('a').length).to.equals(2);
    wrapper.find('a').at(0).props().onClick();
    wrapper.update();

    expect(wrapper.find('input').props().value).to.equals('value12');
    expect(wrapper.find('a').length).to.equals(0);
  });
});
