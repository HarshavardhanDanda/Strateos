import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';
import VendorCatalogActions from 'main/actions/VendorCatalogActions';
import VendorCatalogStore from 'main/stores/VendorCatalogStore';
import { simulateAPICallComplete } from 'main/components/SelectorContent/SelectorContentNew.spec';
import VendorCatalogSelectorHOC, { VendorCatalogSelector } from 'main/pages/MaterialsPage/VendorCatalogSelector/index';

describe('VendorCatalogSelector', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const vendor1 = Immutable.fromJS({ id: 'vendor1', supplier: { name: 'supplier1' } });
  const vendor2 = Immutable.fromJS({ id: 'vendor2', supplier: { name: 'supplier1' } });
  const vendor3 = Immutable.fromJS({ id: 'vendor3', supplier: { name: 'supplier2' } });

  const actions = {
    doSearch: () => {},
    updateState: () => {}
  };

  const props = {
    search: Immutable.fromJS({
      results: [{ id: 'vendor1' }, { id: 'vendor2' }, { id: 'vendor3' }]
    }),
    actions: actions,
    searchOptions: Immutable.Map(),
    isSearching: false,
    onSelectSource: () => {},
    onSelectRow: () => {},
    hasResults: true,
    onSortChange: () => {},
    onSearchFilterChange: () => {},
    onSearchFailed: () => {},
    zeroStateProps: {},
    zeroStateSearchOptions: {}
  };

  beforeEach(() => {
    const getById = sandbox.stub(VendorCatalogStore, 'getById');
    getById.withArgs('vendor1').returns(vendor1);
    getById.withArgs('vendor2').returns(vendor2);
    getById.withArgs('vendor3').returns(vendor3);

    sandbox.stub(VendorCatalogActions, 'search').returns({
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
      <VendorCatalogSelectorHOC
        {...props}
        search={Immutable.fromJS({ results: [] })}
        isSearching
        hasResults={false}
      />
    );
    expect(wrapper.find('Spinner')).to.have.length(1);
  });

  it('should have search bar hidden', () => {
    wrapper = mount(<VendorCatalogSelectorHOC {...props} />);
    simulateAPICallComplete(wrapper);

    expect(wrapper.find('SearchResultsSidebar')).to.have.length(1);
    expect(wrapper.find('SearchField')).to.have.length(0);
  });

  it('should have filter and search results', () => {
    wrapper = mount(<VendorCatalogSelectorHOC {...props} />);
    simulateAPICallComplete(wrapper);
    const filter = wrapper.find('SourceFilter');
    const result = wrapper.find('VendorCatalogSearchResults');

    expect(filter).to.have.length(1);
    expect(result).to.have.length(1);
    expect(result.prop('data').size).to.equal(3);
  });

  it('should call select source callback on source filter change', () => {
    const onSelectSourceSpy = sinon.spy();

    wrapper = mount(
      <VendorCatalogSelectorHOC
        {...props}
        onSelectSource={onSelectSourceSpy}
      />
    );
    simulateAPICallComplete(wrapper);

    const searchResultsSidebar = wrapper.find('SearchResultsSidebar');
    searchResultsSidebar.find('VendorCatalogSearchFilter').prop('onSelectSource')();
    expect(onSelectSourceSpy.calledOnce).to.be.true;
  });

  it('should have all the unique suppliers in the state', () => {
    wrapper = mount(<VendorCatalogSelectorHOC {...props} />);
    simulateAPICallComplete(wrapper);
    const suppliers = wrapper.find('VendorCatalogSearchFilter').prop('suppliers');

    expect(suppliers).to.deep.equal(['supplier1', 'supplier2']);
  });

  it('should change selected supplier and update data when onselectsupplier is called ', () => {
    wrapper = mount(<VendorCatalogSelectorHOC {...props} />);
    simulateAPICallComplete(wrapper);

    const filters = wrapper.find('VendorCatalogSearchFilter');
    expect(filters.prop('selectedSupplier')).to.equal('all');
    expect(wrapper.find('VendorCatalogSearchResults').prop('data').size).to.equal(3);
    filters.prop('onSelectSupplier')('supplier1');
    wrapper.update();
    expect(wrapper.find('VendorCatalogSearchFilter').prop('selectedSupplier')).to.equal('supplier1');
    expect(wrapper.find('VendorCatalogSearchResults').prop('data').size).to.equal(2);
  });

  it('should call load when mounted', () => {
    const loadSpy = sandbox.spy(VendorCatalogSelector.prototype, 'load');
    wrapper = mount(<VendorCatalogSelector {...props} />);

    expect(loadSpy.calledOnce).to.be.true;
  });

  it('should have SelectorContent', () => {
    wrapper = mount(
      <VendorCatalogSelectorHOC {...props} />
    );
    expect(wrapper.find('SelectorContent').length).to.be.equal(1);
  });

  it('should call updateState when a row is selected', () => {
    const updateStateSpy = sandbox.spy();
    const onSelectRowSpy = sinon.spy();
    wrapper = mount(
      <VendorCatalogSelectorHOC
        {...props}
        actions={{
          ...actions,
          updateState: updateStateSpy
        }}
        onSelectRow={onSelectRowSpy}
      />
    );
    simulateAPICallComplete(wrapper);

    wrapper.find('VendorCatalogSearchResults').prop('onSelectRow')();
    expect(updateStateSpy.calledOnce).to.be.true;
    expect(onSelectRowSpy.calledOnce).to.be.true;
  });
});
