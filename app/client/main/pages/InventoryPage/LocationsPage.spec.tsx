import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import FeatureConstants from '@strateos/features';
import LocationsPane, { LocationExplorer } from 'main/pages/InventoryPage/LocationsPage';
import FeatureStore from 'main/stores/FeatureStore';
import ContainerActions from 'main/actions/ContainerActions';
import PathActions from 'main/inventory/locations/PathActions';
import LocationTypeActions from 'main/actions/LocationTypeActions';
import NotificationActions from 'main/actions/NotificationActions';
import LocationStore from 'main/stores/LocationStore';

describe('LocationsPage', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const containers =  [
    {
      barcode: '687887',
      container_type_shortname: 'micro-1.5',
      container_type_id: 'micro-1.5',
      location_id: 'loc1arp7mm9ys2a478r',
      organization_id: 'org13',
      status: 'available',
      label: 'Tube 9644_5',
      is_tube: true,
      id: 'ct1arwp8rsmunqe3eu',
      lab: {
        id: 'lb1fknzm4kjxcvg'
      },
      hazards: ['flammable']
    }
  ];
  const box_location = Immutable.fromJS({
    ancestors: [
      {
        id: 'loc1arp7mm3uzefvyyss',
        name: 'location_test',
      }
    ],
    row: 1,
    col: 1,
    location_type: {
      id: 'loctyp19639bajergr',
      name: 'tube_cell',
      category: 'box_cell'
    },
    name: 'Row: 2 Col: 2',
    lab_id: 'lb1fknzm4kjxcvg',
    parent_id: 'loc1arp7mm3uzefvyys',
    containers: containers,
    location_type_id: 'loctyp19639bajergr',
    human_path: 'location_test_9644 --> Row: 2 Col: 2',
    parent_path: ['loc1arp7mm3uzefvyys'],
    id: 'loc1arp7mm9ys2a478r',
    blacklist: ['flammable'],
    children: []
  });

  const props = {
    location: box_location,
    enclosingLocation: Immutable.Map(),
    subLocations: Immutable.List(),
    containers: Immutable.Seq(containers),
    containersByPosition: ()  => {},
    boxTypeHelper: () => {},
    currentContainer: Immutable.fromJS(containers[0]),
    currentBoxPosition: 11,
    shouldShowLocationDetails: false,
    shouldShowSearcher: false,
  };

  const locationPaneProps = {
    match: {
      path: '/:subdomain/inventory/locations/:locationId?',
      url: '/transcriptic/inventory/locations',
      isExact: true,
      params: {
        locationId: 'loctyp19639bajergr',
        subdomain: 'transcriptic'
      }
    },
    history: {
      action: 'PUSH',
      location: {
        pathname: '/transcriptic/inventory/locations',
        search: '',
        hash: '',
        key: 'opo0cb',
      }
    }
  };

  beforeEach(() => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab')
      .withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, 'lb1fknzm4kjxcvg')
      .returns(true);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  describe('LocationExplorer', () => {

    it('should render', () => {
      shallow(<LocationExplorer {...props} />);
    });

    it('should navigate to the relocated location only when the container can be relocated', () => {
      const containerRelocateStub = sandbox.stub(ContainerActions, 'relocate').returns({
        then: (cb) => {
          cb();
          return { fail: () => {} };
        }
      });

      const navigateSpy = sandbox.stub(PathActions, 'navigate');
      wrapper = mount(<LocationExplorer {...props} />);
      const locationAssigmentModal = wrapper.find('LocationAssignmentModal');
      locationAssigmentModal.prop('onLocationSelected')('loc1arp7mm3uzefvzas');

      expect(navigateSpy.calledOnce).to.be.true;
      expect(containerRelocateStub.calledOnceWith('ct1arwp8rsmunqe3eu', 'loc1arp7mm3uzefvzas')).to.be.true;
    });

    it('should not navigate when the container cannot be relocated to the selected location', () => {
      sandbox.stub(ContainerActions, 'relocate').returns({
        then: () => {
          return { fail: () => {} };
        }
      });

      const navigateSpy = sandbox.stub(PathActions, 'navigate');
      wrapper = mount(<LocationExplorer {...props} />);
      const locationAssigmentModal = wrapper.find('LocationAssignmentModal');
      locationAssigmentModal.prop('onLocationSelected')('loc1arp7mm3uzefvzas');

      expect(navigateSpy.called).to.be.false;
    });

    it('should not relocate a container and should send a notification when container has a blacklisted hazard', () => {
      const locationStoreStub = sandbox.stub(LocationStore, 'getById');
      locationStoreStub.withArgs('loc1arp7mm9ys2a478r').returns(Immutable.fromJS({ blacklist: ['flammable'] }));
      const notificationActionsStub = sandbox.stub(NotificationActions, 'createNotification');

      wrapper = shallow(<LocationExplorer {...props} />);
      const modal = wrapper.find('LocationAssignmentModal').dive()
        .find('LocationSelector').dive()
        .find('ConnectedSinglePaneModal')
        .dive()
        .find('SinglePaneModal');
      modal.props().onAccept();
      expect(notificationActionsStub.calledOnce).to.be.true;
      expect(notificationActionsStub.args[0][0].text).to.eql('This location is blacklisted for this container');
    });
  });

  describe('LocationsPane', () => {
    let locationTypeActionsStub;
    let wrapper;

    beforeEach(() => {
      locationTypeActionsStub = sandbox.stub(LocationTypeActions, 'loadAll').returns({
        then: (cb) => {
          cb();
          return { fail: () => {} };
        }
      });
    });

    afterEach(() => {
      if (wrapper) {
        wrapper.unmount();
      }
      sandbox.restore();
    });

    it('should render locations pane', () => {
      shallow(<LocationsPane {...locationPaneProps} />);
    });

    it('should call the locationType action in the init method when the match params are changed', () => {
      wrapper = mount(<LocationsPane {...locationPaneProps} />);
      expect(locationTypeActionsStub.calledOnce).to.be.true;
      wrapper.setProps({ match: { ...locationPaneProps.match, params: { locationId: 'loc1234', subdomain: 'test' } } });
      expect(locationTypeActionsStub.calledTwice).to.be.true;
    });

    it('should not call the locationType action in the init method when the match params are same', () => {
      wrapper = mount(<LocationsPane {...locationPaneProps} />);
      expect(locationTypeActionsStub.calledOnce).to.be.true;
      wrapper.setProps({ ...locationPaneProps });
      expect(locationTypeActionsStub.calledOnce).to.be.true;
    });
  });
});
