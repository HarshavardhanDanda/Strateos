import React       from 'react';
import Immutable   from 'immutable';
import sinon       from 'sinon';
import { expect }  from 'chai';
import { shallow } from 'enzyme';
import { Button, TextInput, Select, Validated } from '@transcriptic/amino';
import AccessControlActions     from 'main/actions/AccessControlActions';
import ajax               from 'main/util/ajax';
import SessionStore       from 'main/stores/SessionStore';
import { AddCollaboratorDropDown } from './AddCollaboratorDropDown';

describe('Add user button', () => {

  const sandbox = sinon.createSandbox();
  let ref, onCreateFailStub;

  const featureGroups = {
    content: [
      {
        id: '2f758030-e956-42e5-bfcb-25ceee540df1',
        label: 'Admin',
        description: 'Features applicable to users who manages organizations administrative tasks like adding their own users, granting permissions',
        context: 'ORGANIZATION'
      }
    ]
  };

  const labs = {
    data: [
      {
        id: 'lb1fdrv57w6fcaz',
        type: 'labs',
        links: {
          self: 'http://localhost:5555/api/labs/lb1fdrv57w6fcaz'
        },
        attributes: {
          name: 'Menlo Park',
          operated_by_id: 'org13',
          address_id: 'addr188rr9ukd7ry'
        }
      }],
    meta: {
      record_count: 2
    }
  };

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    sandbox.stub(ajax, 'get').returns({ done: (cb) => cb(labs) });
    sandbox.stub(AccessControlActions, 'loadFeatureGroups').returns({ done: (cb) => cb(featureGroups) });
    onCreateFailStub = sandbox.stub().returns({
      fail: (cb) => {
        cb({}, undefined, 'api error');
        return { done: () => {} };
      } });
  });

  afterEach(() => {
    ref.unmount();
    sandbox.restore();
  });

  it('Add user to organization button is present', () => {
    ref = shallow(<AddCollaboratorDropDown onCreate={() => {}} existingCollaborators={Immutable.fromJS([{ email: '' }])} />);
    const CardCount = ref.find(Button);
    expect(CardCount.length).to.be.eql(2);
  });

  it('Check if dropdown contains three Textfields', () => {
    ref = shallow(<AddCollaboratorDropDown onCreate={() => {}} existingCollaborators={Immutable.fromJS([{ email: '' }])} />);
    const TextFeildCount = ref.find(TextInput);
    expect(TextFeildCount.length).to.be.eql(1);
  });

  it('Check if dropdown contains one Select', () => {
    ref = shallow(<AddCollaboratorDropDown onCreate={() => {}} existingCollaborators={Immutable.fromJS([{ email: '' }])} />);
    const SelectCount = ref.find(Select);
    expect(SelectCount.length).to.be.eql(1);
  });

  it('Check if inside dropdown select component has both roles', () => {
    ref = shallow(<AddCollaboratorDropDown onCreate={() => {}} existingCollaborators={Immutable.fromJS([{ email: '' }])} />);
    expect(ref.findWhere((node) => {
      if (node.prop('options') != undefined) {
        return node.prop('options') === [{ name: 'User', value: 'user' }, { name: 'Admin', value: 'admin' }];
      }
    })).not.to.equal(undefined);
  });

  it('should throw an error while adding an email in uppercase which is already present with the collaborators', () => {
    ref = shallow(<AddCollaboratorDropDown onCreate={() => {}} existingCollaborators={Immutable.fromJS(['test123@gmail.com_Admin_undefined'])} />);
    const textFieldInput = ref.find(TextInput);
    textFieldInput.props().onChange({ target: { value: 'TEST123@GMAIL.COM' } });
    ref.update();
    expect(ref.find(Validated).props().error).to.equal('Collaborator already exists in your organization');
  });

  it('should display error banner if create api call fails', () => {
    ref = shallow(<AddCollaboratorDropDown onCreate={onCreateFailStub} existingCollaborators={Immutable.fromJS([{ email: '' }])} />);
    ref.setState({ email: 'test@xyz.com' });
    ref.find('Button').at(1).simulate('click');
    const banner = ref.find('Banner');
    expect(banner.props().bannerType).to.be.equal('error');
    expect(banner.props().bannerMessage).to.be.equal('api error');
  });

  it('should dismiss error banner when clicked on cross button', () => {
    ref = shallow(<AddCollaboratorDropDown onCreate={onCreateFailStub} existingCollaborators={Immutable.fromJS([{ email: '' }])} />);
    ref.setState({ email: 'test@xyz.com' });
    ref.find('Button').at(1).simulate('click');
    const banner = ref.find('Banner');
    expect(banner.props().bannerMessage).to.be.equal('api error');
    banner.props().onClose({ stopPropagation: () => {} });
    expect(ref.find('Banner').length).to.be.equal(0);
  });
});
