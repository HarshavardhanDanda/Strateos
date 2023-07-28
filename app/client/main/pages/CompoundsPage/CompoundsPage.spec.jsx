import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import AcsControls from 'main/util/AcsControls';
import UserStore from 'main/stores/UserStore';
import FeatureConstants from '@strateos/features';
import { CompoundsPage } from 'main/pages/CompoundsPage';
import ModalActions from 'main/actions/ModalActions';
import { CompoundDownloadModal } from 'main/components/Compounds';
import { simulateAPICallComplete } from 'main/components/PageWithSearchAndList/PageWithSearchAndList.spec';
import { CompoundsPageActions } from './CompoundsActions';

describe('CompoundsPage', () => {
  const sandbox = sinon.createSandbox();
  let compoundsPage;
  const resultUrl = sandbox.stub().returns('/stuff/foobar');
  const searchOptions = Immutable.fromJS({
    searchQuery: 'query',
    searchSimilarity: 'ABC',
  });
  const onSearchInputChange = sandbox.stub();
  const onSearchPageChange = sandbox.stub();
  const onSortChange = sandbox.stub();
  const onViewDetailsClicked = sandbox.stub();
  const onSearchFilterChange = sandbox.stub();
  const actions = {
    updateState: sandbox.stub(),
    initializeStoreState: sandbox.stub(),
    doSearch: sandbox.stub(),
    onSearchFilterChange: sandbox.stub(),
    onSearchPageChange: sandbox.stub(),
    onSortChange: sandbox.stub(),
    onViewDetailsClicked: sandbox.stub(),
    onSearchInputChange: sandbox.stub(),
    onSearchSimilarityChange: sandbox.stub()
  };
  const props = {
    hasResults: true,
    isSearching: false,
    resultUrl,
    history: { push: sandbox.stub() },
    actions,
    searchOptions,
    onSortChange,
    onSearchInputChange,
    onSearchFilterChange,
    onSearchPageChange,
    onViewDetailsClicked,
    page: sandbox.stub().returns(5),
    numPages: sandbox.stub().returns(10),
    pageSize: sandbox.stub().returns(15)
  };

  afterEach(() => {
    sandbox.restore();
    compoundsPage.unmount();
  });

  it('should have search field and filters', () => {
    compoundsPage = mount(
      <CompoundsPage
        {...props}
        searchOptions={Immutable.Map({ searchSimilarity: '' })}
      />);
    simulateAPICallComplete(compoundsPage);

    const filters = compoundsPage.find('CompoundSearchFilters');
    expect(filters.length).to.equal(1);

    const filterTitles = filters.find('.search-filter-wrapper__title');
    expect(filterTitles.length).to.eq(11);
    expect(filterTitles.at(0).text()).to.eq('Search');
    expect(filterTitles.at(1).text()).to.eq('Structure similarity');
    expect(filterTitles.at(2).text()).to.eq('Weight');
    expect(filterTitles.at(3).text()).to.eq('TPSA');
    expect(filterTitles.at(4).text()).to.eq('C LOGP');
    expect(filterTitles.at(5).text()).to.eq('Labels');
    expect(filterTitles.at(6).text()).to.eq('Container status');
    expect(filterTitles.at(7).text()).to.eq('Creator');
    expect(filterTitles.at(8).text()).to.eq('Source');
    expect(filterTitles.at(9).text()).to.eq('Hazard');
    expect(filterTitles.at(10).text()).to.eq('Custom properties');

    const inputFields = filters.find('input');
    expect(inputFields.at(1).props().placeholder).to.eq('Search by Name, Code, ID, or External System ID');
    expect(inputFields.at(2).props().placeholder).to.eq('SMILES String...');
    expect(inputFields.at(3).props().placeholder).to.eq('Lower Bound');
    expect(inputFields.at(4).props().placeholder).to.eq('Upper Bound');
    expect(inputFields.at(5).props().placeholder).to.eq('Lower Bound');
    expect(inputFields.at(6).props().placeholder).to.eq('Upper Bound');
    expect(inputFields.at(7).props().placeholder).to.eq('Lower Bound');
    expect(inputFields.at(8).props().placeholder).to.eq('Upper Bound');
    const radioGroup = filters.find('SearchFilter').at(0).find('RadioGroup');
    expect(radioGroup.prop('value')).to.eq('all');
    expect(radioGroup.find('Radio').findWhere((node) => node.prop('value') === 'all').find('p').text()
      .trim()).to.eq('All');

    const firstOption = radioGroup.find('Radio').at(0);
    expect(actions.onSearchFilterChange.notCalled).to.be.true;
    firstOption.prop('onChange')({ target: { value: 'available' } });
    expect(actions.onSearchFilterChange.called).to.be.true;
  });

  it('should have CompoundSearchResults', () => {
    sandbox.stub(UserStore, 'getById').returns(null);
    actions.onSearchPageChange.resetHistory();
    actions.onSearchFilterChange.resetHistory();
    actions.onViewDetailsClicked.resetHistory();
    const result = Immutable.fromJS({ id: 123 });
    const search = Immutable.fromJS({
      page: 5,
      num_pages: 10,
      per_page: 15,
      results: [{ id: 123 }]
    });

    compoundsPage = mount(<CompoundsPage
      {...props}
      search={search}
    />);
    simulateAPICallComplete(compoundsPage);
    const compoundSearchResults = compoundsPage.find('CompoundSearchResults');
    expect(compoundSearchResults.length).to.equal(1);
    expect(compoundSearchResults.props().page).to.equal(5);
    expect(compoundSearchResults.props().numPages).to.equal(10);
    expect(compoundSearchResults.props().pageSize).to.equal(15);
    compoundSearchResults.props().onSearchPageChange();
    expect(actions.onSearchPageChange.calledOnce).to.be.true;
    compoundSearchResults.props().onSearchFilterChange();
    expect(actions.onSearchFilterChange.calledOnce).to.be.true;
    compoundSearchResults.props().onRowClick(result);
    expect(actions.updateState.calledOnce).to.be.true;
  });

  it('should have CompoundSearchFilters', () => {
    sandbox.stub(UserStore, 'getById').returns(null);
    actions.onSearchFilterChange.resetHistory();
    actions.onSearchInputChange.resetHistory();
    actions.onSearchFilterChange.resetHistory();
    actions.onSearchSimilarityChange.resetHistory();
    const search = Immutable.fromJS({
      page: 5,
      num_pages: 10,
      per_page: 15,
      results: [{ id: 123 }]
    });
    const placeHolderText = 'Search by Name, Code, ID, or External System ID';

    compoundsPage = mount(<CompoundsPage
      {...props}
      search={search}
      zeroStateSearchOptions={{ title: 'test' }}
    />);
    simulateAPICallComplete(compoundsPage);

    const compoundSearchFilters = compoundsPage.find('CompoundSearchFilters');
    expect(compoundSearchFilters.length).to.equal(1);
    expect(compoundSearchFilters.props().searchOptions.toJS()).to.deep.equal({ searchQuery: 'query', searchSimilarity: 'ABC' });
    expect(compoundSearchFilters.props().showSource).to.exist;
    expect(compoundSearchFilters.props().drawStructure).to.exist;
    compoundSearchFilters.props().onSearchSimilarityChange();
    expect(actions.onSearchSimilarityChange.calledOnce).to.be.true;
    expect(compoundSearchFilters.props().placeholder).to.equal(placeHolderText);
    compoundSearchFilters.props().onSearchInputChange();
    expect(actions.onSearchInputChange.calledOnce).to.be.true;
    compoundSearchFilters.props().onSearchFilterChange();
    expect(actions.onSearchFilterChange.calledOnce).to.be.true;
    actions.onSearchFilterChange.resetHistory();
    compoundSearchFilters.props().onSearchFilterReset();
    expect(actions.onSearchFilterChange.calledOnce).to.be.true;
    expect(actions.onSearchFilterChange.args[0][1].toJS()).to.deep.equal({ title: 'test' });
  });

  it('should open Modal to draw Structure', () => {
    const modalOpenStub = sandbox.stub(ModalActions, 'open').returns({});
    compoundsPage = mount(
      <CompoundsPage
        {...props}
        searchOptions={Immutable.Map({ searchSimilarity: '' })}
      />);
    simulateAPICallComplete(compoundsPage);

    const filters = compoundsPage.find('CompoundSearchFilters');
    expect(filters.find('CompoundsSimilaritySearch').length).to.eql(1);

    filters.find('.fa-pencil').simulate('click');
    expect(modalOpenStub.calledOnce).to.be.true;
    expect(modalOpenStub.args[0][0]).to.equal('STRUCTURE SEARCH MODAL');
  });

  it('should reset to zero state', () => {
    const zeroState = { foo: 'baz' };
    actions.onSearchFilterChange.resetHistory();
    compoundsPage = mount(<CompoundsPage {...props} zeroStateSearchOptions={zeroState} />);
    simulateAPICallComplete(compoundsPage);

    const filters = compoundsPage.find('CompoundSearchFilters');
    filters.props().onSearchFilterReset();
    expect(actions.onSearchFilterChange.calledOnce).to.be.true;

    const args = actions.onSearchFilterChange.getCall(0).args[1].toJS();
    expect(args).to.deep.equal(zeroState);
  });

  it('should not have PageLayout if hasPageLayout is undefined', () => {
    compoundsPage = shallow(<CompoundsPage {...props} />);
    expect(compoundsPage.dive().find('PageLayout')).to.have.lengthOf(0);
  });

  it('should have the props set when permission is enabled', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.REGISTER_PUBLIC_COMPOUND).returns(true);
    compoundsPage = mount(<CompoundsPage {...props} />);
    compoundsPage.find('CompoundsPage').setState({ isPublicCompound: true });
    const compoundRegistrationModal = compoundsPage.find('CompoundRegistrationModal');
    const bulkCompoundRegistrationModal = compoundsPage.find('BulkCompoundRegistrationModal');

    expect(compoundRegistrationModal.props().isPublicCompound).to.equal(true);
    expect(compoundRegistrationModal.props().onTogglePublicCompound).to.not.equal(false);
    expect(bulkCompoundRegistrationModal.props().isPublicCompound).to.equal(true);
    expect(compoundRegistrationModal.props().onTogglePublicCompound).to.not.equal(false);
  });

  it('should not have the props set when permission is disabled', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.REGISTER_PUBLIC_COMPOUND).returns(false);
    compoundsPage = mount(<CompoundsPage {...props} />);
    const compoundRegistrationModal = compoundsPage.find('CompoundRegistrationModal');
    const bulkCompoundRegistrationModal = compoundsPage.find('BulkCompoundRegistrationModal');

    expect(compoundRegistrationModal.props().isPublicCompound).to.equal(false);
    expect(compoundRegistrationModal.props().onTogglePublicCompound).to.equal(undefined);
    expect(bulkCompoundRegistrationModal.props().isPublicCompound).to.equal(false);
    expect(compoundRegistrationModal.props().onTogglePublicCompound).to.equal(undefined);
  });

  /**
   * We have register public compound toggle to register public compounds. The value of the toggle is based on isPublicCompound Prop.
   * If user have only REGISTER_PUBLIC_COMPOUND feature, then he can register only public compounds.
   * So, the register public compound toggle value should be 'on' and it depends on isPublicCompound Prop and the toggle should
   * be disabled as he have only REGISTER_PUBLIC_COMPOUND feature and he cannot register private compound.
   */
  it('should set isPublicCompound and disableToggle props to true if user have only register public compound permission', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.REGISTER_PUBLIC_COMPOUND).returns(true);
    getACS.withArgs(FeatureConstants.REGISTER_COMPOUND).returns(false);
    compoundsPage = mount(<CompoundsPage {...props} />);
    const compoundRegistrationModal = compoundsPage.find('CompoundRegistrationModal');
    const bulkCompoundRegistrationModal = compoundsPage.find('BulkCompoundRegistrationModal');

    expect(compoundRegistrationModal.props().isPublicCompound).to.equal(true);
    expect(compoundRegistrationModal.props().disableToggle).to.equal(true);
    expect(bulkCompoundRegistrationModal.props().isPublicCompound).to.equal(true);
    expect(bulkCompoundRegistrationModal.props().disableToggle).to.equal(true);
  });

  it('should have CompoundDownloadModal', () => {
    compoundsPage = mount(<CompoundsPage {...props} />);
    const compoundEditModal = compoundsPage.find(CompoundDownloadModal);
    expect(compoundEditModal.length).to.equal(1);
  });

  it('should call downloadCompounds method in CompoundActions when download option is clicked in modal', () => {
    const downloadCompounds = sandbox.stub(CompoundsPageActions, 'downloadCompounds');
    compoundsPage = mount(<CompoundsPage {...props} selected={['id1', 'id2']} />);
    const instance = compoundsPage.find('CompoundsPage').instance();
    instance.setState({ downloadOption: {
      csv: true,
      sdf: true
    } });
    instance.onModalDownloadClicked();
    expect(downloadCompounds.calledOnce).to.be.true;
    expect(downloadCompounds.calledWithExactly(true, true, ['id1', 'id2'])).to.be.true;
  });

  it('should set props correctly for PageWithSearchAndList', () => {
    compoundsPage = shallow(
      <CompoundsPage
        {...props}
        showOrgFilter
        hasPageLayout
        listUrl={'url'}
        zeroStateProps={{ title: 'zero title' }}
        extendSidebar
      />);

    const pageWithSearchAndList = compoundsPage.dive().dive().find('PageWithSearchAndList');
    expect(pageWithSearchAndList.props().hasResults).to.be.true;
    expect(pageWithSearchAndList.props().isSearching).to.be.false;
    expect(pageWithSearchAndList.props().extendSidebar).to.be.true;
    expect(pageWithSearchAndList.props().hasPageLayout).to.be.true;
    expect(pageWithSearchAndList.props().listUrl).to.equal('url');
    expect(pageWithSearchAndList.props().zeroStateProps).to.deep.equal({ title: 'zero title' });
  });

  it('should render StructureSearchModal', () => {
    actions.onSearchSimilarityChange.resetHistory();
    compoundsPage = mount(
      <CompoundsPage
        {...props}
        selected={['id1', 'id2']}
      />);
    simulateAPICallComplete(compoundsPage);
    const structureSearchModal = compoundsPage.find('StructureSearchModal');

    expect(structureSearchModal.props().SMILES).to.equal('ABC');
    structureSearchModal.props().onSave();
    expect(actions.onSearchSimilarityChange.calledOnce).to.be.true;
  });

  it('should render PageWithSearchAndList as first child to ensure proper page scroll', () => {
    compoundsPage = shallow(<CompoundsPage {...props} />);

    expect(compoundsPage.find('div').length).to.equal(0);
    expect(compoundsPage.find('PageWithSearchAndListHOC').length).to.equal(1);
  });
});
