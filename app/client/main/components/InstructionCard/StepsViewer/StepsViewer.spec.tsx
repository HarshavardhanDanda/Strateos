import React from 'react';

import { expect } from 'chai';
import { shallow } from 'enzyme';

import { Button } from '@transcriptic/amino';
import StepsViewer from './StepsViewer';

describe('StepsViewer', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<StepsViewer steps={steps} title={title} />);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  const steps = [
    'Fill the container upto 30ml',
    'Shake the container for 30 seconds'
  ];

  const title = 'Test';

  it('should render correctly', () => {
    wrapper = shallow(
      <StepsViewer steps={steps} title={title} />
    );

    expect(wrapper.find('.steps-viewer')).to.have.length(1);
  });

  it('should have title', () => {
    expect(wrapper.find('.steps-viewer__title').text()).to.equal(title);
  });

  it('should show `Show all steps` button by default', () => {
    expect(wrapper.find(Button).dive().find('.btn__content').text()).to.equal('Show all steps');
  });

  it('should show `Hide all steps` by default when there is only one step', () => {
    wrapper = shallow(<StepsViewer steps={[steps[0]]} title={title} />);
    expect(wrapper.find(Button).dive().find('.btn__content').text()).to.equal(
      'Hide all steps'
    );
  });

  it('should show step 1 by default in the collapsed view', () => {
    const collapsedTextElement = wrapper.find('.steps-viewer__collapsed-text');

    expect(collapsedTextElement.length).to.equal(1);
    expect(collapsedTextElement.text()).to.equal(' Step 1 ' + steps[0]);
  });

  it('should show `Hide all steps` and body when we click on the heading', () => {
    expect(wrapper.find(Button).dive().find('.btn__content').text()).to.equal(
      'Show all steps'
    );

    wrapper.find('.steps-viewer__heading').simulate('click');

    expect(wrapper.find(Button).dive().find('.btn__content').text()).to.equal(
      'Hide all steps'
    );

    expect(wrapper.find('.steps-viewer__body')).to.have.length(1);
  });

  it('should show steps with the step numbers', () => {
    wrapper.find('.steps-viewer__heading').simulate('click');

    const stepElements = wrapper.find('.steps-viewer__body').find('.steps-viewer__step');
    expect(stepElements.length).to.equal(steps.length);
    expect(stepElements.at(0).text()).to.equal(' Step 1 ' + steps[0]);
    expect(stepElements.at(1).text()).to.equal(' Step 2 ' + steps[1]);
  });

  it('should not show collapsed text and steps content when the steps are empty', () => {
    wrapper = shallow(<StepsViewer steps={[]} title={title} />);
    expect(wrapper.find('.steps-viewer__collapsed-text')).to.have.length(0);

    wrapper.find('.steps-viewer__heading').simulate('click');

    expect(wrapper.find('.steps-viewer__body').find('.steps-viewer__step')).to.have.length(0);
  });
});
