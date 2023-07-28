import React        from 'react';
import { expect }   from 'chai';
import sinon        from 'sinon';
import { shallow }  from 'enzyme';
import Immutable    from 'immutable';
import UserStore    from 'main/stores/UserStore';
import UserPost     from './UserPost';

describe('User Post test', () => {

  const content = {
    id: '6972',
    conversation_id: 'conv1ehf45ny69nw',
    created_at: '2021-07-20T03:43:12.946-07:00',
    text: 'test note',
    author_type: 'User',
    author: {
      id: 'u1eb92vx7q82mj',
      name: 'User'
    },
    attachments: {
      attachments: [{
        key: 'uploads/3a129ecd-01a0-4f26-9ca1-f686fb807d4f/testfile.png',
        name: 'testfile',
        size: 3015,
      }]
    }
  };

  const post = Immutable.Map(content);

  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should have User Profile', () => {
    sandbox.stub(UserStore, 'getById')
      .returns(Immutable.fromJS({ id: 'u1eb92vx7q82mj' }));
    wrapper = shallow(<UserPost post={post} />);

    expect(wrapper.find('UserProfile')).to.have.lengthOf(1);
  });

  it('should render without error', () => {
    const userpost = shallow(<UserPost post={post} />);
    expect(userpost.find('.text').text().trim()).to.equal(content.text);
  });
});
