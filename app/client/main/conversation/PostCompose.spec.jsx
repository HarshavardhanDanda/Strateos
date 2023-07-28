import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import Immutable from 'immutable';
import Sinon from 'sinon';
import PostCompose from 'main/conversation/PostCompose.jsx';
import SessionStore from 'main/stores/SessionStore';

describe('PostCompose', () => {
  let postCompose;
  const sandbox = Sinon.createSandbox();
  const user = Immutable.fromJS({ id: 'user-id', name: 'scott Antipa' });
  beforeEach(() => {
    sandbox.stub(SessionStore, 'getUser').returns(user);
  });

  afterEach(() => {
    if (postCompose) postCompose.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should not have dragdrop component when showActions is not triggered', () => {
    postCompose = mount(<PostCompose onSubmit={() => {}} />);
    expect(postCompose.find('DragDropFilePicker').length).to.equal(0);
  });

  it('should have dragdrop component when showActions is triggered', () => {
    postCompose = mount(<PostCompose onSubmit={() => {}} />);
    postCompose.find('.add-post').simulate('focus');
    expect(postCompose.find('DragDropFilePicker').length).to.equal(1);
  });

  it('should trigger onFilesSelected when a file is dropped', () => {
    const onFilesSelected = sandbox.stub(PostCompose.prototype, 'onFilesSelected');
    postCompose = mount(<PostCompose onSubmit={() => {}} />);
    postCompose.find('.add-post').simulate('focus');
    const dragdrop = postCompose.find('DragDropFilePicker');
    dragdrop.props().onDrop({ uuid: 'sample-uuid', file: { name: 'file.csv' }, status: 'uploading' });
    expect(onFilesSelected.calledOnce).to.be.true;
  });

});
