import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';

import PostFeed from 'main/conversation/PostFeed';
import PostActions from 'main/actions/PostActions';

describe('PostFeed', () => {
  let showAll;
  let wrapper;
  const sandbox = sinon.createSandbox();
  const props = {
    conversationId: 'convId',
    posts: Immutable.fromJS([
      { id: 'post1' },
      { id: 'post2' },
      { id: 'post3' },
      { id: 'post4' },
      { id: 'post5' },
      { id: 'post6' }
    ]),
    numToShow: 5,
  };

  beforeEach(() => {
    showAll =  sandbox.spy();
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should show all posts when clicked on show more', () => {
    wrapper = shallow(<PostFeed {...props} showAll={showAll} />);
    expect(wrapper.find('PostContainer').length).to.equals(5);
    expect(wrapper.find('a').text()).to.equals('Show 1 more post.');
    wrapper.find('a').props().onClick();
    expect(showAll.calledOnce).to.be.true;
  });

  it('should show all posts when any post is deleted', () => {
    sandbox.stub(PostActions, 'deletePost').returns({ done: (cb) => cb() });
    wrapper = shallow(<PostFeed {...props} showAll={showAll} />);
    wrapper.find('PostContainer').at(0).props().deletePost();
    expect(showAll.calledOnce).to.be.true;
  });
});
