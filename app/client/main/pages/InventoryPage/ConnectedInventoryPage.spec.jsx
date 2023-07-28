import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import SessionStore from 'main/stores/SessionStore';
import OrganizationStore from 'main/stores/OrganizationStore';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import ModalActions from 'main/actions/ModalActions';
import StructureSearchModal from 'main/pages/CompoundsPage/StructureSearchModal';
import ShipmentActions from 'main/actions/ShipmentActions';
import FeatureStore from 'main/stores/FeatureStore';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import ContainerActions from 'main/actions/ContainerActions';
import OrgCollaborationsActions from 'main/actions/OrgCollaborationsActions';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import InventoryUtil from 'main/inventory/inventory/util/InventoryUtil';
import ContainerStore from 'main/stores/ContainerStore';
import LocationStore from 'main/stores/LocationStore';
import UserStore from 'main/stores/UserStore';
import ShippingCartActions from 'main/actions/ShippingCartActions';
import BulkActionReportModal from 'main/components/BulkActionReportModal';
import BulkActionLoaderModal from 'main/components/BulkActionLoaderModal';
import { threadBounce } from 'main/util/TestUtil';
import CommonUiUtil from 'main/util/CommonUiUtil';
import FileUtil from 'main/util/FileUtil';
import mockBulkRequestResponsePartialSuccess from 'main/test/container/bulkActions/mockBulkRequestResponsePartialSuccess.json';
import mockMultiTransferResponseAllSuccess from 'main/test/container/bulkActions/mockMultiTransferResponseAllSuccess.json';
import mockBulkDownloadResponsePartialSuccess from 'main/test/container/bulkActions/mockBulkDownloadResponsePartialSuccess.json';
import mockBulkDownloadResponseAllSuccess from 'main/test/container/bulkActions/mockBulkDownloadResponseAllSuccess.json';
import mockMultiRelocateResponseAllSuccess from 'main/test/container/bulkActions/mockMultiRelocateResponseAllSuccess.json';
import mockBulkDownloadResponseFailedWithErrors500 from 'main/test/container/bulkActions/mockBulkDownloadResponseFailedWithErrorsCode500.json';
import mockBulkDownloadResponseFailedWithErrors400 from 'main/test/container/bulkActions/mockBulkDownloadResponseFailedWithErrorsCode400.json';
import UserPreference from 'main/util/UserPreferenceUtil';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import NotificationActions from 'main/actions/NotificationActions';
import InventoryPage from './index';
import ConnectedInventoryPage, { getStateFromStores } from './ConnectedInventoryPage';
import BulkActionReportUtil from './BulkActionReportUtil';

const props = {
  match: {
    params: { subdomain: 'transcriptic' },
    path: '/:subdomain/inventory/samples'
  },
  history: {},
};

const mockLabConsumer = (lbcId, orgId) => {
  return {
    id: `${lbcId}`,
    organization: {
      id: `${orgId}` }
  };
};

const parentLocation = {
  id: 'parent-loc',
  name: 'Parent Location',
  location_type: {
    category: 'tube_box_rack'
  },
  lab_id: 'lab1'
};

const c1 = Immutable.Map({
  id: 'c1',
  label: 'Loo',
  status: 'pending',
  container_type_id: 'ct1',
  lab: Immutable.Map({
    id: 'lab1'
  })
});

describe('ConnectedInventoryPage', () => {
  const sandbox = sinon.createSandbox();
  let connectedInventoryPage;
  const searchOptions = Immutable.Map();
  const search = Immutable.fromJS({
    results: [{ id: 'foobar' }]
  });
  let loadAllShipments;
  let getLabIds;
  let loadLabConsumersByLab;
  let loadOrgCollaborations;
  let findBySubdomain;
  let bulkRequestStub;
  let bulkPollStub;
  let notificationActionsStub;

  beforeEach(() => {
    loadAllShipments = sandbox.stub(ShipmentActions, 'loadAll');
    getLabIds = sandbox.stub(FeatureStore, 'getLabIds').returns([]);
    loadLabConsumersByLab = sandbox.stub(LabConsumerActions, 'loadLabConsumersByLab').returns([]);
    loadOrgCollaborations = sandbox.stub(OrgCollaborationsActions, 'loadOrgCollaborations')
      .returns({ then: () => {} });
    findBySubdomain = sandbox.stub(OrganizationStore, 'findBySubdomain');
    findBySubdomain.withArgs('transcriptic').returns(Immutable.fromJS({ id: 'org13', container_stats: { total: 2 } }));
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic' }));
    bulkRequestStub = sandbox.stub(ContainerActions, 'bulkRequest').returns({
      then: (cb) => {
        cb('request123');
        return { fail: () => ({}) };
      },
    });
    notificationActionsStub = sandbox.stub(NotificationActions, 'createNotification');
    bulkPollStub = sandbox.stub(ContainerActions, 'pollForBulkRequest').returns({
      then: (cb) => {
        cb(mockBulkRequestResponsePartialSuccess);
        return { fail: () => ({}) };
      },
    });
    sandbox.stub(UserStore, 'getById').returns(Immutable.fromJS({ id: 'u123', name: 'Users Name' }));
  });

  afterEach(() => {
    connectedInventoryPage.unmount();
    sandbox.restore();
    sinon.restore();
    LabConsumerStore._empty();
  });

  it('should show organization filter if there are lab consumers', () => {
    findBySubdomain.restore();
    findBySubdomain = sandbox.stub(OrganizationStore, 'findBySubdomain');
    findBySubdomain.withArgs('transcriptic').returns(Immutable.fromJS({ id: 'org13', container_stats: { total: 2 } }));
    LabConsumerStore._receiveData([mockLabConsumer('lbc1', 'org13'), mockLabConsumer('lbc1', 'org14')]);
    connectedInventoryPage = shallow(
      <ConnectedInventoryPage
        hasResults={false}
        search={search}
        selected={[]}
        searchOptions={searchOptions}
        {...getStateFromStores()}
      />
    );
    connectedInventoryPage.setState({ isLoading: false, hasResults: true });
    expect(connectedInventoryPage.prop('showOrgFilter')).to.equal(true);
  });

  it('should show organization filter if there is 1 lab consumer and the org id is not the same', () => {
    findBySubdomain.restore();
    findBySubdomain = sandbox.stub(OrganizationStore, 'findBySubdomain');
    findBySubdomain.withArgs('transcriptic').returns(Immutable.fromJS({ id: 'org12', container_stats: { total: 2 } }));
    LabConsumerStore._receiveData([mockLabConsumer('lbc1', 'org13')]);
    connectedInventoryPage = shallow(
      <ConnectedInventoryPage
        hasResults={false}
        search={search}
        selected={[]}
        searchOptions={searchOptions}
        {...getStateFromStores()}
      />
    );
    connectedInventoryPage.setState({ isLoading: false, hasResults: true });
    expect(connectedInventoryPage.prop('showOrgFilter')).to.equal(true);
  });

  it('should not show organization filter if there is no lab consumer', () => {
    findBySubdomain.restore();
    findBySubdomain = sandbox.stub(OrganizationStore, 'findBySubdomain');
    findBySubdomain.withArgs('transcriptic').returns(Immutable.fromJS({ id: 'org12', container_stats: { total: 2 } }));
    connectedInventoryPage = shallow(
      <ConnectedInventoryPage
        hasResults={false}
        search={search}
        selected={[]}
        searchOptions={searchOptions}
        {...getStateFromStores()}
      />
    );
    connectedInventoryPage.setState({ isLoading: false, hasResults: true });
    expect(connectedInventoryPage.prop('showOrgFilter')).to.equal(false);
  });

  it('should contain AddContainerModal', () => {
    connectedInventoryPage = shallow(<ConnectedInventoryPage {...props} />);
    const addContainerModal = connectedInventoryPage.find('AddContainerModal');
    expect(addContainerModal).to.exist;
  });

  it('should contain AddContainersToShipmentModal', () => {
    connectedInventoryPage = shallow(<ConnectedInventoryPage {...props} />);
    const addContainerModal = connectedInventoryPage.find('AddContainersToShipmentModal');
    expect(addContainerModal).to.exist;
  });

  it('should open Modal to draw Chemical Structure when user clicks the Draw structure from child component', () => {
    const modalOpenStub = sandbox.stub(ModalActions, 'open').returns({});
    connectedInventoryPage = shallow(<ConnectedInventoryPage {...props} />);
    connectedInventoryPage.dive().find(InventoryPage).prop('onOpenStructureSearchModal')();

    expect(modalOpenStub.calledOnce).to.be.true;
    expect(modalOpenStub.args[0][0]).to.equal('STRUCTURE SEARCH MODAL');
  });

  it('should handle SMILE search change from Draw structure modal', () => {
    const actions = {
      onSearchSmileChange: sinon.stub()
    };
    connectedInventoryPage = shallow(<ConnectedInventoryPage {...props} actions={actions} />);
    connectedInventoryPage.dive().find(StructureSearchModal).prop('onSave')();
    connectedInventoryPage.update();
    expect(actions.onSearchSmileChange.calledOnce).to.be.true;
  });

  it('should make initial api and function calls when component loads',  async () => {
    const selected = ['ct123'];
    const search = Immutable.fromJS({ results: [{ id: 'ct123' }] });
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.Map({ id: 'ct123' }));
    connectedInventoryPage = mount(<ConnectedInventoryPage {...props} selected={selected} search={search} />);

    expect(loadAllShipments.calledOnce).to.be.true;
    expect(getLabIds.calledOnce).to.be.true;
    expect(loadLabConsumersByLab.called).to.be.true;
    expect(loadOrgCollaborations.called).to.be.true;
  });

  it('should set shippable flag to true if containers are shippable',  async () => {
    const search = Immutable.fromJS({ results: [{ id: 'ct123' }] });
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.fromJS({ id: 'ct123' }));
    sandbox.stub(ContainerStore, 'getByIds').returns(Immutable.fromJS([{ id: 'ct123' }]));
    sandbox.stub(ShippingCartActions, 'canContainersBeShipped').returns(true);
    connectedInventoryPage = mount(<ConnectedInventoryPage {...props} search={search} />);

    let inventoryPage = connectedInventoryPage.find('InventoryPage');
    const containerIds = ['ct123'];
    inventoryPage.props().setShippable(containerIds);
    await threadBounce(2);
    connectedInventoryPage.update();
    inventoryPage = connectedInventoryPage.find('InventoryPage');
    expect(inventoryPage.prop('isShippable')).is.true;
  });

  it('should set shippable flag to false if containers are not shippable',  async () => {
    const search = Immutable.fromJS({ results: [{ id: 'ct123' }] });
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.fromJS({ id: 'ct123' }));
    sandbox.stub(ContainerStore, 'getByIds').returns(Immutable.fromJS([{ id: 'ct123' }]));
    sandbox.stub(ShippingCartActions, 'canContainersBeShipped').returns(false);
    connectedInventoryPage = mount(<ConnectedInventoryPage {...props} search={search} />);

    let inventoryPage = connectedInventoryPage.find('InventoryPage');
    const containerIds = ['ct123'];
    inventoryPage.props().setShippable(containerIds);
    await threadBounce(2);
    connectedInventoryPage.update();
    inventoryPage = connectedInventoryPage.find('InventoryPage');
    expect(inventoryPage.prop('isShippable')).is.false;
  });

  it('should send extra props besides props from store to InventoryPage', () => {
    connectedInventoryPage = shallow(<ConnectedInventoryPage {...props} />);
    const inventoryPage = connectedInventoryPage.dive().find(InventoryPage);

    expect(inventoryPage.prop('selectedOnCurrentPage')).to.exist;
    expect(inventoryPage.prop('onOpenStructureSearchModal')).to.exist;
    expect(inventoryPage.prop('onTransferClick')).to.exist;
    expect(inventoryPage.prop('allResultIds')).to.exist;
    expect(inventoryPage.prop('setShippable')).to.exist;
    expect(inventoryPage.prop('isShippable')).to.exist;
    expect(inventoryPage.prop('deleteContainersInStore')).to.exist;
  });

  it('should set canTransferContainer prop to true if transfer feature exists', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.TRANSFER_CONTAINER).returns(true);
    connectedInventoryPage = shallow(<ConnectedInventoryPage {...props} />);
    const inventoryPage = connectedInventoryPage.dive().find(InventoryPage);
    expect(inventoryPage.prop('canTransferContainer')).to.be.true;
  });

  it('should set canTransferContainer prop to false if transfer feature does not exist', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.TRANSFER_CONTAINER).returns(false);
    connectedInventoryPage = shallow(<ConnectedInventoryPage {...props} />);
    const inventoryPage = connectedInventoryPage.dive().find(InventoryPage);
    expect(inventoryPage.prop('canTransferContainer')).to.be.false;
  });

  it('should open ContainerTransferModal if selection across pages is active', () => {
    const modalOpenSpy = sandbox.spy(ModalActions, 'open');
    connectedInventoryPage = mount(<ConnectedInventoryPage {...props} />);
    connectedInventoryPage.find(InventoryPage).prop('onSelectionAcrossPagesChange')(true, 3);
    connectedInventoryPage.update();
    connectedInventoryPage.find(InventoryPage).prop('onTransferClick')();
    const containerTransferModal = connectedInventoryPage.find('ContainerTransferModal');
    expect(containerTransferModal.prop('selection')).equals(3);
    expect(modalOpenSpy.calledOnce).to.be.true;
  });

  it('should open ContainerTransferModal with multi transfer', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.TRANSFER_CONTAINER).returns(true);
    const selected = ['foobar1', 'foobar2'];
    const modalOpenStub = sandbox.stub(ModalActions, 'open');
    connectedInventoryPage = shallow(<ConnectedInventoryPage {...props} selected={selected} />);
    const page = connectedInventoryPage.dive().find(InventoryPage);
    page.props().onTransferClick();
    expect(modalOpenStub.calledOnceWith('ContainerTransferModal')).to.be.true;
  });

  it('should contain LocationSelectorModal', () => {
    connectedInventoryPage = shallow(<ConnectedInventoryPage {...props} />);
    const locationSelectorModal = connectedInventoryPage.find('LocationAssignmentModal');
    expect(locationSelectorModal).to.exist;
  });

  it('should have correct props for LocationSelectorModal', () => {
    sandbox.stub(ContainerStore, 'getById')
      .returns(Immutable.fromJS({ id: 'ct123', label: 'container 1', lab_id: 'lb123' }));
    const selected = ['ct123', 'ct124'];
    const search = Immutable.fromJS({ results: [{ id: 'ct123' }, { id: 'ct124' }, { id: 'ct125' }]  });
    connectedInventoryPage = shallow(<ConnectedInventoryPage {...props} search={search} selected={selected} />);
    const locationSelectorModal = connectedInventoryPage.dive().find('LocationAssignmentModal');
    expect(locationSelectorModal.prop('labIdForFilter')).to.equal('lb123');
    expect(locationSelectorModal.prop('containersCount')).to.equal(2);
  });

  it('should display confirm message before calling relocate', () => {
    const confirmWithUserStub = sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(false);
    sandbox.stub(LocationStore, 'getById').returns(Immutable.fromJS({ name: 'Parent Location', id: 'parent-loc' }));
    connectedInventoryPage = shallow(<ConnectedInventoryPage
      {...props}
      search={Immutable.fromJS({
        results: [{ id: 'c1' }]
      })}
      selected={['c1']}
      selectedOnCurrentPage={sandbox.stub().returns([c1])}
      allResultIds={sandbox.stub().returns(Immutable.fromJS(['c1']))}
    />);

    connectedInventoryPage.dive().find('LocationAssignmentModal').props().updateMultipleLocations(parentLocation.id);
    expect(confirmWithUserStub.args[0][0]).to.equal('Are you sure you want to relocate 1 containers to Parent Location?');
  });

  it('should call multi relocate action when relocating multiple containers to a location on a single page', () => {
    const multiRelocateSpy = sandbox.spy(ContainerActions, 'relocateMany');
    sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(true);
    sandbox.stub(LocationStore, 'getById').returns(Immutable.fromJS({ name: 'Parent Location', id: 'parent-loc' }));
    connectedInventoryPage = shallow(<ConnectedInventoryPage
      {...props}
      search={Immutable.fromJS({
        results: [{ id: 'c1' }]
      })}
      selected={['c1']}
      selectedOnCurrentPage={sandbox.stub().returns([c1])}
      allResultIds={sandbox.stub().returns(Immutable.fromJS(['c1']))}
    />);
    connectedInventoryPage.dive().find('LocationAssignmentModal').props().updateMultipleLocations(parentLocation.id);
    expect(multiRelocateSpy.args[0][0]).to.deep.equal(['c1']);
  });

  it('should call bulk request action when relocating all containers across pages', () => {
    sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(true);
    sandbox.stub(LocationStore, 'getById').returns(Immutable.fromJS({ name: 'Parent Location', id: 'parent-loc' }));
    connectedInventoryPage = mount(<ConnectedInventoryPage {...props} />);
    connectedInventoryPage.find('InventoryPage').props().onSelectionAcrossPagesChange(true, 2);
    connectedInventoryPage.update();
    connectedInventoryPage.find('LocationAssignmentModal').props().updateMultipleLocations(parentLocation.id);

    expect(bulkRequestStub.args[0][0]).to.equal('relocate');
    expect(bulkRequestStub.args[0][2]).to.equal(2);
    expect(bulkRequestStub.args[0][3]).to.deep.equal({ location_id: 'parent-loc' });
  });

  it('should send updateMultipleLocations prop to the LocationAssignmentModal to select multiple locations in the rack ', () => {
    connectedInventoryPage = shallow(<ConnectedInventoryPage {...props} />);
    const locationSelectorModal = connectedInventoryPage.dive().find('LocationAssignmentModal');
    expect(locationSelectorModal.prop('updateMultipleLocations')).to.exist;
  });

  it('should save selected locationId as UserPreference while relocating containers', () => {
    const response = {
      data: {
        attributes: {
          result_success: [
            {
              id: 'test-container-id',
              location_id: parentLocation.id,
              errors: null
            }
          ],
          result_errors: []
        }
      }
    };
    sandbox.stub(ContainerActions, 'relocateMany').returns({
      done: (cb) => {
        cb(response);
        return {
          done: () => ({})
        };
      },
      fail: () => ({})
    });
    sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(true);
    sandbox.stub(LocationStore, 'getById').returns(Immutable.fromJS({ name: 'Parent Location', id: parentLocation.id }));
    const userPreferenceSaveStub = sandbox.stub(UserPreference, 'save');
    connectedInventoryPage = shallow(<ConnectedInventoryPage {...props} />);
    connectedInventoryPage.dive().find('LocationAssignmentModal').props().updateMultipleLocations(parentLocation.id);
    expect(userPreferenceSaveStub.called).to.be.true;
    expect(userPreferenceSaveStub.args[0][0][KeyRegistry.PREFERRED_CONTAINER_RELOCATION_ID]).to.equal(parentLocation.id);
  });

  it('should call doSearch after the user confirmation, while relocating containers', () => {
    const response = {
      data: {
        attributes: {
          result_success: [
            {
              id: 'test-container-id',
              location_id: parentLocation.id,
              errors: null
            }
          ],
          result_errors: []
        }
      }
    };
    sandbox.stub(ContainerActions, 'relocateMany').returns({
      done: (cb) => {
        cb(response);
      },
    });
    const doSearchStub = sandbox.stub();
    const updateStateStub = sandbox.stub();
    sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(true);
    sandbox.stub(LocationStore, 'getById').returns(Immutable.fromJS({ name: 'Parent Location', id: parentLocation.id }));
    connectedInventoryPage = shallow(
      <ConnectedInventoryPage
        {...props}
        actions={{
          doSearch: doSearchStub,
          updateState: updateStateStub
        }}
      />);
    connectedInventoryPage.dive().find('LocationAssignmentModal').props().updateMultipleLocations(parentLocation.id);
    expect(doSearchStub.calledOnce).to.be.true;
  });

  it('should pass preferred-container-relocation-id to LocationAssignmentModal', () => {
    const locationId = 'test-location-id';
    const userPreferenceGetStub = sandbox.stub(UserPreference, 'get').returns(locationId);
    connectedInventoryPage = shallow(<ConnectedInventoryPage {...props} />);
    const locationSelectorModal = connectedInventoryPage.dive().find('LocationAssignmentModal');

    expect(userPreferenceGetStub.called).to.be.true;
    expect(locationSelectorModal.props().initialLocationId).to.equal(locationId);
  });

  it('should send correct props to the ContainerTransferModal for rendering of the container names', () => {
    sandbox.stub(ContainerStore, 'getById')
      .onFirstCall()
      .returns(Immutable.fromJS({ id: 'ct123', label: 'container 1' }))
      .onSecondCall()
      .returns(Immutable.fromJS({ id: 'ct456', label: 'container 2' }));
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.TRANSFER_CONTAINER).returns(true);
    const selected = ['ct123', 'ct456'];
    const modalOpenStub = sandbox.stub(ModalActions, 'open');

    connectedInventoryPage = shallow(<ConnectedInventoryPage {...props} selected={selected} />);
    const page = connectedInventoryPage.dive().find(InventoryPage);
    const containerTransferModal = connectedInventoryPage.dive().find('ContainerTransferModal');
    page.props().onTransferClick();
    expect(modalOpenStub.calledOnceWith('ContainerTransferModal')).to.be.true;
    expect(containerTransferModal.prop('selection')).equals(selected);
    expect(containerTransferModal.dive().find('TransferModal').prop('selectionDescription')).equals('container 1, container 2');
  });

  it('should call multi transfer action when transferring multiple containers on a single page', () => {
    const multiTransferSpy = sandbox.spy(ContainerActions, 'multiTransfer');
    const selected = ['ct-1'];
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.TRANSFER_CONTAINER).returns(true);
    sandbox.stub(BulkActionReportUtil, 'getHeaders').returns(['header']);
    connectedInventoryPage = mount(<ConnectedInventoryPage {...props} selected={selected} />);
    connectedInventoryPage.update();
    connectedInventoryPage.find('ContainerTransferModal').prop('onTransfer')('org-1');
    expect(multiTransferSpy.args[0][0]).to.deep.equal(['ct-1']);
    expect(multiTransferSpy.args[0][1]).to.deep.equal('org-1');
  });

  it('should call bulk request action when transferring all containers across pages', () => {
    connectedInventoryPage = mount(<ConnectedInventoryPage {...props} />);
    connectedInventoryPage.find(InventoryPage).prop('onSelectionAcrossPagesChange')(true, 3);
    connectedInventoryPage.update();
    connectedInventoryPage.find('ContainerTransferModal').prop('onTransfer')('org-1');
    expect(bulkRequestStub.args[0][0]).to.equal('transfer');
    expect(bulkRequestStub.args[0][2]).to.equal(3);
    expect(bulkRequestStub.args[0][3]).to.deep.equal({ organization_id: 'org-1' });
  });

  it('should have BulkActionReportModal with correct props', () => {
    connectedInventoryPage = shallow(<ConnectedInventoryPage {...props}  />);
    const bulkActionReport = connectedInventoryPage.dive().find('BulkActionReportModal');
    expect(bulkActionReport.prop('title')).to.eql('Bulk action report');
    expect(bulkActionReport.prop('fileText')).to.eql('');
    expect(bulkActionReport.prop('buttonText')).to.eql('close');
  });

  it('should set visibleColumns prop correctly', () => {
    sandbox.stub(InventoryUtil, 'getVisibleColumns').returns(['test']);
    connectedInventoryPage = shallow(<ConnectedInventoryPage {...props} />);
    const inventoryPage = connectedInventoryPage.dive().find(InventoryPage);
    expect(inventoryPage.prop('visibleColumns')).to.deep.equal(['test']);
  });

  const createPage = (extraProps = {}) => {
    connectedInventoryPage = mount(<ConnectedInventoryPage {...props} {...extraProps} />);
  };

  const triggerBulkAction = (action, triggerAction) => {
    if (triggerAction) {
      triggerAction();
    } else {
      connectedInventoryPage.find(InventoryPage).props().onBulkActionClick(action);
    }
    connectedInventoryPage.update();
  };

  const validateBulkReportModal = (action, expectations, extraProps, triggerAction) => {
    const { expectedHeaders, expectedErrorHeaders, expectedErrorBanner, expectedFileText } = expectations;
    const modalOpenSpy = sandbox.spy(ModalActions, 'open').withArgs('BULK_ACTION_REPORT_MODAL');
    createPage(extraProps);
    triggerBulkAction(action, triggerAction);

    const bulkActionReport = connectedInventoryPage.find(BulkActionReportModal);

    expect(bulkActionReport.prop('title')).to.eql('Bulk action report');
    expect(bulkActionReport.prop('headers')).to.deep.equal(expectedHeaders);
    expect(bulkActionReport.prop('errorHeaders')).to.deep.equal(expectedErrorHeaders);
    expect(bulkActionReport.prop('errorBanner')).to.equal(expectedErrorBanner);
    expect(bulkActionReport.prop('fileText')).to.eql(expectedFileText);
    expect(modalOpenSpy.calledOnceWithExactly('BULK_ACTION_REPORT_MODAL')).to.be.true;
  };

  const validateBulkActionLoaderModal = (action, extraProps) => {
    const modalOpenSpy = sandbox.spy(ModalActions, 'open').withArgs('BULK_ACTION_LOADER_MODAL');
    const modalCloseSpy = sandbox.spy(ModalActions, 'close').withArgs('BULK_ACTION_LOADER_MODAL');
    connectedInventoryPage = mount(<ConnectedInventoryPage {...props} {...extraProps} />);
    expect(connectedInventoryPage.find(BulkActionLoaderModal).length).to.equal(1);
    connectedInventoryPage.find(InventoryPage).props().onBulkActionClick(action);
    connectedInventoryPage.update();
    expect(modalOpenSpy.calledOnce).to.be.true;
    expect(modalCloseSpy.calledOnce).to.be.true;
  };

  const validateBulkActionFailure = (action, extraProps) => {
    bulkRequestStub.returns({
      then: () => ({
        fail: (cb) => cb({})
      }),
    });
    const modalCloseSpy = sandbox.spy(ModalActions, 'close').withArgs('BULK_ACTION_LOADER_MODAL');
    connectedInventoryPage = mount(<ConnectedInventoryPage {...props} {...extraProps} />);
    connectedInventoryPage.find(InventoryPage).props().onBulkActionClick(action);
    connectedInventoryPage.update();
    expect(modalCloseSpy.calledOnce).to.be.true;
  };

  it('should display BulkActionReportModal when successful transfer for multiple containers on page', () => {
    const selected = ['ct123', 'ct124'];
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.Map({ id: 'foo' }));
    sandbox.stub(ContainerActions, 'multiTransfer').returns({ done: (cb) => { cb(mockMultiTransferResponseAllSuccess); } });
    const triggerMultiplePerPageTransfer = () => {
      connectedInventoryPage.find('ContainerTransferModal').props().onTransfer('org-1');
    };
    validateBulkReportModal('multi_transfer', {
      expectedHeaders: ['Id', 'Label', 'Barcode', 'Status', 'Organization', 'Updated at', 'Reason'],
      expectedErrorHeaders: ['Reason'],
      expectedErrorBanner: 'One or more containers has invalid status or are scheduled for runs',
      expectedFileText: 'transfer_containers',
    }, { selected }, triggerMultiplePerPageTransfer);
  });

  it('should display BulkActionReportModal when successfully relocating containers to a location', () => {
    const selected = ['ct123', 'ct124'];
    sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(true);
    sandbox.stub(LocationStore, 'getById').returns(Immutable.fromJS({ name: 'Parent Location', id: 'parent-loc' }));
    sandbox.stub(ContainerActions, 'relocateMany').returns({ done: (cb) => { cb(mockMultiRelocateResponseAllSuccess); } });
    const triggerMultiplePerPageRelocate = () => {
      connectedInventoryPage.find('LocationAssignmentModal').props().updateMultipleLocations(parentLocation.id);
    };
    validateBulkReportModal('relocate_many', {
      expectedHeaders: ['Id', 'Label', 'Barcode', 'Status', 'Location', 'Updated at', 'Reason'],
      expectedErrorHeaders: ['Reason'],
      expectedErrorBanner: 'One or more containers could not be relocated',
      expectedFileText: 'relocate_containers',
    }, { selected }, triggerMultiplePerPageRelocate);
  });

  it('should display BulkActionReportModal when successful bulk transfer for selection across pages', () => {
    validateBulkReportModal('transfer', {
      expectedHeaders: ['Id', 'Label', 'Barcode', 'Status', 'Organization', 'Updated at', 'Reason'],
      expectedErrorHeaders: ['Reason'],
      expectedErrorBanner: 'One or more containers could not be transferred',
      expectedFileText: 'transfer_containers',
    });
  });

  it('should display BulkActionReportModal when successful bulk download for selection across pages', () => {
    bulkPollStub.returns({
      then: (cb) => {
        cb(mockBulkDownloadResponsePartialSuccess);
        return { fail: () => ({}) };
      },
    });
    sandbox.stub(FileUtil, 'downloadBlob');
    validateBulkReportModal('download', {
      expectedHeaders: ['Id', 'Label', 'Barcode', 'Status', 'Updated at', 'Reason'],
      expectedErrorHeaders: ['Reason'],
      expectedErrorBanner: 'One or more containers could not be downloaded',
      expectedFileText: 'download_containers',
    });
  });

  it('should display BulkActionReportModal when successful bulk destroy for selection across pages', () => {
    validateBulkReportModal('destroy', {
      expectedHeaders: ['Id', 'Label', 'Barcode', 'Status', 'Updated at', 'Reason'],
      expectedErrorHeaders: ['Reason'],
      expectedErrorBanner: 'One or more containers could not be destroyed',
      expectedFileText: 'destroy_containers',
    });
  });

  it('should display BulkActionReportModal when successful bulk delete for selection across pages', () => {
    validateBulkReportModal('delete', {
      expectedHeaders: ['Id', 'Label', 'Barcode', 'Status', 'Updated at', 'Reason'],
      expectedErrorHeaders: ['Reason'],
      expectedErrorBanner: 'One or more containers could not be deleted',
      expectedFileText: 'delete_containers',
    });
  });

  it('should display BulkActionReportModal when successful bulk relocate for selection across pages', () => {
    validateBulkReportModal('relocate', {
      expectedHeaders: ['Id', 'Label', 'Barcode', 'Status', 'Location', 'Updated at', 'Reason'],
      expectedErrorHeaders: ['Reason'],
      expectedErrorBanner: 'One or more containers could not be relocated',
      expectedFileText: 'relocate_containers',
    });
  });

  it('should display BulkActionLoaderModal when calling bulk transfer for selection across pages', () => {
    validateBulkActionLoaderModal('transfer');
  });

  it('should display BulkActionLoaderModal when calling bulk download for selection across pages', () => {
    bulkPollStub.returns({
      then: (cb) => {
        cb(mockBulkDownloadResponsePartialSuccess);
        return { fail: () => ({}) };
      },
    });
    sandbox.stub(FileUtil, 'downloadBlob');
    validateBulkActionLoaderModal('download');
  });

  it('should display BulkActionLoaderModal when calling bulk destroy for selection across pages', () => {
    validateBulkActionLoaderModal('destroy');
  });

  it('should display BulkActionLoaderModal when calling bulk delete for selection across pages', () => {
    validateBulkActionLoaderModal('delete');
  });

  it('should display BulkActionLoaderModal when calling bulk relocate for selection across pages', () => {
    validateBulkActionLoaderModal('relocate');
  });

  it('should handle bulk transfer request failure', () => {
    validateBulkActionFailure('transfer');
  });

  it('should handle bulk download request failure', () => {
    validateBulkActionFailure('download');
  });

  it('should handle bulk delete request failure', () => {
    validateBulkActionFailure('delete');
  });

  it('should handle bulk destroy request failure', () => {
    validateBulkActionFailure('destroy');
  });

  it('should handle bulk relocate request failure', () => {
    validateBulkActionFailure('relocate');
  });

  it('should download zip files on bulk action download if all result are successful', () => {
    bulkPollStub.returns({
      then: (cb) => {
        cb(mockBulkDownloadResponseAllSuccess);
        return { fail: () => ({}) };
      },
    });
    const blob = { type: 'text/csv', lastModifiedDate: new Date() };
    const base64ToBlobStub = sandbox.stub(FileUtil, 'base64ToBlob').returns(blob);
    const downloadBlobStub = sandbox.stub(FileUtil, 'downloadBlob');
    createPage();
    triggerBulkAction('download');
    expect(base64ToBlobStub.calledTwice).to.be.true;
    expect(downloadBlobStub.calledTwice).to.be.true;
    expect(base64ToBlobStub.getCall(0).args[0]).to.equal('aGV5IHRoZXJl');
    expect(base64ToBlobStub.getCall(1).args[0]).to.equal('d2hhdHMsdXA=');
    expect(downloadBlobStub.getCall(0).args[1]).to.equal('org-1_container-results.csv');
    expect(downloadBlobStub.getCall(1).args[1]).to.equal('org-2_container-results.csv');
  });

  it('should download zip files on bulk action download even if some result failed', () => {
    bulkPollStub.returns({
      then: (cb) => {
        cb(mockBulkDownloadResponsePartialSuccess);
        return { fail: () => ({}) };
      },
    });
    const base64ToBlobSpy = sandbox.spy(FileUtil, 'base64ToBlob');
    const downloadBlobStub = sandbox.stub(FileUtil, 'downloadBlob');
    createPage();
    triggerBulkAction('download');
    expect(base64ToBlobSpy.called).to.be.true;
    expect(downloadBlobStub.called).to.be.true;
  });

  it('should set Select all flag to inactive and reset count when Select all action is performed', () => {
    createPage();
    triggerBulkAction('destroy');
    const inventoryPage = connectedInventoryPage.find('InventoryPage');
    expect(inventoryPage.props().bulkSelectionCount).to.equal(0);
    expect(inventoryPage.props().isSelectionAcrossPagesActive).to.equal(false);
  });

  it('should display error title when bulk request failed_with_errors attribute returns a 500 status code', () => {
    bulkPollStub.returns({
      then: (cb) => {
        cb(mockBulkDownloadResponseFailedWithErrors500);
      },
    });
    createPage();
    connectedInventoryPage.find(InventoryPage).prop('onSelectionAcrossPagesChange')(true, 3);
    connectedInventoryPage.update();
    triggerBulkAction('download');

    expect(bulkRequestStub.args[0][0]).to.equal('download');
    expect(notificationActionsStub.calledOnce).to.be.true;
    expect(notificationActionsStub.args[0][0].text).to.equal('Internal Server Error');
  });

  it('should display error detail when bulk request failed_with_errors attribute returns any 4xx status code', () => {
    bulkPollStub.returns({
      then: (cb) => {
        cb(mockBulkDownloadResponseFailedWithErrors400);
      },
    });
    createPage();
    connectedInventoryPage.find(InventoryPage).prop('onSelectionAcrossPagesChange')(true, 3);
    connectedInventoryPage.update();
    triggerBulkAction('download');

    expect(bulkRequestStub.args[0][0]).to.equal('download');
    expect(notificationActionsStub.calledOnce).to.be.true;
    expect(notificationActionsStub.args[0][0].text).to.equal('User not authorized to perform this action');
  });
});
