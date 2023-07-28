import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import RunAPI from 'main/api/RunAPI';
import RunCustomProperties from './index';

const props = {
  customProperties: {
    key: {
      id: 'ccp1gnfvcbk2u9zj',
      context_type: 'Run',
      value: '2800',
      key: 'target_id'
    },
    thaw_count: {
      id: 'ccp1gnfvcbk54p9m',
      context_type: 'Run',
      value: '8789798',
      key: 'thaw_count'
    }
  },
  customInputsConfig: {
    target_id: {
      type: 'choice',
      label: 'Target Id',
      default: ['Test Value']
    }
  }
};

describe('RunCustomProperties', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<RunCustomProperties {...props} />);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sinon.restore();
  });

  it('should render', () => {
    expect(wrapper).to.be.ok;
  });

  it('should trigger update of ContextualCustomProperty on edit property', () => {
    const spy = sinon.stub(RunAPI, 'updateCustomProperty');
    wrapper =  shallow(<RunCustomProperties {...props} />);
    const editProperty = wrapper.find('EditableProperty').first();
    editProperty.props().onSave('value');
    expect(spy.calledOnce).to.be.true;
  });
});
