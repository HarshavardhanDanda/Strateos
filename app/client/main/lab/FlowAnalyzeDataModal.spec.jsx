import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import Immutable from 'immutable';

import FlowAnalyzeDataModal from 'main/lab/FlowAnalyzeDataModal';

describe('flow analyze data modal tests', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  it('should have attachment uploader', () => {
    wrapper = shallow(<FlowAnalyzeDataModal modalId={'modal-id'} instruction={Immutable.Map()} />);
    expect(wrapper.find('AttachmentUploader')).to.have.length(1);
  });

  it('should have inital state when the upload is aborted', () => {
    wrapper = shallow(<FlowAnalyzeDataModal modalId={'modal-id'} instruction={Immutable.Map()} />);
    const attachmentUploader = wrapper.find('AttachmentUploader');
    attachmentUploader.props().onFilesSelected([{ uuid: 'sample-uuid', file: { name: 'file.csv' }, status: 'uploading' }]);
    attachmentUploader.props().onUploadAborted();
    expect(wrapper.instance().state.file).to.be.undefined;
  });

  it('should set state when upload is done successfully', () => {
    wrapper = shallow(<FlowAnalyzeDataModal modalId={'modal-id'} instruction={Immutable.Map()} />);
    const attachmentUploader = wrapper.find('AttachmentUploader');
    const file = { uuid: 'sample-uuid', file: { name: 'file.csv' }, status: 'uploading' };
    attachmentUploader.props().onFilesSelected([file]);
    attachmentUploader.props().onUploadDone(file);
    expect(wrapper.instance().state.file).to.deep.equal(file);
  });
});
