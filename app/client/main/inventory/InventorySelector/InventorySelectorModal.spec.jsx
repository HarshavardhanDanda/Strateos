import React from 'react';
import Immutable  from 'immutable';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import { Banner, Button, ButtonGroup, ModalDrawer } from '@transcriptic/amino';
import { pubSub } from '@strateos/micro-apps-utils';

import InventorySelector from 'main/inventory/InventorySelector';
import { InventorySelectorModalAliquotActions, InventorySelectorModalContainerActions } from 'main/inventory/inventory/InventoryActions';
import { InventorySelectorModalAliquotState, InventorySelectorModalContainerState } from 'main/inventory/inventory/InventoryState';
import SessionStore from 'main/stores/SessionStore';
import ContainerStore from 'main/stores/ContainerStore';
import AliquotStore from 'main/stores/AliquotStore';
import InventorySelectorModal from 'main/inventory/InventorySelector/InventorySelectorModal';
import AliquotAPI from 'main/api/AliquotAPI';
import Dispatcher from 'main/dispatcher';
import AliquotActions from 'main/actions/AliquotActions';
import UserStore from 'main/stores/UserStore';
import { simulateAPICallComplete } from 'main/components/SelectorContent/SelectorContentNew.spec';
import SelectedInventory from './SelectedInventory';

describe('InventorySelectorModal', () => {
  let modal;
  const sandbox = sinon.createSandbox();

  const container = Immutable.Map({
    aliquot_count: 1,
    aliquot_search_scores: [],
    container_type_id: 'vendor-tube',
    created_at: '2020-11-24T23:53:12.322-08:00',
    id: 'ct1f564252kunec',
    label: 'Vendor tube',
    organization_id: 'org13',
    public_location_description: 'In transit to Transcriptic.',
    shipment_code: 'PVM',
    shipment_id: 'sr1f564253jcst7',
    slot: null,
    status: 'inbound',
    storage_condition: 'cold_80',
    test_mode: false,
    type: 'containers',
    updated_at: '2020-11-24T23:53:12.384-08:00',
    current_mass_mg: null,
    empty_mass_mg: null,
    barcode: 'abcd',
    hazards: ['flammable']
  });

  const aliquots = Immutable.fromJS([
    {
      created_by_run_id: null,
      hazards: [],
      mass_mg: null,
      created_at: '2023-01-18T21:50:15.418-08:00',
      name: null,
      resource_id: null,
      well_idx: 73,
      lot_no: null,
      properties: {},
      resource_id_last_changed_at: null,
      attributes: {
        well_idx: 73,
        container_id: 'ct1as49vrbeebz533k'
      },
      updated_at: '2023-01-18T21:50:15.418-08:00',
      amount: null,
      version: 0,
      container_id: 'ct1as49vrbeebz533k',
      deleted_at: null,
      links: {
        self: 'http://localhost/api/aliquots/aq1as49vrc83t6nnwk'
      },
      type: 'aliquots',
      id: 'aq1as49vrc83t6nnwk',
      volume_ul: '1.0'
    },
    {
      created_by_run_id: null,
      hazards: [],
      mass_mg: null,
      created_at: '2023-01-18T21:50:15.418-08:00',
      name: null,
      resource_id: null,
      well_idx: 72,
      lot_no: null,
      properties: {},
      resource_id_last_changed_at: null,
      attributes: {
        well_idx: 72,
        container_id: 'ct1as49vrbeebz533k'
      },
      updated_at: '2023-01-18T21:50:15.418-08:00',
      amount: null,
      version: 0,
      container_id: 'ct1as49vrbeebz533k',
      deleted_at: null,
      links: {
        self: 'http://localhost/api/aliquots/aq1as49vrc7amky8wd'
      },
      type: 'aliquots',
      id: 'aq1as49vrc7amky8wd',
      volume_ul: '1.0'
    }
  ]);

  beforeEach(() => {
    sandbox.stub(UserStore, 'getById').returns(Immutable.Map({ id: 'u123' }));
  });

  afterEach(() => {
    if (sandbox) sandbox.restore();
  });

  it('should have modal header and title', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    modal = shallow(<InventorySelectorModal title="Container Selection" modalOpen selectionType="CONTAINER+" selectionMap={Immutable.Map()} beforeDismiss={() => {}} />);
    const singlePaneModal = modal.dive().dive().find('SinglePaneModal');
    const modalHeader = singlePaneModal.dive().find('ModalHeader');
    expect(modalHeader).to.have.length(1);
    expect(modalHeader.props().titleContent).to.equal('Container Selection');
  });

  it('should have footer and Select, Cancel buttons', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    modal = shallow(<InventorySelectorModal title="Containers Selection" modalOpen selectionType="CONTAINER+" selectionMap={Immutable.Map()} beforeDismiss={() => {}} />);
    const singlePaneModal = modal.dive().dive().find('SinglePaneModal');
    const modalFooter = singlePaneModal.dive().find(ButtonGroup);
    expect(modalFooter).to.have.length(1);
    expect(modalFooter.find(Button).dive().text()).to.equal('Cancel');
    expect(modalFooter.find('span').text()).to.equal('Use Containers');
  });

  it('should have inventory selector to select container', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    modal = shallow(<InventorySelectorModal title="Containers Selection" modalOpen selectionMap={Immutable.Map()} beforeDismiss={() => {}} />);
    const inventorySelector = modal.find(InventorySelector);
    expect(inventorySelector).to.have.length(1);
  });

  it('should have correct footer button label', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    modal = shallow(<InventorySelectorModal title="Aliquots Selection" modalOpen selectionType="ALIQUOT+" selectionMap={Immutable.Map()} beforeDismiss={() => {}} />);
    const modalFooterButtonText = modal.prop('acceptText');
    expect(modalFooterButtonText).to.equal('Use Aliquots');
  });

  it('select all aliquots should make an API request', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    const get = sandbox.stub(AliquotAPI, 'getByContainerId').returns({
      done: () => {
        return { always: () => ({}) };
      }
    });
    modal = shallow(<InventorySelectorModal title="Aliquot Selection" modalOpen selectionType="ALIQUOT+" selectionMap={Immutable.Map()} beforeDismiss={() => {}} />);
    modal.instance().onSelectAll(['c1', 'c2']);
    expect(get.called).to.be.true;
  });

  it('should have correct drawer footer button labels and select button enabled for multiple aliquots selection', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    modal = shallow(<InventorySelectorModal title="Aliquot Selection" modalOpen selectionType="ALIQUOT+" selectionMap={Immutable.Map()} beforeDismiss={() => {}} />);
    modal.find(InventorySelector).prop('onRowClick')(container);
    modal.setState({ disableSelectButton: false });
    const modalDrawerButtons = modal.find('ConnectedSinglePaneModal').prop('drawerFooterChildren').props.children;

    expect(modalDrawerButtons[0].props.children).to.equal('Close');
    expect(modalDrawerButtons[1].props.children).to.equal('Select');
    expect(modalDrawerButtons[0].props.disabled).to.equal(undefined);
    expect(modalDrawerButtons[1].props.disabled).to.equal(false);
  });

  it('should have Select button disabled for single Aliquot selection until any aliquot is selected', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    modal = shallow(<InventorySelectorModal title="Aliquot Selection" modalOpen selectionType="ALIQUOT" selectionMap={Immutable.Map()} beforeDismiss={() => {}} />);
    modal.find(InventorySelector).prop('onRowClick')(container);
    const  modalDrawerButtons = modal.find('ConnectedSinglePaneModal').prop('drawerFooterChildren').props.children;
    expect(modalDrawerButtons[0].props.children).to.equal('Close');
    expect(modalDrawerButtons[1].props.children).to.equal('Select');
    expect(modalDrawerButtons[0].props.disabled).to.equal(undefined);
    expect(modalDrawerButtons[1].props.disabled).to.equal(true);
  });

  it('should handle single aliquot selection when clicking drawer button select', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org113', subdomain: 'transcriptic', feature_groups: [] }));
    const beforeDismiss = sinon.spy();
    const onSelectionChange = sinon.spy();
    modal = shallow(<InventorySelectorModal title="Aliquot Selection" modalOpen selectionType="ALIQUOT" selectionMap={Immutable.Map()} onSelectionChange={onSelectionChange} beforeDismiss={beforeDismiss} />);
    modal.setState({ containerId: 'ct1f564252kunec', selectedRows: [] });
    sandbox.spy(InventorySelectorModalAliquotActions, 'updateState');
    modal.instance().onDetailsDrawerButtonSelect();

    expect(onSelectionChange.calledOnce).to.equal(true);
    expect(beforeDismiss.calledOnce).to.equal(true);
    sandbox.restore();
  });

  it('should handle multiple aliquots selection when clicking drawer button select', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    modal = shallow(<InventorySelectorModal title="Aliquot Selection" modalOpen selectionType="ALIQUOT+" selectionMap={Immutable.Map()} beforeDismiss={() => {}} />);
    modal.setState({ containerId: 'ct1f564252kunec', selectedRows: [], onAllWellsSelected: {} });
    const onAllWellsSelected = sinon.spy(modal.instance(), 'onAllWellsSelected');
    modal.instance().onDetailsDrawerButtonSelect();

    expect(onAllWellsSelected.calledOnce).to.equal(true);
  });

  it('should handle multiple container selection type when clicking drawer button select', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    modal = shallow(<InventorySelectorModal title="Container Selection" modalOpen selectionType="CONTAINER+" selectionMap={Immutable.Map()} beforeDismiss={() => {}} />);
    modal.setState({ containerId: 'ct1f564252kunec', selectedRows: [], onSelectedContainerChange: {} });
    const onSelectedContainerChange = sinon.spy(modal.instance(), 'onSelectedContainerChange');
    modal.instance().onDetailsDrawerButtonSelect();

    expect(onSelectedContainerChange.calledOnce).to.equal(true);
  });

  it('should initialize state correctly for container selection', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    const stateSpy = sandbox.spy(InventorySelectorModalContainerState, 'get');
    const actionsSpy = sandbox.spy(InventorySelectorModalContainerActions, 'searchOptions');
    modal = shallow(<InventorySelectorModal title="Container Selection" modalOpen selectionType="CONTAINER" beforeDismiss={() => {}} />);
    modal.find(InventorySelector).dive().find('InventorySelector');
    expect(stateSpy.called).to.be.true;
    expect(actionsSpy.called).to.be.true;
  });

  it('should initialize state correctly for aliquot selection', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    const stateSpy = sandbox.spy(InventorySelectorModalAliquotState, 'get');
    const actionsSpy = sandbox.spy(InventorySelectorModalAliquotActions, 'searchOptions');
    modal = shallow(<InventorySelectorModal title="Container Selection" modalOpen selectionType="ALIQUOT" beforeDismiss={() => {}} />);
    modal.find(InventorySelector).dive().find('InventorySelector');
    expect(stateSpy.called).to.be.true;
    expect(actionsSpy.called).to.be.true;
  });

  it('should include containers without aliquots when selecting containers', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    modal = mount(<InventorySelectorModal title="Container Selection" modalOpen selectionType="CONTAINER" beforeDismiss={() => {}} />);
    simulateAPICallComplete(modal);
    const inventorySelector = modal.find(InventorySelector).find('InventorySelector');
    expect(inventorySelector.props().searchOptions.aliquot_count).to.equal(0);
  });

  it('should exclude containers without aliquots when selecting aliquots', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    modal = mount(<InventorySelectorModal title="Container Selection" modalOpen selectionType="ALIQUOT" beforeDismiss={() => {}} />);
    simulateAPICallComplete(modal);
    const inventorySelector = modal.find(InventorySelector).find('InventorySelector');
    expect(inventorySelector.props().searchOptions.aliquot_count).to.equal(1);
  });

  it('should show the banner when containers have negative volume aliquot when selecting containers', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    const negativeVolumeAliquot =
    {
      data: [{
        attributes: {
          container_id: 'ct1f564252kunec',
          id: 'aq1f45ya42gp8g7',
          name: 'Tube 1',
          properties: {},
          type: 'aliquots',
          version: 0,
          volume_ul: '-10.0',
          mass_mg: '2.0',
          well_idx: '0',
          resource_id: null,
        }
      }]
    };
    sandbox.stub(AliquotAPI, 'getByContainerId').returns({
      done: (cb) => {
        cb(negativeVolumeAliquot);
        return  { always: (cb) => { cb(); } };
      },
    });
    sandbox.stub(ContainerStore, 'getById').returns(container);

    modal = shallow(<InventorySelectorModal title="Container Selection" modalOpen selectionType="CONTAINER+" selectionMap={Immutable.Map()} beforeDismiss={() => {}} />);

    modal.instance().onSelectRow({}, true, { ct1f564252kunec: true });
    const submitButton = modal.dive().dive().find('SinglePaneModal').dive()
      .find(ButtonGroup)
      .find('AjaxButton');

    expect(modal.find(Banner)).to.have.length(1);
    expect(modal.find(Banner).prop('bannerMessage')).to.be.equal('Some of the aliquots in the container Vendor tube have negative volumes/masses. \n              These samples can still be used however, physical material may not be transferred from Aliquots with negative quantities');
    expect(modal.find(Banner).prop('bannerType')).to.be.equal('warning');
    expect(submitButton.props().disabled).to.equal(false);
  });

  it('should show the banner when containers have negative mass aliquot when selecting containers', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    const negativeMassAliquot = {
      data: [{
        attributes: {
          container_id: 'ct1f564252kunec',
          id: 'aq1f45ya42gp8g7',
          name: 'Tube 1',
          properties: {},
          type: 'aliquots',
          version: 0,
          volume_ul: '10.0',
          mass_mg: '-2.0',
          well_idx: '0',
          resource_id: null,
        }
      }]
    };
    sandbox.stub(AliquotAPI, 'getByContainerId').returns({
      done: (cb) => {
        cb(negativeMassAliquot);
        return  { always: (cb) => { cb(); } };
      },
    });
    sandbox.stub(ContainerStore, 'getById').returns(container);

    modal = shallow(<InventorySelectorModal title="Container Selection" modalOpen selectionType="CONTAINER+" selectionMap={Immutable.Map()} beforeDismiss={() => {}} />);

    modal.instance().onSelectRow({}, true, { ct1f564252kunec: true });
    const submitButton = modal.dive().dive().find('SinglePaneModal').dive()
      .find(ButtonGroup)
      .find('AjaxButton');
    const bannerMessage = 'Some of the aliquots in the container Vendor tube have negative volumes/masses.' +
      ' \n              These samples can still be used however, physical material may not be transferred from Aliquots with negative quantities';
    expect(modal.find(Banner)).to.have.length(1);
    expect(modal.find(Banner).prop('bannerMessage')).to.be.equal(bannerMessage);
    expect(modal.find(Banner).prop('bannerType')).to.be.equal('warning');
    expect(submitButton.props().disabled).to.equal(false);
  });

  it('should subscribe to show and hide pubsub events', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: ['inventory_browser_microapp'] }));
    const subscribe = sandbox.stub(pubSub, 'subscribe');
    const showModal = sandbox.stub(InventorySelectorModal.prototype, 'showModal');
    const hideModal = sandbox.stub(InventorySelectorModal.prototype, 'hideModal');
    modal = shallow(<InventorySelectorModal modalOpen title="test" beforeDismiss={() => {}} />);
    modal.instance().componentDidMount();

    expect(subscribe.args[0][0]).to.equal('INVENTORY_BROWSER_MODAL_SHOW');
    subscribe.args[0][1]();
    expect(showModal.calledOnce).to.be.true;
    expect(subscribe.args[1][0]).to.equal('INVENTORY_BROWSER_MODAL_HIDE');
    subscribe.args[1][1]();
    expect(hideModal.calledOnce).to.be.true;
  });

  it('should set state with parameters from publish event to open modal for containers', () => {
    const setState = sandbox.stub(InventorySelectorModal.prototype, 'setState');
    const selectionMap = Immutable.fromJS({ test: 1 });
    const publishParams = {
      title: 'Container selection',
      selectionType: 'CONTAINER+',
      organizationId: 'org13',
      labId: 'lab123',
      testMode: true,
      pubSubKey: '123456',
      selectionMap: selectionMap,
      defaultFilters: {
        containerTypeWellCount: 6
      }
    };
    modal = shallow(<InventorySelectorModal modalOpen title="test" beforeDismiss={() => {}} />);
    modal.instance().showModal(publishParams);

    expect(setState.args[0][0]).to.deep.equal({
      modalOpen: true,
      isPubSub: true,
      ...publishParams,
      containerSelectionMap: selectionMap,
      wellSelectionMap: Immutable.Map()
    });
  });

  it('should set state with parameters from publish event to open modal for aliquots', () => {
    const setState = sandbox.stub(InventorySelectorModal.prototype, 'setState');
    const selectionMap = Immutable.fromJS({ test: [] });
    const publishParams = {
      title: 'Container selection',
      selectionType: 'ALIQUOT',
      organizationId: 'org13',
      labId: 'lab123',
      testMode: true,
      pubSubKey: '123456',
      selectionMap: selectionMap,
      defaultFilters: {
        containerTypeWellCount: 6
      }
    };
    modal = shallow(<InventorySelectorModal modalOpen title="test" beforeDismiss={() => {}} />);
    modal.instance().showModal(publishParams);

    expect(setState.args[0][0]).to.deep.equal({
      modalOpen: true,
      isPubSub: true,
      ...publishParams,
      containerSelectionMap: Immutable.Map(),
      wellSelectionMap: selectionMap
    });
  });

  it('should set state with parameters from publish event to hide modal', () => {
    const setState = sandbox.stub(InventorySelectorModal.prototype, 'setState');
    modal = shallow(<InventorySelectorModal modalOpen title="test" beforeDismiss={() => {}} />);
    modal.instance().hideModal();
    expect(setState.args[0][0]).to.deep.equal({
      modalOpen: false
    });
  });

  it('should publish event on selection change', () => {
    const selectionMap = Immutable.fromJS({ ct12345: Immutable.fromJS([]) });
    const containersFromStore = [Immutable.fromJS({ id: 'ct12345' })];
    const selectedContainers = sandbox.stub(ContainerStore, 'getByIds').returns(containersFromStore);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: ['inventory_browser_microapp'] }));
    const publish = sandbox.stub(pubSub, 'publish');
    const publishParams = {
      title: 'Container selection',
      selectionType: 'CONTAINER+',
      organizationId: 'org13',
      labId: 'lab123',
      testMode: true,
      pubSubKey: '123456',
      selectionMap
    };
    modal = shallow(<InventorySelectorModal modalOpen title="test" beforeDismiss={() => {}} />);
    modal.instance().showModal(publishParams);

    const singlePaneModal = modal.dive().dive().find('SinglePaneModal');
    singlePaneModal.props().onAccept();
    expect(publish.args[0][0]).to.equal('INVENTORY_BROWSER_MODAL_ONSELECTIONCHANGE_123456');
    expect(selectedContainers.calledOnce).to.be.true;
    expect(publish.args[0][1]).to.deep.equal({
      version: 'V1',
      selectionMap: Immutable.fromJS({ ct12345: Immutable.fromJS([]) }),
      selectedContainers: containersFromStore
    });
  });

  it('should render wells count when selecting all aliquots', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    const dispatchStub = sandbox.stub(Dispatcher, 'dispatch');
    const getByContainerIdStub = sandbox.stub(AliquotAPI, 'getByContainerId').returns({
      done: cb => {
        cb([container]);
        return { always: () => ({}) };
      }
    });
    const getByContainerStub = sandbox.stub(AliquotStore, 'getByContainer').returns(aliquots);

    modal = shallow(<InventorySelectorModal title="Aliquot Selection" modalOpen selectionType="ALIQUOT" selectionMap={Immutable.Map()} beforeDismiss={() => {}} />);
    modal.instance().onSelectAll(['c1', 'c2']);

    expect(getByContainerIdStub.args[2][1].fields.aliquots).to.eql(['id', 'well_idx', 'container_id', 'volume_ul']);
    expect(dispatchStub.calledImmediatelyAfter(getByContainerIdStub)).to.be.true;
    expect(getByContainerStub.calledAfter(getByContainerIdStub)).to.be.true;
    expect(modal.state().wellSelectionMap.toJS()).to.eql({ 0: [73, 72], 1: [73, 72] });
  });

  describe('Consolidated InventorySelectorModal', () => {
    const selectionMap = Immutable.Map({ test: [] });
    const publishParams = {
      title: 'Container selection',
      selectionType: 'CONTAINER+',
      organizationId: 'org13',
      labId: 'lab123',
      testMode: true,
      pubSubKey: '123456',
      selectionMap
    };
    beforeEach(() => {
      sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: ['inventory_browser_microapp'] }));
    });

    it('should show SelectedInventory component', () => {
      modal = shallow(<InventorySelectorModal modalOpen title="test" beforeDismiss={() => {}} />);
      modal.instance().showModal(publishParams);
      const selectedInventory = modal.find(SelectedInventory);

      expect(selectedInventory.props().onClick).to.exist;
      expect(selectedInventory.props().onSearch).to.exist;
      expect(selectedInventory.props().onSelectionDeleted).to.exist;
      expect(selectedInventory.props().containerSelectionMap).to.exist;
      expect(selectedInventory.props().wellSelectionMap).to.exist;
    });

    it('should show InventorySelector and InventoryDetails Drawers when SelectedInventory button is clicked', () => {
      modal = shallow(<InventorySelectorModal modalOpen title="test" beforeDismiss={() => {}} />);
      modal.instance().showModal(publishParams);
      const selectedInventory = modal.find(SelectedInventory);
      selectedInventory.props().onClick();
      let inventorySelectorDrawer = modal.find(ModalDrawer).findWhere(modalDrawer => modalDrawer.props().title === 'Container inventory');
      const inventoryDetailsDrawer = modal.find(ModalDrawer).findWhere(modalDrawer => modalDrawer.props().title === 'Container selection');

      expect(inventorySelectorDrawer.props().drawerState).to.be.true;
      const inventorySelector = shallow(inventorySelectorDrawer.props().drawerChildren);
      expect(inventorySelector.props().title).to.equal('Inventory');
      inventorySelector.unmount();

      const drawerFooterChildren = shallow(inventorySelectorDrawer.props().drawerFooterChildren);
      const closeButton = drawerFooterChildren.find('Button').findWhere(button => button.props().type === 'secondary');
      expect(closeButton.children().text()).to.equal('Close');
      const acceptButton = drawerFooterChildren.find('Button').findWhere(button => button.props().type === 'primary');
      expect(acceptButton.children().text()).to.equal('Use Containers');
      drawerFooterChildren.unmount();

      expect(inventoryDetailsDrawer.props().drawerState).to.be.false;
      expect(inventoryDetailsDrawer.props().style).to.deep.equal({ zIndex: 1000, position: 'fixed' });
      expect(inventoryDetailsDrawer.props().sideTransition).to.be.true;

      inventorySelectorDrawer.props().onDrawerClose();
      inventorySelectorDrawer = modal.find(ModalDrawer).findWhere(modalDrawer => modalDrawer.props().title === 'Container inventory');
      expect(inventorySelectorDrawer.exists()).to.be.false;
    });

    it('should show InventorySelector drawer when SelectedInventory input search is invoked for Containers', () => {
      const actionsSpy = sandbox.spy(InventorySelectorModalContainerActions, 'onSearchInputChange');
      modal = shallow(<InventorySelectorModal modalOpen title="test" beforeDismiss={() => {}} />);
      modal.instance().showModal(publishParams);
      const selectedInventory = modal.find(SelectedInventory);
      selectedInventory.props().onSearch('ct123');

      expect(actionsSpy.calledOnce).to.be.true;
      expect(actionsSpy.args[0][1]).to.equal('ct123');
      expect(actionsSpy.args[0][2]).to.equal(true);

      const inventorySelectorDrawer = modal.find(ModalDrawer).findWhere(modalDrawer => modalDrawer.props().title === 'Container inventory');
      expect(inventorySelectorDrawer.props().drawerState).to.be.true;
    });

    it('should show InventorySelector drawer when SelectedInventory input search is invoked for Aliquots', () => {
      const actionsSpy = sandbox.spy(InventorySelectorModalAliquotActions, 'onSearchInputChange');
      modal = shallow(<InventorySelectorModal modalOpen title="test" beforeDismiss={() => {}} />);
      modal.instance().showModal({
        ...publishParams,
        selectionType: 'ALIQUOT'
      });
      const selectedInventory = modal.find(SelectedInventory);
      selectedInventory.props().onSearch('ct123');

      expect(actionsSpy.calledOnce).to.be.true;
      expect(actionsSpy.args[0][1]).to.equal('ct123');
      expect(actionsSpy.args[0][2]).to.equal(true);

      const inventorySelectorDrawer = modal.find(ModalDrawer).findWhere(modalDrawer => modalDrawer.props().title === 'Container inventory');
      expect(inventorySelectorDrawer.props().drawerState).to.be.true;
    });

    it('should reset selected state when modal reopens and selection type is ALIQUOT+', () => {
      modal = shallow(<InventorySelectorModal modalOpen title="test" beforeDismiss={() => {}}  />);
      modal.instance().showModal({ ...publishParams, selectionType: 'ALIQUOT+' });

      const selectedInventory = modal.find(SelectedInventory);
      selectedInventory.props().onClick();
      modal.instance().onSelectRow(Immutable.fromJS({ id: 'ct1f564252kunec' }), true, { ct1f564252kunec: true });

      const inventorySelectorDrawer = modal.find(ModalDrawer).findWhere(modalDrawer => modalDrawer.props().title === 'Container inventory');
      inventorySelectorDrawer.props().onDrawerClose();

      const inventorySelector = shallow(inventorySelectorDrawer.props().drawerChildren);
      expect(inventorySelector.props().selected.length).to.equal(0);
      inventorySelector.unmount();
    });

    it('should reset selected state when modal reopens and selection type is CONTAINER+', () => {
      modal = shallow(<InventorySelectorModal modalOpen title="test" beforeDismiss={() => {}}  />);
      modal.instance().showModal(publishParams);

      const selectedInventory = modal.find(SelectedInventory);
      selectedInventory.props().onClick();
      modal.instance().onSelectRow(Immutable.fromJS({ id: 'ct1f564252kunec' }), true, { ct1f564252kunec: true });

      const inventorySelectorDrawer = modal.find(ModalDrawer).findWhere(modalDrawer => modalDrawer.props().title === 'Container inventory');
      inventorySelectorDrawer.props().onDrawerClose();

      const inventorySelector = shallow(inventorySelectorDrawer.props().drawerChildren);
      expect(inventorySelector.props().selected.length).to.equal(0);
      inventorySelector.unmount();
    });

    it('should reset selected state when modal reopens and selection type is ALIQUOT+ on Use Aliquots button click', () => {
      modal = shallow(<InventorySelectorModal modalOpen title="test" beforeDismiss={() => {}}  />);
      modal.instance().showModal({ ...publishParams, selectionType: 'ALIQUOT+' });

      const selectedInventory = modal.find(SelectedInventory);
      selectedInventory.props().onClick();
      modal.instance().onSelectRow(Immutable.fromJS({ id: 'ct1f564252kunec' }), true, { ct1f564252kunec: true });

      const inventorySelectorDrawer = modal.find(ModalDrawer).findWhere(modalDrawer => modalDrawer.props().title === 'Container inventory');
      const drawerFooterChildren = shallow(inventorySelectorDrawer.props().drawerFooterChildren);
      const acceptButton = drawerFooterChildren.find('Button').findWhere(button => button.props().type === 'primary');
      acceptButton.simulate('click');
      drawerFooterChildren.unmount();

      const inventorySelector = shallow(inventorySelectorDrawer.props().drawerChildren);
      expect(inventorySelector.props().selected.length).to.equal(0);
      inventorySelector.unmount();
    });

    it('should reset selected state when modal reopens and selection type is CONTAINER+ on Use Containers button click', () => {
      modal = shallow(<InventorySelectorModal modalOpen title="test" beforeDismiss={() => {}}  />);
      modal.instance().showModal({ ...publishParams, selectionType: 'CONTAINER+' });

      const selectedInventory = modal.find(SelectedInventory);
      selectedInventory.props().onClick();
      modal.instance().onSelectRow(Immutable.fromJS({ id: 'ct1f564252kunec' }), true, { ct1f564252kunec: true });

      const inventorySelectorDrawer = modal.find(ModalDrawer).findWhere(modalDrawer => modalDrawer.props().title === 'Container inventory');
      const drawerFooterChildren = shallow(inventorySelectorDrawer.props().drawerFooterChildren);
      const acceptButton = drawerFooterChildren.find('Button').findWhere(button => button.props().type === 'primary');
      acceptButton.simulate('click');
      drawerFooterChildren.unmount();

      const inventorySelector = shallow(inventorySelectorDrawer.props().drawerChildren);
      expect(inventorySelector.props().selected.length).to.equal(0);
      inventorySelector.unmount();
    });

    it('should set props correctly in SinglePaneModal component', () => {
      const publish = sandbox.stub(pubSub, 'publish');
      const beforeDismiss = sandbox.stub();
      modal = shallow(<InventorySelectorModal modalOpen title="test" beforeDismiss={beforeDismiss} />);
      const singlePaneModal = modal.find('ConnectedSinglePaneModal').dive();
      expect(singlePaneModal.props().modalId).to.equal('SEARCH_CONTAINER_MODAL');
      expect(singlePaneModal.props().modalOpen).to.be.true;
      expect(singlePaneModal.props().acceptText).to.equal('Save');
      expect(singlePaneModal.props().acceptBtnDisabled).to.be.false;
      expect(singlePaneModal.props().closeOnClickOut).to.be.true;
      expect(singlePaneModal.props().isFullscreen).to.be.false;
      expect(singlePaneModal.props().modalSize).to.equal('xlg');
      expect(singlePaneModal.props().isMulti).to.be.false;

      singlePaneModal.props().onAccept();
      expect(publish.calledOnce).to.be.true;

      beforeDismiss.resetHistory();
      singlePaneModal.props().beforeDismiss();
      expect(beforeDismiss.calledOnce).to.be.true;
    });

    it('should update state when unsaved containers are deleted in SelectedInventory component', () => {
      modal = shallow(<InventorySelectorModal modalOpen title="test" beforeDismiss={() => {}} />);
      modal.instance().showModal(publishParams);
      modal.instance().onSelectedContainerChange({ ct123: true, ct456: true });
      let selectedInventory = modal.find(SelectedInventory);
      expect(selectedInventory.props().containerSelectionMap.toJS()).to.deep.equal({ test: [], ct123: [], ct456: [] });

      selectedInventory.props().onSelectionDeleted('ct123');
      selectedInventory.props().onClick();
      selectedInventory = modal.find(SelectedInventory);
      expect(selectedInventory.props().containerSelectionMap.toJS()).to.deep.equal({ test: [], ct456: [] });
    });

    it('should update state when unsaved aliquots are deleted in SelectedInventory component', () => {
      sandbox.stub(AliquotActions, 'fetch_by_container').returns({
        done: cb => {
          cb({});
          return { fail: () => ({}) };
        }
      });
      sandbox.stub(AliquotStore, 'getByContainer').returns(Immutable.fromJS([{ id: 'aq123', well_idx: 0, volume_ul: 10, mass_mg: null }]));
      modal = shallow(<InventorySelectorModal modalOpen title="test" beforeDismiss={() => {}} />);
      modal.instance().showModal({ ...publishParams, selectionType: 'ALIQUOT+' });
      let selectedInventory = modal.find(SelectedInventory);
      modal.instance().onAllWellsSelected('ct123', true);
      modal.instance().onAllWellsSelected('ct456', true);
      modal.update();

      selectedInventory.props().onSelectionDeleted('ct123');
      selectedInventory = modal.find(SelectedInventory);
      expect(selectedInventory.props().wellSelectionMap.toJS()).to.deep.equal({ test: [], ct456: [0] });
    });
  });
});
