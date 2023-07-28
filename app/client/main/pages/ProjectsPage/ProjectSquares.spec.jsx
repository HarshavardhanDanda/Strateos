import React from 'react';
import { expect }  from 'chai';
import { shallow } from 'enzyme';
import Immutable   from 'immutable';

import sinon from 'sinon';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import ProjectSquares from './ProjectSquares';

describe('ProjectSquares', () => {

  const sandbox = sinon.createSandbox();
  const props = {
    projects: Immutable.List([]),
    searchOptions: Immutable.Map({}),
    subdomain: '',
    setActiveProject: () => {},
    onCreate: () => {}
  };
  let wrapper;

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
    sinon.restore();
  });

  it('should have create Project square if user has implementation feature', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);
    wrapper = shallow(<ProjectSquares {...props} />);
    expect(wrapper.find('NewProjectSquare')).to.length(1);
  });

  it('should have create Project square if user has create or edit project feature', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CREATE_EDIT_PROJECT).returns(true);
    wrapper = shallow(<ProjectSquares {...props} />);
    expect(wrapper.find('NewProjectSquare')).to.length(1);
  });

  it('should not have create Project square if user doesnt have implementation feature or create or edit project feature', () => {
    wrapper = shallow(<ProjectSquares {...props} />);
    expect(wrapper.find('NewProjectSquare')).to.length(0);
  });
});
