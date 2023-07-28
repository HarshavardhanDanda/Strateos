import React from 'react';
import _ from 'lodash';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import RunFeedbackModal from './';

describe('RunFeedback Modal', () => {
  let wrapper;

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  const props = {
    success: false,
    successNotes: null,
    runId: 'test id',
    projectId: 'project id'
  };

  beforeEach(() => {
    wrapper = shallow(<RunFeedbackModal {...props} />);
  });

  it('should not reset values when same prop is set again', () => {
    wrapper.setState({ successNotes: 'You a failure' });
    expect(wrapper.dive().find('RunFeedback').props().successNotes).to.equal('You a failure');
    wrapper.setProps({ successNotes: null });
    expect(wrapper.dive().find('RunFeedback').props().successNotes).to.equal('You a failure');
  });

  it('should update state on change in RunFeedback input fields', () => {
    expect(wrapper.state().initialValues).deep.equals({
      success: false,
      successNotes: null,
      runId: 'test id'
    });
    wrapper.find('RunFeedback').props().onFieldChange({ result: 'success', outcome: 'success on run' });
    wrapper.update();
    expect(wrapper.state().success).to.be.true;
    expect(wrapper.state().successNotes).to.equals('success on run');
  });

  it('should reset and update state from props when new props are set again', () => {
    expect(wrapper.state()).deep.equals({
      initialValues: _.pick(props, ['success', 'successNotes', 'runId']),
      success: props.success,
      successNotes: props.successNotes,
      editable: true
    });
    const newProps = { success: true,  successNotes: 'note', runId: 'run1' };
    wrapper.setProps(newProps);
    wrapper.update();
    expect(wrapper.state()).deep.equals({
      initialValues: newProps,
      success: newProps.success,
      successNotes: newProps.successNotes,
      editable: false
    });
  });
});
