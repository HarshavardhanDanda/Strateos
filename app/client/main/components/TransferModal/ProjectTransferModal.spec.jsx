import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import AdminOrganizationActions from 'main/admin/actions/OrganizationActions';
import UserProjectActions   from  'main/actions/ProjectActions';
import SessionStore         from 'main/stores/SessionStore';
import ProjectStore         from 'main/stores/ProjectStore';
import OrganizationStore    from 'main/stores/OrganizationStore';
import ProjectTransferModal from './ProjectTransferModal';
import TransferModal from './TransferModal';

describe('ProjectTransferModal', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  const searchResults = {
    results: [
      {
        id: 'org17rcd7xzn473',
        name: 'test'
      },
      {
        id: 'org17rcd7xzn472',
        name: 'transcriptic'
      }
    ]
  };

  const project = Immutable.fromJS({
    id: 'p1fmsnn7dqf43h',
    name: 'test project',
    organization_id: 'org17rcd7xzn472'
  });

  const organization = Immutable.fromJS({
    id: 'org17rcd7xzn472',
    customer: {
      name: 'test_name',
      id: 'test_id'
    }
  });

  beforeEach(() => {
    sandbox.stub(ProjectStore, 'getById').returns(project);
    sandbox.stub(SessionStore, 'getOrg').returns(organization);
  });

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should have organization label and prepopulate customer name in user transfer modal', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(false);
    sandbox.stub(OrganizationStore, 'getById').returns(organization);

    wrapper = shallow(<ProjectTransferModal selection={'p1fmsnn7dqf43h'} />);
    const transferModal = wrapper.find('TransferModal').dive();

    expect(transferModal.find('.transfer-modal__org-label')).to.have.length(1);
    expect(transferModal.find('.transfer-modal__org-label').text()).to.equal(organization.getIn(['customer', 'name']));
  });

  it('should have organization search in admin transfer modal', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(true);

    wrapper = shallow(<ProjectTransferModal selection={'p1fmsnn7dqf43h'} />);
    const transferModal = wrapper.find('TransferModal').dive();

    expect(transferModal.find('AjaxedAjaxManager')).to.have.length(1);
  });

  it('should have customer name populated in org search of admin transfer modal', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(true);
    sandbox.stub(OrganizationStore, 'getById').returns(organization);

    wrapper = shallow(<ProjectTransferModal selection={'p1fmsnn7dqf43h'} />);
    const transferModal = wrapper.find('TransferModal').dive();

    expect(transferModal.find('AjaxedAjaxManager').props().value).to.equal(organization.getIn(['customer', 'name']));
  });

  it('should filter selected organization name from search results in admin transfer modal', () => {
    sandbox.stub(AdminOrganizationActions, 'search').returns(new Promise(resolve => { resolve(searchResults); }));
    sandbox.stub(SessionStore, 'isAdmin').returns(true);
    wrapper = shallow(<ProjectTransferModal selection={''} />);
    const transferModal = wrapper.find('TransferModal');
    transferModal.props().onSearch('transcriptic').then(results => {
      expect(results.length).equal(1);
      expect(results[0]).equal('transcriptic');
    });
  });

  it('should not show current organization name in the search results', () => {
    sandbox.stub(AdminOrganizationActions, 'search').returns(new Promise(resolve => { resolve(searchResults); }));
    sandbox.stub(SessionStore, 'isAdmin').returns(true);
    wrapper = shallow(<ProjectTransferModal selection={''} />);
    const transferModal = wrapper.find('TransferModal');
    transferModal.props().onSearch(organization.get('name')).then(results => {
      expect(results.length).equal(0);
    });
  });

  it('should show drawer state as true when clicked on transfer action', () => {
    wrapper = shallow(<ProjectTransferModal selection={''} />);
    const transferModal = wrapper.find('TransferModal');
    expect(wrapper.find('TransferModal').props().isDrawerOpen).to.be.false;
    transferModal.props().onTransfer();
    expect(wrapper.find('TransferModal').props().isDrawerOpen).to.be.true;
  });

  it('should make call to OrganizationStore to get customer id, if name in the search is changed', () => {
    sandbox.stub(OrganizationStore, 'getById').returns(organization);
    const orgStoreSpy = sandbox.stub(OrganizationStore, 'findByName').returns(organization);
    sandbox.stub(UserProjectActions, 'transfer').returns({
      done: (cb) => {
        cb();
      }
    });
    wrapper = shallow(<ProjectTransferModal selection={''} />);
    const transferModal = wrapper.find('TransferModal');
    const drawer = transferModal.dive().find('ConnectedSinglePaneModal').dive().dive()
      .find('ModalDrawer');
    const button = drawer.dive().find('Button').at(1);
    button.simulate('click');
    expect(orgStoreSpy.calledOnce).to.be.true;
  });

  it('should use UserProjectActions to transfer a project in user transfer modal', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(false);
    sandbox.stub(OrganizationStore, 'findByName').returns(organization);
    const userProjectActionsSpy = sandbox.stub(UserProjectActions, 'transfer').returns({
      done: (cb) => {
        cb();
      }
    });
    wrapper = shallow(<ProjectTransferModal selection={''} />);
    const transferModal = wrapper.find('TransferModal');
    const drawer = transferModal.dive().find('ConnectedSinglePaneModal').dive().dive()
      .find('ModalDrawer');
    const button = drawer.dive().find('Button').at(1);
    button.simulate('click');    expect(userProjectActionsSpy.calledOnce).to.be.true;
  });

  it('should transfer run if there are no linked runs', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(false);
    sandbox.stub(OrganizationStore, 'findByName').returns(organization);
    const userProjectActionsSpy = sandbox.stub(UserProjectActions, 'transfer').returns({
      done: (cb) => {
        cb();
      }
    });
    wrapper = shallow(<ProjectTransferModal selection={''} />);
    const transferModal = wrapper.find('TransferModal');
    const drawer = transferModal.dive().find('ConnectedSinglePaneModal').dive().dive()
      .find('ModalDrawer');
    const button = drawer.dive().find('Button').at(1);
    button.simulate('click');    expect(userProjectActionsSpy.calledOnce).to.be.true;
  });

  it('should make a callback to onProjectTransfer method that is passed as a prop, when project is transferred', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(false);
    sandbox.stub(OrganizationStore, 'findByName').returns(organization);
    sandbox.stub(UserProjectActions, 'transfer').returns({
      done: (cb) => {
        cb();
      }
    });
    const onProjectTransferSpy =  sandbox.spy();
    wrapper = shallow(<ProjectTransferModal selection={'p1fmsnn7dqf43h'} onTransfer={onProjectTransferSpy} />);
    const transferModal = wrapper.find('TransferModal');
    const drawer = transferModal.dive().find('ConnectedSinglePaneModal').dive().dive()
      .find('ModalDrawer');
    const button = drawer.dive().find('Button').at(1);
    button.simulate('click');    expect(onProjectTransferSpy.calledOnceWithExactly('p1fmsnn7dqf43h')).to.be.true;
  });

  it('should display selected project name in transfer modal', () => {
    wrapper = shallow(<ProjectTransferModal selection={'p1fmsnn7dqf43h'} onTransfer={() => {}} />);
    expect(wrapper.find(TransferModal).prop('selectionDescription')).to.equal('test project');
  });
});
