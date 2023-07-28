import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import React from 'react';
import sinon from 'sinon';
import { Radio, SearchFilter, TypeAheadInput, RadioGroup } from '@transcriptic/amino';
import Immutable from 'immutable';
import CompoundSourceSearchFilters from './CompoundSourceSearchFilters';

describe('CompoundSourceSearchFilters', () => {
  const searchOptions = Immutable.Map().set('searchInput', 'Text');
  let materialSearchFilters;
  const sandbox = sinon.createSandbox();
  const onSearchFilterChange = sandbox.spy();
  afterEach(() => {
    materialSearchFilters.unmount();
    sandbox.restore();
  });
  const props = {
    onSearchPageChange: sinon.spy(),
    addContainer: sinon.spy(),
    searchOptions: searchOptions,
    placeholder: 'Search container name',
    onSearchInputChange: sinon.spy(),
    onSearchFilterChange: onSearchFilterChange,
    modalSourceSelection: 'user_inventory',
    isLoading: sinon.stub(),
    onSourceChange: sinon.stub()
  };

  it('labels should be present test', () => {
    materialSearchFilters = mount(
      <CompoundSourceSearchFilters {...props} />
    );
    expect(materialSearchFilters.find('.search-filter-wrapper__vertical-options .tx-radio__text').at(0).text().trim()).to.equal('User inventory');
    const inputField = materialSearchFilters.find('.search-field__input');
    expect(inputField.at(0).prop('placeholder')).to.equal('Search container name');
  });

  it('input value test', () => {
    materialSearchFilters = mount(
      <CompoundSourceSearchFilters {...props} />
    );
    const inputField = materialSearchFilters.find('.search-field__input');
    inputField.at(0).simulate('change', { target: { value: 'test1' } });
    inputField.update();
    expect(props.onSearchInputChange.calledOnce).to.equal(true);
  });

  it('should have Source filter ', () => {
    materialSearchFilters = shallow(
      <CompoundSourceSearchFilters {...props} />
    );
    const searchFilters = materialSearchFilters.find('SearchFilter');
    expect(searchFilters.at(0).dive().find('SearchFilterWrapper').dive()
      .find('span')
      .text()).to.equal('Source');
  });

  it('should have typeAhead and supplier filter when source is strateos', () => {
    materialSearchFilters = shallow(
      <CompoundSourceSearchFilters {...props} modalSourceSelection="strateos" />
    );
    expect(materialSearchFilters.find(TypeAheadInput).length).to.equal(1);
    const searchFilters = materialSearchFilters.find(SearchFilter);
    expect(searchFilters.at(1).dive().find('SearchFilterWrapper').dive()
      .find('span')
      .text()).to.equal('Suppliers');
  });

  it('should trigger onSourceChange when source is changed', () => {
    materialSearchFilters = mount(
      <CompoundSourceSearchFilters {...props} />
    );
    const searchFilters = materialSearchFilters.find('SearchFilter');
    searchFilters.at(0).props().onSelectOption('e_molecules');
    expect(props.onSourceChange.calledOnce).to.be.true;
    expect(props.onSourceChange.args[0][0].get('searchSource')).to.deep.equal('e_molecules');
  });

  it('eMolecules search should have two radio buttons , typeAhead and supplier filter', () => {
    materialSearchFilters = mount(
      <CompoundSourceSearchFilters {...{ ...props, modalSourceSelection: 'e_molecules' }} />
    );

    const searchFilter = materialSearchFilters.find(SearchFilter);
    const eMoleculesSearchRadioGroup = searchFilter.at(1).find(RadioGroup);
    const radioButtons = eMoleculesSearchRadioGroup.find(Radio);

    expect(radioButtons.length).to.equal(2);
    expect(radioButtons.at(0).props().label).to.equal('Exact structure');
    expect(radioButtons.at(1).props().label).to.equal('Alternate forms');
    expect(searchFilter.at(2).find('SearchFilterWrapper').props().title).to.equal('Suppliers');
    expect(materialSearchFilters.find(TypeAheadInput).length).to.equal(1);

  });

  it('should trigger onSearchFilterChange when radio button is selected', () => {
    materialSearchFilters = mount(
      <CompoundSourceSearchFilters {...{ ...props, modalSourceSelection: 'e_molecules' }} />
    );
    const event = { stopPropagation: sinon.spy(), target: { value: 'EXACT' } };
    const radioButtons = materialSearchFilters.find(Radio);
    radioButtons.at(0).prop('onChange')(event);
    expect(props.onSearchFilterChange.called).to.be.true;
  });

  it('should add supplier in selected list using typeAhead', () => {
    props.onSearchFilterChange.resetHistory();
    materialSearchFilters = shallow(
      <CompoundSourceSearchFilters {...{ ...props, modalSourceSelection: 'e_molecules' }} />
    );
    materialSearchFilters.setState({ eMoleculeSupplierSelected: ['supplier1'] });
    materialSearchFilters.find(TypeAheadInput).prop('onSuggestedSelect')('supplier2');
    expect(props.onSearchFilterChange.called).to.be.true;
    expect(props.onSearchFilterChange.args[1][0].get('searchEMoleculeSupplier').length).to.equal(2);
    const searchFilter = materialSearchFilters.find(SearchFilter);
    expect(searchFilter.at(2).prop('currentSelection')).to.deep.equal(['supplier2', 'supplier1']);
  });

  it('should give correct eMolecule supplier suggestion', () => {
    materialSearchFilters = shallow(
      <CompoundSourceSearchFilters {...{ ...props, modalSourceSelection: 'e_molecules' }} />
    );
    materialSearchFilters.setState({ eMoleculesAllSuppliers: ['supplier1', 'testSupplier'] });
    const event = { target: { value: 'test' } };
    materialSearchFilters.find(TypeAheadInput).prop('onChange')(event);
    expect(materialSearchFilters.find(TypeAheadInput).prop('suggestions')).to.deep.equal(['testSupplier']);
  });
});
