import React from 'react';

import { expect }  from 'chai';
import { shallow } from 'enzyme';
import Immutable   from 'immutable';

import sinon from 'sinon';
import FavoriteStore  from 'main/stores/FavoriteStore';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import FavoriteAPI from 'main/api/FavoriteAPI';
import ProjectActions from 'main/actions/ProjectActions';
import CommonUiUtil from 'main/util/CommonUiUtil';
import { ProjectSquare } from './ProjectSquare';

function getProject(is_favorite, is_implementation = false) {
  return Immutable.fromJS({
    id: 'p1e6g4gxwe5xpj',
    name: 'xyz',
    bsl: 1,
    created_at: '2020-03-01T12:12:56.044-08:00',
    organization_id: 'org13',
    is_favorite: is_favorite,
    is_implementation: is_implementation,
    organization: {
      id: 'org13',
      name: 'Strateos'
    }
  });
}

describe('Project Square', () => {

  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
    sinon.restore();
  });

  it('star must not be highlighted for nil favorite', () => {
    sandbox.stub(FavoriteStore, 'hasFavorableId').returns(false);
    wrapper = shallow(<ProjectSquare project={getProject(null)} />);
    const star = wrapper.find('i');
    expect(star.hasClass('far fa-star')).to.equal(true);
  });

  it('star must be highlighted if favorite present', () => {
    sandbox.stub(FavoriteStore, 'hasFavorableId').returns(true);
    wrapper = shallow(<ProjectSquare project={getProject(true)} />);
    const star = wrapper.find('i');
    expect(star.hasClass('fas fa-star project-square__favorite-icon--active')).to.equal(true);
  });

  it('Favoriting a project should call project actions to update project favorite', () => {
    sandbox.stub(FavoriteStore, 'hasFavorableId').returns(false);
    wrapper = shallow(<ProjectSquare project={getProject(null)} />);
    const star = wrapper.find('i');
    expect(star.hasClass('far fa-star')).to.equal(true);
    const favoriteActions = sandbox.stub(FavoriteAPI, 'create').returns({
      done: (cb) => {
        cb();
        return { fail: () => {} };
      }
    });
    wrapper.find('.project-square__favorite-icon').first().simulate('click');
    expect(favoriteActions.calledOnce).to.be.true;
  });

  it('Unfavoriting a project should call project actions to update project favorite', () => {
    sandbox.stub(FavoriteStore, 'hasFavorableId').returns(true);
    const onToggleProjectStar = sinon.spy();
    wrapper = shallow(<ProjectSquare project={getProject(true)} onToggleProjectStar={onToggleProjectStar} />);
    const star = wrapper.find('i');
    expect(star.hasClass('fas fa-star project-square__favorite-icon--active')).to.equal(true);
    sandbox.stub(FavoriteStore, 'getByFavorableId').returns(Immutable.Map({ id: '12' }));
    const favoriteActions = sandbox.stub(FavoriteAPI, 'destroy').returns({
      always: (cb) => {
        cb();
        return { fail: () => {} };
      }
    });
    wrapper.find('.project-square__favorite-icon').first().simulate('click');
    expect(favoriteActions.calledOnce).to.be.true;
    expect(onToggleProjectStar.calledOnce).to.be.true;
  });

  it('should show pending, rejected run count on the card', () => {
    sandbox.stub(FavoriteStore, 'hasFavorableId').returns(true);
    const project = getProject(true);
    const run_count = Immutable.fromJS({
      pending: 2,
      rejected: 3
    });

    wrapper = shallow(<ProjectSquare project={project.set('run_count', run_count)} />);
    const runTypeSummaries = wrapper.find('.project-square__summaries').find('RunTypeSummary');
    expect(runTypeSummaries.at(0).props().description).to.equal('Pending');
    expect(runTypeSummaries.at(0).props().count).to.equal(run_count.get('pending'));
    expect(runTypeSummaries.at(1).props().description).to.equal('Rejected');
    expect(runTypeSummaries.at(1).props().count).to.equal(run_count.get('rejected'));
  });

  it('should not show pending, rejected run count on the card, if runs not exists', () => {
    sandbox.stub(FavoriteStore, 'hasFavorableId').returns(true);
    const project = getProject(true);
    wrapper = shallow(<ProjectSquare project={project.set('run_count', Immutable.Map())} />);
    const runTypeSummaries = wrapper.find('.project-square__summaries').find('RunTypeSummary');
    expect(runTypeSummaries).to.have.length(0);
  });
});

describe('Implementation Project Square', () => {
  let wrapper;
  let featureStub;
  const sandbox = sinon.createSandbox();
  const project = getProject(true, true);

  beforeEach(() => {
    featureStub = sandbox.stub(AcsControls, 'isFeatureEnabled');
    featureStub.withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);
    wrapper = shallow(<ProjectSquare project={project} />);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  it('should have organization name, eye-slash icon and tool tip if it is implementation project', () => {
    expect(wrapper.find('p').at(0).text()).to.equal('Strateos');
    expect(wrapper.find('p').at(0).props().className).to.equal('project-square__subheader');
    expect(wrapper.find('ImplementationProjectIndicator').length).to.equal(1);
    expect(wrapper.find('ImplementationProjectIndicator').dive().find('Icon').props().icon).to.equal('fa fa-eye-slash');
  });

  it('should have project-square--implementation class for implementation project', () => {
    expect(wrapper.find('Card').at(0).hasClass('project-square--implementation')).to.equal(true);
  });

  it('should have background--implementation class when hovered on implementation project', () => {
    wrapper.setState({ isHovered: true });
    expect(wrapper.find('div').at(1).hasClass('project-square__background--implementation')).to.equal(true);
  });

  it('should open prompt when clicked on hidden eye icon', () => {
    const confirmSpy = sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(false);
    wrapper.find('ImplementationProjectIndicator').simulate('click');
    expect(confirmSpy.calledOnce).to.equal(true);
    expect(confirmSpy.args[0][0])
      .to.equal('Are you sure you want to expose this project to the client Organization?');
  });

  it('should call update when user unhides the project', () => {
    const updateSpy = sandbox.spy(ProjectActions, 'update');
    sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(true);
    wrapper.find('ImplementationProjectIndicator').simulate('click');
    expect(updateSpy.calledOnce).to.equal(true);
    expect(updateSpy.args[0][0]).to.equal('p1e6g4gxwe5xpj');
    expect(updateSpy.args[0][1].is_implementation).to.equal(false);
  });

  it('should set isHighlighted prop to true when hovered on card', () => {
    expect(wrapper.find('ImplementationProjectIndicator').props().isHighlighted).to.equal(false);
    wrapper.setState({ isHovered: true });
    expect(wrapper.find('ImplementationProjectIndicator').props().isHighlighted).to.equal(true);
  });

  it('should set isHovered prop to false when not hovered on card', () => {
    expect(wrapper.find('ImplementationProjectIndicator').props().isHighlighted).to.equal(false);
  });

  it('should have hidden eye icon if it is a implementation project', () => {
    expect(wrapper.find('ImplementationProjectIndicator').length).to.equal(1);
    expect(wrapper.find('ImplementationProjectIndicator').dive().find('Icon').props().icon).to.equal('fa fa-eye-slash');
  });

  it('should able to view project if the user has the permission', () => {
    expect(wrapper.find('Link').find('h4').text()).to.equal('View Project');
  });

  it('should call update and onUnhideProject callback method when user unhides the project from action menu', () => {
    const updateStub = sandbox.stub(ProjectActions, 'update').returns({
      done: (cb) => {
        cb();
        return { fail: () => {} };
      }
    });
    const onUnhideProjectSpy = sandbox.spy();
    sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(true);
    featureStub.withArgs(FeatureConstants.CREATE_EDIT_PROJECT).returns(true);

    wrapper = shallow(<ProjectSquare project={project} onUnhideProject={onUnhideProjectSpy} />);
    wrapper.find('ActionMenu').simulate('click');
    wrapper.find('ActionMenu').dive().find('Suggestions').props().suggestions[3].onClick();

    expect(updateStub.calledOnce).to.equal(true);
    expect(updateStub.args[0][0]).to.equal('p1e6g4gxwe5xpj');
    expect(updateStub.args[0][1].is_implementation).to.equal(false);
    expect(onUnhideProjectSpy.calledOnce).to.equal(true);
  });
});
