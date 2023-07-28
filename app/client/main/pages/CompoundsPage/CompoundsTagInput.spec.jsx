import React from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import CompoundsTagInput from './CompoundsTagInput';

describe('CompoundsTagInput', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should render component', () => {
    wrapper = shallow(
      <CompoundsTagInput tags={['tag1', 'tag2']} />
    );
    expect(wrapper).to.not.be.undefined;
  });

  it('should render Tag component', () => {
    wrapper = shallow(
      <CompoundsTagInput tags={['tag1', 'tag2']} />
    );
    expect(wrapper.dive().find('Tag').at(0).prop('text')).to.equal('tag1');
    expect(wrapper.dive().find('Tag').at(1).prop('text')).to.equal('tag2');
  });
});
