import React from 'react';
import sinon from 'sinon';
import _ from 'lodash';
import { mount } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';

import ResourceActions from 'main/actions/ResourceActions';
import ResourceStore from 'main/stores/ResourceStore';
import { simulateAPICallComplete } from 'main/components/SelectorContent/SelectorContentNew.spec';
import { ResourceSelectorModalActions } from 'main/pages/ResourcesPage/ResourcesSearchActions';
import ResourceSelectorHOC, { ResourceSelector }  from './ResourceSelector';

describe('ResourceSelector', () => {
  let wrapper;

  const sandbox = sinon.createSandbox();

  const resources = [
    {
      id: 'rs1'
    },
    {
      id: 'rs2'
    }
  ];

  const searchOptions = Immutable.Map();

  const actions = {
    doSearch: () => {},
    updateState: () => {}
  };

  beforeEach(() => {
    const getById = sandbox.stub(ResourceStore, 'getById');
    getById.withArgs('rs1').returns(Immutable.fromJS(resources[0]));
    getById.withArgs('rs2').returns(Immutable.fromJS(resources[1]));

    sandbox.stub(ResourceActions, 'search').returns({
      done: () => {},
      always: () => {},
      fail: () => {}
    });
  });

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should have spinner', () => {
    wrapper = mount(
      <ResourceSelectorHOC
        search={Immutable.fromJS({
          results: []
        })}
        actions={ResourceSelectorModalActions}
        searchOptions={Immutable.Map()}
        isSearching
        onSelectRow={() => {}}
      />
    );

    expect(wrapper.find('Spinner')).to.have.length(1);
  });

  it('should have filter and search results', () => {
    const searchOptions = Immutable.Map();
    wrapper = mount(
      <ResourceSelectorHOC
        search={Immutable.fromJS({
          results: resources,
          page: 1,
          num_pages: 1,
          per_page: 2
        })}
        actions={actions}
        searchOptions={searchOptions}
        isSearching={false}
        onSelectRow={() => {}}
        hasResults
      />
    );
    simulateAPICallComplete(wrapper);

    const filter = wrapper.find('SearchResultsSidebar').find('ResourcesSearchFilters');
    const result = wrapper.find('ResourceSearchResults');

    expect(filter).to.have.length(1);
    expect(result).to.have.length(1);
    expect(result.prop('data').size).to.equal(2);
    expect(result.props()).to.include({
      page: 1,
      numPages: 1,
      pageSize: 2
    });
  });

  it('should call action on filter change', () => {
    const onSearchFilterChangeSpy = sinon.spy();

    wrapper = mount(
      <ResourceSelectorHOC
        search={Immutable.fromJS({
          results: resources
        })}
        actions={{
          ...actions,
          onSearchFilterChange: onSearchFilterChangeSpy
        }}
        searchOptions={searchOptions}
        onSelectRow={() => {}}
        isSearching={false}
        hasResults
      />
    );

    simulateAPICallComplete(wrapper);
    wrapper.find('SearchResultsSidebar').find('ResourcesSearchFilters').prop('onSearchFilterChange')();

    expect(onSearchFilterChangeSpy.calledOnce).to.be.true;
  });

  it('should call action on select change', () => {
    const onSelectRowSpy = sinon.spy();

    wrapper = mount(
      <ResourceSelectorHOC
        search={Immutable.fromJS({
          results: resources
        })}
        actions={actions}
        searchOptions={searchOptions}
        isSearching={false}
        onSelectRow={onSelectRowSpy}
        hasResults
      />
    );
    simulateAPICallComplete(wrapper);
    wrapper.find('ResourceSearchResults').prop('onSelectRow')();

    expect(onSelectRowSpy.calledOnce).to.be.true;
  });

  it('should call load when mounted', () => {
    const loadspy = sandbox.spy(ResourceSelector.prototype, 'load');
    const doSearchSpy = sandbox.spy();
    const props = {
      search: Immutable.fromJS({
        results: resources
      }),
      actions: { ...actions, doSearch: doSearchSpy },
      searchOptions: searchOptions,
      isSearching: false,
      hasResults: true,
      onSelectRow: () => {},
      onSortChange: () => {},
      onSearchInputChange: () => {},
      onSearchFilterChange: () => {},
      onSearchPageChange: () => {},
      onSearchFailed: () => {},
      page: () => {},
      numPages: () => {},
      pageSize: () => {},
      zeroStateProps: {},
      zeroStateSearchOptions: {}
    };

    wrapper = mount(<ResourceSelector {...props} />);

    expect(loadspy.calledOnce).to.be.true;
    expect(doSearchSpy.calledOnce).to.be.true;
  });

  it('should have SelectorContent', () => {
    wrapper = mount(
      <ResourceSelectorHOC
        search={Immutable.fromJS({
          results: resources
        })}
        actions={actions}
        searchOptions={searchOptions}
        isSearching={false}
        onSelectRow={() => {}}
        hasResults
      />
    );
    expect(wrapper.find('SelectorContent').length).to.be.equal(1);
  });

  it('should call updateState when a row is selected', () => {
    const updateStateSpy = sandbox.spy();
    const onSelectRowSpy = sinon.spy();
    wrapper = mount(
      <ResourceSelectorHOC
        search={Immutable.fromJS({
          results: resources
        })}
        actions={{
          ...actions,
          updateState: updateStateSpy
        }}
        searchOptions={searchOptions}
        isSearching={false}
        onSelectRow={onSelectRowSpy}
        hasResults
      />
    );
    simulateAPICallComplete(wrapper);

    wrapper.find('ResourceSearchResults').prop('onSelectRow')();
    expect(updateStateSpy.calledOnce).to.be.true;
    expect(onSelectRowSpy.calledOnce).to.be.true;
  });
});
