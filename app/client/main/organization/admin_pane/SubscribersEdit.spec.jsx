import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';
import sinon from 'sinon';

import SubscribersEdit from './SubscribersEdit';

describe('SubscribersEdit', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  let onChangeSelectedAdminIdSpy;

  const props = {
    selectedAdminId: 'id1',
    candidateSubscribers: Immutable.fromJS([{
      id: 'id2',
      name: 'name1'
    },
    {
      id: 'id3',
      name: 'name2'
    }]),
    subscribedAdmins: Immutable.fromJS([{
      id: 'id1',
      name: 'name1'
    }]),
    subdomain: '',
    onChangeSelectedAdminId: () => {}
  };

  beforeEach(() => {
    onChangeSelectedAdminIdSpy = sandbox.spy();
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should render', () => {
    wrapper = shallow(<SubscribersEdit {...props} />);
  });

  it('should call onChangeSelectedAdminId prop on select input change', () => {
    wrapper = shallow(<SubscribersEdit {...props} onChangeSelectedAdminId={onChangeSelectedAdminIdSpy} />);
    wrapper.find('Select').props().onChange({ target: { value: 'id' } });
    expect(onChangeSelectedAdminIdSpy.calledOnceWithExactly('id')).true;
  });

  it('should reset selected admin id on adding an admin', () => {
    wrapper = shallow(<SubscribersEdit {...props} onChangeSelectedAdminId={onChangeSelectedAdminIdSpy} />);
    wrapper.find('Button').at(0).props().onClick();
    expect(onChangeSelectedAdminIdSpy.calledOnceWithExactly('')).true;
  });

  it('should not disable select input when candidateSubscribers is not empty', () => {
    wrapper = shallow(<SubscribersEdit {...props} />);
    expect(wrapper.find('Select').props().disabled).false;
  });

  it('should disable select input when candidateSubscribers is empty', () => {
    wrapper = shallow(<SubscribersEdit {...props} candidateSubscribers={Immutable.List()} />);
    expect(wrapper.find('Select').props().disabled).true;
  });
});
