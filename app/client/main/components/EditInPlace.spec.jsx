import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';

import { EditInPlace, ExpandingInput } from './EditInPlace';

describe('EditInPlace', () => {
  let wrapper;

  const props = {
    onSave: () => {}
  };

  afterEach(() => {
    wrapper.unmount();
  });

  it('renders', () => {
    wrapper = shallow(<EditInPlace {...props}  />);
    expect(wrapper).to.not.be.undefined;
  });

  it('can start in edit mode', () => {
    wrapper = mount(<EditInPlace {...props} startInEdit />);
    expect(wrapper.state().editAction).to.equal('editing');
    expect(wrapper.find(ExpandingInput).length).to.equal(1);
  });

  it('shows an edit icon by default', () => {
    wrapper = shallow(<EditInPlace  {...props} />);
    expect(wrapper).to.not.be.undefined;
    expect(wrapper.find('i.fa.fa-edit').length).to.equal(1);
  });

});
