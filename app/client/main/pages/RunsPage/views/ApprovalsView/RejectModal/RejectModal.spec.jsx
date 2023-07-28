import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import sinon from 'sinon';
import ModalStore from 'main/stores/ModalStore';
import RejectModal from 'main/pages/RunsPage/views/ApprovalsView/RejectModal/RejectModal';

describe('RejectModal', () => {
  let component;
  const sandbox = sinon.createSandbox();
  const props = {
    onReject: () => {},
    selectedRuns: 4,
  };

  afterEach(() => {
    if (component) component.unmount();
    sandbox.restore();
  });

  it('should have reject button disabled until reason is selected', () => {
    sandbox.stub(ModalStore, 'getById').returns({ get: () => true });
    component = mount(<RejectModal {...props} />);
    expect(component.find('button').at(2).prop('disabled')).to.be.true;
  });
});
