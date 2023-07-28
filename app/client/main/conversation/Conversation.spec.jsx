import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import Immutable from 'immutable';

import PostActions from 'main/actions/PostActions';
import PostStore from 'main/stores/PostStore';
import Conversation from './Conversation';

describe('Conversation', () => {

  let wrapper;
  let loadPostsStub;
  const sandbox = sinon.createSandbox();
  const postsArray = [
    { id: 'id1' },
    { id: 'id2' },
    { id: 'id3' },
    { id: 'id4' },
    { id: 'id5' },
    { id: 'id6' },
    { id: 'id7' },
  ];
  const props = {
    conversation_id: 'cid123',
    onPostSubmitted: () => {}
  };

  beforeEach(() => {
    sandbox.stub(PostStore, 'getByConversation').returns(Immutable.Iterable(postsArray));
    loadPostsStub = sandbox.stub(PostActions, 'loadPosts').returns({ done: (cb) => cb(postsArray) });
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should render without errors', () => {
    wrapper = shallow(<Conversation {...props} />);
  });

  it('should fetch posts when props are changed', () => {
    wrapper = shallow(<Conversation {...props} />).dive();
    expect(loadPostsStub.calledOnce).to.be.true;
    wrapper.setProps({ ...props, conversation_id: 'cid456' });
    expect(loadPostsStub.calledTwice).to.be.true;
  });

  it('should not fetch posts when props are not changed', () => {
    wrapper = shallow(<Conversation {...props} />).dive();
    expect(loadPostsStub.calledOnce).to.be.true;
    wrapper.setProps({ ...props, conversation_id: 'cid123' });
    expect(loadPostsStub.calledOnce).to.be.true;
  });

  it('should show only five posts if there are more than five posts', () => {
    wrapper = shallow(<Conversation {...props} />).dive();
    expect(wrapper.find('PostFeed').at(0).props().numToShow).to.equals(5);
  });

  it('should show all posts when clicked on show more', () => {
    wrapper = shallow(<Conversation {...props} />).dive();
    wrapper.find('PostFeed').at(0).props().showAll();
    expect(wrapper.find('PostFeed').at(0).props().numToShow).to.equals(7);
  });

  it('should show all posts if there are less than five posts', () => {
    loadPostsStub.returns({ done: (cb) => cb([{ id: 'id1' }]) });
    wrapper = shallow(<Conversation {...props} />).dive();
    expect(wrapper.find('PostFeed').at(0).props().numToShow).to.equals(1);
  });
});
