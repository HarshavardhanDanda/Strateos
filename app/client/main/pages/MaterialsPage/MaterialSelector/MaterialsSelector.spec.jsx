import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';

import MaterialActions from 'main/actions/MaterialActions';
import MaterialStore from 'main/stores/MaterialStore';
import { simulateAPICallComplete } from 'main/components/SelectorContent/SelectorContentNew.spec';
import MaterialsSelectorHOC, { MaterialsSelector } from './index';

describe('MaterialsSelector', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const results = [{
    id: 'mat1',
    orderable_materials: [{
      id: 'omat1',
      price: 10,
      tier: '5 days',
      orderable_material_components: [{
        vol_measurement_unit: 'µL',
        volume_per_container: 10
      }]
    }]
  }, {
    id: 'mat2',
    orderable_materials: [{
      id: 'omat2',
      price: 10,
      tier: '5 days',
      orderable_material_components: [{
        vol_measurement_unit: 'µL',
        volume_per_container: 10
      }]
    }]
  }];
  const searchOptions = Immutable.Map();
  const actions = {
    doSearch: () => {},
    updateState: () => {}
  };
  const props = {
    search: Immutable.fromJS({
      results,
      page: 1,
      num_pages: 1,
      per_page: 2
    }),
    searchOptions,
    actions,
    hasResults: true,
    isSearching: false,
    onSelectRow: () => {},
    onSelectedChange: () => {}
  };

  beforeEach(() => {
    const getById = sandbox.stub(MaterialStore, 'getById');
    getById.withArgs('mat1').returns(Immutable.fromJS(results[0]));
    getById.withArgs('mat2').returns(Immutable.fromJS(results[1]));

    sandbox.stub(MaterialActions, 'search').returns({
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
      <MaterialsSelectorHOC
        {...props}
        search={Immutable.fromJS({
          results: []
        })}
        isSearching
      />
    );

    expect(wrapper.find('Spinner')).to.have.length(1);
  });

  it('should have filter and search results', () => {
    wrapper = mount(
      <MaterialsSelectorHOC
        {...props}
      />
    );
    simulateAPICallComplete(wrapper);

    const filter = wrapper.find('SearchResultsSidebar').find('MaterialsSearchFilter');
    const result = wrapper.find('MaterialsSelectorSearchResults');

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
      <MaterialsSelectorHOC
        {...props}
        actions={{
          ...actions,
          onSearchFilterChange: onSearchFilterChangeSpy
        }}
      />
    );
    simulateAPICallComplete(wrapper);
    wrapper.find('SearchResultsSidebar').find('MaterialsSearchFilter').prop('onSearchFilterChange')();

    expect(onSearchFilterChangeSpy.calledOnce).to.be.true;
  });

  it('should call action on select change', () => {
    const onSelectRowSpy = sinon.spy();

    wrapper = mount(
      <MaterialsSelectorHOC
        {...props}
        onSelectRow={onSelectRowSpy}
      />
    );
    simulateAPICallComplete(wrapper);
    wrapper.find('MaterialsSelectorSearchResults').prop('onSelectRow')();

    expect(onSelectRowSpy.calledOnce).to.be.true;
  });

  it('should call load when mounted', () => {
    const loadspy = sandbox.spy(MaterialsSelector.prototype, 'load');
    const doSearchSpy = sandbox.spy();
    const props = {
      search: Immutable.fromJS({
        results
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
      zeroStateSearchOptions: {},
      selected: []
    };

    wrapper = mount(
      <MaterialsSelector
        {...props}
      />
    );

    expect(loadspy.calledOnce).to.be.true;
    expect(doSearchSpy.calledOnce).to.be.true;
  });

  it('should have SelectorContent', () => {
    wrapper = mount(
      <MaterialsSelectorHOC
        {...props}
      />
    );
    expect(wrapper.find('SelectorContent').length).to.be.equal(1);
  });

  it('should call updateState when a row is selected', () => {
    const updateStateSpy = sandbox.spy();
    const onSelectRowSpy = sandbox.spy();
    wrapper = mount(
      <MaterialsSelectorHOC
        {...props}
        actions={{
          ...actions,
          updateState: updateStateSpy
        }}
        onSelectRow={onSelectRowSpy}
      />
    );
    simulateAPICallComplete(wrapper);

    wrapper.find('MaterialsSelectorSearchResults').prop('onSelectRow')();
    expect(updateStateSpy.calledOnce).to.be.true;
    expect(onSelectRowSpy.calledOnce).to.be.true;
  });
});
