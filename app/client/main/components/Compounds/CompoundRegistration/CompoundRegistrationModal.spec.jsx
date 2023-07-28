import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import { CompoundRegistrationModal } from 'main/components/Compounds';

describe('Compound Registration Modal', () => {

  it('should not mount SpecifyPane when compoundId is undefined', () => {
    const wrapper = shallow(<CompoundRegistrationModal />);
    expect(wrapper.state().compoundId).to.equal(undefined);
    expect(wrapper.find('ConnectedSpecifyPane').length).to.equal(0);
  });

  it('should render SpecifyPane when compoundId is not undefined', () => {
    const wrapper = shallow(<CompoundRegistrationModal />);
    expect(wrapper.state().compoundId).to.equal(undefined);
    wrapper.find('DrawPane').props().setCompound('id', true, 'smile');
    expect(wrapper.state().compoundId).to.equal('id');
    expect(wrapper.find('ConnectedSpecifyPane').length).to.equal(1);
  });
});
