import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';
import LotNumberSelectorModal from './LotNumberSelectorModal';

describe('LotNumberSelectorModal', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should render modal with text input', () => {
    wrapper = shallow(<LotNumberSelectorModal onSelect={() => {}} />);
    expect(wrapper.find('LabeledInput').props().label).to.equal('Lot number');
    expect(wrapper.find('TextInput').props().value).to.equal(null);
  });

  it('should output lot number text on submit', () => {
    const onSelectSpy = sandbox.spy();
    wrapper = shallow(<LotNumberSelectorModal onSelect={onSelectSpy} />);
    wrapper.find('TextInput').props().onChange({ target: { value: 'foo' } });
    wrapper.find('ConnectedSinglePaneModal').props().onAccept();
    expect(onSelectSpy.calledWith('foo')).to.be.true;
  });
});
