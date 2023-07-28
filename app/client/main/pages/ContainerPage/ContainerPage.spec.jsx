import React from 'react';
import Immutable from 'immutable';
import sinon from 'sinon';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import _ from 'lodash';
import FeatureConstants from '@strateos/features';
import { Divider } from '@transcriptic/amino';

import ContainerAPI from 'main/api/ContainerAPI';
import UserActions from 'main/actions/UserActions';
import mockProperties from 'main/test/container/customProperties.json';
import mockConfigs from 'main/test/container/customPropertiesConfigs.json';
import { ContainerPage } from 'main/pages/ContainerPage/ContainerPage';
import SessionStore from 'main/stores/SessionStore';
import UserStore from 'main/stores/UserStore';
import ContainerActions from 'main/actions/ContainerActions';
import Urls from 'main/util/urls';
import AcsControls from 'main/util/AcsControls';
import ContextualCustomPropertiesConfigActions from 'main/actions/ContextualCustomPropertiesConfigActions';
import ContextualCustomPropertyConfigStore from 'main/stores/ContextualCustomPropertyConfigStore';
import CustomPropertyTable from './CustomPropertyTable';

const customProperties = Immutable.fromJS(mockProperties);
const customPropertiesConfigs = Immutable.fromJS(mockConfigs);

const containerObj = {
  aliquot_count: 2,
  barcode: undefined,
  container_type_id: '96-pcr',
  id: 'ct1et8cdx6bnmwr',
  label: 'pcr test',
  organization_id: 'org13',
  status: 'consumable',
  storage_condition: 'cold_4',
  test_mode: true,
  type: 'containers',
  lab: { id: 'lb1', name: 'lab1' }
};
const containerType = Immutable.Map({ col_count: 2 });

let ccpcStoreStub;
const container = Immutable.Map(containerObj);
const aliquots = Immutable.List([
  Immutable.fromJS({
    container_id: 'ct1et8cdx6bnmwr',
    id: 'aq1et8cdx7t3j52',
    name: 'A1',
    type: 'aliquots',
    volume_ul: '131.0',
    well_idx: 0
  }),
  Immutable.fromJS({
    container_id: 'ct1et8cdx6bnmwr',
    id: 'aq1et8cdx7t3j53',
    name: 'A2',
    type: 'aliquots',
    volume_ul: '131.0',
    well_idx: 1
  })
]);

const props = {
  match: { params: { containerId: 'containerId', wellIndex: 'A1' } },
  history: {
    push: () => {}
  },
  location: { pathname: '/org13/inventory/samples/ct' },
  containerType,
  container,
  aliquots,
  containerId: 'ct1et8cdx6bnmwr',
  inShippingCart: false,
  customProperties: Immutable.List(),
  containersInShippingCart: Immutable.List(container)
};

function getTestComponent(pr = props) {
  return  shallow(
    <ContainerPage {...pr} />
  );
}

describe('ContainerPage', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'subdomain' }));
    sandbox.stub(ContainerAPI, 'get').returns({
      done: (cb) => {
        cb({
          data: {
            attributes: {
              created_by: 'user',
              shipment_id: 'sq1et8cdx7t3j53',
              organization_id: 'org13'
            }
          }
        });
        return { fail: () => ({ always: () => { } }) };
      }
    });

    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      done: (cb) => {
        cb({
          data: [
            {
              id: 'ccpc1gpcwaecddjpn',
              type: 'contextual_custom_properties_configs',
              attributes: {
                context_type: 'Container',
                config_definition: {
                  type: 'string',
                  label: 'Nickname',
                  default: '',
                  validation_regexp: '',
                  editable: true,
                  unique: false
                },
                key: 'container_nickname',
                organization_id: 'org13'
              }
            }
          ]
        });
      }
    });
    ccpcStoreStub = sandbox.stub(ContextualCustomPropertyConfigStore, 'loadCustomPropertiesConfig').returns(customPropertiesConfigs);
  });

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  const getEditPermissions = (editContainer, manageContainersInLab) => {
    const mockIsFeatureEnabled = sandbox.stub(AcsControls, 'isFeatureEnabled');
    mockIsFeatureEnabled.withArgs(FeatureConstants.EDIT_CONTAINER).returns(editContainer);
    mockIsFeatureEnabled.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(manageContainersInLab);
  };

  const getAddPermissions = (createSample, createTest) => {
    const mockIsFeatureEnabled = sandbox.stub(AcsControls, 'isFeatureEnabled');
    mockIsFeatureEnabled.withArgs(FeatureConstants.CREATE_SAMPLE_SHIPMENTS).returns(createSample);
    mockIsFeatureEnabled.withArgs(FeatureConstants.CREATE_TEST_CONTAINERS).returns(createTest);
  };

  const getActions = (actionText) => {
    wrapper = getTestComponent();
    const PageHeader = wrapper.dive().find('PageLayout').prop('PageHeader');
    const actions = PageHeader.props.actions;
    const option = _.find(actions, item => item.text == actionText);
    return option;
  };

  it('should render without error', () => {
    wrapper = getTestComponent();
  });

  it('should set container_id in intercom settings', () => {
    window.intercomSettings = {};
    wrapper = getTestComponent();
    expect(window.intercomSettings.container_id).to.be.equal(props.match.params.containerId);
  });

  it('should select index on mouse hover enter', () => {
    wrapper = getTestComponent();
    const shallowInstance = wrapper.instance();

    shallowInstance.onMouseHoverWellIndexChange(1);
    expect(shallowInstance.state.mouseHoverWellIndex).to.equal(1);
  });

  it('should unselect index on mouse hover leave', () => {
    wrapper = getTestComponent();
    const shallowInstance = wrapper.instance();

    shallowInstance.onMouseHoverWellIndexChange();
    expect(shallowInstance.state.mouseHoverWellIndex).to.be.undefined;
  });

  it('should contain InteractivePlate view and the ContainerMetadata by default', () => {
    wrapper = getTestComponent();
    expect(wrapper.find('InteractivePlate').length).to.equal(1);
    expect(wrapper.find('ContainerMetadata').length).to.equal(1);
  });

  it('should open correct aliquot details on well click', () => {
    const callback = sandbox.spy();
    Urls.use('org13');
    wrapper = getTestComponent(_.assign(props,
      {
        history: {
          push: callback
        }
      }));
    const plate = wrapper.find('InteractivePlate');
    plate.simulate('wellClick', 0);
    expect(callback.calledWith('/org13/inventory/samples/ct1et8cdx6bnmwr/A1')).to.be.true;
    plate.simulate('wellClick', 1);
    expect(callback.calledWith('/org13/inventory/samples/ct1et8cdx6bnmwr/A2')).to.be.true;
  });

  it('should change state of selected index on callback', () => {
    wrapper = getTestComponent();
    const shallowInstance = wrapper.instance();

    shallowInstance.onMouseHoverWellIndexChange(0);
    expect(shallowInstance.state.mouseHoverWellIndex).to.equal(0);

    shallowInstance.onMouseHoverWellIndexChange(1);
    expect(shallowInstance.state.mouseHoverWellIndex).to.equal(1);
  });

  it('should have correct breadcrumb links ', () => {
    wrapper = getTestComponent(_.assign({
      location: { pathname: '/org13/inventory/samples/details/ct1et8cdx6bnmwr' }
    }, props));
    const PageHeader = wrapper.find('PageLayout').prop('PageHeader');
    const pageHeader =  shallow(PageHeader);
    const inventoryLink = pageHeader.find('Link').at(0);
    expect(inventoryLink.prop('to')).to.equal('/org13/inventory');

    const containersLink = pageHeader.find('Link').at(1);
    expect(containersLink.prop('to')).to.equal('/org13/inventory/samples');
    const containerDetailLink = pageHeader.find('Link').at(2);
    expect(containerDetailLink.prop('to')).to.equal('/org13/inventory/samples/ct1et8cdx6bnmwr');
  });
  it('users should not be loaded when present in store', () => {
    sandbox.stub(UserStore, 'getById').returns({});
    const loadUsers = sandbox.stub(UserActions, 'load').returns();
    wrapper = getTestComponent();

    expect(loadUsers.called).to.be.false;
  });

  it('users should be loaded when not present in store', () => {
    sandbox.stub(UserStore, 'getById').returns();
    const loadUsers = sandbox.stub(UserActions, 'load').returns();
    wrapper = getTestComponent();

    expect(loadUsers.calledWith('user')).to.be.true;
  });

  it('should have admin panel when acs permissions given', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    wrapper = getTestComponent();
    expect(wrapper.find('AdminPanel').exists()).to.be.true;

  });
  it('should not have admin panel for normal user', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(false);
    wrapper = getTestComponent();
    expect(wrapper.find('AdminPanel').exists()).to.be.false;

  });
  it('should have destroy container option in hamburger when DESTROY_CONTAINER permission given', () => {
    const mockIsFeatureEnabled = sandbox.stub(AcsControls, 'isFeatureEnabled');
    mockIsFeatureEnabled.withArgs(FeatureConstants.DESTROY_CONTAINER).returns(true);
    mockIsFeatureEnabled.withArgs(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS).returns(false);
    expect(getActions('Destroy container')).to.not.be.undefined;
  });

  it('should have destroy container option in hamburger when DESTROY_CONTAINER_RESET_ALL_ALIQUOTS permission given', () => {
    const mockIsFeatureEnabled = sandbox.stub(AcsControls, 'isFeatureEnabled');
    mockIsFeatureEnabled.withArgs(FeatureConstants.DESTROY_CONTAINER).returns(false);
    mockIsFeatureEnabled.withArgs(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS).returns(true);
    expect(getActions('Destroy container')).to.not.be.undefined;
  });

  it('should not have destroy container option in hamburger when permission not given', () => {
    const mockIsFeatureEnabled = sandbox.stub(AcsControls, 'isFeatureEnabled');
    mockIsFeatureEnabled.withArgs(FeatureConstants.DESTROY_CONTAINER).returns(false);
    mockIsFeatureEnabled.withArgs(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS).returns(false);
    expect(getActions('Destroy container')).to.be.undefined;
  });

  it('should have edit container option in hamburger when EDIT_CONTAINER permission given', () => {
    getEditPermissions(true, false);
    expect(getActions('Container Settings')).to.not.be.undefined;
  });

  it('should have edit container option in hamburger when MANAGE_CONTAINERS_IN_LAB permission given', () => {
    getEditPermissions(false, true);
    expect(getActions('Container Settings')).to.not.be.undefined;
  });

  it('should not have edit container option in hamburger when permissions are not given', () => {
    getEditPermissions(false, false);
    expect(getActions('Container Settings')).to.be.undefined;
  });

  it('should have ship container option in hamburger when permissions REQUEST_SAMPLE_RETURN is given', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.REQUEST_SAMPLE_RETURN).returns(true);
    wrapper = getTestComponent();
    expect(getActions('Ship container')).to.not.be.undefined;
  });

  it('should not have ship container option in hamburger when permissions REQUEST_SAMPLE_RETURN is not given', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.REQUEST_SAMPLE_RETURN).returns(false);
    wrapper = getTestComponent();
    expect(getActions('Ship container')).to.be.undefined;
  });

  it('should have add container button when permission are given', () => {
    getAddPermissions(true, true);
    wrapper = getTestComponent();
    const PageHeader = wrapper.dive().find('PageLayout').prop('PageHeader');
    const button = PageHeader.props.primaryInfoArea[2];
    expect(button).to.not.be.null;
    expect(button.props.children).equals('Add Container');
  });

  it('should not have add container button when permission are not given', () => {
    getAddPermissions(false, false);
    wrapper = getTestComponent();
    const PageHeader = wrapper.dive().find('PageLayout').prop('PageHeader');
    const button = PageHeader.props.primaryInfoArea[2];
    expect(button).to.be.false;
  });

  it('should call delete action of containerActions on deleting container from user console', () => {
    const mockIsFeatureEnabled = sandbox.stub(AcsControls, 'isFeatureEnabled');
    mockIsFeatureEnabled.withArgs(FeatureConstants.DESTROY_CONTAINER).returns(true);
    const deleteSpy = sandbox.spy(ContainerActions, 'destroy');
    wrapper = getTestComponent();
    const PageHeader = wrapper.dive().find('PageLayout').prop('PageHeader');
    const button = PageHeader.props.actions[0];
    expect(button).to.not.be.null;
    expect(button.text).equals('Destroy container');
    button.onClick();
    expect(deleteSpy.calledOnce).to.be.true;
  });

  it('should redirect to compound detail page on clicking compounds from container detail', () => {
    const linkId = 'cmpl1dajandaj';
    Urls.use('org13');
    const callback = sandbox.spy();
    wrapper = getTestComponent(_.assign(props,
      {
        history: {
          push: callback
        },
        location: { pathname: '/org13/inventory/samples/ct1et8cdx6bnmwr' }
      }));
    const shallowInstance = wrapper.instance();
    const aliquotsInfoPanel = shallowInstance.renderAliquotsInfoPanel();
    aliquotsInfoPanel.props.onCompoundClick(linkId);
    expect(callback.calledWith({
      pathname: `/org13/compounds/${linkId}`
    })).to.be.true;
  });

  it('should render container custom property table without errors', () => {
    wrapper = getTestComponent({ ...props, customProperties });
    expect(wrapper.find(Divider).length).to.equal(2);
    expect(wrapper.dive().find(CustomPropertyTable).length).to.equal(1);
  });

  it('should NOT render container custom property table if there are no custom properties configs', () => {
    ccpcStoreStub.returns(Immutable.fromJS([]));
    wrapper = getTestComponent();
    expect(wrapper.find(Divider).length).to.equal(1);
    expect(wrapper.find(CustomPropertyTable).length).to.equal(0);
  });

  it('should call ContainerAPI.updateCustomProperty when property is updated', () => {
    const updateCustomPropertySpy = sandbox.spy(ContainerAPI, 'updateCustomProperty');
    wrapper = getTestComponent({ ...props, customProperties });
    wrapper.instance().onSaveCustomProperty(customPropertiesConfigs.get(0).get('key'), 'changedValue',);
    expect(updateCustomPropertySpy.calledWithExactly('ct1et8cdx6bnmwr', customPropertiesConfigs.get(0).get('key'), 'changedValue')).to.be.true;
  });

  it('should redirect to compound detail page on clicking batch id link', () => {
    const linkId = 'cmpl1dajandaj';
    Urls.use('org13');
    const callback = sandbox.spy();
    wrapper = getTestComponent(_.assign(props,
      {
        history: {
          push: callback
        },
        location: { pathname: '/org13/inventory/samples/ct1et8cdx6bnmwr' }
      }));
    const shallowInstance = wrapper.instance();
    const aliquotsInfoPanel = shallowInstance.renderAliquotsInfoPanel();
    aliquotsInfoPanel.props.onCompoundClick(linkId, 'Batches');
    expect(callback.calledWith({
      pathname: `/org13/compounds/${linkId}`,
      state: {
        tab: 'Batches'
      }
    })).to.be.true;
  });

  it('should redirect to a specified route when there are no aliquots for a container ', () => {
    wrapper = getTestComponent({ ...props, isAdmin: false });
    let redirectUrl;
    redirectUrl = wrapper.find('Switch').find('Redirect');
    expect(redirectUrl.length).to.eq(0);
    wrapper.setProps({ ...props, aliquots: Immutable.List() });
    redirectUrl = wrapper.find('Switch').find('Redirect');
    expect(redirectUrl.length).to.eq(1);
    expect(redirectUrl.first().prop('to')).equals('/org13/inventory/samples/ct1et8cdx6bnmwr');
  });
});
