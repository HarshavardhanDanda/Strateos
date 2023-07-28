import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { BrowserRouter as Router } from 'react-router-dom';
import Immutable from 'immutable';

import FeatureConstants from '@strateos/features';
import AcsControls from 'main/util/AcsControls';
import ProjectActions from 'main/actions/ProjectActions';
import CommonUiUtil from 'main/util/CommonUiUtil';
import ProjectPage from './ProjectPage';

const projectId = 'pr1eczcyxsr2urq';

const implementationProject = Immutable.fromJS({
  id: 'p123456',
  name: 'Test Project',
  organization_id: 'org123',
  archived_at: null,
  bsl: 1,
  is_implementation: true,
  run_count: {
    in_progress: 0,
    aborted: 0,
    complete: 0,
    accepted: 0,
    pending: 0,
    rejected: 0,
    test_mode: 0
  },
  users: [],
  organization: {
    id: 'org123',
    name: 'Test Org'
  }
});
const routeProps = {
  match: {
    params: {
      subdomain: 'xyz',
      projectId: 'pr1eczcyxsr2urq'
    },
    path: ''
  },
  project: implementationProject,
};

describe('ProjectPage', () => {

  let component, projectUpdateStub;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(ProjectActions, 'load').returns({ done: (cb) => { cb(); } });
    projectUpdateStub = sandbox.stub(ProjectActions, 'update').returns({ done: (cb) => { cb(); } });
  });

  afterEach(() => {
    if (component) {
      component.unmount();
    }
    sandbox.restore();
  });

  it('should set project_id in intercom settings', () => {
    window.intercomSettings = {};
    component = mount(
      <Router>
        {<ProjectPage
          {...routeProps}
        />}
      </Router>);
    expect(window.intercomSettings.project_id).to.be.equal(projectId);
  });

  it('should indicate when project is an implementation project', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.LAUNCH_RUN).returns(true);
    component = mount(
      <Router>
        <ProjectPage
          {...routeProps}
          project={implementationProject}
        />
      </Router>
    );
    const launchButton = component.find('Button').filterWhere(button => button.text() === 'Launch Run');
    expect(launchButton.props().type).to.equal('secondary');
    expect(component.find('PageHeader').props().type).to.equal('brand');
    expect(component.find('ImplementationProjectIndicator').length).to.equal(1);
  });

  it('should render org name for implementation projects', () => {
    component = mount(
      <Router>
        <ProjectPage
          {...routeProps}
        />
      </Router>);
    const orgSpan = component.find('PageLayout').find('span').at(9);
    expect(orgSpan.text()).to.equal('Test Org');
  });

  it('should not render org name for non implementation projects', () => {
    component = mount(
      <Router>
        <ProjectPage
          {...routeProps}
          project={implementationProject.set('is_implementation', false)}
        />
      </Router>);
    expect(component.find('PageLayout')
      .find('span')
      .findWhere(span => span.text() === 'Test Org').length)
      .to.equal(0);
  });

  it('should render hidden icon and tooltip for implementation projects', () => {
    component = mount(
      <Router>
        <ProjectPage
          {...routeProps}
        />
      </Router>);
    const tooltip = component.find('PageLayout').find('Tooltip');
    expect(tooltip.props().title).to.equal('This is a Test Org implementation project');
    expect(tooltip.find('Icon').props().icon).to.equal('fa fa-eye-slash');
  });

  it('should not render hidden icon and tooltip for non implementation projects', () => {
    component = mount(
      <Router>
        <ProjectPage
          {...routeProps}
          project={implementationProject.set('is_implementation', false)}
        />
      </Router>);
    expect(component.find('PageLayout')
      .find('Tooltip').length)
      .to.equal(0);
  });

  it('should render Unhide Project action option for implementation projects', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled')
      .withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);
    component = mount(
      <Router>
        <ProjectPage
          {...routeProps}
        />
      </Router>);
    const unhideProjectAction = component.find('PageLayout').find('ActionMenu')
      .find('Suggestions').props().suggestions
      .find(suggestion => suggestion.text === 'Unhide Project');

    expect(unhideProjectAction.icon).to.equal('fa fa-eye');
    expect(unhideProjectAction.text).to.equal('Unhide Project');
    expect(unhideProjectAction.onClick).to.be.not.undefined;
    expect(unhideProjectAction.disabled).to.be.false;
  });

  it('should call update api when clicked on "Unhide Project" action', () => {
    sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(true);
    sandbox.stub(AcsControls, 'isFeatureEnabled')
      .withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);
    component = mount(
      <Router>
        <ProjectPage
          {...routeProps}
        />
      </Router>);
    const unhideProjectAction = component.find('PageLayout').find('ActionMenu')
      .find('Suggestions').props().suggestions
      .find(suggestion => suggestion.text === 'Unhide Project');
    unhideProjectAction.onClick();
    expect(projectUpdateStub.calledOnce).to.be.true;
    expect(projectUpdateStub.calledWithExactly('p123456', { is_implementation: false })).to.be.true;
  });

  it('should not render Unhide Project action option for non implementation projects', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled')
      .withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);
    component = mount(
      <Router>
        <ProjectPage
          {...routeProps}
          project={implementationProject.set('is_implementation', false)}
        />
      </Router>);
    const unhideProjectAction = component.find('PageLayout').find('ActionMenu')
      .find('Suggestions').props().suggestions
      .find(suggestion => suggestion.text === 'Unhide Project');

    expect(unhideProjectAction).to.be.undefined;
  });

  it('should not render Unhide Project action option if does not have required feature', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled')
      .withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(false);
    component = mount(
      <Router>
        <ProjectPage
          {...routeProps}
        />
      </Router>);
    const unhideProjectAction = component.find('PageLayout').find('ActionMenu')
      .find('Suggestions').props().suggestions
      .find(suggestion => suggestion.text === 'Unhide Project');

    expect(unhideProjectAction).to.be.undefined;
  });
});
