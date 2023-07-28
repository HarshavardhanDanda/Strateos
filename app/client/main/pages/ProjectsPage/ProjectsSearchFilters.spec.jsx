import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';
import { SearchField, Popover } from '@transcriptic/amino';
import sinon from 'sinon';
import SessionStore from 'main/stores/SessionStore';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import ProjectsSearchFilters from './ProjectsSearchFilters';

describe('Project Search Filters', () => {

  let wrapper;
  let onSearchFilterChangeSpy = () => {};

  const searchOptions = Immutable.Map({
    query: '',
    is_starred: false,
    per_page: 50,
    page: 1,
    customer_organization_id: 'org1',
    is_implementation: false
  });

  beforeEach(() => {
    onSearchFilterChangeSpy = sinon.spy();
  });

  afterEach(() => {
    wrapper.unmount();
    sinon.restore();
  });

  it('should have Search Field that searches name, ID or run ID', () => {
    wrapper = shallow(<ProjectsSearchFilters
      searchOptions={searchOptions}
      onSearchFilterChange={options => onSearchFilterChangeSpy(options)}
    />);

    const searchField = wrapper.find(SearchField).dive();
    expect(searchField).to.have.length(1);
    expect(searchField.find('TextInput').dive().find('input').props().placeholder).equals('Search by project name, id or run id');
    searchField.find('TextInput').simulate('change', { target: { value: 'release-1' } });

    expect(onSearchFilterChangeSpy.calledWithExactly(searchOptions.set('query', 'release-1'))).to.be.true;
  });

  it('should have reset in SearchField to clear the search', () => {
    wrapper = shallow(<ProjectsSearchFilters
      searchOptions={searchOptions}
      onSearchFilterChange={options => onSearchFilterChangeSpy(options)}
    />);

    const searchField = wrapper.find(SearchField);
    searchField.props().reset();
    expect(onSearchFilterChangeSpy.calledWithExactly(searchOptions.set('query', ''))).to.be.true;
  });

  it('should have favorite filter to list the favorite projects ', () => {
    wrapper = shallow(<ProjectsSearchFilters
      searchOptions={searchOptions}
      onSearchFilterChange={options => onSearchFilterChangeSpy(options)}
    />);

    const favoriteIcon = wrapper.find('.projects-search-filters__favorite-filter');
    expect(favoriteIcon).to.have.length(1);
    expect(favoriteIcon.find('Icon').props()).to.include({
      icon: 'far fa-star',
      className: 'projects-search-filters__favorite-icon'
    });

    favoriteIcon.simulate('click');
    expect(onSearchFilterChangeSpy.calledWithExactly(searchOptions.set('is_starred', true))).to.be.true;
  });

  it('should have popover for favorite filter', () => {
    wrapper = shallow(<ProjectsSearchFilters
      searchOptions={searchOptions}
      onSearchFilterChange={options => onSearchFilterChangeSpy(options)}
    />);
    expect(wrapper.find(Popover)).to.have.length(1);
    expect(wrapper.find(Popover).at(0).props().content).equal('View favorite projects only');
  });

  it('should have eye icon and toggle is_implementation value on click', () => {
    let newSearchOptions = searchOptions;
    newSearchOptions = newSearchOptions.set('is_implementation', true);

    sinon.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);

    wrapper = shallow(<ProjectsSearchFilters
      searchOptions={newSearchOptions}
      onSearchFilterChange={options => onSearchFilterChangeSpy(options)}
    />);

    const iconWrapper = wrapper.find('.projects-search-filters__implementation-filter');
    expect(iconWrapper).to.have.length(1);
    expect(iconWrapper.find('Icon').props()).to.include({
      icon: 'far fa-eye-slash',
      className: 'projects-search-filters__implementation-icon'
    });

    iconWrapper.simulate('click');
    expect(onSearchFilterChangeSpy.calledWithExactly(newSearchOptions.set('is_implementation', undefined))).to.be.true;
    expect(wrapper.find('.projects-search-filters--implementation-active').length).to.equal(1);
  });

  it('should not render eye icon without permissions', () => {
    sinon.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(false);

    wrapper = shallow(<ProjectsSearchFilters
      searchOptions={searchOptions}
      onSearchFilterChange={options => onSearchFilterChangeSpy(options)}
    />);

    expect(wrapper.find('.projects-search-filters__implementation-filter').length).to.equal(0);
  });

  it('should have OrganizationTypeAhead for orgs filter', () => {
    sinon.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);

    wrapper = shallow(<ProjectsSearchFilters
      searchOptions={searchOptions}
      onSearchFilterChange={options => onSearchFilterChangeSpy(options)}
    />);

    expect(wrapper.find('OrganizationTypeAhead')).to.length(1);
  });

  it('should set organization selected value in OrganizationTypeAhead', () => {
    sinon.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org1' }));
    sinon.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);

    wrapper = shallow(<ProjectsSearchFilters
      searchOptions={searchOptions}
      onSearchFilterChange={options => onSearchFilterChangeSpy(options)}
    />);

    expect(wrapper.find('OrganizationTypeAhead').props().organizationSelected).to.equal('org1');
  });

  it('should have popover for implementation projects filter with permissions', () => {
    sinon.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(true);

    wrapper = shallow(<ProjectsSearchFilters
      searchOptions={searchOptions}
      onSearchFilterChange={options => onSearchFilterChangeSpy(options)}
    />);
    expect(wrapper.find(Popover)).to.have.length(2);
    expect(wrapper.find(Popover).at(1).props().content).equal('Show implementation projects only');
  });

  it('should not have popover for implementation projects filter without permissions', () => {
    sinon.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB).returns(false);

    wrapper = shallow(<ProjectsSearchFilters
      searchOptions={searchOptions}
      onSearchFilterChange={options => onSearchFilterChangeSpy(options)}
    />);
    expect(wrapper.find(Popover)).to.have.length(1);
    expect(wrapper.find(Popover).at(0).props().content).to.not.equal('Show implementation projects only');
  });

  it('should have sort by filter and sort by should have oldest and newest project options', () => {
    wrapper = shallow(<ProjectsSearchFilters
      searchOptions={searchOptions}
      onSearchFilterChange={options => onSearchFilterChangeSpy(options)}
    />);
    const filters = wrapper.find('Select');
    const options = filters.at(0).props().options;
    expect(filters).to.have.length(1);
    expect(options).to.have.length(2);
    expect(options[0].name).equals('Newest Project');
    expect(options[1].name).equals('Oldest Project');
  });

  it('should trigger callback on sort by change', () => {
    wrapper = shallow(<ProjectsSearchFilters
      searchOptions={searchOptions}
      onSearchFilterChange={options => onSearchFilterChangeSpy(options)}
    />);
    const filters = wrapper.find('Select');
    filters.at(0).simulate('change',  { target: { value: 'asc' } });
    expect(onSearchFilterChangeSpy.calledWithExactly(searchOptions.set('created_at', 'asc'))).to.be.true;
  });
});
