import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Select, Label, InputsController, TextArea } from '@transcriptic/amino';
import RunFeedback from './RunFeedback';

describe('RunFeedback test', () => {

  let wrapper;

  const initialProps = {
    success: null,
    successNotes: null,
    editable: true,
    onFieldChange: () => {}
  };

  const props = {
    success: true,
    successNotes: 'test note',
    editable: true,
    runStatus: 'complete',
    onFieldChange: () => {}
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('should render without errors', () => {
    wrapper = shallow(<RunFeedback {...initialProps} />);
    expect(wrapper.find(Select).length).to.equal(1);
    expect(wrapper.find(InputsController).props().defaultState.result).to.equal('failure');
  });

  it('should disable select input field if run status is aborted', () => {
    wrapper = shallow(<RunFeedback {...initialProps} runStatus="aborted"  />);
    expect(wrapper.find(Select).length).to.equal(0);
    expect(wrapper.find(Label).props().type).to.equal('danger');
  });

  it('should disable select input field if run status is canceled', () => {
    wrapper = shallow(<RunFeedback {...initialProps} runStatus="canceled"  />);
    expect(wrapper.find(Select).length).to.equal(0);
    expect(wrapper.find(Label).props().type).to.equal('danger');
  });

  it('should show success in select field if success prop is true', () => {
    wrapper = shallow(<RunFeedback {...props} />);
    expect(wrapper.find(Select).props().name).to.equal('result');
    expect(wrapper.find(InputsController).props().defaultState.result).to.equal('success');
    expect(wrapper.find(TextArea).props().name).to.equal('outcome');
    expect(wrapper.find(InputsController).props().defaultState.outcome).to.equal('test note');
  });

});
