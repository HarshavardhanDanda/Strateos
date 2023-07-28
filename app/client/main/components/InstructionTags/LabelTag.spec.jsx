import React from 'react';
import PropTypes from 'prop-types';
import sinon from 'sinon';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import LabelTag from './LabelTag';

describe('LabelTag', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (wrapper)wrapper.unmount();
    if (sandbox)sandbox.restore();
  });

  it('should call the onnavigate container context method on click', () => {
    const navigateContainerSpy = sinon.stub();
    wrapper = shallow(<LabelTag containerId={'ct1euf24x7k9mp5'} label={'XYZ'} color={'#fff'} />, {
      context: { onNavigateContainer:  navigateContainerSpy },
      childContextTypes: { onNavigateContainer: PropTypes.func }
    });
    expect(wrapper.find('BaseTag').dive().text()).to.equal('XYZ');
    wrapper.simulate('click', new Event('click'));
    expect(navigateContainerSpy.calledOnce).to.be.true;
    expect(navigateContainerSpy.calledWith('ct1euf24x7k9mp5')).to.be.true;
  });

});
