import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import FilePickUpload from './FilePickUpload';

const crypto = require('crypto');

describe('FilePickUpload', () => {
  const sandbox = sinon.createSandbox();
  let Uploader;
  const onAllUploadsDone = sandbox.stub();
  const props = {
    onAllUploadsDone: onAllUploadsDone
  };

  afterEach(() => {
    Uploader.unmount();
    sandbox.restore();
  });

  it('Should have DragnDropFilePicker component when no file is uploaded', () => {
    Uploader = shallow(<FilePickUpload {...props}  />);
    expect(Uploader.find('DragDropFilePicker').length).to.eql(1);
  });

  it('Should have FileUpload component when file is uploaded', () => {
    Uploader = shallow(<FilePickUpload {...props}  />);
    Uploader.setState({ files: [{ uuid: 'uuid-1', file: { name: 'dummyFile' } }] });
    expect(Uploader.find('FileUpload').length).to.eql(1);
  });

  it('Should trigger onAllUploadsDone function when file is attached', () => {
    // this is to fix Error: crypto.getRandomValues() not supported when simulating DragDropFilePicker
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: (arr) => crypto.randomBytes(arr.length)
      },
      configurable: true
    });
    Uploader = shallow(<FilePickUpload {...props} />);
    Uploader.find('DragDropFilePicker').dive().find('input').simulate('change', {
      preventDefault: () => {},
      target: { files: [{ file: { name: 'dummyFile' } }] }
    });
    Uploader.instance().onFileUploaded({ name: 'dummyFile' }, 1);
    expect(onAllUploadsDone.calledOnce).to.be.true;
  });

  it('Should trigger onFilesSelected function when file is dropped', () => {
    // this is to fix Error: crypto.getRandomValues() not supported when simulating DragDropFilePicker
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: (arr) => crypto.randomBytes(arr.length)
      },
      configurable: true
    });
    const onAllUploadsDone = sandbox.spy();
    Uploader = shallow(<FilePickUpload  onAllUploadsDone={onAllUploadsDone} />);
    Uploader.find('DragDropFilePicker').dive().simulate('drop', {
      preventDefault: () => {},
      dataTransfer: { files: [{ name: 'dummyFile' }], types: ['Files'] }
    });
    Uploader.instance().onFileUploaded({ name: 'dummyFile' }, 1);
    expect(onAllUploadsDone.calledOnce).to.be.true;
  });

  it('Should have multiple FileUpload Component when multiple file are uploaded', () => {
    Uploader = shallow(<FilePickUpload {...props} multiple />);
    Uploader.setState({ files: [{ uuid: 'uuid-1', file: { name: 'dummyFile1' } }, { uuid: 'uuid-1', file: { name: 'dummyFile2' } }, { uuid: 'uuid-1', file: { name: 'dummyFile3' } }] });
    expect(Uploader.find('FileUpload').length).to.eql(3);
  });
});
