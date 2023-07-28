import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import ModalActions from 'main/actions/ModalActions';
import ViewActivityLogModal from './ViewActivityLogModal';

describe('DownloadFileModal', () => {

  const sandbox = sinon.createSandbox();

  it('should display a list of activities with file name, id, data type, size, date, notes, and user profile for download', () => {
    const viewActivityLogModal = shallow(
      <ViewActivityLogModal />
    );
    const columns = viewActivityLogModal.find('Column');
    expect(columns.at(0).prop('header')).to.equal('File name');
    expect(columns.at(1).prop('header')).to.equal('Id');
    expect(columns.at(2).prop('header')).to.equal('Data type');
    expect(columns.at(3).prop('header')).to.equal('Size');
    expect(columns.at(4).prop('header')).to.equal('Activity');
    expect(columns.at(5).prop('header')).to.equal('Date');
    expect(columns.at(6).prop('header')).to.equal('Notes');
    expect(columns.at(7).prop('header')).to.equal('User');
    viewActivityLogModal.unmount();
  });

  it('should have a button to close the modal', () => {
    const viewActivityLogModal = shallow(
      <ViewActivityLogModal />
    );
    const closeModal = sandbox.stub(ModalActions, 'close');

    const closeButton = viewActivityLogModal.find('Button');
    expect(closeButton.dive().text()).to.equal('Close');

    closeButton.dive().simulate('click');
    expect(closeModal.calledWithExactly('VIEW_ACTIVITY_LOG_MODAL')).to.be.true;
    viewActivityLogModal.unmount();
  });
});
