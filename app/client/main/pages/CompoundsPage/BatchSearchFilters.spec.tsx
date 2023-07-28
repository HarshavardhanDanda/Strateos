import React from 'react';
import sinon from 'sinon';
import Immutable from 'immutable';
import { mount } from 'enzyme';
import { expect } from 'chai';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
import { MoleculeViewer, SearchField } from '@transcriptic/amino';
import { SinglePaneModal } from 'main/components/Modal';
import BatchSearchFilters from './BatchSearchFilters';
import StructureSearchModal from './StructureSearchModal';

describe('BatchSearchFilters', () => {
  const sandbox = sinon.createSandbox();
  let wrapper, onSearchInputChange, onSearchFilterChange, onSearchFilterReset, onSearchSimilarityChange;

  const searchOptions = Immutable.Map({
    searchInput: '',
    searchSimilarity: 'ClC1CCCCC1',
    searchField: 'all',
    synthesisProgram: { id: 'id123', name: 'name123' },
    synthesisRequest: { id: 'srq129', name: 'synth request' },
    searchPurity: { max: '100:%', min: '20:%', hasError: false },
    searchMassYield: { min: '10:milligram', max: '100:milligram', hasError: false }
  });

  beforeEach(() => {
    onSearchInputChange = sandbox.spy();
    onSearchFilterChange = sandbox.spy();
    onSearchFilterReset = sandbox.spy();
    onSearchSimilarityChange = sandbox.spy();
    wrapper = mount(<BatchSearchFilters
      searchOptions={searchOptions}
      onSearchSimilarityChange={value => onSearchSimilarityChange(value)}
      onSearchInputChange={onSearchInputChange}
      onSearchFilterChange={options => onSearchFilterChange(options)}
      onSearchFilterReset={onSearchFilterReset}
    />);
  });

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should have categories all, id and name', () => {
    const categories = [
      { name: 'All', value: 'all' },
      { name: 'ID', value: 'id' },
      { name: 'Name', value: 'name' }
    ];
    const searchFilterWrapper = wrapper.find('SearchFilterWrapper').at(0);
    expect(searchFilterWrapper.find('SearchField').props().categories.length).to.equal(3);
    expect(searchFilterWrapper.find('SearchField').props().categories[0].name).to.equal(categories[0].name);
    expect(searchFilterWrapper.find('SearchField').props().categories[0].value).to.equal(categories[0].value);
    expect(searchFilterWrapper.find('SearchField').props().categories[1].name).to.equal(categories[1].name);
    expect(searchFilterWrapper.find('SearchField').props().categories[1].value).to.equal(categories[1].value);
    expect(searchFilterWrapper.find('SearchField').props().categories[2].name).to.equal(categories[2].name);
    expect(searchFilterWrapper.find('SearchField').props().categories[2].value).to.equal(categories[2].value);
  });

  it('should have Search Field that searches name, ID', () => {
    const searchField = wrapper.find(SearchField).at(0);
    expect(searchField).to.have.length(1);
    expect(searchField.find('TextInput').find('input').props().placeholder).equals('Search By ID or Name');
    searchField.find('TextInput').simulate('change', { target: { value: 'Batch-test' } });
    expect(onSearchInputChange.calledOnce).to.be.true;
    expect(onSearchInputChange.args[0][0]).to.equal('Batch-test');
  });

  it('should reset input field on container pills reset', () => {
    wrapper.unmount();
    const onSearchInputChange = sandbox.spy();
    const searchOptions = Immutable.Map({
      searchInput: 'Batch1',
      searchField: '',
      synthesisProgram: { id: '', name: '' },
      synthesisRequest: { id: 'srq129', name: 'synth request' },
      searchPurity: { max: '', min: '', hasError: false },
      searchSimilarity: '',
      searchMassYield: { min: '', max: '', hasError: false }
    });
    wrapper = mount(
      <BatchSearchFilters
        searchOptions={searchOptions}
        onSearchInputChange={onSearchInputChange}
      />
    );
    expect(wrapper.find('SearchFilterWrapper').at(0).props().title).to.equal('Search');
    expect(wrapper.find('SearchFilterWrapper').at(0).props().alwaysOpen).to.be.true;
    const controlPills = wrapper.find('SearchFilterWrapper').at(0).props().controlBoxPills;
    expect(controlPills.props.id).to.equal('batch-search');
    expect(controlPills.props.value).to.equal('Batch1');

    controlPills.props.onReset();
    expect(onSearchInputChange.calledOnce).to.be.true;
    expect(onSearchInputChange.args[0][0]).to.equal('');
  });

  it('should have reset in SearchField to clear the search', () => {
    const searchField = wrapper.find(SearchField).at(0);
    searchField.find('TextInput').simulate('change', { target: { value: 'Batch-test' } });
    expect(onSearchInputChange.calledOnce).to.be.true;
    expect(onSearchInputChange.args[0][0]).to.equal('Batch-test');
    searchField.props().reset();
    expect(onSearchInputChange.calledTwice).to.be.true;
    expect(onSearchInputChange.args[1][0]).to.equal('');
  });

  it('should call onSearchFilterChange on category change', () => {
    const searchField = wrapper.find(SearchField).at(0);
    searchField.props().onCategoryChange({}, { value: 'id' });
    expect(onSearchFilterChange.calledOnce).to.be.true;
    expect(onSearchFilterChange.args[0][0]).to.deep.equal(searchOptions.set('searchField', 'id'));
  });

  it('should have search filter by user', () => {
    wrapper.unmount();
    sandbox
      .stub(FeatureStore, 'hasFeature')
      .withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB)
      .returns(true);
    wrapper = mount(
      <BatchSearchFilters
        searchOptions={searchOptions}
      />
    );
    const searchFilter = wrapper.find('SearchFilter').at(0);
    expect(searchFilter.props().title).to.equal('Creator');
    expect(searchFilter.props().options.length).to.equal(2);
    expect(searchFilter.props().options[0].queryTerm).to.equal('all');
    expect(searchFilter.props().options[0].display).to.equal('All');
    expect(searchFilter.props().options[1].queryTerm).to.equal('me');
    expect(searchFilter.props().options[1].display).to.equal('By me');
  });

  it('should call search options filter', () => {
    wrapper.unmount();
    sandbox
      .stub(FeatureStore, 'hasFeature')
      .withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB)
      .returns(true);
    wrapper = mount(
      <BatchSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    wrapper.find('SearchFilter').at(0).props().onSelectOption();
    expect(onSearchFilterChange.calledOnce).to.be.true;
  });
  // Temporarily disable this test until we find and fix the root cause of this failure
  xit('should search structure with valid SMILES string', () => {
    expect(wrapper.find(MoleculeViewer).length);
    expect(wrapper.find(SinglePaneModal).length);
    expect(wrapper.find(StructureSearchModal).find('ConnectedSinglePaneModal')
      .find('SinglePaneModal').prop('modalOpen')).to.be.false;
    wrapper.find(MoleculeViewer).props().onExpand();
    expect(wrapper.find(MoleculeViewer).props().SMILES).to.eq('ClC1CCCCC1');
  });

  it('should search structure with invalid SMILES string', () => {
    wrapper.unmount();
    const opts = Immutable.Map({
      searchSimilarity: 'C%$$s',
      synthesisProgram: { id: '', name: '' },
      synthesisRequest: { id: '', name: '' },
      searchPurity: { max: '', min: '', hasError: false },
      searchMassYield: { min: '', max: '', hasError: false }
    });
    wrapper = mount(
      <BatchSearchFilters
        searchOptions={opts}
        onSearchSimilarityChange={value => onSearchSimilarityChange(value)}
        onSearchFilterChange={options => onSearchFilterChange(options)}
      />
    );
    expect(wrapper.find(MoleculeViewer).props().SMILES).to.eq('C%$$s');
  });

  it('should have SearchFilterWrapper with controlBoxPills for SysthesisProgramTypeAhead', () => {
    expect(wrapper.find('SearchFilterWrapper').at(2).props().title).to.equal('Synthesis Program');
    const controlPills = wrapper.find('SearchFilterWrapper').at(2).props().controlBoxPills;
    expect(controlPills.props.id).to.equal('batch-synthesis-program');
    expect(controlPills.props.value).to.equal('name123');

    controlPills.props.onReset();
    expect(onSearchFilterChange.calledOnce).to.be.true;
    expect(onSearchFilterChange.args[0][0]).to.deep.equal(searchOptions.set('synthesisProgram', { id: '', name: '' }));
  });

  it('should have SearchFilterWrapper with controlBoxPills for SysthesisRequest TypeAhead', () => {
    expect(wrapper.find('SearchFilterWrapper').at(3).props().title).to.equal('Synthesis request');
    const controlPills = wrapper.find('SearchFilterWrapper').at(3).props().controlBoxPills;

    expect(controlPills.props.id).to.equal('batch-synthesis-request');
    expect(controlPills.props.value).to.equal('synth request');

    controlPills.props.onReset();
    expect(onSearchFilterChange.calledOnce).to.be.true;
    expect(onSearchFilterChange.args[0][0]).to.deep.equal(searchOptions.set('synthesisRequest', { id: '', name: '' }));
  });

  it('should show different previewText for different scenarios for synthesis program', () => {
    let previewText = wrapper.find('SearchFilterWrapper').at(2).props().previewText;
    expect(previewText).to.equal('name123');
    sandbox.restore();
    const searchOptions = Immutable.Map({
      synthesisProgram: { id: 'id123', name: '' },
      synthesisRequest: { id: 'srq129', name: 'synth request' },
      searchPurity: { max: '', min: '', hasError: false },
      searchSimilarity: '',
      searchMassYield: { min: '', max: '', hasError: false }
    });
    wrapper = mount(<BatchSearchFilters
      searchOptions={searchOptions}
    />);
    previewText = wrapper.find('SearchFilterWrapper').at(2).props().previewText;
    expect(previewText).to.equal('Any');
  });

  it('should invoke onSelectOption on synthesis program change', () => {
    wrapper.find('SynthesisTypeAhead').at(0).props().onChange({ id: 'abc', name: 'program2' });
    expect(onSearchFilterChange.calledOnce).to.be.true;
    expect(onSearchFilterChange.args[0][0]).to.deep.equal(searchOptions.set('synthesisProgram', { id: 'abc', name: 'program2' }));
  });

  it('should display default value for previewText when searchOptions has empty SynthesisRequest', () => {
    const searchOptions = Immutable.Map({
      searchInput: '',
      searchSimilarity: '',
      searchField: '',
      synthesisRequest: { id: '', name: '' },
      synthesisProgram: { id: '', name: '' },
      searchPurity: { max: '', min: '', hasError: false },
      searchMassYield: { min: '', max: '', hasError: false }
    });
    const batchSearchFilter = mount(
      <BatchSearchFilters
        searchOptions={searchOptions}
      />
    );
    expect(batchSearchFilter.find('#synthesis-request').prop('title')).to.equal('Synthesis request');
    expect(batchSearchFilter.find('#synthesis-request').prop('previewText')).to.equal('Any');
  });

  it('should show previewText when searchOptions has SynthesisRequest', () => {
    expect(wrapper.find('#synthesis-request').prop('title')).to.equal('Synthesis request');
    expect(wrapper.find('#synthesis-request').props().previewText).to.equal('synth request');
  });

  it('should invoke onChange on synthesisRequest change', () => {
    wrapper.find('SynthesisTypeAhead').at(1).props().onChange({ id: 'srq123', name: 'synth request' });
    expect(onSearchFilterChange.calledOnce).to.be.true;
    expect(onSearchFilterChange.args[0][0]).to.deep.equal(searchOptions.set('synthesisRequest', { id: 'srq123', name: 'synth request' }));
  });

  it('should display search range filter for purity', () => {
    expect(wrapper.find('SearchRangeFilter').at(0).props().title).to.eql('Purity');
    expect(wrapper.find('SearchRangeFilter').at(0).props().dimension).to.eql('symbol');
    expect(wrapper.find('SearchRangeFilter').at(0).props().symbol).to.eql('%');
    expect(wrapper.find('SearchRangeFilter').at(0).props().min).to.eql(0);
    expect(wrapper.find('SearchRangeFilter').at(0).props().max).to.eql(100);
    expect(wrapper.find('InputWithUnits').at(0).props().name).to.eql('lower-bound');
    expect(wrapper.find('InputWithUnits').at(1).props().name).to.eql('upper-bound');
  });

  it('should display default value for previewText when searchOptions has empty searchPurity', () => {
    wrapper.unmount();
    const searchOptions = Immutable.Map({
      searchInput: '',
      searchSimilarity: '',
      searchField: '',
      synthesisRequest: { id: '', name: '' },
      synthesisProgram: { id: '', name: '' },
      searchPurity: { max: '', min: '', hasError: false },
      searchMassYield: { min: '', max: '', hasError: false }
    });
    wrapper = mount(
      <BatchSearchFilters
        searchOptions={searchOptions}
      />
    );
    expect(wrapper.find('SearchRangeFilter').at(0).props().title).to.eql('Purity');
    expect(wrapper.find('SearchRangeFilter').at(0).props().previewText).to.eql('Any');
  });

  it('should show different previewText for different scenarios of purity values', () => {
    let previewText = wrapper.find('SearchRangeFilter').at(0).props().previewText;
    expect(previewText).to.equal('20%-100%');
    sandbox.restore();
    wrapper.unmount();
    const searchOptions = Immutable.Map({
      synthesisProgram: { id: '', name: '' },
      synthesisRequest: { id: '', name: '' },
      searchPurity: { max: '', min: '', hasError: false },
      searchSimilarity: '',
      searchMassYield: { min: '', max: '', hasError: false }
    });
    wrapper = mount(<BatchSearchFilters
      searchOptions={searchOptions}
    />);
    previewText = wrapper.find('SearchRangeFilter').at(0).props().previewText;
    expect(previewText).to.equal('Any');
    wrapper.unmount();
    const searchOptionsWithMax = Immutable.Map({
      synthesisProgram: { id: '', name: '' },
      synthesisRequest: { id: '', name: '' },
      searchPurity: { max: '20:%', min: '', hasError: false },
      searchSimilarity: '',
      searchMassYield: { min: '', max: '', hasError: false }
    });
    wrapper = mount(<BatchSearchFilters
      searchOptions={searchOptionsWithMax}
    />);

    previewText = wrapper.find('SearchRangeFilter').at(0).props().previewText;
    expect(previewText).to.equal('<= 20%');
    wrapper.unmount();
    const searchOptionsWithMin = Immutable.Map({
      synthesisProgram: { id: '', name: '' },
      synthesisRequest: { id: '', name: '' },
      searchPurity: { max: '', min: '10:%', hasError: false },
      searchSimilarity: '',
      searchMassYield: { min: '', max: '', hasError: false }
    });
    wrapper = mount(<BatchSearchFilters
      searchOptions={searchOptionsWithMin}
    />);

    previewText = wrapper.find('SearchRangeFilter').at(0).props().previewText;
    expect(previewText).to.equal('>= 10%');
  });

  it('should invoke onSearchFilterChange on purity value change', () => {
    onSearchFilterChange.resetHistory();
    wrapper.find('InputWithUnits').at(0).props().onChange({ target: { value: '20:%' } });
    expect(onSearchFilterChange.calledOnce).to.be.true;
    wrapper.find('InputWithUnits').at(1).props().onChange({ target: { value: '20:%' } });
    expect(onSearchFilterChange.calledTwice).to.be.true;
    expect(onSearchFilterChange.args[0][0]).to.deep.equal(searchOptions.set('searchPurity', { min: '20:%', max: '20:%', hasError: false }));
  });

  it('should display search range filter for Mass Yield', () => {
    expect(wrapper.find('SearchRangeFilter').at(1).props().title).to.eql('mass yield');
    expect(wrapper.find('SearchRangeFilter').at(1).props().dimension).to.eql('mass');
    expect(wrapper.find('SearchRangeFilter').at(1).props().defaultUnit).to.eql('milligram');
    expect(wrapper.find('SearchRangeFilter').at(1).props().min).to.eql('0:milligram');
    expect(wrapper.find('InputWithUnits').at(2).props().name).to.eql('lower-bound');
    expect(wrapper.find('InputWithUnits').at(3).props().name).to.eql('upper-bound');
  });

  it('should display default value for previewText when searchOptions has empty searchMassYield', () => {
    wrapper.unmount();
    const searchOptions = Immutable.Map({
      searchInput: '',
      searchSimilarity: '',
      searchField: '',
      synthesisRequest: { id: '', name: '' },
      synthesisProgram: { id: '', name: '' },
      searchPurity: { max: '', min: '', hasError: false },
      searchMassYield: { min: '', max: '', hasError: false },
    });
    wrapper = mount(
      <BatchSearchFilters
        searchOptions={searchOptions}
      />
    );
    expect(wrapper.find('SearchRangeFilter').at(1).props().title).to.eql('mass yield');
    expect(wrapper.find('SearchRangeFilter').at(1).props().previewText).to.eql('Any');
  });

  it('should show different previewText when lower bound and upper bound is present for mass yield', () => {
    const previewText = wrapper.find('SearchRangeFilter').at(1).props().previewText;
    expect(previewText).to.equal('10mg-100mg');
  });

  it('should show different previewText when upper bound and lower bound is not present for mass yield', () => {
    wrapper.unmount();
    const searchOptionsWithMax = Immutable.Map({
      synthesisProgram: { id: '', name: '' },
      synthesisRequest: { id: '', name: '' },
      searchPurity: { max: '', min: '', hasError: false },
      searchMassYield: { min: '', max: '', hasError: false },
      searchSimilarity: ''
    });
    wrapper = mount(<BatchSearchFilters
      searchOptions={searchOptionsWithMax}
    />);

    const previewText = wrapper.find('SearchRangeFilter').at(1).props().previewText;
    expect(previewText).to.equal('Any');
  });

  it('should show different previewText when only upper bound is present for mass yield', () => {
    wrapper.unmount();
    const searchOptionsWithMax = Immutable.Map({
      synthesisProgram: { id: '', name: '' },
      synthesisRequest: { id: '', name: '' },
      searchPurity: { max: '', min: '', hasError: false },
      searchMassYield: { min: '', max: '20:milligram', hasError: false },
      searchSimilarity: ''
    });
    wrapper = mount(<BatchSearchFilters
      searchOptions={searchOptionsWithMax}
    />);

    const previewText = wrapper.find('SearchRangeFilter').at(1).props().previewText;
    expect(previewText).to.equal('<= 20mg');
  });

  it('should show different previewText when only lower bound is present for mass yield', () => {
    wrapper.unmount();
    const searchOptionsWithMin = Immutable.Map({
      synthesisProgram: { id: '', name: '' },
      synthesisRequest: { id: '', name: '' },
      searchPurity: { max: '', min: '', hasError: false },
      searchMassYield: { min: '10:milligram', max: '', hasError: false },
      searchSimilarity: ''
    });
    wrapper = mount(
      <BatchSearchFilters searchOptions={searchOptionsWithMin} />
    );

    const previewText = wrapper.find('SearchRangeFilter').at(1).props().previewText;
    expect(previewText).to.equal('>= 10mg');
  });

  it('should invoke onSearchFilterChange on mass yield value change', () => {
    onSearchFilterChange.resetHistory();
    wrapper.find('InputWithUnits').at(2).props().onChange({ target: { value: '50:milligram' } });
    expect(onSearchFilterChange.calledOnce).to.be.true;
    wrapper.find('InputWithUnits').at(3).props().onChange({ target: { value: '50:milligram' } });
    expect(onSearchFilterChange.calledTwice).to.be.true;
    expect(onSearchFilterChange.args[0][0]).to.deep.equal(searchOptions.set('searchMassYield', { min: '50:milligram', max: '50:milligram', hasError: false }));
  });

});
