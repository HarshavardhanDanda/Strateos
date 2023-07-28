import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import AttachmentUploader from './AttachmentUploader';

const crypto = require('crypto');

describe('AttachmentUploader', () => {
  const sandbox = sinon.createSandbox();
  let Uploader;

  afterEach(() => {
    Uploader.unmount();
    sandbox.restore();
  });

  it('Should have DragnDropFilePicker component when no file is uploaded', () => {
    Uploader = shallow(<AttachmentUploader />);
    expect(Uploader.find('DragDropFilePicker').length).to.eql(1);
  });

  it('Should have FileUpload component when file is uploaded', () => {
    const dummyFile = { name: 'dummyFile' };
    Uploader = shallow(<AttachmentUploader files={[dummyFile]} />);
    expect(Uploader.find('FileUpload').length).to.eql(1);
  });

  it('Should trigger onFilesSelected function when file is attached', () => {
    // this is to fix Error: crypto.getRandomValues() not supported when simulating DragDropFilePicker
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: (arr) => crypto.randomBytes(arr.length)
      },
      configurable: true
    });
    const attached = sandbox.stub();
    Uploader = shallow(<AttachmentUploader  onFilesSelected={attached} />);
    Uploader.find('DragDropFilePicker').dive().find('input').simulate('change', {
      preventDefault: () => {},
      target: {
        files: [{ uuid: 'uuid', file: ['dummyValue.something'] }]
      }
    });
    expect(attached.calledOnce).to.be.true;
  });

  it('Should trigger onFilesSelected function when file is dropped', () => {
    const attached = sandbox.spy();
    Uploader = shallow(<AttachmentUploader  onFilesSelected={attached} />);
    Uploader.find('DragDropFilePicker').dive().simulate('drop', {
      preventDefault: () => {},
      dataTransfer: { file: ['dummyFile'], types: ['Files'] }
    });
    expect(attached.calledOnce).to.be.true;
  });

  it('Should have multiple FileUpload Component when multiple file are uploaded', () => {
    const dummyFile1 = { name: 'dummyFile1' };
    const dummyFile2 = { name: 'dummyFile2' };
    const dummyFile3 = { name: 'dummyFile3' };
    Uploader = shallow(<AttachmentUploader files={[dummyFile1, dummyFile2,  dummyFile3]} />);
    expect(Uploader.find('FileUpload').length).to.eql(3);
  });

  it('Should not have multiple FileUpload Component when multiple={false} even if multiple files are uploaded', () => {
    const dummyFile1 = { name: 'dummyFile1' };
    const dummyFile2 = { name: 'dummyFile2' };
    const dummyFile3 = { name: 'dummyFile3' };
    Uploader = shallow(<AttachmentUploader multiple={false} files={[dummyFile1, dummyFile2, dummyFile3]} />);
    expect(Uploader.find('FileUpload').length).to.eql(1);
  });

  it('Should trigger renderFileUpload n times when n files are uploaded', () => {
    const renderFileUpload = sandbox.stub(AttachmentUploader.prototype, 'renderFileUpload');
    Uploader = shallow(<AttachmentUploader files={['dummyFile1', 'dummyFile2']} />);
    expect(renderFileUpload.callCount).to.eql(2);
  });

  it('Should trigger renderUploads once even if n files are uploaded', () => {
    const renderUploads = sandbox.stub(AttachmentUploader.prototype, 'renderUploads');
    Uploader = shallow(<AttachmentUploader files={['dummyFile1', 'dummyFile2']} />);
    expect(renderUploads.callCount).to.eql(1);
  });
});
