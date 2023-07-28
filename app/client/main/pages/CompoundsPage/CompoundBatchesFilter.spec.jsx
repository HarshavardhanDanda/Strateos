import React from 'react';
import sinon from 'sinon';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Button, SearchField } from '@transcriptic/amino';
import CompoundBatchesFilter from './CompoundBatchesFilter';

describe('CompoundBatchesFilter', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const defaultFilters = Immutable.fromJS({
    searchInput: '',
    searchPage: 1,
    searchSortBy: 'created_at',
    descending: true,
    searchPerPage: 10,
    compound_link_id: 'cmpl1g8f8jcckfwcc',
    container_types: []
  });

  const SearchedFilters = Immutable.fromJS({
    compound_link_id: 'cmpl1g8f8jcckfwcc',
    container_types: ['d1-vial'],
    descending: true,
    searchInput: '',
    searchPage: 1,
    searchPerPage: '10',
    searchSortBy: 'created_at'
  });

  const props = {
    searchOptions: defaultFilters,
    onSearchInputChange: () => {},
    onSearchFilterChange: () => {}
  };

  afterEach(() => {
    sandbox.restore();
  });

  it('should render search field', () => {
    wrapper = shallow(<CompoundBatchesFilter {...props} />);
    const searchField = wrapper.find(SearchField);
    expect(searchField.length).to.equal(1);
  });

  it('should have MultiSelect to select container type', () => {
    wrapper = shallow(<CompoundBatchesFilter {...props} />);
    expect(wrapper.find('ContainerTypeSelector').length).to.equal(1);
    expect(wrapper.find('ContainerTypeSelector').props().isMultiSelect).to.be.true;
  });

  it('should reset filters on reset button click', () => {
    const onSearchFilterChange = sandbox.spy();
    wrapper = shallow(<CompoundBatchesFilter
      {...props}
      searchOptions={SearchedFilters}
      onSearchFilterChange={onSearchFilterChange}
    />);
    const resetButton = wrapper.find(Button);
    resetButton.simulate('click');
    expect(onSearchFilterChange
      .args[0][0]).to.deep.equal(defaultFilters);
  });

  it('Search field should search by batch id', () => {
    const onSearchInputChange = sandbox.spy();
    wrapper = shallow(<CompoundBatchesFilter
      {...props}
      onSearchInputChange={onSearchInputChange}
    />);
    expect(wrapper.dive().find(SearchField).length).to.equal(1);
    wrapper.dive().find(SearchField).props().onChange({ target: { value: 'bat123' } });
    expect(onSearchInputChange.calledOnce).to.be.true;
    expect(onSearchInputChange.args[0][0]).to.equal('bat123');
  });

  it('should trigger onSearchFilterChange when container type is changed', () => {
    const onSearchFilterChange = sandbox.spy();
    wrapper = shallow(<CompoundBatchesFilter
      {...props}
      onSearchFilterChange={onSearchFilterChange}
    />);
    const containerTypeMultiSelect = wrapper.find('ContainerTypeSelector');
    containerTypeMultiSelect.prop('onChange')({ target: { value: ['d1-vial', 'a1-vial'] } });
    expect(onSearchFilterChange
      .args[0][0]).to.deep.equal(defaultFilters.set('container_types', ['d1-vial', 'a1-vial']));
  });

});
