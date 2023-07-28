import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Moment from 'moment';
import Immutable from 'immutable';
import FeatureConstants from '@strateos/features';
import { RadioGroup } from '@transcriptic/amino';

import ModalActions from 'main/actions/ModalActions';
import FeatureStore from 'main/stores/FeatureStore';
import ContextualCustomPropertiesConfigActions from 'main/actions/ContextualCustomPropertiesConfigActions';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import SessionStore from 'main/stores/SessionStore';
import ContainerSearchFilters from './ContainerSearchFilters';

describe('ContainerSearchFilters', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;
  let getConfig;
  let getOrg;
  const onSearchFilterChange = sandbox.stub();
  const onSearchFilterReset = sandbox.stub();
  const searchOptions = Immutable.fromJS({
    organization_id: 'org13',
    searchSmiles: 'CNCCC',
    searchCustomProperties: Immutable.Map(),
    searchAliquotCustomProperties: Immutable.Map(),
    searchAliquotProperties: Immutable.Map(),
    searchContainerProperties: Immutable.Map(),
    bulkSearch: Immutable.List(),
    createdAfter: null,
    createdBefore: null,
    unusedContainers: [],
    generatedContainers: [],
    searchLocation: []
  });

  function mockLabConsumer(lbcId, orgId) {
    return { id: `${lbcId}`,
      organization: {
        id: `${orgId}` }
    };
  }

  beforeEach(() => {
    getConfig = sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      then: () => {}
    });
    getOrg = sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    sandbox.stub(LabConsumerStore, 'getAll').returns(Immutable.fromJS([mockLabConsumer('lbc1', 'org13'),  mockLabConsumer('lbc2', 'org13')]));
  });

  afterEach(() => {
    if (sandbox) sandbox.restore();
    if (wrapper) wrapper.unmount();
  });

  it('should have status filter if showStatusFilter is true', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const searchFilters = wrapper.find('SearchFilter');
    expect(searchFilters.at(0).dive().find('SearchFilterWrapper').dive()
      .find('span')
      .text()).to.equal('Status');
  });

  it('should have searchFilters', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const searchFilters = wrapper.find('SearchFilter');
    expect(searchFilters.length).to.equal(5);
    expect(searchFilters.at(0).dive().find('SearchFilterWrapper').dive()
      .find('span')
      .text()).to.equal('Status');
    expect(searchFilters.at(1).dive().find('SearchFilterWrapper').dive()
      .find('span')
      .text()).to.equal('Aliquot volume');
    expect(searchFilters.at(2).dive().find('SearchFilterWrapper').dive()
      .find('span')
      .text()).to.equal('Origin');
    expect(searchFilters.at(3).dive().find('SearchFilterWrapper').dive()
      .find('span')
      .text()).to.equal('Storage condition');
    expect(searchFilters.at(4).dive().find('SearchFilterWrapper').dive()
      .find('span')
      .text()).to.equal('Creator');
  });

  it('should have bulk search button', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const searchFilterWrapper = wrapper.find('SearchFilterWrapper');

    expect(searchFilterWrapper.at(2).prop('title')).to.equal('Bulk Search');
    expect(searchFilterWrapper.find('Button').length).to.equal(1);
    expect(searchFilterWrapper.find('Button').props().children).to.equal('Bulk container search');
  });

  it('should have multiselect and isDisplayTypeOptions to select container type', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
        unusedContainers={Immutable.List()}
        generatedContainers={Immutable.List()}
      />
    );
    const searchFilterWrapper = wrapper.find('SearchFilterWrapper');
    expect(searchFilterWrapper.at(3).prop('title')).to.equal('Container type');
    expect(searchFilterWrapper.find('ContainerTypeSelector').length).to.equal(1);
    expect(searchFilterWrapper.find('ContainerTypeSelector').props().isMultiSelect).to.be.true;
    expect(searchFilterWrapper.find('ContainerTypeSelector').props().isDisplayTypeOptions).to.be.true;
    expect(searchFilterWrapper.find('ContainerTypeSelector').props().wellCount).to.be.undefined;
  });

  it('should not display All type options if default container type filter exists', () => {
    const defaultFilters = {
      containerTypeWellCount: 6
    };
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
        unusedContainers={Immutable.List()}
        generatedContainers={Immutable.List()}
        defaultFilters={defaultFilters}
      />
    );
    const searchFilterWrapper = wrapper.find('SearchFilterWrapper');
    expect(searchFilterWrapper.find('ContainerTypeSelector').props().isDisplayTypeOptions).to.be.false;
  });

  it('should send well count to ContainerTypeSelector if default filter for container type exists', () => {
    const defaultFilters = {
      containerTypeWellCount: 6
    };
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
        unusedContainers={Immutable.List()}
        generatedContainers={Immutable.List()}
        defaultFilters={defaultFilters}
      />
    );
    const searchFilterWrapper = wrapper.find('SearchFilterWrapper');
    expect(searchFilterWrapper.find('ContainerTypeSelector').props().wellCount).to.equal(6);
  });

  it('should display pill for All plates', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          searchContainerType: ['plates']
        })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const containerTypeFilterWrapper = wrapper.find('SearchFilterWrapper').at(3);
    expect(containerTypeFilterWrapper.props().controlBoxPills[0]).to.be.null;
    expect(containerTypeFilterWrapper.props().controlBoxPills[1][0].props.value).to.eql('All Plates');
  });

  it('should display pill for All tubes', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          searchContainerType: ['tubes']
        })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const containerTypeFilterWrapper = wrapper.find('SearchFilterWrapper').at(3);
    expect(containerTypeFilterWrapper.props().controlBoxPills[0]).to.be.null;
    expect(containerTypeFilterWrapper.props().controlBoxPills[1][0].props.value).to.eql('All Tubes');
  });

  it('should display pill for well count if default filter for container type exists', () => {
    const defaultFilters = {
      containerTypeWellCount: 6
    };
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          searchContainerType: ['tubes']
        })}
        onSearchFilterChange={onSearchFilterChange}
        defaultFilters={defaultFilters}
      />
    );
    const containerTypeFilterWrapper = wrapper.find('SearchFilterWrapper').at(3);
    expect(containerTypeFilterWrapper.props().controlBoxPills[0].props.value).to.eql('Well count: 6');
  });

  it('should have two searchFilterProperties', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const searchFilterProperties = wrapper.find('SearchFilterProperties');
    expect(searchFilterProperties.length).to.equal(2);
  });

  it('should not have CustomProperties filters when showOrgFilter is true and organization id is not present', () => {
    getOrg.returns(Immutable.Map());
    wrapper = mount(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          searchCustomProperties: Immutable.Map(),
          searchAliquotCustomProperties: Immutable.Map(),
          searchAliquotProperties: Immutable.Map(),
          searchBarcodes: Immutable.List(),
          searchContainerProperties: Immutable.Map(),
          unusedContainers: Immutable.List(),
          generatedContainers: Immutable.List() })}
        showOrgFilter
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const customPropertySet = wrapper.find('CustomPropertySet');
    expect(customPropertySet.length).to.equal(2);
    expect(getConfig.called).to.be.false;
  });

  it('should have CustomProperties filters when showOrgFilter and hasLabPermissions is true and organization id in searchOptions', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    wrapper = mount(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={onSearchFilterChange}
        showOrgFilter
      />
    );
    const customPropertySet = wrapper.find('CustomPropertySet');
    expect(customPropertySet.length).to.equal(4);
    expect(getConfig.called).to.be.true;
  });

  it('should not have CustomProperties filters when showOrgFilter and hasLabPermissions is true and organization id not set in searchOptions', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    wrapper = mount(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          organization_id: undefined,
          searchCustomProperties: Immutable.Map(),
          searchAliquotCustomProperties: Immutable.Map(),
          searchAliquotProperties: Immutable.Map(),
          searchBarcodes: Immutable.List(),
          searchContainerProperties: Immutable.Map(),
          unusedContainers: Immutable.List(),
          generatedContainers: Immutable.List() })}
        onSearchFilterChange={onSearchFilterChange}
        showOrgFilter
      />
    );
    const customPropertySet = wrapper.find('CustomPropertySet');
    expect(customPropertySet.length).to.equal(2);
    expect(getConfig.called).to.be.false;
  });

  it('should have CustomProperties filters when hasLabPermissions is false and organization id is present in store', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(false);
    wrapper = mount(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          searchCustomProperties: Immutable.Map(),
          searchAliquotCustomProperties: Immutable.Map(),
          searchAliquotProperties: Immutable.Map(),
          searchBarcodes: Immutable.List(),
          searchContainerProperties: Immutable.Map(),
          unusedContainers: Immutable.List(),
          generatedContainers: Immutable.List() })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const customPropertySet = wrapper.find('CustomPropertySet');
    expect(customPropertySet.length).to.equal(4);
    expect(getConfig.called).to.be.true;
  });

  it('should have 2 org specific properties and 2 context-wise properties ', () => {
    wrapper = mount(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showOrgFilter
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    expect(getConfig.called).to.be.true;
    const searchFilterProperties = wrapper.find('CustomPropertySet');
    expect(searchFilterProperties.length).to.equal(4);
  });

  it('should trigger onSearchFilterChange when a filter is applied', () => {
    onSearchFilterChange.resetHistory();
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const searchFilters = wrapper.find('SearchFilter');
    searchFilters.at(0).dive().find('SearchFilterOptions').dive()
      .find(RadioGroup)
      .props()
      .onChange({ target: { value: 'available' } });
    expect(onSearchFilterChange.calledOnce).to.be.true;
  });

  it('should disable Organization filter when showOrgFilter is false', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
        showOrgFilter={false}
      />
    );
    const searchFilterBar = wrapper.find('SearchFilterBar');
    expect(searchFilterBar.at(0).dive().find('OrganizationTypeAhead').length).to.equal(0);
  });

  it('Smiles filter should render SearchField for smiles and anchor to open modal for drawing structure', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_COMPOUNDS).returns(true);
    const onSearchSmileChangeSpy = sinon.spy();
    const drawStructureSpy = sinon.spy();
    const options = searchOptions.merge({ searchSmiles: '' });
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={options}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
        showOrgFilter={false}
        onSearchSmileChange={onSearchSmileChangeSpy}
        drawStructure={drawStructureSpy}
      />
    );
    const compoundFilter = wrapper.find('SearchFilterWrapper').findWhere(node => node.prop('title') === 'Structure').childAt(0)
      .dive();

    expect(compoundFilter.find('SearchField').prop('value')).to.equal('');
    compoundFilter.find('Button').at(0).simulate('click');
    expect(drawStructureSpy.calledOnce).to.be.true;
  });

  it('Smiles filter should render MoleculeViewer for a valid input smile ', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_COMPOUNDS).returns(true);
    const onSearchSmileChangeSpy = sinon.spy();
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
        showOrgFilter={false}
        onSearchSmileChange={onSearchSmileChangeSpy}
      />
    );
    expect(wrapper.find('MoleculeViewer').props().SMILES).to.eq(searchOptions.get('searchSmiles'));
  });

  it('Smiles filter should be disabled when user does not have permissions', () => {
    const getACS = sandbox.stub(FeatureStore, 'hasFeature');
    getACS.withArgs(FeatureConstants.VIEW_COMPOUNDS).returns(false);
    getACS.withArgs(FeatureConstants.VIEW_LAB_COMPOUNDS).returns(false);
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
        showOrgFilter={false}
      />
    );
    expect(wrapper.find('MoleculeViewer').length).to.equal(0);
    expect(wrapper.find('.container-filters__structure-search').length).to.equal(0);
  });

  it('should display previews for numeric range filters', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions.set('searchEmptyMass', Immutable.Map({ min: 0, max: 2 }))}
        onSearchFilterChange={() => {}}
      />
    );
    expect(wrapper.find('SearchRangeFilter').props().previewText).to.eql('0-2');
  });

  it('should allow users to select filters', () => {
    const getACS = sandbox.stub(FeatureStore, 'hasFeature');
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    const options = searchOptions.merge({ searchHazard: ['flammable'], searchStatus: 'available' });
    const onSearchFilterChange = sinon.stub();

    wrapper = mount(
      <ContainerSearchFilters
        searchOptions={options}
        onSearchFilterChange={onSearchFilterChange}
        orientation="vertical"
        showStatusFilter
      />
    );

    const hazardFilter = wrapper.find('SearchFilter').filterWhere((searchFilter) => searchFilter.prop('title') === 'Hazard');
    expect(hazardFilter.length).to.equal(1);
    expect(hazardFilter.find('.search-filter-bar-title-wrapper').text()).to.equal('Hazard');
    expect(hazardFilter.find('.search-filter-wrapper__preview').text()).to.equal('1 item selected');
    hazardFilter.find('SearchFilterWrapper').find('li > div > div').at(0).simulate('click');
    hazardFilter.find('Checkbox').find('input').at(3).simulate('change', { detail: { value: true } });
    expect(hazardFilter.find('p.tx-checkbox__label').length).to.equal(9);

    // simulate change in props due to filter selection
    const newSearchOptions = options.merge({ searchHazard: onSearchFilterChange.getCall(-1).args[0].toJS().searchHazard });
    wrapper.setProps({ ...wrapper.props(), ...{ searchOptions: newSearchOptions } });

    const statusFilter = wrapper.find('SearchFilter').filterWhere((searchFilter) => searchFilter.prop('title') === 'Status');
    expect(statusFilter.length).to.equal(1);
    expect(statusFilter.find('.search-filter-bar-title-wrapper').text()).to.equal('Status');
    expect(statusFilter.find('.search-filter-wrapper__preview').text()).to.equal('Available');
    statusFilter.find('SearchFilterWrapper').find('li > div > div').at(0).simulate('click');
    statusFilter.find('Radio').at(1).prop('onChange')({ target: { value: 'all' } });

    const args = onSearchFilterChange.getCall(-1).args[0].toJS();
    expect(args).to.deep.equal({
      bulkSearch: [],
      searchHazard: ['flammable', 'strong_acid'],
      organization_id: 'org13',
      searchAliquotCustomProperties: {},
      searchAliquotProperties: {},
      searchContainerProperties: {},
      searchCustomProperties: {},
      searchSmiles: 'CNCCC',
      searchStatus: 'all',
      createdAfter: null,
      createdBefore: null,
      searchLocation: [],
      generatedContainers: [],
      unusedContainers: []
    });
  });

  it('should render Date Created date filter component', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const searchDateFilter = wrapper.find('SearchDateFilter');
    expect(searchDateFilter.prop('title')).to.equal('Date created');
  });

  it('should set selected dates as dates on date filter', () => {
    const createdAfter = '2022-02-01T18:30:00.000Z';
    const createdBefore = '2022-02-04T18:29:59.999Z';
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={
          searchOptions
            .set('createdAfter', createdAfter)
            .set('createdBefore', createdBefore)
        }
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const searchFilterWrapper = wrapper.find('SearchDateFilter');
    expect(searchFilterWrapper.prop('date')).to.deep.equal(Moment(createdAfter).toDate());
    expect(searchFilterWrapper.prop('endDate')).to.deep.equal(Moment(createdBefore).toDate());
  });

  it('should display preview text for properties empty state', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          searchCustomProperties: Immutable.Map({}),
          searchAliquotCustomProperties: Immutable.Map({}),
          searchAliquotProperties: Immutable.Map({}),
          searchBarcodes: Immutable.List([]),
          searchContainerProperties: Immutable.Map({})
        })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    expect(wrapper.find('SearchFilterWrapper').at(4).props().previewText).to.eql('Any property');
    expect(wrapper.find('SearchFilterWrapper').at(5).props().previewText).to.eql('Any property');
  });

  it('should display title and preview text for container properties', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          searchContainerProperties: Immutable.Map({
            foo: 'bar',
            fizz: 'buzz',
            key: 'value'
          }),
          searchCustomProperties: Immutable.Map({
            foo: 'bar',
            fizz: 'buzz'
          }),
          searchAliquotProperties: Immutable.Map(),
          bulkSearch: [],
          searchAliquotCustomProperties: Immutable.Map(),
          unusedContainers: Immutable.List(),
          generatedContainers: Immutable.List()
        })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );

    expect(wrapper.find('SearchFilterWrapper').at(4).props().title).to.eql('Container properties');
    expect(wrapper.find('SearchFilterWrapper').at(4).props().previewText).to.eql('5 properties selected');
  });

  it('should display title and preview text for aliquot properties', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          searchContainerProperties: Immutable.Map(),
          searchCustomProperties: Immutable.Map(),
          searchAliquotProperties: Immutable.Map({
            foo: 'bar',
            fizz: 'buzz',
            key: 'value'
          }),
          searchBarcodes: Immutable.List(),
          searchAliquotCustomProperties: Immutable.Map({
            foo: 'bar',
            fizz: 'buzz'
          }),
          unusedContainers: Immutable.List(),
          generatedContainers: Immutable.List()
        })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    expect(wrapper.find('SearchFilterWrapper').at(5).props().title).to.eql('Aliquot properties');
    expect(wrapper.find('SearchFilterWrapper').at(5).props().previewText).to.eql('5 properties selected');
  });

  it('should display preview text for single property selected', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          searchContainerProperties: Immutable.Map({ foo: 'bar' }),
          searchCustomProperties: Immutable.Map(),
          searchAliquotProperties: Immutable.Map({ foo: 'bar' }),
          searchBarcodes: Immutable.List(),
          searchAliquotCustomProperties: Immutable.Map(),
          unusedContainers: Immutable.List(),
          generatedContainers: Immutable.List()
        })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    expect(wrapper.find('SearchFilterWrapper').at(4).props().previewText).to.eql('1 property selected');
    expect(wrapper.find('SearchFilterWrapper').at(5).props().previewText).to.eql('1 property selected');
  });

  it('should have SearchField to search the container', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          searchContainerProperties: Immutable.Map({ foo: 'bar' }),
          searchCustomProperties: Immutable.Map(),
          searchAliquotProperties: Immutable.Map({ foo: 'bar' }),
          searchBarcodes: Immutable.List(),
          searchAliquotCustomProperties: Immutable.Map(),
          unusedContainers: Immutable.List(),
          generatedContainers: Immutable.List()
        })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const searchFilterWrapper = wrapper.find('SearchFilterWrapper').at(0);
    expect(searchFilterWrapper.props().title).to.equal('Search');
    expect(searchFilterWrapper.find('SearchField').length).to.be.equal(1);
  });

  it('SearchField to search the container should have options of all, id, name and barcode', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          searchContainerProperties: Immutable.Map({ foo: 'bar' }),
          searchCustomProperties: Immutable.Map(),
          searchAliquotProperties: Immutable.Map({ foo: 'bar' }),
          searchBarcodes: Immutable.List(),
          searchAliquotCustomProperties: Immutable.Map(),
          unusedContainers: Immutable.List(),
          generatedContainers: Immutable.List()
        })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const searchFilterWrapper = wrapper.find('SearchFilterWrapper').at(0);
    expect(searchFilterWrapper.find('SearchField').props().categories.length).to.equal(4);
    expect(searchFilterWrapper.find('SearchField').props().categories[0].name).to.equal('All');
    expect(searchFilterWrapper.find('SearchField').props().categories[1].name).to.equal('ID');
    expect(searchFilterWrapper.find('SearchField').props().categories[2].name).to.equal('Name');
    expect(searchFilterWrapper.find('SearchField').props().categories[3].name).to.equal('Barcode');
  });

  it('should call onSearchFilterChange when change category in search field', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          searchContainerProperties: Immutable.Map({ foo: 'bar' }),
          searchCustomProperties: Immutable.Map(),
          searchAliquotProperties: Immutable.Map({ foo: 'bar' }),
          searchBarcodes: Immutable.List(),
          searchAliquotCustomProperties: Immutable.Map(),
          unusedContainers: Immutable.List(),
          generatedContainers: Immutable.List()
        })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const searchFilterWrapper = wrapper.find('SearchFilterWrapper').at(0);
    searchFilterWrapper.find('SearchField').props().onCategoryChange({ target: { value: 'name' } });
    expect(onSearchFilterChange.called).to.be.true;
    expect(onSearchFilterChange.lastCall.args[0].get('searchField')).to.equal('name');
  });

  it('should display location filter', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          searchLocation: [
            { id: 'loc-1', name: 'Location 1' },
            { id: 'loc-2', name: 'Location 2' }
          ]
        })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const locationFilter = wrapper.find('SearchFilterWrapper').at(6);
    expect(locationFilter.props().title).to.equal('Locations');
    expect(locationFilter.props().controlBoxPills.length).to.equal(2);
    expect(locationFilter.find('Button').props().children).to.equal('Add location');
    expect(locationFilter.dive().find('Radio').at(0).props().label).to.equal('Selected location only');
    expect(locationFilter.dive().find('Radio').at(1).props().label).to.equal('Selected location and all nested locations');
  });

  it('should display location selector modal', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    const modalOpenSpy = sandbox.spy(ModalActions, 'open');
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    wrapper.find('SearchFilterWrapper').at(6).find('Button').simulate('click');
    expect(modalOpenSpy.calledOnce).to.be.true;
    expect(wrapper.find('LocationSelectorModal').length).to.equal(1);
  });

  it('should display location control pills', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          searchLocation: [
            { id: 'loc-1', name: 'Location 1', includeDeep: true },
            { id: 'loc-2', name: 'Location 2' }
          ]
        })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const locationFilter = wrapper.find('SearchFilterWrapper').at(6);
    const controlPills = locationFilter.props().controlBoxPills;
    expect(controlPills[0].props.value).to.equal('Location 1 + All nested');
    expect(controlPills[1].props.value).to.equal('Location 2');
  });

  it('should update searchOptions on container pills reset', () => {
    const onSearchFilterChange = sandbox.spy();
    const bulkSearch = Immutable.fromJS([
      {
        field: 'barcode',
        container_ids: ['ct1']
      },
      {
        field: 'label',
        container_ids: ['ct2', 'ct3']
      }
    ]);
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          bulkSearch: bulkSearch
        })}
        onSearchFilterChange={onSearchFilterChange}
        onSearchFilterReset={onSearchFilterReset}
      />
    );
    const controlPills = wrapper.find('SearchFilterWrapper').at(2).props().controlBoxPills;
    expect(controlPills[0].props.value).to.equal('1 container');
    expect(controlPills[0].props.id).to.equal('bulk-search-0');
    controlPills[0].props.onReset();
    expect(controlPills[1].props.value).to.equal('2 containers');
    expect(controlPills[1].props.id).to.equal('bulk-search-1');
    controlPills[1].props.onReset();
    expect(onSearchFilterChange.calledTwice).to.be.true;
    expect(onSearchFilterChange.args[0][0].get('bulkSearch')).to.deep.equal(bulkSearch.remove(0));
    expect(onSearchFilterChange.args[1][0].get('bulkSearch')).to.deep.equal(bulkSearch.remove(1));
  });

  it('should trigger onSearchFilterChange when bulksearch filter is applied', () => {
    const onSearchFilterChange = sandbox.stub();
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
      />
    );

    wrapper.find('SearchFilterWrapper').at(2).find('ActionMenu').props().options[0].onClick();
    expect(wrapper.find('SearchFilterWrapper').at(2).find('BulkSearchLookupModal').props().searchField.name).to.equal('barcode');

    const searchFilterWrapper = wrapper.find('SearchFilterWrapper');
    searchFilterWrapper.at(2).find('BulkSearchLookupModal').props().onApplyFilter(Immutable.fromJS(['ct1']));
    wrapper.update();

    expect(onSearchFilterChange.calledOnce).to.be.true;
    expect(onSearchFilterChange.args[0][0].getIn(['bulkSearch', 0]).field).to.equal('barcode');
    expect(onSearchFilterChange.args[0][0].getIn(['bulkSearch', 0]).container_ids).to.deep.equal(Immutable.List(['ct1']));
  });

  it('should not trigger onSearchFilterChange when bulksearch filter is applied with no containers', () => {
    const onSearchFilterChange = sandbox.stub();
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
      />
    );

    wrapper.find('SearchFilterWrapper').at(2).find('ActionMenu').props().options[0].onClick();

    const searchFilterWrapper = wrapper.find('SearchFilterWrapper');
    searchFilterWrapper.at(2).find('BulkSearchLookupModal').props().onApplyFilter(Immutable.fromJS([]));
    wrapper.update();

    expect(onSearchFilterChange.calledOnce).to.be.false;
  });

  it('should update container ids in bulkSeach', () => {
    const onSearchFilterChange = sandbox.spy();
    const bulkSearch = Immutable.fromJS([
      {
        field: 'barcode',
        container_ids: ['ct1']
      }
    ]);
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          bulkSearch: bulkSearch
        })}
        onSearchFilterChange={onSearchFilterChange}
        onSearchFilterReset={onSearchFilterReset}
      />
    );
    wrapper.find('SearchFilterWrapper').at(2).find('ActionMenu').props().options[0].onClick();
    expect(wrapper.find('SearchFilterWrapper').at(2).find('BulkSearchLookupModal').props().searchField.name).to.equal('barcode');

    const searchFilterWrapper = wrapper.find('SearchFilterWrapper');
    searchFilterWrapper.at(2).find('BulkSearchLookupModal').props().onApplyFilter(Immutable.fromJS(['ct2']));
    wrapper.update();

    expect(onSearchFilterChange.args[0][0].getIn(['bulkSearch', 0, 'container_ids'])).to.deep.equal(Immutable.List(['ct1']));
    expect(onSearchFilterChange.args[0][0].getIn(['bulkSearch', 1]).container_ids).to.deep.equal(Immutable.List(['ct2']));
  });

  it('should have "Refine search" section with filter toggles', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={Immutable.Map({
          bulkSearch: Immutable.List(),
          searchContainerProperties: Immutable.Map({ foo: 'bar' }),
          searchCustomProperties: Immutable.Map(),
          searchAliquotProperties: Immutable.Map({ foo: 'bar' }),
          searchAliquotCustomProperties: Immutable.Map(),
          unusedContainers: Immutable.List(),
          generatedContainers: Immutable.List()
        })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const searchFilterWrapper = wrapper.find('SearchFilterWrapper')
      .filterWhere(searchFilterWrapper => searchFilterWrapper.prop('title') === 'Refine search');
    expect(searchFilterWrapper.exists()).to.be.true;
    const unusedContainersToggle = searchFilterWrapper.dive().find('Toggle').filterWhere(toggle => toggle.prop('label') === 'Show only unused containers');
    expect(unusedContainersToggle.exists()).to.be.true;
    const generatedContainersToggle = searchFilterWrapper.dive().find('Toggle').filterWhere(toggle => toggle.prop('label') === 'Hide all pending containers');
    expect(generatedContainersToggle.exists()).to.be.true;
  });

  it('should call onSearchFilterChange prop correctly after toggling unused containers and generated containers', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={Immutable.Map({
          searchContainerProperties: Immutable.Map({ foo: 'bar' }),
          searchCustomProperties: Immutable.Map(),
          searchAliquotProperties: Immutable.Map({ foo: 'bar' }),
          searchAliquotCustomProperties: Immutable.Map(),
          bulkSearch: Immutable.List(),
          unusedContainers: Immutable.List(),
          generatedContainers: Immutable.List()
        })}
        onSearchFilterChange={onSearchFilterChange}
        testMode={false}
      />
    );
    const searchFilterWrapper = wrapper.find('SearchFilterWrapper')
      .filterWhere(searchFilterWrapper => searchFilterWrapper.prop('title') === 'Refine search');
    const unusedContainersToggle = searchFilterWrapper.dive().find('Toggle').filterWhere(toggle => toggle.prop('label') === 'Show only unused containers');
    unusedContainersToggle.simulate('change', { target: { value: 'on' } });
    let onSearchFilterChangeFirstArg = onSearchFilterChange.getCall(-1).args[0].toJS();
    expect(onSearchFilterChangeFirstArg).to.deep.equal({
      searchContainerProperties: { foo: 'bar' },
      searchCustomProperties: {},
      searchAliquotProperties: { foo: 'bar' },
      searchAliquotCustomProperties: {},
      bulkSearch: [],
      unusedContainers: ['showUnusedContainers'],
      generatedContainers: []
    });

    const generatedContainersToggle = searchFilterWrapper.dive().find('Toggle').filterWhere(toggle => toggle.prop('label') === 'Hide all pending containers');
    generatedContainersToggle.simulate('change', { target: { value: 'on' } });
    onSearchFilterChangeFirstArg = onSearchFilterChange.getCall(-1).args[0].toJS();
    expect(onSearchFilterChangeFirstArg).to.deep.equal({
      searchContainerProperties: { foo: 'bar' },
      searchCustomProperties: {},
      searchAliquotProperties: { foo: 'bar' },
      searchAliquotCustomProperties: {},
      bulkSearch: [],
      unusedContainers: [],
      generatedContainers: ['hidePendingContainers']
    });
  });

  it('should display number of containers in pills when bulk search filtrer is applied', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={Immutable.Map({
          bulkSearch: Immutable.fromJS([{
            field: 'barcode',
            container_ids: ['c1']
          }]),
          searchContainerProperties: Immutable.Map({ foo: 'bar' }),
          searchCustomProperties: Immutable.Map(),
          searchAliquotProperties: Immutable.Map({ foo: 'bar' }),
          searchAliquotCustomProperties: Immutable.Map(),
          unusedContainers: Immutable.List(),
          generatedContainers: Immutable.List()
        })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );

    const controlPills = wrapper.find('SearchFilterWrapper').at(2).props().controlBoxPills;
    expect(controlPills[0].props.value).to.equal('1 container');
  });

  it('should BulkSearchLookupModal have searchfield as barcode when Barcode is selected', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
      />
    );

    wrapper.find('SearchFilterWrapper').at(2).find('ActionMenu').props().options[0].onClick();
    expect(wrapper.find('SearchFilterWrapper').at(2).find('BulkSearchLookupModal').props().searchField.name).to.equal('barcode');
  });

  it('should BulkSearchLookupModal have searchfield as id when ID is selected', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
      />
    );

    wrapper.find('SearchFilterWrapper').at(2).find('ActionMenu').props().options[1].onClick();
    expect(wrapper.find('SearchFilterWrapper').at(2).find('BulkSearchLookupModal').props().searchField.name).to.equal('id');
  });

  it('should BulkSearchLookupModal have searchfield as name when Name is selected', () => {
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions}
        showStatusFilter
        onSearchFilterChange={onSearchFilterChange}
      />
    );

    wrapper.find('SearchFilterWrapper').at(2).find('ActionMenu').props().options[2].onClick();
    expect(wrapper.find('SearchFilterWrapper').at(2).find('BulkSearchLookupModal').props().searchField.name).to.equal('name');
  });

  it('should call onSelectionAcrossPagesChange on location search change', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    const onSelectionAcrossPagesChangeSpy = sinon.spy();
    wrapper = shallow(
      <ContainerSearchFilters
        searchOptions={searchOptions.merge({
          searchLocation: [
            { id: 'loc-1', name: 'Location 1' },
            { id: 'loc-2', name: 'Location 2' }
          ]
        })}
        onSearchFilterChange={onSearchFilterChange}
        onSelectionAcrossPagesChange={onSelectionAcrossPagesChangeSpy}
      />
    );
    const locationFilter = wrapper.find('SearchFilterWrapper').at(6);
    locationFilter.dive()
      .find(RadioGroup)
      .props()
      .onChange({ target: { value: 'some location' } });
    wrapper.update();
    expect(onSelectionAcrossPagesChangeSpy.calledOnceWith(false)).to.be.true;
  });
});
