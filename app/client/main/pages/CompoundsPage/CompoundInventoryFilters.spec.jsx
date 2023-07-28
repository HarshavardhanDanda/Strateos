import React from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Button, SearchField } from '@transcriptic/amino';
import CompoundInventoryFilters from './CompoundInventoryFilters';

describe('CompoundInventoryFilters', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const onInventorySearchFilterChangeSpy = sandbox.spy();

  const defaultInventoryFilters = {
    searchFields: ['batch_ids', 'label', 'barcode'],
    query: '',
    searchContainerType: []
  };

  const props = {
    inventoryFilters: defaultInventoryFilters,
    onInventorySearchFilterChange: onInventorySearchFilterChangeSpy
  };

  afterEach(() => {
    sandbox.restore();
    onInventorySearchFilterChangeSpy.resetHistory();
  });

  it('should render search field', () => {
    wrapper = shallow(<CompoundInventoryFilters {...props} />);
    const searchField = wrapper.find(SearchField);
    expect(searchField.length).to.equal(1);
  });

  it('should have MultiSelect to select container type', () => {
    wrapper = shallow(<CompoundInventoryFilters {...props} />);
    expect(wrapper.find('ContainerTypeSelector').length).to.equal(1);
    expect(wrapper.find('ContainerTypeSelector').props().isMultiSelect).to.be.true;
  });

  it('should trigger onInventorySearchFilterChange when search field value is changed', () => {
    wrapper = shallow(<CompoundInventoryFilters {...props} />);
    const searchField = wrapper.find(SearchField);
    searchField.prop('onChange')({ target: { value: 'batch123' } });
    expect(onInventorySearchFilterChangeSpy
      .calledOnceWithExactly({ ...defaultInventoryFilters, query: 'batch123' })).to.be.true;
  });

  it('should not trigger onInventorySearchFilterChange when search field category is changed and query is empty', () => {
    wrapper = shallow(<CompoundInventoryFilters {...props} />);
    const searchField = wrapper.find(SearchField);
    searchField.prop('onCategoryChange')({ target: { value: 'barcode' } });
    expect(onInventorySearchFilterChangeSpy.called).to.be.false;
  });

  it('should trigger onInventorySearchFilterChange when search field category is changed and query is not empty', () => {
    wrapper = shallow(<CompoundInventoryFilters
      {...props}
      inventoryFilters={{ ...defaultInventoryFilters,  query: 'batch123' }}
    />);
    const searchField = wrapper.find(SearchField);
    searchField.prop('onCategoryChange')({ target: { value: 'batch_ids' } });
    expect(onInventorySearchFilterChangeSpy
      .calledWith({ ...defaultInventoryFilters, searchFields: ['batch_ids'], query: 'batch123' })).to.be.true;
  });

  it('should trigger onInventorySearchFilterChange when container type is changed', () => {
    wrapper = shallow(<CompoundInventoryFilters {...props} />);
    const containerTypeMultiSelect = wrapper.find('ContainerTypeSelector');
    containerTypeMultiSelect.prop('onChange')({ target: { value: ['d1-vial', 'a1-vial'] } });
    expect(onInventorySearchFilterChangeSpy
      .calledOnceWithExactly({ ...defaultInventoryFilters, searchContainerType: ['d1-vial', 'a1-vial'] })).to.be.true;
  });

  it('should reset filters on reset button click', () => {
    wrapper = shallow(<CompoundInventoryFilters {...props} />);
    wrapper.setProps({ inventoryFilters: { searchFields: ['barcode'] } });
    const resetButton = wrapper.find(Button);
    resetButton.simulate('click');
    expect(onInventorySearchFilterChangeSpy
      .calledOnceWithExactly(defaultInventoryFilters)).to.be.true;
  });

});
