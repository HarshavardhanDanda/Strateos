import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';
import Imm from 'immutable';
import sinon from 'sinon';
import { List, Table, Column, Tooltip, Checkbox, ActionMenu } from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';

import UserStore from 'main/stores/UserStore';
import FeatureStore from 'main/stores/FeatureStore';
import ContainerStore from 'main/stores/ContainerStore';
import ContainerActions from 'main/actions/ContainerActions';
import ModalActions from 'main/actions/ModalActions';
import AliquotActions from 'main/actions/AliquotActions';
import AcsControls from 'main/util/AcsControls';
import InventoryUtil  from 'main/inventory/inventory/util/InventoryUtil';
import SessionStore from 'main/stores/SessionStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import { LocationAssignmentModal } from 'main/models/LocationSelectorModal/LocationSelectorModal';
import CommonUiUtil from 'main/util/CommonUiUtil';
import BulkActionReportUtil from './BulkActionReportUtil';
import ContainerSearchResults from './ContainerSearchResults';

describe('ContainerSearchResults', () => {
  let wrapper;
  let confirmStub;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(UserStore, 'getById').returns(user);
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
    if (confirmStub) confirmStub.restore();
  });

  const onSelectionAcrossPagesChangeSpy = sandbox.spy();

  const list = Imm.fromJS([
    {
      id: 'aq1et8cdx7t3j52',
      container: 'pcr-0.5',
      container_type_id: 'pcr-0.5',
      storage_condition: 'cold_4',
      organization_id: 'org13',
      organization_name: 'Transcriptic',
      location_id: 'loc1dssgxed8dzgf',
      created_at: '2020-11-08T23:55:05.145-08:00',
      label: 'tube 1',
      public_location_description: 'In transit to Transcriptic.',
      hazards: ['flammable'],
      updated_at: '2020-11-08T23:55:05.218-08:00',
      aliquot_count: 5,
      run_count: 21,
      created_by: 'u16r2fqgpp93m',
      code: 'p603lxgh',
      status: 'inbound',
      barcode: '4s0dwx73jdu',
      shipment_code: 'DRB',
      shipment_id: 'sr1geceprputkrr',
      generated_by_run_id: 'r1gebju4yc53x5',
      lab: {
        name: 'Menlo Park',
        address_id: 'addr188rr9ukd7ry',
        created_at: '2021-02-17T23:07:46.706-08:00',
        id: 'lb1fej8nubcf3k3',
        operated_by_id: 'org13',
        updated_at: '021-02-17T23:07:46.706-08:00',
      },
      empty_mass_mg: '5',
      location: { name: '📋 Test Region' },
    }
  ]);

  const user = Imm.fromJS({
    email: 'ben.miles2@gmail.com',
    id: 'u16r2fqgpp93m',
    name: 'Ben Miles'
  });

  const shipments = Imm.fromJS([
    {
      container_ids: undefined,
      created_at: '2021-09-09T21:05:49.844-07:00',
      data: {},
      editable: true,
      checked_in_at: undefined,
      id: 'sr1geceprputkrr',
      label: 'GBQP',
      organization: { id: 'org13', name: 'Strateos' },
      organization_id: 'org13',
      shipment_type: 'sample',
      status: 'pending',
      user
    }
  ]);

  const visibleColumns = ['type', 'name',  'ID', 'format', 'status', 'contents', 'condition', 'created', 'barcode', 'Last used', 'code', 'Run Count', 'creator'];

  const props = {
    card: true,
    data: list,
    page: 1,
    selected: Imm.List(),
    createdIds: Imm.Map(),
    shipments: Imm.Seq(shipments),
    pageSize: 10,
    numPages: 100,
    showOrgFilter: false,
    shippable: false,
    onSortChange: () => { },
    onSearchFilterChange: () => { },
    visibleColumns: visibleColumns,
    searchOptions: Imm.fromJS({
      searchQuery: '*',
      searchGeneration: '*',
      searchVolume: '*',
      searchInput: '',
      searchPerPage: '10',
      include: ['container_type'],
      searchStorageCondition: 'all',
      searchContainerType: [],
      searchPage: 1,
      aliquot_count: 0,
      descending: true,
      searchEmptyMass: { min: '', max: '' },
      searchStatus: 'available',
      searchHazard: [],
      searchProperties: {},
      searchRegion: 'all',
      searchSortBy: 'updated_at',
      createdBy: 'all'
    }),
    onBulkActionClick: () => { },
    selectedContainers: ['c1'],
    onUnselectAllResults: () => { },
    refetchContainers: sandbox.spy(),
    onSelectionAcrossPagesChange: onSelectionAcrossPagesChangeSpy,
    isSelectionAcrossPagesActive: false,
  };

  const c1 = Imm.Map({
    id: 'c1',
    label: 'Loo',
    status: 'pending',
    container_type_id: 'ct1',
    lab: Imm.Map({
      id: 'lab1'
    })
  });

  const destroyedLab1Container = Imm.Map({
    id: 'c2',
    label: 'Loo',
    status: 'destroyed',
    container_type_id: 'ct1',
    lab: Imm.Map({
      id: 'lab1'
    })
  });

  const returnedLab1Container = Imm.Map({
    id: 'c3',
    label: 'Loo',
    status: 'returned',
    container_type_id: 'ct1',
    lab: Imm.Map({
      id: 'lab1'
    })
  });

  const returnedLab2Container = Imm.Map({
    id: 'c4',
    label: 'Loo',
    status: 'returned',
    container_type_id: 'ct1',
    lab: Imm.Map({
      id: 'lab2'
    })
  });

  it('should have a Card', () => {
    wrapper = shallow(<ContainerSearchResults {...props} />);
    expect(wrapper.find(List).props().disableCard).to.equal(false);
  });

  it('should have a Popover', () => {
    const prop = { onModal: true, ...props };
    wrapper = shallow(<ContainerSearchResults {...prop} />);
    const table = wrapper.find(List).dive().find(Table);
    const userProfile = table.dive().find('UserProfile');
    const profile = userProfile.dive().find('Profile');
    const popover = profile.dive().find('Popover');
    expect(popover).length(1);
  });

  it('should have Table and Pagination', () => {
    wrapper = shallow(<ContainerSearchResults {...props} />);
    expect(wrapper.find(List).length).to.equal(1);
  });

  it('should have 11 columns by default', () => {
    const newProps = { ...props, visibleColumns: InventoryUtil.getVisibleColumns() };
    wrapper = shallow(<ContainerSearchResults {...newProps} />);
    const table = wrapper.find(List).dive().find('Table');

    expect(table.find(Column).length).to.equal(11);
    expect(table.find(Column).at(0).props().header).to.equal('type');
    expect(table.find(Column).at(1).props().header).to.equal('name');
    expect(table.find(Column).at(2).props().header).to.equal('ID');
    expect(table.find(Column).at(3).props().header).to.equal('format');
    expect(table.find(Column).at(4).props().header).to.equal('contents');
    expect(table.find(Column).at(5).props().header).to.equal('condition');
    expect(table.find(Column).at(6).props().header).to.equal('created');
    expect(table.find(Column).at(7).props().header).to.equal('barcode');
    expect(table.find(Column).at(8).props().header).to.equal('Last used');
    expect(table.find(Column).at(9).props().header).to.equal('code');
    expect(table.find(Column).at(10).props().header).to.equal('creator');
  });

  it('should have correct relativeWidths set for specific columns', () => {
    const newProps = { ...props, visibleColumns: InventoryUtil.getVisibleColumns() };
    wrapper = shallow(<ContainerSearchResults {...newProps} />);
    const table = wrapper.find(List).dive().find('Table');
    expect(table.find(Column).at(0).props().relativeWidth).to.equal(0.5);
    expect(table.find(Column).at(1).props().relativeWidth).to.equal(2);
    expect(table.find(Column).at(3).props().relativeWidth).to.equal(1.5);
    expect(table.find(Column).at(10).props().relativeWidth).to.equal(0.5);
  });

  it('should have 11 columns by default for non CCS Org', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(false);
    const prop = {
      card: true,
      data: list,
      page: 1,
      selected: Imm.List(),
      createdIds: Imm.Map(),
      shipments: Imm.Seq(),
      pageSize: 10,
      numPages: 100,
      showOrgFilter: true,
      shippable: false,
      onBulkActionComplete: () => { },
      onUnselectAllResults: () => { },
      onSortChange: () => { },
      onSearchFilterChange: () => { },
      searchOptions: Imm.fromJS({}),
      selectedContainers: [],
    };
    wrapper = shallow(<ContainerSearchResults {...prop} visibleColumns={InventoryUtil.getVisibleColumns()} />);
    const table = wrapper.find(List).dive().find('Table');

    expect(table.find(Column).length).to.equal(11);

    expect(table.find(Column).at(0).props().header).to.equal('type');
    expect(table.find(Column).at(1).props().header).to.equal('name');
    expect(table.find(Column).at(2).props().header).to.equal('ID');
    expect(table.find(Column).at(3).props().header).to.equal('format');
    expect(table.find(Column).at(4).props().header).to.equal('contents');
    expect(table.find(Column).at(5).props().header).to.equal('condition');
    expect(table.find(Column).at(6).props().header).to.equal('created');
    expect(table.find(Column).at(7).props().header).to.equal('barcode');
    expect(table.find(Column).at(8).props().header).to.equal('Last used');
    expect(table.find(Column).at(9).props().header).to.equal('code');
    expect(table.find(Column).at(10).props().header).to.equal('creator');
  });

  it('should have sortable columns', () => {
    const newProps = { ...props, visibleColumns: InventoryUtil.getVisibleColumns() };
    wrapper = shallow(<ContainerSearchResults {...newProps} />);
    const table = wrapper.find(List).dive().find('Table');
    expect(table.find(Column).at(0).props().sortable).to.be.false;
    expect(table.find(Column).at(1).props().sortable).to.be.true;
    expect(table.find(Column).at(2).props().sortable).to.be.false;
    expect(table.find(Column).at(3).props().sortable).to.be.true;
    expect(table.find(Column).at(4).props().sortable).to.be.false;
    expect(table.find(Column).at(5).props().sortable).to.be.true;
    expect(table.find(Column).at(6).props().sortable).to.be.true;
    expect(table.find(Column).at(7).props().sortable).to.be.true;
    expect(table.find(Column).at(8).props().sortable).to.be.true;
    expect(table.find(Column).at(9).props().sortable).to.be.false;
    expect(table.find(Column).at(10).props().sortable).to.be.true;
  });

  it('should have 5 columns by default for operator view', () => {
    const getACS = sandbox.stub(FeatureStore, 'hasFeature');
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    getACS.withArgs(FeatureConstants.EDIT_CONTAINER).returns(false);
    const newProps = { ...props, visibleColumns: InventoryUtil.getVisibleColumns() };
    wrapper = shallow(<ContainerSearchResults {...newProps} />);
    const table = wrapper.find(List).dive().find('Table');
    expect(table.find('Column').length).to.equal(5);

    expect(table.find('Column').at(0).props().header).to.equal('name');
    expect(table.find('Column').at(1).props().header).to.equal('format');
    expect(table.find('Column').at(2).props().header).to.equal('created');
    expect(table.find('Column').at(3).props().header).to.equal('barcode');
    expect(table.find('Column').at(4).props().header).to.equal('location');
  });

  it('should change columns shown', () => {
    const getACS = sandbox.stub(FeatureStore, 'hasFeature');
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    getACS.withArgs(FeatureConstants.EDIT_CONTAINER).returns(false);
    const newProps = { ...props, visibleColumns: InventoryUtil.getVisibleColumns() };
    wrapper = shallow(<ContainerSearchResults {...newProps} />);
    const list = wrapper.find(List).dive();
    expect(list.find('Table').find('Column').length).to.equal(5);
    list.setState({ visibleColumns: ['name', 'format'] });
    expect(list.find('Table').find('Column').length).to.equal(2);
  });

  it('should have corresponding persistence key info to enable user preference', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Imm.Map({ id: 'org13' }));
    sandbox.stub(SessionStore, 'getUser').returns(Imm.Map({ id: 'user3202' }));

    const newProps = { ...props, visibleColumns: InventoryUtil.getVisibleColumns() };
    wrapper = shallow(<ContainerSearchResults {...newProps} />);
    const list = wrapper.find(List);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.CONTAINERS_TABLE
    });
  });

  it('should display container information on clicking container icon ', () => {
    const onRowClick = sinon.spy();
    wrapper = shallow(<ContainerSearchResults {...{ onRowClick, ...props }} />);
    wrapper.find(List).dive().find(Table).dive()
      .find('.baby-icon')
      .simulate('click');
    expect(onRowClick.callCount).to.equal(1);
  });

  it('should have 6 columns by default for operator view', () => {
    const getACS = sandbox.stub(FeatureStore, 'hasFeature');
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    const prop = {
      card: true,
      data: list,
      page: 1,
      selected: Imm.List(),
      createdIds: Imm.Map(),
      shipments: Imm.Seq(),
      pageSize: 10,
      numPages: 100,
      showOrgFilter: true,
      shippable: false,
      onBulkActionComplete: () => { },
      onUnselectAllResults: () => { },
      onSortChange: () => { },
      onSearchFilterChange: () => { },
      searchOptions: Imm.fromJS({}),
      selectedContainers: [],
    };
    wrapper = shallow(<ContainerSearchResults {...prop} visibleColumns={InventoryUtil.getVisibleColumns()} />);
    const table = wrapper.find(List).dive().find(Table);
    expect(table.find(Column).length).to.equal(6);

    expect(table.find(Column).at(0).props().header).to.equal('name');
    expect(table.find(Column).at(1).props().header).to.equal('format');
    expect(table.find(Column).at(2).props().header).to.equal('created');
    expect(table.find(Column).at(3).props().header).to.equal('barcode');
    expect(table.find(Column).at(4).props().header).to.equal('organization');
    expect(table.find(Column).at(5).props().header).to.equal('location');
  });

  it('should display ship action button if REQUEST_SAMPLE_RETURN permissions are given', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.REQUEST_SAMPLE_RETURN).returns(true);
    sandbox.stub(ContainerStore, 'getByIds').returns([c1]);
    wrapper = shallow(<ContainerSearchResults {...{ ...props, shippable: true }} />);
    expect(wrapper.find(List).props().actions[0].title).to.equal('Ship');
  });

  it('should not display Ship action button if REQUEST_SAMPLE_RETURN permissions are not given', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.REQUEST_SAMPLE_RETURN).returns(false);
    sandbox.stub(ContainerStore, 'getByIds').returns([c1]);
    const hasFeatureInLabStub = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    hasFeatureInLabStub.withArgs(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS, c1.getIn(['lab', 'id'])).returns(0);
    hasFeatureInLabStub.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, c1.getIn(['lab', 'id'])).returns(0);
    wrapper = shallow(<ContainerSearchResults {...{ ...props, shippable: true }} />);
    expect(wrapper.find(List).props().actions.length).to.equal(2);
    expect(wrapper.find(List).props().actions[0].title).to.equal('Download');
    expect(wrapper.find(List).props().actions[1].title).to.equal('Relocate');
  });

  it('should have skip notification to be false when destroying container', () => {
    const callBack = sandbox.stub(ContainerActions, 'destroyMany');
    callBack.withArgs(props.selectedContainers).returns({ done: (cb) => cb() });
    wrapper = shallow(<ContainerSearchResults {...props} />);
    confirmStub = sinon.stub(global, 'confirm');
    confirmStub.returns(true);
    const destroyButton = wrapper.find(List).dive().find('Button').at(2);
    destroyButton.simulate('click');
    expect(confirmStub.calledOnce).to.equal(true);
    expect(callBack.withArgs(props.selectedContainers).calledOnce).to.equal(true);
  });

  it('should display Destroy action button if DESTROY_CONTAINER permission is given', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.DESTROY_CONTAINER).returns(true);
    wrapper = shallow(<ContainerSearchResults {...props} />);
    expect(wrapper.find(List).props().actions.length).to.equal(4);
    expect(wrapper.find(List).props().actions[2].title).to.equal('Destroy');
  });

  it('should not display Destroy action button if DESTROY_CONTAINER permission are not given', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns([c1]);
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.DESTROY_CONTAINER).returns(false);
    getACS.withArgs(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS, c1.getIn(['lab', 'id'])).returns(0);
    wrapper = shallow(<ContainerSearchResults {...props} />);
    expect(wrapper.find(List).props().actions.length).to.equal(3);
    expect(wrapper.find(List).props().actions[0].title).to.equal('Download');
    expect(wrapper.find(List).props().actions[1].title).to.equal('Relocate');
    expect(wrapper.find(List).props().actions[2].title).to.equal('Delete');
  });

  it('should display Delete action button if DESTROY_CONTAINER_RESET_ALL_ALIQUOTS permission is given', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns([c1]);
    const getACS = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    getACS.withArgs(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS, c1.getIn(['lab', 'id'])).returns(1);
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, c1.getIn(['lab', 'id'])).returns(0);
    wrapper = shallow(<ContainerSearchResults {...props} />);
    expect(wrapper.find(List).props().actions.length).to.equal(3);
    expect(wrapper.find(List).props().actions[0].title).to.equal('Download');
    expect(wrapper.find(List).props().actions[1].title).to.equal('Relocate');
    expect(wrapper.find(List).props().actions[2].title).to.equal('Delete');
  });

  it('should not display Delete action button if permissions are not given', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns([c1]);
    const getACS = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    getACS.withArgs(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS, c1.getIn(['lab', 'id'])).returns(0);
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, c1.getIn(['lab', 'id'])).returns(0);
    wrapper = shallow(<ContainerSearchResults {...props} />);
    expect(wrapper.find(List).props().actions.length).to.equal(2);
    expect(wrapper.find(List).props().actions[0].title).to.equal('Download');
    expect(wrapper.find(List).props().actions[1].title).to.equal('Relocate');
  });

  it('should display Relocate action button', () => {
    wrapper = shallow(<ContainerSearchResults {...props} />);
    expect(wrapper.find(List).props().actions.length).to.equal(4);
    expect(wrapper.find(List).props().actions[1].title).to.equal('Relocate');
  });

  it('should trigger delete action callback and should call refetch containers call back', () => {
    const callBack = sandbox.stub(ContainerActions, 'destroyManyContainer');
    const clock = sinon.useFakeTimers();
    const debounceFetch = sandbox.stub(debounceFetch);
    callBack.withArgs(props.selectedContainers).returns({ done: (cb) => cb() });
    confirmStub = sinon.stub(global, 'confirm');
    confirmStub.returns(true);
    sandbox.stub(ContainerStore, 'getByIds').returns([c1]);
    const getACS = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    getACS.withArgs(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS, c1.getIn(['lab', 'id'])).returns(1);
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, c1.getIn(['lab', 'id'])).returns(0);
    wrapper = shallow(<ContainerSearchResults {...props} />);
    const deleteAction = wrapper.find(List).dive().find('Button').at(2);
    expect(deleteAction.dive().text()).to.equal('Delete');
    deleteAction.simulate('click');
    expect(confirmStub.calledOnce).to.equal(true);
    expect(callBack.calledOnce).to.equal(true);
    clock.tick(500);
    expect(props.refetchContainers.called).to.equal(true);
    clock.restore();
  });

  it('should display Relocate action button in enabled mode if pending container is selected', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns([c1]);
    const getACS = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    wrapper = shallow(<ContainerSearchResults {...props} />);
    expect(wrapper.find(List).props().actions.length).to.equal(3);
    expect(wrapper.find(List).props().actions[1].title).to.equal('Relocate');
    expect(wrapper.find(List).props().actions[1].disabled).to.equal(false);
  });

  it('should display Relocate action button in disabled mode if MANAGE_CONTAINERS_IN_LAB feature is not present ', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns([c1]);
    const getACS = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(false);
    wrapper = shallow(<ContainerSearchResults {...{ ...props, selectedContainers: ['c1'] }}  />);
    expect(wrapper.find(List).props().actions.length).to.equal(3);
    expect(wrapper.find(List).props().actions[1].title).to.equal('Relocate');
    expect(wrapper.find(List).props().actions[1].disabled).to.equal(true);
    const tooltip = wrapper.find(List).dive().find('Button').at(1)
      .props().label;
    expect(tooltip).to.equal('You do not have permission to relocate containers from the selected lab');
  });

  it('should display Relocate action button in disabled mode with highest priority tooltip', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns([c1, returnedLab2Container]);
    const getACS = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, 'lab1').returns(true);
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, 'lab2').returns(false);
    wrapper = shallow(<ContainerSearchResults {...{ ...props, selectedContainers: ['c1', 'returnedLab2Container'] }} />);
    expect(wrapper.find(List).props().actions.length).to.equal(3);
    expect(wrapper.find(List).props().actions[1].title).to.equal('Relocate');
    expect(wrapper.find(List).props().actions[1].disabled).to.equal(true);
    const tooltip = wrapper.find(List).dive().find('Button').at(1)
      .props().label;
    expect(tooltip).to.equal('Only containers from a single lab can be relocated');
  });

  it('should display Relocate action button in disabled mode when destroyed container is selected ', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns([destroyedLab1Container]);
    const getACS = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    wrapper = shallow(<ContainerSearchResults {...{ ...props, selectedContainers: ['destroyedLab1Container'] }}  />);
    expect(wrapper.find(List).props().actions.length).to.equal(3);
    expect(wrapper.find(List).props().actions[1].title).to.equal('Relocate');
    expect(wrapper.find(List).props().actions[1].disabled).to.equal(true);
  });

  it('should display Relocate action button in disabled mode when returned container is selected ', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns([returnedLab2Container]);
    const getACS = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    wrapper = shallow(<ContainerSearchResults {...{ ...props, selectedContainers: ['returnedLab2Container'] }}  />);
    expect(wrapper.find(List).props().actions.length).to.equal(3);
    expect(wrapper.find(List).props().actions[1].title).to.equal('Relocate');
    expect(wrapper.find(List).props().actions[1].disabled).to.equal(true);
  });

  it('should display tooltip text on Relocate action if any destroyed container is selected', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns([destroyedLab1Container, returnedLab1Container]);
    const getACS = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    wrapper = shallow(<ContainerSearchResults {...{ ...props, selectedContainers: ['destroyedLab1Container', 'returnedLab1Container'] }} />);
    expect(wrapper.find(List).props().actions.length).to.equal(3);
    expect(wrapper.find(List).props().actions[1].title).to.equal('Relocate');
    expect(wrapper.find(List).props().actions[1].disabled).to.equal(true);
    const tooltip = wrapper.find(List).dive().find('Button').at(1)
      .props().label;
    expect(tooltip).to.equal('Destroyed and Returned containers cannot be relocated');
  });

  it('should display tooltip text on Relocate action if containers from different labs are selected', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns([returnedLab1Container, returnedLab2Container]);
    const getACS = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    wrapper = shallow(<ContainerSearchResults {...{ ...props, selectedContainers: ['returnedLab1Container', 'returnedLab2Container'] }} />);
    expect(wrapper.find(List).props().actions.length).to.equal(3);
    expect(wrapper.find(List).props().actions[1].title).to.equal('Relocate');
    expect(wrapper.find(List).props().actions[1].disabled).to.equal(true);
    const tooltip = wrapper.find(List).dive().find('Button').at(1)
      .props().label;
    expect(tooltip).to.equal('Only containers from a single lab can be relocated');
  });

  it('should display Relocate button in enabled mode if select all across pages is active, irrespective of labs or contaner status', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns([returnedLab1Container, returnedLab2Container]);
    const getACS = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    wrapper = shallow(<ContainerSearchResults {...{ ...props, isSelectionAcrossPagesActive: true }} />);
    expect(wrapper.find(List).props().actions.length).to.equal(3);
    expect(wrapper.find(List).props().actions[1].title).to.equal('Relocate');
    expect(wrapper.find(List).props().actions[1].disabled).to.equal(false);
  });

  it('should trigger download action callback', () => {
    const callBack = sandbox.stub(AliquotActions, 'downloadCSV');
    callBack.withArgs(props.selectedContainers).returns({ done: (cb) => cb() });
    wrapper = shallow(<ContainerSearchResults {...props} />);
    const downloadAction = wrapper.find(List).dive().find('Button').at(0);
    expect(downloadAction.dive().text()).to.equal('Download');
    downloadAction.simulate('click');
    expect(callBack.withArgs(props.selectedContainers).calledOnce).to.equal(true);
  });

  it('should display Transfer action button if canTransferContainers is true', () => {
    wrapper = shallow(<ContainerSearchResults {...{ ...props, canTransferContainers: true }}  />);
    expect(wrapper.find(List).props().actions.length).to.equal(5);
    expect(wrapper.find(List).props().actions[2].title).to.equal('Transfer');
  });

  it('should not display Transfer action button if canTransferContainers is false', () => {
    wrapper = shallow(<ContainerSearchResults {...props}  />);
    expect(wrapper.find(List).props().actions.length).to.equal(4);
  });

  it('should call props.onTransferClick function when transfer button is clicked', () => {
    const onTransferClickStub = sandbox.stub();
    wrapper = shallow(<ContainerSearchResults {...{ ...props, canTransferContainers: true }} onTransferClick={onTransferClickStub}  />);
    expect(wrapper.find(List).props().actions.length).to.equal(5);
    expect(wrapper.find(List).props().actions[2].title).to.equal('Transfer');
    const transferButton = wrapper.find(List).dive().find('Button').at(2);
    transferButton.simulate('click');
    expect(onTransferClickStub.calledOnce).to.be.true;
  });

  it('should open LocationSelectorModal when clicked on Relocate button', () => {
    const modalOpenSpy = sandbox.spy(ModalActions, 'open');
    wrapper = shallow(<ContainerSearchResults {...props} />);
    expect(wrapper.find(List).props().actions.length).to.equal(4);
    expect(wrapper.find(List).props().actions[1].title).to.equal('Relocate');
    const relocateButton = wrapper.find(List).dive().find('Button').at(1);
    relocateButton.simulate('click');
    expect(modalOpenSpy.calledOnce).to.be.true;
    expect(modalOpenSpy.args[0][0]).to.equal(LocationAssignmentModal.MODAL_ID);
  });

  it('should display column name on hover', () => {
    wrapper = mount(<ContainerSearchResults {...props} />);
    const table = wrapper.find(List);
    const tooltips = table.find(Table).find('thead').find('tr').find('th')
      .find(Tooltip);
    expect(tooltips).to.have.length(13);
    expect(tooltips.at(1).text()).to.equal('name');
  });

  it('should display column run count', () => {
    wrapper = mount(<ContainerSearchResults {...props} />);
    const table = wrapper.find(List);
    const tooltips = table.find(Table).find('thead').find('tr').find('th')
      .find(Tooltip);
    expect(tooltips).to.have.length(13);
    expect(tooltips.at(11).text()).to.equal('Run Count');
  });

  it('should display value name on hover over cell', () => {
    wrapper = mount(<ContainerSearchResults {...props} />);
    const table = wrapper.find(List);
    const cellTooltips = table.find(Table).find('tbody').find('tr').find('td');
    expect(cellTooltips.at(1).find(Tooltip)).to.have.length(0);
    expect(cellTooltips.at(2).find(Tooltip)).to.have.length(1);
    expect(cellTooltips.at(3).find(Tooltip)).to.have.length(1);
    expect(cellTooltips.at(4).find(Tooltip)).to.have.length(1);
    expect(cellTooltips.at(5).find(Tooltip)).to.have.length(1);
    expect(cellTooltips.at(6).find(Tooltip)).to.have.length(1);
    expect(cellTooltips.at(7).find(Tooltip)).to.have.length(1);
    expect(cellTooltips.at(8).find(Tooltip)).to.have.length(1);
    expect(cellTooltips.at(9).find(Tooltip)).to.have.length(1);
    expect(cellTooltips.at(10).find(Tooltip)).to.have.length(1);
    expect(cellTooltips.at(2).find(Tooltip).text()).to.equal('tube 1');
    expect(cellTooltips.at(3).find(Tooltip).text()).to.equal('aq1et8cdx7t3j52');
    expect(cellTooltips.at(4).find(Tooltip).text()).to.equal('pcr-0.5');
    expect(cellTooltips.at(5).find(Tooltip).text()).to.equal('Inbound');
    expect(cellTooltips.at(6).find(Tooltip).text()).to.equal('5 aliquots');
    expect(cellTooltips.at(7).find(Tooltip).text()).to.equal('cold_4');
    expect(cellTooltips.at(8).find(Tooltip).text()).to.equal('Nov 9, 2020');
    expect(cellTooltips.at(9).find(Tooltip).text()).to.equal('4s0dwx73jdu');
    expect(cellTooltips.at(10).find(Tooltip).text()).to.equal('Please ship GBQP');
    expect(cellTooltips.at(11).find(Tooltip).text()).to.equal('DRB');
    expect(cellTooltips.at(12).find(Tooltip).text()).to.equal('21');
  });

  it('should sort names in ascending and descending order', () => {
    const container = list.get(0).toJS();
    const updatedList = Imm.fromJS([
      { ...container, label: 'tube 1' },
      { ...container, label: 'd2-vial_sabtest18' },
      { ...container, label: 'Test_Tube' },
      { ...container, label: 'eric_test_tube' },
    ]);
    const updatedProps = { ...props, data: updatedList };
    wrapper = mount(<ContainerSearchResults {...updatedProps} />);
    wrapper.find(List).find(Table).find('thead').find('tr')
      .find('th')
      .find('.sortable-header')
      .at(0)
      .simulate('click');
    wrapper.update();
    let table = wrapper.find(List);
    let cellTooltips = table.find(Table).find('tbody').find('tr').find('td');
    expect(cellTooltips.at(2).find(Tooltip).text()).to.equal('d2-vial_sabtest18');
    expect(cellTooltips.at(5).find(Tooltip).text()).to.equal('Inbound');
    expect(cellTooltips.at(16).find(Tooltip).text()).to.equal('eric_test_tube');
    expect(cellTooltips.at(30).find(Tooltip).text()).to.equal('Test_Tube');
    expect(cellTooltips.at(44).find(Tooltip).text()).to.equal('tube 1');
    wrapper.find(List).find(Table).find('thead').find('tr')
      .find('th')
      .find('.sortable-header')
      .at(0)
      .simulate('click');
    wrapper.update();
    table = wrapper.find(List);
    cellTooltips = table.find(Table).find('tbody').find('tr').find('td');
    expect(cellTooltips.at(2).find(Tooltip).text()).to.equal('tube 1');
    expect(cellTooltips.at(16).find(Tooltip).text()).to.equal('Test_Tube');
    expect(cellTooltips.at(30).find(Tooltip).text()).to.equal('eric_test_tube');
    expect(cellTooltips.at(44).find(Tooltip).text()).to.equal('d2-vial_sabtest18');
  });

  it('should sort names without breaking when label is null', () => {
    const container = list.get(0).toJS();
    const updatedList = Imm.fromJS([
      { ...container, label: 'tube 1' },
      { ...container, label: 'd2-vial_sabtest18' },
      { ...container, label: null },
      { ...container, label: 'eric_test_tube' },
    ]);
    const updatedProps = { ...props, data: updatedList };
    wrapper = mount(<ContainerSearchResults {...updatedProps} />);
    wrapper.find(List).find(Table).find('thead').find('tr')
      .find('th')
      .find('.sortable-header')
      .at(0)
      .simulate('click');
    wrapper.update();
    const table = wrapper.find(List);
    const cellTooltips = table.find(Table).find('tbody').find('tr').find('td');
    expect(cellTooltips.at(2).find('p').text()).to.equal('d2-vial_sabtest18');
    expect(cellTooltips.at(16).find('p').text()).to.equal('eric_test_tube');
    expect(cellTooltips.at(30).find('p').text()).to.equal('tube 1');
    expect(cellTooltips.at(44).find('p').text()).to.equal('');
  });

  it('should render expected status labels', () => {
    const container = {
      id: 'aq1et8cdx7t3j52',
      container: 'pcr-0.5',
      organization_id: 'org13',
      organization_name: 'Transcriptic',
      location_id: 'loc1dssgxed8dzgf',
      aliquot_count: 5,
      created_by: 'u16r2fqgpp93m',
      status: 'inbound',
    };
    const updatedList = Imm.fromJS([
      { ...container },
      { ...container, id: 'ctet8cdx7t1000', status: 'available' },
      { ...container, id: 'ctet8cdx7t2000', status: 'will_be_destroyed' },
      { ...container, id: 'ctet8cdx7t3000', status: 'destroyed' },
      { ...container, id: 'ctet8cdx7t4000', status: 'pending_return' },
      { ...container, id: 'ctet8cdx7t4000', status: 'returned' },
    ]);
    const updatedProps = { ...props, data: updatedList };
    wrapper = mount(<ContainerSearchResults {...updatedProps} visibleColumns={['status']} />);
    const table = wrapper.find(List);
    const cells = table.find(Table).find('tbody').find('tr').find('td');

    expect(cells.at(1).text()).to.equal('Inbound');
    expect(cells.at(3).text()).to.equal('Available');
    expect(cells.at(5).text()).to.equal('Pending Destruction');
    expect(cells.at(7).text()).to.equal('Destroyed');
    expect(cells.at(9).text()).to.equal('Pending Return');
    expect(cells.at(11).text()).to.equal('Returned');
  });

  it('should display the correct row count options in the Container List', () => {
    const newProps = { ...props, visibleColumns: ['status'] };
    wrapper = mount(<ContainerSearchResults {...newProps} />);
    expect(wrapper.find(List).prop('pageSizeOptions')).deep.equals([10, 25, 50, 100]);
    expect(wrapper.find(List).prop('pageSize')).equals(10);
  });

  describe('container title text color', () => {
    const getTitleElement = (data) => {
      wrapper = mount(<ContainerSearchResults {...{ ...props, data }}  />);
      const table = wrapper.find(List).find(Table);
      const titleCell = table.find('tbody').find('tr').find('td').at(2);
      return titleCell.find('p');
    };

    it('should display warning text color for test containers', () => {
      const dataWithTestContainer = list.setIn([0, 'test_mode'], true);
      const title = getTitleElement(dataWithTestContainer);
      expect(title.hasClass('tx-type--warning'));
    });

    it('should display success text color for stock containers', () => {
      const dataWithOrglessContainer = list.setIn([0, 'organization_id'], undefined);
      const title = getTitleElement(dataWithOrglessContainer);
      expect(title.hasClass('tx-type--success'));
    });

    it('should prioritize test style when both test and stock container', () => {
      let dataWithOrglessTestContainer = list.setIn([0, 'organization_id'], undefined);
      dataWithOrglessTestContainer = dataWithOrglessTestContainer.setIn([0, 'test_mode'], true);
      const title = getTitleElement(dataWithOrglessTestContainer);
      expect(title.hasClass('tx-type--warning'));
      expect(title.hasClass('tx-type--success')).to.be.false;
    });

    it('should show Spinner (determined by loaded prop) in List component when API call is in flight', () => {
      wrapper = shallow(<ContainerSearchResults {...props} isSearching />);
      expect(wrapper.find(List).props().loaded).to.equal(false);
    });

    it('should not show Spinner (determined by loaded prop) in List component when API call is complete', () => {
      wrapper = shallow(<ContainerSearchResults {...props} isSearching={false} />);
      expect(wrapper.find(List).props().loaded).to.equal(true);
    });
  });

  describe('bulk actions', () => {
    let confirmWithUserStub;
    let acsStub;

    beforeEach(() => {
      sandbox.stub(SessionStore, 'getOrg').returns(Imm.fromJS({ id: 'org13', feature_groups: ['bulk_action_experiment'] }));
      acsStub = sandbox.stub(AcsControls, 'isFeatureEnabled');
      acsStub.withArgs(FeatureConstants.REQUEST_SAMPLE_RETURN).returns(true);
    });

    afterEach(() => {
      if (sandbox) sandbox.restore();
      if (confirmWithUserStub) confirmWithUserStub.restore();
    });

    const renderWithSelectionAcrossPages = (extraProps = {}) => {
      const newProps = { ...props, visibleColumns: InventoryUtil.getVisibleColumns() };
      return mount(<ContainerSearchResults
        {...newProps}
        enableSelectionAcrossPages
        canTransferContainers
        {...extraProps}
      />);
    };

    const clickSelectAll = (selectionCount = 2) => {
      wrapper.setProps({ isSelectionAcrossPagesActive: true, bulkSelectionCount: selectionCount });
      wrapper.find(List).prop('onSelectionAcrossPagesClick')(true, selectionCount);
      wrapper.setProps({ isSelectionAcrossPagesActive: true, bulkSelectionCount: selectionCount });
      wrapper.update();
    };

    const clickDeselectAll = () => {
      wrapper.setProps({ isSelectionAcrossPagesActive: false });
      wrapper.find(List).prop('onSelectionAcrossPagesClick')(false);
      wrapper.update();
    };

    const clickAllActions = () => {
      wrapper.find(List).prop('actions')[1].action();
      wrapper.find(List).prop('actions')[2].action();
      wrapper.find(List).prop('actions')[3].action();
      wrapper.find(List).prop('actions')[4].action();
      wrapper.find(List).prop('actions')[5].action();
    };

    it('should enable selection across pages if user has access', () => {
      wrapper = renderWithSelectionAcrossPages();
      expect(wrapper.find(List).prop('enableSelectionAcrossPages')).equals(true);
    });

    it('should set list props to enable selection across pages', () => {
      wrapper = renderWithSelectionAcrossPages({ totalRecordCount: 3000 });
      expect(wrapper.find(List).props()).to.deep.include({
        totalRecordCount: 3000,
        enableSelectionAcrossPages: true,
        isSelectionAcrossPagesActive: false,
        maxSelectionAcrossPages: 1000
      });
      expect(wrapper.find(List).prop('onSelectionAcrossPagesClick')).to.not.be.undefined;
    });

    it('should call onSelectionAcrossPagesChange when select all is active', () => {
      onSelectionAcrossPagesChangeSpy.resetHistory();
      wrapper = renderWithSelectionAcrossPages();
      clickSelectAll();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
    });

    it('should enable all bulk actions except "Ship" when selection across pages is active', () => {
      wrapper = renderWithSelectionAcrossPages();
      clickSelectAll();
      expect(wrapper.find(List).prop('actions')[0].disabled).to.be.true;
      expect(wrapper.find(List).prop('actions')[1].disabled).to.be.false;
      expect(wrapper.find(List).prop('actions')[2].disabled).to.be.false;
      expect(wrapper.find(List).prop('actions')[3].disabled).to.be.false;
      expect(wrapper.find(List).prop('actions')[4].disabled).to.be.false;
    });

    it('should display confirm message before calling download, destroy and delete bulk actions', () => {
      confirmWithUserStub = sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(false);
      wrapper = renderWithSelectionAcrossPages();
      clickSelectAll();
      clickAllActions();
      expect(confirmWithUserStub.callCount).to.equal(3);
      expect(confirmWithUserStub.args[0][0]).to.equal('Are you sure you want to download 2 containers?');
      expect(confirmWithUserStub.args[1][0]).to.equal('Are you sure you want to destroy 2 containers?');
      expect(confirmWithUserStub.args[2][0]).to.equal('Are you sure you want to delete 2 containers?');
    });

    it('should not call download, destroy and delete bulk actions if user has not confirmed', () => {
      const downloadSpy = sandbox.spy(AliquotActions, 'downloadCSV');
      const transferSpy = sandbox.spy();
      const destroySpy = sandbox.spy(ContainerActions, 'destroyMany');
      const deleteSpy = sandbox.spy(ContainerActions, 'destroyManyContainer');
      sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(false);
      wrapper = renderWithSelectionAcrossPages({ onTransferClick: transferSpy });
      clickSelectAll();
      clickAllActions();
      expect(downloadSpy.notCalled).to.be.true;
      expect(transferSpy.called).to.be.true;
      expect(destroySpy.notCalled).to.be.true;
      expect(deleteSpy.notCalled).to.be.true;
    });

    it('should clear selections on Deselect all button click', () => {
      wrapper = renderWithSelectionAcrossPages();
      clickSelectAll();
      clickDeselectAll();
      const checkboxes = wrapper.find(Checkbox).filterWhere(checkbox => checkbox.prop('checked') === 'checked');
      checkboxes.update();
      expect(checkboxes.length).to.equal(0);
    });

    it('should clear selection on sort change', () => {
      wrapper = renderWithSelectionAcrossPages();
      clickSelectAll();
      wrapper.find(List).find(Table).find('thead').find('tr')
        .find('th')
        .find('.sortable-header')
        .at(0)
        .simulate('click');
      wrapper.update();
      const checkboxes = wrapper.find(Checkbox).filterWhere(checkbox => checkbox.prop('checked') === 'checked');
      checkboxes.update();
      expect(checkboxes.length).to.equal(0);
    });

    it('should trigger bulk delete action callback', () => {
      confirmWithUserStub = sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(true);
      sandbox.stub(ContainerStore, 'getByIds').returns([c1]);
      const getACS = sandbox.stub(FeatureStore, 'hasFeatureInLab');
      getACS.withArgs(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS, c1.getIn(['lab', 'id'])).returns(1);
      const onBulkActionClickSpy = sandbox.spy();

      wrapper = renderWithSelectionAcrossPages({
        onBulkActionClick: onBulkActionClickSpy
      });
      clickSelectAll();

      wrapper.find(ActionMenu).find('button').at(0).simulate('click');
      const actionMenuButtons = wrapper.find(ActionMenu).find('.input-suggestions__suggestion');
      expect(actionMenuButtons.at(2).text()).to.equal('Delete');
      actionMenuButtons.at(2).simulate('click');

      expect(confirmWithUserStub.calledOnce).to.be.true;
      expect(onBulkActionClickSpy.calledWith(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DELETE)).to.be.true;
    });

    it('should trigger bulk destroy action callback', () => {
      confirmWithUserStub = sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(true);
      acsStub.withArgs(FeatureConstants.DESTROY_CONTAINER).returns(true);
      sandbox.stub(ContainerStore, 'getByIds').returns([c1]);
      const getACS = sandbox.stub(FeatureStore, 'hasFeatureInLab');
      getACS.withArgs(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS, c1.getIn(['lab', 'id'])).returns(1);
      const onBulkActionClickSpy = sandbox.spy();

      wrapper = renderWithSelectionAcrossPages({
        onBulkActionClick: onBulkActionClickSpy
      });
      clickSelectAll();

      wrapper.find(ActionMenu).find('button').at(0).simulate('click');
      const actionMenuButtons = wrapper.find(ActionMenu).find('.input-suggestions__suggestion');
      expect(actionMenuButtons.at(2).text()).to.equal('Destroy');
      actionMenuButtons.at(2).simulate('click');

      expect(confirmWithUserStub.calledOnce).to.be.true;
      expect(onBulkActionClickSpy.calledWith(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DESTROY)).to.be.true;
    });

    it('should trigger bulk download action callback', () => {
      confirmWithUserStub = sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(true);
      sandbox.stub(ContainerStore, 'getByIds').returns([c1]);
      const onBulkActionClickSpy = sandbox.spy();

      wrapper = renderWithSelectionAcrossPages({
        onBulkActionClick: onBulkActionClickSpy
      });
      clickSelectAll();

      const downloadAction = wrapper.find(List).find('Button').at(2);
      expect(downloadAction.text()).to.equal('Download');
      downloadAction.simulate('click');

      expect(confirmWithUserStub.calledOnce).to.be.true;
      expect(onBulkActionClickSpy.calledWith(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DOWNLOAD, { visible_columns: InventoryUtil.getVisibleColumns() })).to.be.true;
    });
  });
});
