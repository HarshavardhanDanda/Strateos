import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import Immutable from 'immutable';
import ContainerTypeActions from 'main/actions/ContainerTypeActions';
import { LocationTreeLogic } from 'main/components/LocationTree';
import LocationActions from 'main/actions/LocationActions';
import NotificationActions from 'main/actions/NotificationActions';
import LocationStore from 'main/stores/LocationStore';
import ContainerAPI from 'main/api/ContainerAPI';
import LocationsAPI from 'main/api/LocationsAPI';
import LocationSelectorModal, { LocationSelector, LocationAssignmentModal } from './LocationSelectorModal';

const locationBoxMock = {
  id: 'location-box',
  location_type: { category: 'box' }
};

describe('LocationSelectorModal', () => {
  let component;
  const sandbox = sinon.createSandbox();
  let locationStoreStub;

  beforeEach(() => {
    locationStoreStub = sandbox.stub(LocationStore, 'getById');
    locationStoreStub.withArgs('location-box').returns(Immutable.fromJS(locationBoxMock));
  });

  afterEach(() => {
    if (component) {
      component.unmount();
    }
    sandbox.restore();
  });

  it('should render without error', () => {
    return shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId="location-1"
      />
    );
  });

  it('should initialize the state correctly', () => {
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId="location-id"
      />
    );

    expect(component.state()).to.deep.equal({
      nodeState: Immutable.fromJS({
        null: {
          isRoot: true,
          isOpen: true
        }
      }),
      initialLocation: undefined,
      locationId: 'location-id',
      suggestedLocation: undefined,
      loadingLocation: true,
      loadingSuggestion: false,
      allotedLocations: undefined,
      overrideReason: null,
      showOverrideReason: false
    });
  });

  it('should load all ContainerTypes when modal is opened', () => {
    const containerTypeSpy = sandbox.spy(ContainerTypeActions, 'loadAll');
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId="location-id"
      />
    );
    component.instance().onOpen();
    expect(containerTypeSpy.calledOnce).to.be.true;
  });

  it('should call getSuggestedLocation when modal is opened', () => {
    sandbox.stub(LocationsAPI, 'pickLocationForContainer').returns({
      done: (cb) => {
        cb({
          location: { id: 'location-id' }
        });
      }
    });
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId="location-id"
      />
    );
    const getSuggestedLocationSpy = sandbox.spy(component.instance(), 'getSuggestedLocation');
    component.instance().onOpen();
    expect(getSuggestedLocationSpy.called).to.be.true;
    expect(component.state().suggestedLocation.id).to.be.equal('location-id');
    expect(component.state().loadingSuggestion).to.be.equal(false);
    expect(component.state().locationId).to.be.equal('location-id');
  });

  it('should fetch locations when modal is opened', () => {
    const fetchLocationsSpy = sandbox.spy(LocationSelector.prototype, 'fetchLocations');
    const loadAndFocusLocationSpy = sandbox.spy(LocationSelector.prototype, 'loadAndFocusLocation');
    sandbox.stub(LocationsAPI, 'loadDeep').returns({
      always: () => {}
    });
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId="location-id"
      />
    );
    component.instance().onOpen();
    expect(fetchLocationsSpy.called).to.be.true;
    expect(loadAndFocusLocationSpy.called).to.be.true;
  });

  it('should call onTreeSelect when a location is selected', () => {
    const onTreeSelectSpy = sandbox.spy(LocationSelector.prototype, 'onTreeSelect');
    const nodeState = Immutable.fromJS({
      null: {
        isOpen: true,
        isSelected: false
      },
      undefined: {
        isBusy: false,
        isSelected: false
      },
      locationId: {
        isSelected: true,
        isBusy: false
      }
    });

    locationStoreStub.withArgs('locationId').returns(Immutable.fromJS({
      id: 'locationId',
      location_type: { category: 'box' },
      parent_id: 'parent_id'
    }));
    sandbox.stub(LocationActions, 'loadLocation').returns({
      always: () => {},
      done: () => {}
    });
    sandbox.stub(LocationsAPI, 'loadDeepContainers').returns({
      always: () => {}
    });
    sandbox.stub(LocationTreeLogic, 'setBusy').returns(nodeState);
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId="locationId"
        onSelect={onTreeSelectSpy}
      />);

    component.find('LocationTree').props().onSelect('locationId');
    expect(onTreeSelectSpy.called).to.be.true;
    expect(component.state().nodeState).to.deep.equal(nodeState);
  });

  it('should call onTreeOpen when a location selected', () => {
    const nodeState = Immutable.fromJS({
      null: {
        isOpen: false,
        isSelected: false
      },
      undefined: {
        isBusy: false,
        isSelected: false
      },
      locationId: {
        isSelected: true,
        isBusy: false
      }
    });
    const onTreeOpenSpy = sandbox.spy(LocationSelector.prototype, 'onTreeOpen');
    sandbox.stub(LocationTreeLogic, 'setOpen').returns(nodeState);
    sandbox.stub(LocationTreeLogic, 'isOpen').returns(true);
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId="locationId"
        onOpen={onTreeOpenSpy}
      />);
    component.find('LocationTree').props().onOpen('locationId');
    expect(onTreeOpenSpy.called).to.be.true;
    expect(component.state().nodeState).to.deep.equal(nodeState);
  });

  it('should display location tree', () => {
    component = shallow(
      <LocationSelector />
    );
    expect(component.find('Card').length).to.equal(1);
    expect(component.find('LocationTree').length).to.equal(1);
  });

  it('should filter locations by lab when labIdForFilter is present', () => {
    const locationsByLabIdSpy = sandbox.spy(LocationStore, 'locationsByLabId');
    component = shallow(
      <LocationSelector
        labIdForFilter={'lab-id'}
      />
    );
    expect(locationsByLabIdSpy.calledOnce).to.be.true;
    expect(locationsByLabIdSpy.args[0][0]).to.equal('lab-id');
  });

  it('should fetch all locations when labIdForFilter is not present', () => {
    const getAllSpy = sandbox.spy(LocationStore, 'getAll');
    component = shallow(
      <LocationSelector />
    );
    expect(getAllSpy.calledOnce).to.be.true;
  });

  it('should have input to search the locations', () => {
    component = shallow(<LocationSelector />);
    const topBar  = component.find('ConnectedSinglePaneModal').props().bannerRenderer();
    const topBarWrapper = shallow(topBar);
    const input = topBarWrapper.find('LocationSearch');
    expect(input.length).to.equal(1);
    topBarWrapper.unmount();
  });

  it('should have LocationKey when container is present', () => {
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId="location-1"
      />
    );
    const topBar  = component.find('ConnectedSinglePaneModal').props().bannerRenderer();
    const topBarWrapper = shallow(topBar);
    expect(topBarWrapper.find('LocationKey').length).to.equal(1);
    topBarWrapper.unmount();
  });

  it('should call onBoxPositionClick when a box is selected', () => {
    locationStoreStub.withArgs('location-1').returns(Immutable.fromJS({
      id: 'location-1',
      location_type: { category: 'box' } }));
    sandbox.stub(LocationStore, 'isBoxLoaded').returns(true);
    sandbox.stub(LocationStore, 'boxDimensions').returns({ numRows: 3, numCols: 4 });
    sandbox.stub(LocationStore, 'find').returns(Immutable.fromJS({
      id: 'location-1',
      location_type: { category: 'box' } }));
    sandbox.stub(LocationStore, 'nextAvailableLocations').returns(Immutable.fromJS({ id: 'loc2', row: '0', col: '2' }));

    const onBoxPositionClickSpy = sandbox.spy(LocationSelector.prototype, 'onBoxPositionClick');

    component = shallow(
      <LocationSelector
        initialLocationId="location-1"
        prohibitedContainers={Immutable.Set()}
        canSelectContainer
        updateMultipleLocations={() => {}}
      />
    );
    const box = component.find('Box');
    expect(box.length).to.equal(1);
    expect(component.find('h2').text()).to.equal('location-1');
    box.props().onPositionClick(undefined, 4);
    expect(onBoxPositionClickSpy.called).to.be.true;
    expect(onBoxPositionClickSpy.args[0][0]).to.equal(undefined);
    expect(onBoxPositionClickSpy.args[0][1]).to.equal(4);
  });

  it('should have button to submit the location', () => {
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId={null}
      />
    );
    const modal = component.find('ConnectedSinglePaneModal').dive().find('SinglePaneModal');
    expect(modal.props().acceptText).to.equal('Select location');
  });

  it('should disable button when selected location is prohibited', () => {
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId={'location-1'}
        prohibitedLocations={Immutable.Set('location-1')}
      />
    );
    const modal = component.find('ConnectedSinglePaneModal').dive().find('SinglePaneModal');
    expect(modal.props().acceptBtnDisabled).to.be.true;
  });

  it('should call onSelect when clicked on submit location button', () => {
    locationStoreStub.withArgs('location-1').returns(Immutable.fromJS({}));
    const onSelectSpy = sandbox.spy(LocationSelector.prototype, 'onSelect');
    sandbox.stub(ContainerAPI, 'logOverrideReason');
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId={'location-1'}
      />
    );
    const modal = component.find('ConnectedSinglePaneModal').dive().find('SinglePaneModal');
    modal.props().onAccept();
    expect(onSelectSpy.called).to.be.true;
  });

  it('should request reason when overriding suggested location', () => {
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId={'location-1'}
      />
    );
    component.setState({ suggestedLocation: { id: 'location-2' } });
    const modal = () => component.find('ConnectedSinglePaneModal').dive().find('SinglePaneModal');
    modal().props().onAccept();
    expect(modal().find('Banner').props().bannerMessage).to.equal('Please describe why the suggested location is not adequate.');
    expect(modal().find('TextInput').props().placeholder).to.equal('Enter reason');
  });

  it('should save entered reason for overriding suggested location', () => {
    const logOverrideReasonSpy = sandbox.spy(ContainerAPI, 'logOverrideReason');
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId={'location-1'}
      />
    );
    component.setState({ suggestedLocation: { id: 'location-2' } });
    const modal = () => component.find('ConnectedSinglePaneModal').dive().find('SinglePaneModal');
    modal().props().onAccept();
    modal().find('TextInput').simulate('change', { target: { value: 'Not cold enough!' } });
    modal().props().onAccept();
    expect(logOverrideReasonSpy.called).to.be.true;
  });

  it('should call containersByBoxPosition to get the position for the container', () => {
    locationStoreStub.withArgs('location-1').returns(Immutable.fromJS({
      id: 'location-1',
      location_type: { category: 'box' } }));
    sandbox.stub(LocationStore, 'isBoxLoaded').returns(true);
    sandbox.stub(LocationStore, 'boxDimensions').returns({ numRows: 3, numCols: 4 });
    sandbox.stub(LocationStore, 'find').returns(Immutable.fromJS({
      id: 'location-1',
      location_type: { category: 'box' } }));
    sandbox.stub(LocationStore, 'nextAvailableLocations').returns(Immutable.fromJS({ id: 'loc2', row: '0', col: '2' }));
    const containersByBoxPositionSpy = sandbox.spy(LocationSelector.prototype, 'containersByBoxPosition');
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId={'location-1'}
      />
    );
    const box = component.find('Box');
    expect(box.length).to.equal(1);
    expect(containersByBoxPositionSpy.called).to.be.true;
  });

  it('should not call loadLocation when initialLocationId prop is null', () => {
    const loadLocationByIdSpy = sandbox.spy(LocationActions, 'loadLocation');
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId={null}
      />
    );
    expect(loadLocationByIdSpy.calledOnce).to.be.false;
  });

  it('should call loadLocation when initialLocationId prop is not null', () => {
    const loadLocationByIdSpy = sandbox.spy(LocationActions, 'loadLocation');
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId="location-id"
      />
    );
    expect(loadLocationByIdSpy.calledOnce).to.be.true;
  });

  it('should reset locationId to initialLocationId when opening modal', () => {
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId="location-id"
      />
    );

    const getInitialStateSpy = sinon.spy(component.instance(), 'getInitialState');

    component.instance().onOpen();

    expect(getInitialStateSpy.calledOnce).to.equal(true);
    expect(component.state().locationId).to.equal('location-id');

    component.setState({ locationId: 'some-other-id' });
    component.instance().onOpen();

    expect(getInitialStateSpy.calledTwice).to.equal(true);
    expect(component.state().locationId).to.equal('location-id');
  });

  it('should send a notification when container has a blacklisted hazard', () => {
    locationStoreStub.withArgs('location-1').returns(Immutable.fromJS({ blacklist: ['flammable'] }));
    const notificationActionsSpy = sandbox.stub(NotificationActions, 'createNotification');
    const logOverrideReasonSpy = sandbox.spy(ContainerAPI, 'logOverrideReason');
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id', hazards: ['flammable'] })}
      />
    );
    component.setState({ suggestedLocation: { id: 'location-1' }, locationId: 'location-1' });
    const modal = component.find('ConnectedSinglePaneModal').dive().find('SinglePaneModal');
    modal.props().onAccept();
    expect(notificationActionsSpy.calledOnce).to.be.true;
    expect(logOverrideReasonSpy.called).to.be.false;
    expect(notificationActionsSpy.args[0][0].text).to.eql('This location is blacklisted for this container');
  });

  it('should not send a notification when container has no blacklisted hazard', () => {
    locationStoreStub.withArgs('location-1').returns(Immutable.fromJS({
      id: 'location-1',
      blacklist: ['strong base'],
      location_type: { category: 'box' } }));
    const notificationActionsSpy = sandbox.stub(NotificationActions, 'createNotification');
    const logLocationPickSuccessSpy = sandbox.spy(ContainerAPI, 'logLocationPickSuccess');
    component = shallow(
      <LocationSelector
        container={Immutable.fromJS({ id: 'container-id', hazards: ['flammable'] })}
      />
    );
    component.setState({ suggestedLocation: { id: 'location-1' }, locationId: 'location-1' });
    const modal = component.find('ConnectedSinglePaneModal').dive().find('SinglePaneModal');
    modal.props().onAccept();
    expect(notificationActionsSpy.called).to.be.false;
    expect(logLocationPickSuccessSpy.called).to.be.true;
  });

  it('should set custom modalId if specified', () => {
    component = shallow(
      <LocationSelector
        modalId="custom-modal-id"
        container={Immutable.fromJS({ id: 'container-id' })}
        initialLocationId="location-id"
      />
    );
    expect(component.find('ConnectedSinglePaneModal').props().modalId).to.equal('custom-modal-id');
  });

  describe('LocationSelectorModal', () => {
    it('should initiate selector modal correctly', () => {
      component = shallow(
        <LocationSelectorModal />
      );
      expect(component.props()).to.deep.include({
        isAssignment: false,
        disableDetails: true,
        container: null
      });
      expect(LocationSelectorModal.MODAL_ID).to.equal('LOCATION_SELECTOR_MODAL');
    });

    it('should set default modalId on SinglePaneModal if not specified in props', () => {
      component = shallow(
        <LocationSelectorModal />
      );
      expect(component.find('LocationSelector').dive().find('ConnectedSinglePaneModal').props().modalId).to.equal('LOCATION_SELECTOR_MODAL');
    });

    it('should allow selection of box', () => {
      component = shallow(
        <LocationSelectorModal initialLocationId="location-box" />
      );
      const modal = component.find('LocationSelector').dive().find('ConnectedSinglePaneModal').dive()
        .find('SinglePaneModal');
      expect(modal.props().acceptBtnDisabled).to.be.false;
    });
  });

  describe('LocationAssignmentModal', () => {
    it('should initiate assignment modal correctly', () => {
      component = shallow(
        <LocationAssignmentModal />
      );
      expect(component.props()).to.deep.include({
        isAssignment: true
      });
      expect(LocationAssignmentModal.MODAL_ID).to.equal('LOCATION_ASSIGNMENT_MODAL');
    });

    it('should set default modalId on SinglePaneModal, that includes container id, if not specified in props', () => {
      component = shallow(
        <LocationAssignmentModal
          container={Immutable.fromJS({ id: 'container-id' })}
        />
      );
      expect(component.find('LocationSelector').dive().find('ConnectedSinglePaneModal').props().modalId).to.equal('LOCATION_ASSIGNMENT_MODALcontainer-id');
    });

    it('should allow assignment to box cell, but NOT the box itself', () => {
      component = shallow(
        <LocationAssignmentModal initialLocationId="location-box" />
      );
      const modal = component.find('LocationSelector').dive().find('ConnectedSinglePaneModal').dive()
        .find('SinglePaneModal');
      expect(modal.props().acceptBtnDisabled).to.be.true;
    });
  });
});
