import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import EditPredecessorRun from './EditPredecessorRun';

describe('EditPredecessorRun', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should have disabled toggle as default', () => {
    wrapper = shallow(<EditPredecessorRun onChange={() => {}} />);

    expect(wrapper.state().editing).to.equal(false);
    expect(wrapper.find('Toggle').prop('value')).to.equal('off');
  });

  it('should enable toggle and input when predecessor is specified', () => {
    wrapper = shallow(<EditPredecessorRun predecessorId="foo" onChange={() => {}} />);

    expect(wrapper.state()).to.deep.equal({ editing: true, predecessorId: 'foo' });
    expect(wrapper.find('Toggle').prop('value')).to.equal('on');
    expect(wrapper.find('TextInput').prop('value')).to.equal('foo');
  });

  it('should update parent with changes', () => {
    const onChangeSpy = sandbox.spy();
    wrapper = shallow(<EditPredecessorRun predecessorId="foo" onChange={onChangeSpy} />);

    wrapper.find('TextInput').simulate('change', { target: { value: 'bar' } });
    expect(onChangeSpy.calledWithExactly('bar')).to.be.true;

    wrapper.find('Toggle').simulate('change', { target: { value: 'off' } });
    expect(onChangeSpy.calledWithExactly(undefined)).to.be.true;
  });

  it('should display error', () => {
    wrapper = shallow(<EditPredecessorRun predecessorId="foo" onChange={() => {}} error="Some error" />);

    expect(wrapper.find('Validated').prop('error')).to.equal('Some error');
  });
});
