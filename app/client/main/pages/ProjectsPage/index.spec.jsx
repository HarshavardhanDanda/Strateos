import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import FavoriteAPI from 'main/api/FavoriteAPI';
import ProjectActions from 'main/actions/ProjectActions';
import Immutable from 'immutable';
import { BrowserRouter as Router } from 'react-router-dom';
import { ProjectsPage } from './index';

describe('ProjectsPage', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const mockPush = sandbox.stub();
  const onSearchFilterChangeSpy = sinon.spy();
  const props = {
    match: { params: { subdomain: 'transcriptic' } },
    location: { search: {} },
    results: Immutable.List(),
    isLoaded: false,
    orgId: '123',
    actions: {
      onSearchFilterChange: onSearchFilterChangeSpy
    },
    searchOptions: Immutable.Map(),
    totalProjects: undefined,
    isSearching: false,
    context: { router: { history: { push: mockPush } } }
  };

  afterEach(() => {
    sandbox.restore();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('should render project page without errors', () => {
    sandbox.stub(FavoriteAPI, 'indexAll');
    sandbox.stub(ProjectActions, 'search');
    shallow(<Router><ProjectsPage {...props} /></Router>);
  });

  it('should call favorite API when rendered', () => {
    const favoriteAction = sandbox.stub(FavoriteAPI, 'indexAll').returns({ done: () => {} });
    const projectActions = sandbox.stub(ProjectActions, 'search');
    wrapper = mount(<Router><ProjectsPage {...props} /></Router>);
    expect(favoriteAction.calledOnce).to.be.true;
    expect(projectActions.calledOnce).to.be.true;
  });

  it('should reload projects after unhiding an implementation project', () => {
    const results = Immutable.List([Immutable.fromJS({
      id: 'p1e6g4gxwe5xpj',
      name: 'xyz',
      bsl: 1,
      created_at: '2020-03-01T12:12:56.044-08:00',
      organization_id: 'org13',
      is_favorite: false,
      is_implementation: true,
      organization: {
        id: 'org13',
        name: 'Strateos'
      }
    })]);
    wrapper = shallow(
      <Router>
        <ProjectsPage {...({ ...props, isLoaded: true, results })} />
      </Router>
    ).dive();
    expect(onSearchFilterChangeSpy.calledOnce).to.be.false;
    wrapper.dive().find('ProjectSquares').dive().find('ProjectSquare')
      .props()
      .onUnhideProject();
    expect(onSearchFilterChangeSpy.calledOnce).to.be.true;
  });
});
