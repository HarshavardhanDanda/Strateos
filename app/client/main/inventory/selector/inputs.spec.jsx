import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';
import { pubSub } from '@strateos/micro-apps-utils';
import shortid from 'shortid';

import SessionStore from 'main/stores/SessionStore';
import ModalActions from 'main/actions/ModalActions';
import { AliquotSelectInput, AliquotsSelectInput, ContainerSelectInput, ContainersSelectInput, InventorySelectInput } from './inputs';

describe('InventorySelectInput', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const onSegmentDeleted = sandbox.stub();
  const onSelectionChange = sandbox.stub();
  const props = {
    selectionType: 'CONTAINER',
    onSelectionChange,
    onSegmentDeleted,
    segments: Immutable.Map({ container1: 'c12daddda' }),
    pubSubKey: '123456'
  };

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should set initial state value of drawerOpen to false', () => {
    wrapper = shallow(<InventorySelectInput {...props} />);
    expect(wrapper.state().modalOpen).to.be.false;
  });

  it('should render Select Container Button', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: ['inventory_browser_microapp'] }));
    wrapper = shallow(<InventorySelectInput {...props} />);
    expect(wrapper.find('Button')).to.have.length(2);
    expect(wrapper.find('Button').at(0).props().height).to.equal('short');
    expect(wrapper.find('Button').at(0).props().type).to.equal('secondary');
    expect(wrapper.find('Button').at(0).dive().text()).to.equal('Select container (1)');
  });

  it('should call showSelector on Select Container button click', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: ['inventory_browser_microapp'] }));
    const clickAction = sandbox.stub(InventorySelectInput.prototype, 'showSelector');
    wrapper = shallow(<InventorySelectInput {...props} />);
    wrapper.find('Button').at(0).simulate('click');
    expect(clickAction.callCount).to.equal(1);
    expect(wrapper.state().modalOpen).to.be.false;
  });

  it('should show TagInput if feature group is not present', () => {
    wrapper = shallow(<InventorySelectInput {...props} />);
    expect(wrapper.find('TagInput').length).to.equal(1);
  });

  it('should show button text based on selection type for ALIQUOT+', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: ['inventory_browser_microapp'] }));
    wrapper = shallow(<InventorySelectInput {...props} selectionType="ALIQUOT+" />);
    expect(wrapper.find('Button').at(0).dive().text()).to.equal('Select aliquots (1)');
  });

  it('should show button text based on selection type for ALIQUOT', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: ['inventory_browser_microapp'] }));
    wrapper = shallow(<InventorySelectInput {...props} selectionType="ALIQUOT" />);
    expect(wrapper.find('Button').at(0).dive().text()).to.equal('Select aliquot (1)');
  });

  it('should show button text based on selection type for CONTAINER+', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: ['inventory_browser_microapp'] }));
    wrapper = shallow(<InventorySelectInput {...props} selectionType="CONTAINER+" />);
    expect(wrapper.find('Button').at(0).dive().text()).to.equal('Select containers (1)');
  });

  it('should publish pubsub event to show inventory browser', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: ['inventory_browser_microapp'] }));
    const publish = sandbox.stub(pubSub, 'publish');
    const selectionMap = Immutable.fromJS({ test: 1 });
    wrapper = shallow(
      <InventorySelectInput
        {...props}
        organizationId="org13"
        labId="lab123"
        test_mode
        selectionMap={selectionMap}
      />);
    wrapper.find('Button').at(0).simulate('click');

    expect(publish.args[0][0]).to.equal('INVENTORY_BROWSER_MODAL_SHOW');
    expect(publish.args[0][1]).to.deep.equal({
      version: 'V1',
      labId: 'lab123',
      organizationId: 'org13',
      selectionType: 'CONTAINER',
      testMode: true,
      title: 'Container Selection',
      pubSubKey: '123456',
      selectionMap: selectionMap
    });
  });

  it('should call onContainerCreation from InventorySelectInput in AddContainerModal', () => {
    const containerCreationSpy = sandbox.stub(InventorySelectInput.prototype, 'onContainerCreation');
    wrapper = shallow(<InventorySelectInput {...props} />);
    const AddContainerModal = wrapper.find('AddContainerModal');
    AddContainerModal.props().onContainerCreation();
    expect(containerCreationSpy.callCount).to.eql(1);
  });

  it('should subscribe pubsub event for onSelectionChange', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: ['inventory_browser_microapp'] }));
    const remove = sandbox.stub();
    const subscribe = sandbox.stub(pubSub, 'subscribe').returns({ remove });
    wrapper = shallow(<InventorySelectInput {...props} organizationId="org13" labId="lab123" test_mode />);
    wrapper.instance().componentDidMount();

    expect(subscribe.args[0][0]).to.equal('INVENTORY_BROWSER_MODAL_ONSELECTIONCHANGE_123456');
    subscribe.args[0][1]({ selectionMap: { test: 1 } });
    expect(onSelectionChange.calledOnce).to.be.true;
  });

  it('should render Add new container button and open AddContainerModal onClick', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: ['inventory_browser_microapp'] }));
    const modalOpenSpy = sandbox.spy(ModalActions, 'open').withArgs('ADD_CONTAINER_MODAL');
    wrapper = shallow(<InventorySelectInput {...props} />);
    const addContainerButton = wrapper.find('Button').at(1);
    addContainerButton.simulate('click');

    expect(modalOpenSpy.calledOnce).to.be.true;
    expect(addContainerButton.props().type).to.equal('primary');
    expect(addContainerButton.props().height).to.equal('short');
    expect(addContainerButton.props().size).to.equal('small');
    expect(addContainerButton.props().icon).to.equal('fa-plus');
    expect(addContainerButton.props().iconColor).to.equal('inherit');
    expect(addContainerButton.props().className).to.equal('inventory-select-input--add-container-button');
    expect(addContainerButton.props().link).to.be.true;
    expect(addContainerButton.dive().text()).to.equal('<Icon />Add new container');
  });
});

describe('AliquotSelectInput', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const props = {
    onAliquotSelected: () => {}
  };

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should set initial state value of pubSubKey', () => {
    sandbox.stub(shortid, 'generate').returns('123456');
    wrapper = shallow(<AliquotSelectInput {...props} />);

    expect(wrapper.state().pubSubKey).to.equal('123456');
  });

  it('should render ConnectedInventorySelectInput', () => {
    sandbox.stub(shortid, 'generate').returns('123456');
    const segments = sandbox.stub(AliquotSelectInput.prototype, 'segments');
    const selectionMap = sandbox.stub(AliquotSelectInput.prototype, 'selectionMap');
    const onSegmentDeleted = sandbox.stub(AliquotSelectInput.prototype, 'onSegmentDeleted');
    const onSelectionChange = sandbox.stub(AliquotSelectInput.prototype, 'onSelectionChange');
    wrapper = shallow(<AliquotSelectInput {...props} test_mode organizationId="org13" labId="lab123" />);
    const connectedInventorySelectInput = wrapper.find('ConnectedInventorySelectInput');

    expect(connectedInventorySelectInput.props().emptyText).to.equal('Choose Aliquot...');
    expect(connectedInventorySelectInput.props().selectionType).to.equal('ALIQUOT');
    expect(connectedInventorySelectInput.props().organizationId).to.equal('org13');
    expect(connectedInventorySelectInput.props().labId).to.equal('lab123');
    expect(connectedInventorySelectInput.props().pubSubKey).to.equal('123456');
    expect(segments.calledOnce).to.be.true;
    expect(selectionMap.calledOnce).to.be.true;

    connectedInventorySelectInput.props().onSegmentDeleted();
    expect(onSegmentDeleted.calledOnce).to.be.true;
    connectedInventorySelectInput.props().onSelectionChange();
    expect(onSelectionChange.calledOnce).to.be.true;
  });
});

describe('AliquotsSelectInput', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const props = {
    onAliquotsSelected: () => {}
  };

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should set initial state value of pubSubKey', () => {
    sandbox.stub(shortid, 'generate').returns('123456');
    wrapper = shallow(<AliquotsSelectInput {...props} />);
    expect(wrapper.state().pubSubKey).to.equal('123456');
  });

  it('should render ConnectedInventorySelectInput', () => {
    sandbox.stub(shortid, 'generate').returns('123456');
    const segments = sandbox.stub(AliquotsSelectInput.prototype, 'segments');
    const selectionMap = sandbox.stub(AliquotsSelectInput.prototype, 'selectionMap');
    const onSegmentDeleted = sandbox.stub(AliquotsSelectInput.prototype, 'onSegmentDeleted');
    const onSelectionChange = sandbox.stub(AliquotsSelectInput.prototype, 'onSelectionChange');
    wrapper = shallow(<AliquotsSelectInput {...props} test_mode organizationId="org13" labId="lab123" />);
    const connectedInventorySelectInput = wrapper.find('ConnectedInventorySelectInput');

    expect(connectedInventorySelectInput.props().emptyText).to.equal('Choose Aliquots...');
    expect(connectedInventorySelectInput.props().selectionType).to.equal('ALIQUOT+');
    expect(connectedInventorySelectInput.props().organizationId).to.equal('org13');
    expect(connectedInventorySelectInput.props().labId).to.equal('lab123');
    expect(connectedInventorySelectInput.props().pubSubKey).to.equal('123456');
    expect(segments.calledOnce).to.be.true;
    expect(selectionMap.calledOnce).to.be.true;

    connectedInventorySelectInput.props().onSegmentDeleted();
    expect(onSegmentDeleted.calledOnce).to.be.true;
    connectedInventorySelectInput.props().onSelectionChange();
    expect(onSelectionChange.calledOnce).to.be.true;
  });
});

describe('ContainerSelectInput', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const props = {
    onContainerSelected: () => {}
  };

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should set initial state value of pubSubKey', () => {
    sandbox.stub(shortid, 'generate').returns('123456');
    wrapper = shallow(<ContainerSelectInput {...props} />);
    expect(wrapper.state().pubSubKey).to.equal('123456');
  });

  it('should render ConnectedInventorySelectInput', () => {
    sandbox.stub(shortid, 'generate').returns('123456');
    const onContainerSelected = sandbox.stub();
    const segments = sandbox.stub(ContainerSelectInput.prototype, 'segments');
    const selectionMap = sandbox.stub(ContainerSelectInput.prototype, 'selectionMap');
    const onSelectionChange = sandbox.stub(ContainerSelectInput.prototype, 'onSelectionChange');
    wrapper = shallow(<ContainerSelectInput {...props} test_mode organizationId="org13" labId="lab123" onContainerSelected={onContainerSelected} />);
    const connectedInventorySelectInput = wrapper.find('ConnectedInventorySelectInput');

    expect(connectedInventorySelectInput.props().emptyText).to.equal('Choose Container...');
    expect(connectedInventorySelectInput.props().selectionType).to.equal('CONTAINER');
    expect(connectedInventorySelectInput.props().organizationId).to.equal('org13');
    expect(connectedInventorySelectInput.props().labId).to.equal('lab123');
    expect(connectedInventorySelectInput.props().pubSubKey).to.equal('123456');
    expect(segments.calledOnce).to.be.true;
    expect(selectionMap.calledOnce).to.be.true;

    connectedInventorySelectInput.props().onSegmentDeleted();
    expect(onContainerSelected.calledOnce).to.be.true;
    connectedInventorySelectInput.props().onSelectionChange();
    expect(onSelectionChange.calledOnce).to.be.true;
  });
});

describe('ContainersSelectInput', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const props = {
    onContainersSelected: () => {}
  };

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should set initial state value of pubSubKey', () => {
    sandbox.stub(shortid, 'generate').returns('123456');
    wrapper = shallow(<ContainersSelectInput {...props} />);
    expect(wrapper.state().pubSubKey).to.equal('123456');
  });

  it('should render ConnectedInventorySelectInput', () => {
    sandbox.stub(shortid, 'generate').returns('123456');
    const segments = sandbox.stub(ContainersSelectInput.prototype, 'segments');
    const selectionMap = sandbox.stub(ContainersSelectInput.prototype, 'selectionMap');
    const onSegmentDeleted = sandbox.stub(ContainersSelectInput.prototype, 'onSegmentDeleted');
    const onSelectionChange = sandbox.stub(ContainersSelectInput.prototype, 'onSelectionChange');
    wrapper = shallow(<ContainersSelectInput {...props} test_mode organizationId="org13" labId="lab123" />);
    const connectedInventorySelectInput = wrapper.find('ConnectedInventorySelectInput');

    expect(connectedInventorySelectInput.props().emptyText).to.equal('Choose Containers...');
    expect(connectedInventorySelectInput.props().selectionType).to.equal('CONTAINER+');
    expect(connectedInventorySelectInput.props().organizationId).to.equal('org13');
    expect(connectedInventorySelectInput.props().labId).to.equal('lab123');
    expect(connectedInventorySelectInput.props().pubSubKey).to.equal('123456');
    expect(segments.calledOnce).to.be.true;
    expect(selectionMap.calledOnce).to.be.true;

    connectedInventorySelectInput.props().onSegmentDeleted();
    expect(onSegmentDeleted.calledOnce).to.be.true;
    connectedInventorySelectInput.props().onSelectionChange();
    expect(onSelectionChange.calledOnce).to.be.true;
  });
});
