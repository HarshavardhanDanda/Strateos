import React from 'react';
import sinon from 'sinon';
import Immutable from 'immutable';
import _ from 'lodash';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { Button, ButtonGroup } from '@transcriptic/amino';
import CreateOrEditProjectModal from 'main/components/CreateOrEditProjectModal';
import AcsControls from 'main/util/AcsControls';
import ProjectActions from 'main/actions/ProjectActions';
import FeatureConstants from '@strateos/features';

describe('CreateOrEditProjectModal', () => {
  let sandbox;
  let wrapper;

  const project = Immutable.Map({
    payment_method_id: undefined,
    webhook_url: 'test',
    created_at: '2023-03-06T13:35:29.417-07:00',
    name: 'chem_synth_testing',
    updated_at: '2023-03-06T13:35:29.417-07:00',
    id: 'p1e9c8yk7pcf8b',
    bsl: 1,
    organization_id: 'org13'
  });

  const props = {
    onSubmitDone: () => {},
    isCreateModal: true
  };

  const assertProjectState = (inputsController, project) => {
    expect(inputsController.prop('defaultState').projectName).to.equal(project.get('name'));
    expect(inputsController.prop('defaultState').webhookURL).to.equal(project.get('webhook_url'));
    expect(inputsController.find('BSLSettings').prop('bsl')).to.equal(project.get('bsl'));
    expect(inputsController.find('ConnectedPaymentMethodSelector').dive().prop('paymentMethodId')).to.equal(project.get('payment_method_id'));
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    wrapper = shallow(<CreateOrEditProjectModal {...props} />);
  });

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('Create or Edit Project modal should contain Single Pane Modal', () => {
    expect(wrapper.find('ConnectedSinglePaneModal')).to.length(1);
  });

  it('Should have footer and Submit, Cancel buttons', () => {
    const singlePaneModal = wrapper.find('ConnectedSinglePaneModal').dive().dive().find('SinglePaneModal');
    const modalFooter = singlePaneModal.dive().find(ButtonGroup);
    expect(modalFooter).to.have.length(1);
    expect(modalFooter.find(Button).dive().text()).to.equal('Cancel');
    expect(modalFooter.find('span').text()).to.equal('Submit');
  });

  it('Project creation modal should not get closed if project creation is failed', () => {
    const inputStates = {
      projectName: 'Demo Project',
      webhookURL: undefined
    };
    const createProject = sandbox.stub(ProjectActions, 'create').returns({
      done: (cb) => {
        cb({
          data: []
        });
        return { fail: () => ({}) };
      }
    });
    wrapper.find('ConnectedSinglePaneModal').dive().find('InputsController').props()
      .inputChangeCallback(inputStates);
    wrapper.find('ConnectedSinglePaneModal').dive().find('ConnectedPaymentMethodSelector').props()
      .onPaymentMethodSelected('pm1dffyk3tbmwsw');
    wrapper.props().onAccept();
    expect(createProject.calledOnce).to.be.true;
    expect(wrapper.find('ConnectedSinglePaneModal')).to.length(1);
    expect(wrapper.find('InputsController').props().defaultState.projectName).to.equal('Demo Project');
  });

  it('should have implementation toggle button when user has implementation feature', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);
    wrapper = shallow(<CreateOrEditProjectModal {...props} />);

    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('Toggle')).to.length(1);
    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('Tooltip').props().title)
      .to.equals('This project is not shown to the client organization by default and is used for testing purposes.');
  });

  it('should not have implementation toggle when user dont have implementation feature', () => {
    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('Toggle')).to.length(0);
  });

  it('should show organization dropdown when implementation project toggle is on', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);
    wrapper = shallow(<CreateOrEditProjectModal {...props} />);
    wrapper.find('ConnectedSinglePaneModal').dive().find('InputsController').props()
      .inputChangeCallback({ implementationToggle: 'on' });
    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('LabeledInput')).to.length(3);
    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('OrganizationTypeAhead')).to.length(1);
  });

  it('should reset orgId when implementation toggle is off', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);
    wrapper = shallow(<CreateOrEditProjectModal {...props} />);
    wrapper.find('ConnectedSinglePaneModal').dive().find('InputsController').props()
      .inputChangeCallback({ implementationToggle: 'on' });
    wrapper.find('ConnectedSinglePaneModal').dive().find('OrganizationTypeAhead').props()
      .onOrganizationChange('org13');
    expect(wrapper.state().orgId).to.equals('org13');
    wrapper.find('ConnectedSinglePaneModal').dive().find('InputsController').props()
      .inputChangeCallback({ implementationToggle: 'off' });
    expect(wrapper.state().orgId).to.equals('');
  });

  it('should call create api with organization_id and is_implementation true on submit', () => {
    const projectCreateStub = sandbox.stub(ProjectActions, 'create').returns({
      done: (cb) => {
        cb({
          data: []
        });
        return { fail: () => ({}) };
      }
    });
    const inputStates = {
      projectName: 'Demo Project',
      webhookURL: undefined
    };
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);
    wrapper = shallow(<CreateOrEditProjectModal {...props} />);
    wrapper.find('ConnectedSinglePaneModal').dive().find('InputsController').props()
      .inputChangeCallback(inputStates);
    wrapper.find('ConnectedSinglePaneModal').dive().find('ConnectedPaymentMethodSelector').props()
      .onPaymentMethodSelected('pm1dffyk3tbmwsw');
    wrapper.find('ConnectedSinglePaneModal').dive().find('InputsController').props()
      .inputChangeCallback({ implementationToggle: 'on' });
    wrapper.find('ConnectedSinglePaneModal').dive().find('OrganizationTypeAhead').props()
      .onOrganizationChange('org13');
    wrapper.props().onAccept();

    expect(projectCreateStub.calledOnce).to.be.true;
    expect(projectCreateStub.args[0][1].organization_id).to.equal('org13');
    expect(projectCreateStub.args[0][1].is_implementation).to.be.true;
  });

  it('should call create api on submit without organization_id and is_implementation when implementation toggle is off', () => {
    const projectCreateStub = sandbox.stub(ProjectActions, 'create').returns({
      done: (cb) => {
        cb({
          data: []
        });
        return { fail: () => ({}) };
      }
    });
    const inputStates = {
      projectName: 'Demo Project',
      webhookURL: undefined
    };
    const payload = {
      payment_method_id: 'pm1dffyk3tbmwsw',
      bsl: 1,
      webhook_url: undefined
    };
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);
    wrapper = shallow(<CreateOrEditProjectModal {...props} />);
    wrapper.find('ConnectedSinglePaneModal').dive().find('InputsController').props()
      .inputChangeCallback(inputStates);
    wrapper.find('ConnectedSinglePaneModal').dive().find('ConnectedPaymentMethodSelector').props()
      .onPaymentMethodSelected('pm1dffyk3tbmwsw');
    wrapper.find('ConnectedSinglePaneModal').dive().find('InputsController').props()
      .inputChangeCallback({ implementationToggle: 'off' });
    wrapper.props().onAccept();

    expect(projectCreateStub.calledOnce).to.be.true;
    expect(projectCreateStub.args[0][1]).to.be.deep.equal(payload);
  });

  it('should disable submit button if implementation project toggle is on and organization is not selected', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);
    wrapper = shallow(<CreateOrEditProjectModal {...props} />);
    wrapper.find('ConnectedSinglePaneModal').dive().find('InputsController').props()
      .inputChangeCallback({ projectName: 'Demo Project' });

    expect(wrapper.find('ConnectedSinglePaneModal').dive().dive().find('SinglePaneModal')
      .props().acceptBtnDisabled).to.be.false;
    wrapper.find('ConnectedSinglePaneModal').dive().find('InputsController').props()
      .inputChangeCallback({ implementationToggle: 'on' });

    expect(wrapper.find('ConnectedSinglePaneModal').dive().dive().find('SinglePaneModal')
      .props().acceptBtnDisabled).to.be.true;
    expect(wrapper.state().orgId).to.equals('');
    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('LabeledInput').at(0)
      .props().label).to.equals('Organization');
    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('LabeledInput').find('Validated')
      .at(0)
      .props().error).to.equals('Must be specified');
  });

  it('should update the project state and render correctly when props are updated', () => {
    wrapper = shallow(<CreateOrEditProjectModal {...props} project={project} isCreateModal={false} />);
    let inputsController = wrapper.find('InputsController');
    assertProjectState(inputsController, project);

    const updatedProject = Immutable.fromJS({ ...project.toJS(), id: 'p3dhf63k7pcf2s', name: 'proj_updated', payment_method_id: 'pm1238382', bsl: 2 });
    wrapper.setProps({ ...props, project: updatedProject, isCreateModal: false,  });
    inputsController = wrapper.find('InputsController');
    assertProjectState(inputsController, updatedProject);
  });

  it('should not update the project state when props are not updated', () => {
    wrapper = shallow(<CreateOrEditProjectModal {...props} project={project} isCreateModal={false} />);
    let inputsController = wrapper.find('InputsController');
    assertProjectState(inputsController, project);

    wrapper.setProps(props);
    inputsController = wrapper.find('InputsController');
    assertProjectState(inputsController, project);
  });

  it('should show payment method dropdown when implementation project toggle is off', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);
    wrapper = shallow(<CreateOrEditProjectModal {...props} />);
    expect(wrapper.find('ConnectedSinglePaneModal')).to.length(1);
    expect(wrapper.find('ConnectedSinglePaneModal').props().title).to.be.equal('Create New Project');
    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('LabeledInput')).to.length(3);
    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('ConnectedPaymentMethodSelector')).to.length(1);
  });

  it('should show payment method dropdown while updating project', () => {
    const props = { onSubmitDone: () => {}, isCreateModal: false };
    const project = Immutable.Map({ is_implementation: false });
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);
    wrapper = shallow(<CreateOrEditProjectModal {...props} project={project} />);
    wrapper.find('ConnectedSinglePaneModal').dive().find('InputsController').props()
      .inputChangeCallback({ implementationToggle: 'off'  });
    expect(wrapper.find('ConnectedSinglePaneModal')).to.length(1);
    expect(wrapper.find('ConnectedSinglePaneModal').props().title).to.be.equal('Update Project Settings');
    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('LabeledInput')).to.length(3);
    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('ConnectedPaymentMethodSelector')).to.length(1);
  });

  it('should not show payment method dropdown when implementation project toggle is on', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);
    wrapper = shallow(<CreateOrEditProjectModal {...props} />);
    wrapper.find('ConnectedSinglePaneModal').dive().find('InputsController').props()
      .inputChangeCallback({ implementationToggle: 'on' });
    expect(wrapper.find('ConnectedSinglePaneModal')).to.length(1);
    expect(wrapper.find('ConnectedSinglePaneModal').props().title).to.be.equal('Create New Project');
    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('LabeledInput')).to.length(3);
    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('ConnectedPaymentMethodSelector')).to.length(0);
  });

  it('should not show payment method dropdown while updating implementation project', () => {
    const props = { onSubmitDone: () => {}, isCreateModal: false };
    const project = Immutable.Map({ is_implementation: true });
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);
    wrapper = shallow(<CreateOrEditProjectModal {...props} project={project} />);
    wrapper.find('ConnectedSinglePaneModal').dive().find('InputsController').props()
      .inputChangeCallback({ implementationToggle: 'off'  });
    expect(wrapper.find('ConnectedSinglePaneModal')).to.length(1);
    expect(wrapper.find('ConnectedSinglePaneModal').props().title).to.be.equal('Update Project Settings');
    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('LabeledInput')).to.length(2);
    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('ConnectedPaymentMethodSelector')).to.length(0);
  });
});
