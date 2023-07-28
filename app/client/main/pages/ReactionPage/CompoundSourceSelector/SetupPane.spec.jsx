import React from 'react';
import _ from 'lodash';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { MultiStepModalPane } from 'main/components/Modal';
import SetupPane from 'main/pages/ReactionPage/CompoundSourceSelector/SetupPane';

describe('SetupPane component', () => {
  let wrapper;
  afterEach(() => {
    wrapper.unmount();
  });

  it('should not show back button and show next button', () => {
    wrapper = shallow(<SetupPane />);
    const pane = wrapper.find(MultiStepModalPane).find('Pane');
    expect(pane.prop('showBackButton')).to.be.false;
    expect(pane.prop('isFinalPane')).to.be.false;
    expect(pane.prop('showNextButton')).to.be.true;
  });

  it('should contain title and image', () => {
    wrapper = shallow(<SetupPane />);
    const pane = wrapper.find(MultiStepModalPane).find('Pane');
    const title = pane.find('ZeroState').dive().find('h3');
    expect(title.text()).contains('Your samples must be in Strateos containers.');
    expect(pane.find('ZeroState').prop('zeroStateSvg')).not.to.be.undefined;
  });
});
