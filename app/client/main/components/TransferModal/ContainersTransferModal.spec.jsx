import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import AdminOrganizationActions from 'main/admin/actions/OrganizationActions';
import SessionStore from 'main/stores/SessionStore';
import OrgCollaborationsActions from 'main/actions/OrgCollaborationsActions';
import ContainerStore from 'main/stores/ContainerStore';
import ContainerTransferModal from './ContainerTransferModal';
import TransferModal from './TransferModal';

describe('ContainerTransferModal', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  beforeEach(() => {
    const containerStoreStub = sandbox.stub(ContainerStore, 'getById');
    containerStoreStub.withArgs('id-1').returns(Immutable.fromJS({ id: 'id-1', label: 'label-1' }));
  });

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  const props = {
    selection: ['id-1', 'id-2'],
    onTransfer: () => {}
  };

  const searchResults = {
    results: [
      {
        id: 'org17rcd7xzn473',
        subdomain: 'yang'
      },
      {
        id: 'org17rcd7xzn472',
        subdomain: 'transcriptic'
      }
    ]
  };

  it('should filter current organization from search results on "onSearch" callback', () => {
    sandbox.stub(AdminOrganizationActions, 'search').returns(new Promise(resolve => { resolve(searchResults); }));
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({
      id: 'org17rcd7xzn473'
    }));
    wrapper = mount(<ContainerTransferModal {...props} />);
    const transferModal = wrapper.find('TransferModal');
    transferModal.props().onSearch('abcd').then(results => {
      expect(results.length).equal(1);
      expect(results[0]).equal('transcriptic');
    });
  });

  it('should call loadOrgCollaborations and loadOrganization', () => {
    const getDestinationOrgs = sandbox.stub(OrgCollaborationsActions, 'loadOrgCollaborations').returns({
      then: () => {}
    });

    wrapper = mount(<ContainerTransferModal {...props} />);
    expect(getDestinationOrgs.called).to.be.true;
  });

  it('should handle selection desctiption when selection is container ids', () => {
    wrapper = mount(<ContainerTransferModal {...props} />);
    expect(wrapper.find(TransferModal).props().selectionDescription).to.equal('label-1, id-2');
  });

  it('should handle selection desctiption when selection is a count', () => {
    wrapper = mount(<ContainerTransferModal {...props} selection={3} />);
    expect(wrapper.find(TransferModal).props().selectionDescription).to.equal('3 containers');
  });
});
