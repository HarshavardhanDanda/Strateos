import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';
import DateSelectorModal from './DateSelectorModal';

describe('DateSelectorModal', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should render modal with calendar date picker', () => {
    wrapper = shallow(<DateSelectorModal onSelect={() => {}} />);
    expect(wrapper.find('LabeledInput').props().label).to.equal('Date');
    expect(wrapper.find('DatePicker').props().date).to.equal(null);
  });

  it('should output date on submit', () => {
    const onSelectSpy = sandbox.spy();
    wrapper = shallow(<DateSelectorModal onSelect={onSelectSpy} />);
    wrapper.find('DatePicker').props().onChange({ target: { value: { date: '3/3/2020' } } });
    wrapper.find('ConnectedSinglePaneModal').props().onAccept();
    expect(onSelectSpy.getCall(0).args[0]).to.equal('3/3/2020');
  });
});
