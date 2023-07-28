import React from 'react';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import { DataTable, Table, Column, Button } from '@transcriptic/amino';
import Immutable from 'immutable';

import ContainerActions from 'main/actions/ContainerActions';
import NotificationActions from 'main/actions/NotificationActions';
import ModalActions from 'main/actions/ModalActions';
import { InventoryActions } from 'main/inventory/inventory/InventoryActions';
import { getDefaultSearchPerPage } from 'main/util/List';
import ManageContainerModal from './ManageContainerModal';

const searchOptions = Immutable.fromJS({
  searchInput: '',
  searchQuery: '*',
  searchField: 'all',
  searchSmiles: '',
  searchPage: 1,
  aliquot_count: 0,
  searchSortBy: 'updated_at',
  descending: true,
  searchContainerType: [],
  searchStorageCondition: 'all',
  searchLocation: [],
  searchPerPage: getDefaultSearchPerPage(),
  searchVolume: '*',
  searchStatus: 'available',
  searchProperties: {},
  searchContainerProperties: {},
  searchAliquotProperties: {},
  searchCustomProperties: {},
  searchAliquotCustomProperties: {},
  searchGeneration: '*',
  unusedContainers: [],
  generatedContainers: [],
  searchEmptyMass: { min: '', max: '' },
  include: ['container_type'],
  searchHazard: [],
  createdBy: 'all',
  organization_id: undefined,
  runsLabId: undefined,
  createdAfter: null,
  createdBefore: null,
  searchBarcodes: []
});

const data = Immutable.fromJS([
  {
    id: 'ct1g67hxv8j8qcn',
    container: 'pcr-0.5',
    status: 'available',
    container_type_id: 'pcr-0.5',
    storage_condition: 'cold_4',
    shipment_id: 'sr1f3d9kms9nccm',
    organization_id: 'org13',
    organization_name: 'Transcriptic',
    location_id: 'loc1dssgxed8dzgf',
    shipment_code: 'BVD',
    created_at: '2020-11-08T23:55:05.145-08:00',
    label: 'tube 1',
    public_location_description: 'In transit to Transcriptic.',
    hazards: ['flammable'],
    updated_at: '2020-11-08T23:55:05.218-08:00',
    aliquot_count: 5,
    available: '1 ml',
    reserved: '0 ml',
    created_by: 'u16r2fqgpp93m',
    barcode: '12345'
  },
  {
    id: 'ct1g67hxvbdt5h6',
    container: 'pcr-0.5',
    status: 'available',
    container_type_id: 'pcr-0.5',
    storage_condition: 'cold_4',
    shipment_id: 'sr1f3d9kms9nccm',
    organization_id: 'org13',
    organization_name: 'Transcriptic',
    location_id: 'loc1dssgxed8dzgf',
    shipment_code: 'BVD',
    created_at: '2020-11-08T23:55:05.145-08:00',
    label: 'tube 1',
    public_location_description: 'In transit to Transcriptic.',
    hazards: ['flammable'],
    updated_at: '2020-11-08T23:55:05.218-08:00',
    aliquot_count: 5,
    available: '1 ml',
    reserved: '0 ml',
    created_by: 'u16r2fqgpp93m',
    barcode: '12567'
  }
]);

const barcodeField = { name: 'barcode', value: 'barcode' };
const labelField = { name: 'name', value: 'label' };

describe('ManageContainerModal', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;
  let buildSearchPayload;
  const props = {
    onManageSubmit: () => {},
    onManageCancel: () => {},
    searchTextArray: [],
    searchField: barcodeField
  };

  beforeEach(() => {
    buildSearchPayload = sandbox.stub(InventoryActions, 'buildSearchPayload');
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    if (sandbox) {
      sandbox.restore();
    }
  });

  it('should render a XLG size modal', () => {
    wrapper = shallow(<ManageContainerModal {...props} />);
    expect(wrapper.find('ConnectedSinglePaneModal').props().modalSize).to.equal('xlg');
  });

  it('should have table with correct columns', () => {
    wrapper = shallow(<ManageContainerModal {...props} />);
    wrapper.setState({ containers: data });
    const table = wrapper.find(DataTable);
    expect(table).to.have.length(1);
    expect(table.props().headers.length).to.equal(11);
    const firstRowColumns = table.props().data[0];

    expect(firstRowColumns.ID).to.eql('ct1g67hxv8j8qcn');
    expect(firstRowColumns.Barcode).to.eql('12345');
    expect(firstRowColumns.Organization).to.eql('Transcriptic');
  });

  it('should have search field', () => {
    wrapper = shallow(<ManageContainerModal {...props} />);
    wrapper.find('SearchField').simulate('change', { target: { value: 'RS333' } });

    expect(wrapper.find('SearchField')).to.have.length(1);
    expect(wrapper.state().searchBarText).to.equal('RS333');
  });

  it('should validate container search result', async () => {
    wrapper = shallow(<ManageContainerModal {...props} />);
    const container = Immutable.fromJS({ barcode: 'RS333' });

    expect(await wrapper.instance().validateContainer(container)).to.equal('Container barcode not found. Please scan or type in a valid barcode or update applied filters.');
    wrapper.setState({ searchBarText: 'RS333' });
    expect(await wrapper.instance().validateContainer()).to.equal('Container barcode not found. Please scan or type in a valid barcode or update applied filters.');
    expect(await wrapper.instance().validateContainer(container)).to.equal('');
  });

  it('should have render Look Up Container drawer on search', () => {
    wrapper = shallow(<ManageContainerModal {...props} />);
    wrapper.setState({ showEmptyState: true, isConflictDrawerOpen: true });
    expect(wrapper.find('ConnectedSinglePaneModal').props().drawerTitle).to.be.eq('Look Up Container');
    const drawerContent = wrapper.find('ConnectedSinglePaneModal').prop('drawerChildren').props.children;
    expect(drawerContent).to.have.length(3);
  });

  it('should have render Look Up Container drawer with a table', () => {
    wrapper = shallow(<ManageContainerModal {...props} />);
    wrapper.setState({ toBeSelectedContainers: data, isConflictDrawerOpen: true });
    const drawer = shallow(wrapper.instance().renderConflictDrawerContent());

    const table = drawer.find(Table);
    expect(table).to.have.length(1);
    expect(table.find(Column).length).to.equal(9);
    const firstRowColumns = drawer.find(Table).dive();

    expect(firstRowColumns.find('BodyCell').at(1).dive().text()).to.eql('ct1g67hxv8j8qcn');
    expect(firstRowColumns.find('BodyCell').at(2).dive().text()).to.eql('12345');
    expect(firstRowColumns.find('BodyCell').at(4).dive().text()).to.eql('Transcriptic');
  });

  it('should have render Look Up Container drawer with correct number of matches', () => {
    wrapper = shallow(<ManageContainerModal {...props} />);
    wrapper.setState({ toBeSelectedContainers: data, isConflictDrawerOpen: true });
    const drawer = shallow(wrapper.instance().renderConflictDrawerContent());
    const textMsg = drawer.find('TextBody').at(0).dive().find('Text')
      .dive()
      .find('p');
    const matches = drawer.find('TextBody').at(1).dive().find('Text')
      .dive()
      .find('p');

    expect(textMsg.text()).to.equal('The container barcode(s) specified below match multiple containers.');
    expect(matches.text()).to.equal('2 matches found.');
  });

  it('should add containers to table button within Look Up Container drawer should be disabled if no container is selected', () => {
    wrapper = shallow(<ManageContainerModal {...props} />);
    wrapper.setState({ toBeSelectedContainers: data, selectedContainers: {}, isConflictDrawerOpen: true });
    const button = wrapper.find('ConnectedSinglePaneModal').props().drawerFooterChildren;
    const buttonWrapper = shallow(button);
    const addContainer = buttonWrapper.find(Button).at(1);

    expect(addContainer.props().disabled).to.be.true;
    buttonWrapper.unmount();
  });

  it('should add containers to table button within Look Up Container drawer should be enabled if some container is selected', () => {
    wrapper = shallow(<ManageContainerModal {...props} />);
    wrapper.setState({ toBeSelectedContainers: data, selectedContainers: { 1: 'ct1g67hxv8j8qcn' }, isConflictDrawerOpen: true });
    const button = wrapper.find('ConnectedSinglePaneModal').props().drawerFooterChildren;
    const buttonWrapper = shallow(button);
    const addContainer = buttonWrapper.find(Button).at(1);

    expect(addContainer.props().disabled).to.be.false;
    buttonWrapper.unmount();
  });

  it('should trigger search if searchTextArray prop changes and is not empty', () => {
    const searchByBarcodesSpy = sandbox.stub(ContainerActions, 'searchWithoutPagination')
      .returns({ done: () => ({ fail: () => {} }) });
    wrapper = shallow(<ManageContainerModal {...props} searchOptions={searchOptions} />);
    wrapper.setProps({ searchTextArray: ['12345'] });

    expect(searchByBarcodesSpy.calledOnce).to.be.true;
    expect(searchByBarcodesSpy.args[0][0].barcode).to.deep.equal(['12345']);
  });

  it('should not trigger search if searchTextArray prop changes and is empty', () => {
    const searchByBarcodesSpy = sandbox.stub(ContainerActions, 'searchWithoutPagination')
      .returns({ done: () => ({ fail: () => {} }) });
    const newProps = { ...props, searchTextArray: ['12345'] };
    wrapper = shallow(<ManageContainerModal {...newProps} />);
    wrapper.setProps({ searchTextArray: [] });

    expect(searchByBarcodesSpy.called).to.be.false;
  });

  it('should call api with searchBarText barcode', () => {
    const searchByBarcodesSpy = sandbox.stub(ContainerActions, 'searchWithoutPagination')
      .returns({ done: () => ({ fail: () => {} }) });
    wrapper = shallow(<ManageContainerModal {...props} searchOptions={searchOptions} />);
    wrapper.find('SearchField').dive().find('TextInput').props()
      .onKeyDown({ key: 'Enter', target: { value: 'BAR01' } });

    expect(searchByBarcodesSpy.calledOnce).to.be.true;
    expect(searchByBarcodesSpy.args[0][0].barcode).to.deep.equal(['BAR01']);
  });

  it('should display error toast message when api call fails', () => {
    const notificationStub = sandbox.spy(NotificationActions, 'handleError');
    const searchByBarcodesStub = sandbox.stub(ContainerActions, 'searchWithoutPagination')
      .returns({
        done: () => ({ fail: (cb) => cb({}) })
      });
    wrapper = shallow(<ManageContainerModal {...props} searchOptions={searchOptions} />);
    wrapper.find('SearchField').dive().find('TextInput').props()
      .onKeyDown({ key: 'Enter', target: { value: 'BAR01' } });

    expect(searchByBarcodesStub.calledOnce).to.be.true;
    expect(searchByBarcodesStub.args[0][0].barcode).to.deep.equal(['BAR01']);
    expect(notificationStub.calledOnce).to.be.true;
  });

  it('should call onManageSubmit with valid containers ids', async () => {
    const onManageSubmit = sandbox.stub();
    const newProps = { ...props, onManageSubmit: onManageSubmit };

    wrapper = shallow(<ManageContainerModal {...newProps} />);
    wrapper.setState({
      validBulkSearchValues: Immutable.fromJS(['12345', '12567']),
      containers: Immutable.fromJS([
        { id: 'ct1', barcode: '12345' },
        { id: 'ct2', barcode: '12567' }
      ])
    });
    const footerComponent = shallow(wrapper.find('ConnectedSinglePaneModal').prop('footerRenderer')());
    footerComponent.find('Button').at(1).simulate('click');
    expect(onManageSubmit.calledOnce).to.be.true;
    expect(onManageSubmit.args[0][0].toJS()).to.deep.equal(['ct1', 'ct2']);
  });

  it('should call onManageCancel on clicking cancel', () => {
    const onManageCancel = sandbox.stub();
    const newProps = { ...props, onManageCancel: onManageCancel };
    wrapper = shallow(<ManageContainerModal {...newProps} />);
    const footerComponent = shallow(wrapper.find('ConnectedSinglePaneModal').prop('footerRenderer')());
    footerComponent.find('Button').at(0).simulate('click');
    expect(onManageCancel.calledOnce).to.be.true;
  });

  it('should enable Look Up Container drawer when a barcode has multiple containers and textAreaSearch is false', () => {
    const containers = data.setIn([1, 'barcode'], '12345');
    wrapper = mount(<ManageContainerModal {...props} />);
    wrapper.instance().onSearchSuccess(['12345'], containers, false);
    wrapper.update();
    const state = wrapper.instance().state;
    expect(state.isConflictDrawerOpen).to.be.true;
    expect(state.toBeSelectedContainers.toJS()).to.deep.equal(containers.toJS());
    const modalProps = wrapper.find('ConnectedSinglePaneModal').props();
    expect(modalProps.drawerState).to.be.true;
    expect(modalProps.drawerTitle).to.be.eq('Look Up Container');
  });

  it('should enable Look Up Container drawer when a barcode has multiple containers and textAreaSearch is true', async () => {
    const containers = data.setIn([1, 'barcode'], '12345');
    wrapper = shallow(<ManageContainerModal {...props} />);
    wrapper.setState({ searchBarText: '12345' });
    await wrapper.instance().onSearchSuccess(['12345'], containers, true);
    wrapper.update();
    const state = wrapper.instance().state;
    const searchFieldProps = wrapper.find('SearchField').props();
    expect(searchFieldProps.value).to.be.eq('');
    expect(state.isConflictDrawerOpen).to.be.true;
    expect(state.toBeSelectedContainers.toJS()).to.deep.equal(containers.toJS());
    const modalProps = wrapper.find('ConnectedSinglePaneModal').props();
    expect(modalProps.drawerState).to.be.true;
    expect(modalProps.drawerTitle).to.be.eq('Look Up Container');
  });

  it('should call onManageSubmit with containers visible in the table', () => {
    const onManageSubmit = sandbox.stub();
    const newProps = { ...props, onManageSubmit: onManageSubmit };
    wrapper = shallow(<ManageContainerModal {...newProps} />);
    wrapper.setState({ validBulkSearchValues: Immutable.fromJS(['12345', '12567']), containers: data });
    const deleteIcon = wrapper.find(DataTable).props().data[0][''];

    // deleting a container
    deleteIcon.props.onClick();
    const footer = shallow(wrapper.instance().renderFooter());
    const submitButton = footer.find('Button').at(1);
    submitButton.props().onClick();

    expect(onManageSubmit.calledWith(Immutable.List(['ct1g67hxvbdt5h6']))).to.be.true;
  });

  it('should display number of container at bottom', () => {
    wrapper = shallow(<ManageContainerModal {...props} />);
    wrapper.setState({ containers: data });
    const footer = shallow(wrapper.instance().renderFooter());
    const footerText = footer.find('TextBody').dive().find('Text').dive()
      .find('p');

    expect(footerText.text()).to.equal('2 containers');
  });

  it('should close modal clicking on cancel and submit', () => {
    const modalCloseStub = sandbox.stub(ModalActions, 'close').returns({});
    wrapper = shallow(<ManageContainerModal {...props} />);
    wrapper.setState({ containers: data });
    const footer = shallow(wrapper.instance().renderFooter());
    footer.find('Button').at(0).props().onClick();
    footer.find('Button').at(1).props().onClick();

    expect(modalCloseStub.calledTwice).to.be.true;
    expect(modalCloseStub.args[0][0]).equals(ManageContainerModal.MODAL_ID);
    expect(modalCloseStub.args[1][0]).equals(ManageContainerModal.MODAL_ID);
  });

  it('should enable barcode error drawer when a barcode does not have any container', () => {
    wrapper = mount(<ManageContainerModal {...props} />);
    wrapper.instance().onSearchSuccess(['12345', '12567', 'invalid_barcode1'], data, false);
    wrapper.update();
    const state = wrapper.instance().state;
    expect(state.isRetryDrawerOpen).to.be.true;
    expect(state.bulkSearchValuesWithNoContainers).to.deep.equal(['invalid_barcode1']);
    const modalProps = wrapper.find('ConnectedSinglePaneModal').props();
    expect(modalProps.drawerState).to.be.true;
    expect(modalProps.drawerTitle).to.be.eq('Containers not found');
  });

  it('should have render barcode error drawer with content', () => {
    wrapper = shallow(<ManageContainerModal {...props} />);
    wrapper.setState({ isRetryDrawerOpen: true, bulkSearchValuesWithNoContainers: ['Barcode1', 'Barcode2'] });
    wrapper.update();
    const drawerContent = shallow(wrapper.find('ConnectedSinglePaneModal').prop('drawerChildren'));
    const modalProps = wrapper.find('ConnectedSinglePaneModal').props();
    expect(modalProps.drawerState).to.be.true;
    expect(modalProps.drawerTitle).to.be.eq('Containers not found');
    const textBody = drawerContent.find('TextBody');
    expect(textBody.at(0).props().children.join(''))
      .to
      .be
      .equal('The container barcodes specified below could not be found. Try searching again or updating the barcodes or applied filters to resolve the error.');
    expect(textBody.at(1).props().children).to.be.equal('Barcodes');
    expect(textBody.at(2).props().children).to.be.equal('Barcode1');
    expect(textBody.at(3).props().children).to.be.equal('Barcode2');
  });

  it('should have render barcode error drawer with retry and cancel action button', () => {
    wrapper = shallow(<ManageContainerModal {...props} />);
    wrapper.setState({ isRetryDrawerOpen: true, bulkSearchValuesWithNoContainers: ['Barcode1', 'Barcode2'] });
    wrapper.update();
    const drawerFooter = shallow(wrapper.find('ConnectedSinglePaneModal').prop('drawerFooterChildren'));
    const modalProps = wrapper.find('ConnectedSinglePaneModal').props();
    expect(modalProps.drawerState).to.be.true;
    expect(modalProps.drawerTitle).to.be.eq('Containers not found');
    const buttons = drawerFooter.find('Button');
    expect(buttons.at(0).props().children).to.be.eq('Cancel');
    expect(buttons.at(1).props().children).to.be.eq('Try again');
  });

  it('should retry search when retry button is clicked on render barcode error drawer', () => {
    const searchByBarcodesSpy = sandbox.stub(ContainerActions, 'searchWithoutPagination')
      .returns({ done: () => ({ fail: (cb) => cb({}) }) });
    wrapper = shallow(<ManageContainerModal {...props} searchOptions={searchOptions} />);
    wrapper.setState({ isRetryDrawerOpen: true, bulkSearchValuesWithNoContainers: ['Barcode1', 'Barcode2'] });
    wrapper.update();
    const drawerFooter = shallow(wrapper.find('ConnectedSinglePaneModal').prop('drawerFooterChildren'));
    const modalProps = wrapper.find('ConnectedSinglePaneModal').props();
    expect(modalProps.drawerState).to.be.true;
    expect(modalProps.drawerTitle).to.be.eq('Containers not found');
    expect(searchByBarcodesSpy.calledOnce).to.be.false;
    drawerFooter.find('Button').at(1).simulate('click');
    expect(searchByBarcodesSpy.calledOnce).to.be.true;
    expect(searchByBarcodesSpy.args[0][0].barcode).to.deep.equal(['Barcode1', 'Barcode2']);
  });

  it('should enable both drawer, cancelling error drawer should enable Look Up Container drawer', async () => {
    wrapper = mount(<ManageContainerModal {...props} />);
    const containers = data.setIn([1, 'barcode'], '12345');
    await wrapper.instance().onSearchSuccess(['12345', '12567'], containers, false);
    wrapper.update();
    expect(wrapper.instance().state.isRetryDrawerOpen).to.be.true;
    expect(wrapper.instance().state.bulkSearchValuesWithNoContainers).to.deep.equal(['12567']);
    expect(wrapper.instance().state.isConflictDrawerOpen).to.be.true;
    expect(wrapper.instance().state.toBeSelectedContainers).to.deep.equal(containers);
    expect(wrapper.instance().state.validBulkSearchValues.size).to.be.equal(0);
    expect(wrapper.instance().state.containers.size).to.be.equal(0);

    expect(wrapper.find('ConnectedSinglePaneModal').props().drawerState).to.be.true;
    expect(wrapper.find('ConnectedSinglePaneModal').props().drawerTitle).to.be.eq('Containers not found');
    const errorDrawerFooter = shallow(wrapper.find('ConnectedSinglePaneModal').prop('drawerFooterChildren'));
    errorDrawerFooter.find('Button').at(0).simulate('click');
    expect(wrapper.instance().state.isRetryDrawerOpen).to.be.false;
    expect(wrapper.instance().state.bulkSearchValuesWithNoContainers).to.deep.equal([]);
    expect(wrapper.instance().state.isConflictDrawerOpen).to.be.true;
    expect(wrapper.instance().state.toBeSelectedContainers).to.deep.equal(containers);
    expect(wrapper.instance().state.validBulkSearchValues.size).to.be.equal(0);
    expect(wrapper.instance().state.containers.size).to.be.equal(0);
    wrapper.update();
    expect(wrapper.find('ConnectedSinglePaneModal').props().drawerState).to.be.true;
    expect(wrapper.find('ConnectedSinglePaneModal').props().drawerTitle).to.be.eq('Look Up Container');
  });

  it('should return barcodes and containers with and without conflict when getConflictingBulkFieldAndContainers is called', () => {
    wrapper = shallow(<ManageContainerModal {...props} />);
    const containers = [
      { id: 'ct1', barcode: 'barcode1' },
      { id: 'ct2', barcode: 'barcode1' },
      { id: 'ct3', barcode: 'barcode2' },
      { id: 'ct4', barcode: 'barcode3' },
      { id: 'ct5', barcode: 'barcode1' },
    ];
    const {
      bulkValuesWithConflict, containersWithConflict,
      bulkValuesWithoutConflict, containersWithoutConflict,
    } = wrapper.instance().getConflictingBulkFieldAndContainers(Immutable.fromJS(containers));
    expect(bulkValuesWithConflict).to.deep.equal(['barcode1']);
    expect(bulkValuesWithoutConflict).to.deep.equal(['barcode2', 'barcode3']);
    expect(containersWithConflict.toJS()).to.deep.equal([containers[0], containers[1], containers[4]]);
    expect(containersWithoutConflict.toJS()).to.deep.equal([containers[2], containers[3]]);
  });

  it('should display error below search field, if searched container with label already listed in the table', async () => {
    const newProps = { ...props, searchField: labelField };
    wrapper = shallow(<ManageContainerModal {...newProps} />);
    wrapper.setState({ searchBarText: 'container1' });
    await wrapper.instance().onSearchSuccess(['container1'], Immutable.List([]), true);
    wrapper.update();
    const searchFieldProps = wrapper.find('SearchField').props();
    expect(searchFieldProps.value).to.be.eq('');
    expect(wrapper.find('Validated').props().error)
      .to
      .be
      .equal('Container name not found. Please scan or type in a valid name or update applied filters.');
  });

  it('should have spinner when loading is true', () => {
    wrapper = shallow(<ManageContainerModal {...props} />);
    wrapper.setState({ loading: true });
    expect(wrapper.find('Spinner').length).to.be.equal(1);
  });

  it('should not have spinner when loading is false', () => {
    wrapper = shallow(<ManageContainerModal {...props} />);
    wrapper.setState({ loading: false });
    expect(wrapper.find('Spinner').length).to.be.equal(0);
  });

  it('should not have spinner when API call is failed', () => {
    const notificationStub = sandbox.spy(NotificationActions, 'handleError');
    const searchByBarcodesStub = sandbox.stub(ContainerActions, 'searchWithoutPagination')
      .returns({
        done: () => ({ fail: (cb) => cb({}) })
      });
    wrapper = shallow(<ManageContainerModal {...props} searchOptions={searchOptions} />);
    wrapper.find('SearchField').dive().find('TextInput').props()
      .onKeyDown({ key: 'Enter', target: { value: 'BAR01' } });

    expect(searchByBarcodesStub.calledOnce).to.be.true;
    expect(searchByBarcodesStub.args[0][0].barcode).to.deep.equal(['BAR01']);
    expect(notificationStub.calledOnce).to.be.true;
    expect(wrapper.find('Spinner').length).to.be.equal(0);
  });

  it('should have spinner when bulk field conflict drawer is opened', () => {
    wrapper = shallow(<ManageContainerModal {...props} />);
    wrapper.setState({ isConflictDrawerOpen: true });
    expect(wrapper.find('Spinner').length).to.be.equal(1);
  });

  it('should not have spinner when API is success', async () => {
    const searchByBarcodesSpy = sandbox.stub(ContainerActions, 'searchWithoutPagination')
      .returns({
        done: (cb) => {
          cb({ data: [{ id: 'ct1', type: 'containers', attributes: { barcode: 'BAR01' } }] });
          return {
            fail: () => {}
          };
        },
      });
    wrapper = shallow(<ManageContainerModal {...props} searchOptions={searchOptions} />);
    wrapper.setState({ searchBarText: 'BAR01' });
    wrapper.find('SearchField').dive().find('TextInput').props()
      .onKeyDown({ key: 'Enter', target: { value: 'BAR01' } });

    expect(searchByBarcodesSpy.calledOnce).to.be.true;
    expect(searchByBarcodesSpy.args[0][0].barcode).to.deep.equal(['BAR01']);
    setTimeout(() => {
      expect(wrapper.find('Spinner').length).to.be.equal(0);
    }, 0);
  });

  it('should call API with the filters applied on containers page', () => {
    buildSearchPayload.restore();
    const args = {
      query: '*',
      search_fields: ['label', 'id', 'barcode'],
      per_page: getDefaultSearchPerPage(),
      aliquot_count: 0,
      page: 1,
      sort_by: 'updated_at',
      sort_desc: true,
      hide_tubes: false,
      hide_plates: false,
      show_containers_without_runs: false,
      hide_containers_with_pending_runs: false,
      storage_condition: undefined,
      volume: '*',
      status: 'available',
      contextual_custom_properties: {},
      aliquot_contextual_custom_properties: {},
      container_properties: {},
      aliquot_properties: {},
      shipped: undefined,
      generated: undefined,
      materials: undefined,
      search_score: true,
      include: ['container_type'],
      test_mode: undefined,
      search_hazard: [],
      container_type: [],
      empty_mass: { min: NaN, max: NaN },
      created_by: undefined,
      lab_id: undefined,
      organization_id: 'org1',
      created_after: null,
      created_before: null,
      barcode: ['BAR01'],
    };
    sandbox.stub(InventoryActions, 'buildSearchPayload').returns(args);

    const searchByBarcodesSpy = sandbox.stub(ContainerActions, 'searchWithoutPagination')
      .returns({
        done: (cb) => {
          cb({ data: [{ id: 'ct1', type: 'containers', attributes: { barcode: 'BAR01' } }] });
          return {
            fail: () => {}
          };
        },
      });
    wrapper = shallow(
      <ManageContainerModal
        {...props}
        searchOptions={searchOptions.merge({
          organization_id: 'org1'
        })}
      />);
    wrapper.setState({ searchBarText: 'BAR01' });
    wrapper.find('SearchField').dive().find('TextInput').props()
      .onKeyDown({ key: 'Enter', target: { value: 'BAR01' } });

    expect(searchByBarcodesSpy.calledOnce).to.be.true;
    expect(searchByBarcodesSpy.args[0][0].barcode).to.deep.equal(['BAR01']);
    expect(searchByBarcodesSpy.args[0][0].organization_id).to.deep.equal('org1');
    expect(searchByBarcodesSpy.args[0][0]).deep.equal(args);
  });

  it('should omit bulk_search from the filters applied on container page while making the API call', () => {
    const searchByBarcodesSpy = sandbox.stub(ContainerActions, 'searchWithoutPagination')
      .returns({
        done: (cb) => {
          cb({ data: [{ id: 'ct1', type: 'containers', attributes: { barcode: 'BAR01' } }] });
          return {
            fail: () => {}
          };
        },
      });

    wrapper = shallow(<ManageContainerModal
      {...props}
      searchOptions={searchOptions.merge({ bulk_search: [{ field: 'barcode', container_ids: ['ct1', 'ct2'] }] })}
    />);
    wrapper.setProps({ searchTextArray: ['12345'] });

    expect(searchByBarcodesSpy.calledOnce).to.be.true;
    expect(searchByBarcodesSpy.args[0][0].bulk_search).to.be.equal(undefined);
  });
});
