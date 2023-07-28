import React from 'react';
import sinon from 'sinon';

import { expect } from 'chai';
import { shallow } from 'enzyme';
import { SinglePaneModal } from 'main/components/Modal';
import { Banner, DragDropFilePicker } from '@transcriptic/amino';
import ProfileImageModal from 'main/pages/ProfileImageModal';

const crypto = require('crypto');

const routeProps = {
  match: {
    params: {
      subdomain: 'Billing'
    },
    path: ''
  },
  onResize: () => {}
};

const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

const contentType = 'image/png';
const b64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4' +
                '//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
const File = b64toBlob(b64Data, contentType);

describe('Profile Image Modal Test Suit', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;
  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('Single Pane Modal is present', () => {
    wrapper = shallow(<ProfileImageModal {...routeProps} />);
    const  Modal = wrapper.find(SinglePaneModal);
    expect(Modal.length).to.be.eql(1);
  });

  it('FilePicker is present', () => {
    wrapper = shallow(<ProfileImageModal {...routeProps} />);
    const  File_picker = wrapper.find(DragDropFilePicker);
    expect(File_picker.length).to.be.eql(1);
  });

  it('Check if image is picked', () => {
    // this is to fix Error: crypto.getRandomValues() not supported when simulating DragDropFilePicker
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: (arr) => crypto.randomBytes(arr.length)
      },
      configurable: true
    });
    const onDrop = sandbox.spy();
    wrapper = shallow(
      <DragDropFilePicker
        onDrop={onDrop}
        multiple="false"
        files={[]}
        accept="image/*"
      />
    );
    wrapper.find('input').simulate('change', { preventDefault: () => {}, target: { files: { 0: File } } });
    expect(onDrop.callCount).to.be.eql(1);
  });

  it('Check if image is Selected', () => {
    const spyFile = sandbox.stub(ProfileImageModal.prototype, 'onSelectFile');
    wrapper = shallow(
      <ProfileImageModal {...routeProps} />);
    wrapper.instance().onSelectFile([File]);
    expect(spyFile.callCount).to.be.eql(1);
  });

  it('Check if image is Loaded', () => {
    const spyFile = sandbox.stub(ProfileImageModal.prototype, 'onImageLoaded');
    wrapper = shallow(
      <ProfileImageModal {...routeProps} />);
    wrapper.instance().onImageLoaded(File);
    expect(spyFile.callCount).to.be.eql(1);
  });

  it('Check if image is not Loaded', () => {
    wrapper = shallow(
      <ProfileImageModal {...routeProps} />);
    wrapper.instance().onImageError();
    const banner = wrapper.find(Banner);
    expect(banner.length).to.be.eql(1);
  });
});
