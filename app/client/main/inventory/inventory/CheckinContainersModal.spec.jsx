import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import CheckinContainersModal from './CheckinContainersModal';

describe('CheckinContainersModal', () => {
  let checkinContainersModal;

  afterEach(() => {
    if (checkinContainersModal) {
      checkinContainersModal.unmount();
    }
  });

  it('should have a modal id', () => {
    expect(CheckinContainersModal.MODAL_ID).to.equal('CHECKIN_CONTAINERS_MODAL');
  });

  it('should render a modal', () => {
    const onAccept = () => 'accepted';
    checkinContainersModal = shallow(
      <CheckinContainersModal
        size={10}
        label="foobar"
        organization="Foo"
        onAccept={onAccept}
      />
    );

    const modal = checkinContainersModal.find('ConnectedSinglePaneModal');
    expect(modal.length).to.equal(1);
    expect(modal.prop('title')).to.equal('Checkin Confirmation');
    expect(modal.prop('acceptText')).to.equal('Checkin');
    expect(modal.prop('onAccept')()).to.deep.equal('accepted');

    const expectedText = [
      'Are you sure you would like to check',
      'in 10 container(s) from shipment foobar, Foo ?'
    ].join(' ');
    expect(modal.find('p').text()).to.equal(expectedText);
  });
});
