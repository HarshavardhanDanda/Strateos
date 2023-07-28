import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import { BrowserRouter as Router } from 'react-router-dom';

import ContainerStore from 'main/stores/ContainerStore';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import Shipment from 'main/models/Shipment/Shipment';
import NotificationActions from 'main/actions/NotificationActions';
import ContainerAPI from 'main/api/ContainerAPI';

import Containers from './Containers';

describe('Containers', () => {
  let containers;
  let sandbox = sinon.createSandbox();
  let containerApiSpy;

  const tableRowSelector = '.amino-table__row';

  const shipment = new Shipment(Immutable.fromJS({
    id: 's1234',
    container_ids: ['c1', 'c2', 'c3']
  }));

  const c1 = Immutable.Map({
    id: 'c1',
    label: 'Loo',
    status: 'pending',
    container_type_id: 'ct1',
    shipment_code: 'EC1',
    storage_condition: 'cold_4',
    barcode: '',
    suggested_user_barcode: '2378'
  });

  const c2 = Immutable.Map({
    id: 'c2',
    label: 'Moo',
    status: 'pending',
    container_type_id: 'ct1',
    shipment_code: 'EC2',
    storage_condition: 'cold_4',
    barcode: '1456'
  });

  const c3 = Immutable.Map({
    id: 'c3',
    label: 'Coo',
    status: 'pending',
    container_type_id: 'ct1',
    shipment_code: 'EC3',
    storage_condition: 'cold_4',
    barcode: '',
    suggested_user_barcode: '',
  });

  const event = { target: { value: '8789' } };
  const ref = React.createRef();

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    containerApiSpy = sandbox.stub(ContainerAPI, 'update');
  });

  afterEach(() => {
    if (containers) {
      containers.unmount();
    }
    sandbox.restore();
  });

  it('should show all the available cover options', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(Immutable.List([c1, c2]));
    sandbox.stub(ContainerTypeStore, 'getById').returns(Immutable.Map({
      id: 'ct1',
      acceptable_lids: Immutable.List(['screw-cap'])
    }));
    containers = mount(
      <Router>
        <Containers shipment={shipment} />
      </Router>
    );
    const checkBox = containers.find(tableRowSelector).at(1).find('Checkbox').find('input');
    checkBox.simulate('change', { target: { checked: 'checked' } });
    const coverStatusPicker = containers.find('CoverStatusPicker');
    expect(coverStatusPicker.props().options.length).to.be.equal(2);
    const statusOptions = coverStatusPicker.props().options.map((c) => c.value);
    expect(statusOptions).to.contains('screw-cap');
    expect(statusOptions).to.contains('uncovered');
  });

  it('should render 7 columns in the Containers table with correct data', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(Immutable.List([c1, c2]));
    containers = mount(
      <Router>
        <Containers shipment={shipment} />
      </Router>
    );

    expect(containers.find('HeaderCell').length).to.be.equal(8);
    expect(containers.find('HeaderCell').at(1).text()).equals('Label');
    expect(containers.find('HeaderCell').at(2).text()).equals('Container Type');
    expect(containers.find('HeaderCell').at(3).text()).equals('Code');
    expect(containers.find('HeaderCell').at(4).text()).equals('Storage');
    expect(containers.find('HeaderCell').at(5).text()).equals('Location');
    expect(containers.find('HeaderCell').at(6).text()).equals('Cover');
    expect(containers.find('HeaderCell').at(7).text()).equals('Barcode');

    expect(containers.find('BodyCell').length).to.be.equal(16);
    expect(containers.find('BodyCell').at(1).text()).equals('Loo');
    expect(containers.find('BodyCell').at(2).text()).equals('ct1');
    expect(containers.find('BodyCell').at(3).text()).equals('EC1');
    expect(containers.find('BodyCell').at(4).text()).equals('cold_4');
    expect(containers.find('BodyCell').at(5).find('Button').text()).equals('Assign location');
    expect(containers.find('BodyCell').at(6).text()).equals('uncovered');
    expect(containers.find('BodyCell').at(7).find('TextInput').length).equals(1);
    expect(containers.find('BodyCell').at(9).text()).equals('Moo');
    expect(containers.find('BodyCell').at(10).text()).equals('ct1');
    expect(containers.find('BodyCell').at(11).text()).equals('EC2');
    expect(containers.find('BodyCell').at(12).text()).equals('cold_4');
    expect(containers.find('BodyCell').at(13).find('Button').text()).equals('Assign location');
    expect(containers.find('BodyCell').at(14).text()).equals('uncovered');
    expect(containers.find('BodyCell').at(15).find('TextInput').length).equals(1);
  });

  it('should display error message when invalid barcode is entered for containers having no barcodes', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(Immutable.List([c3]));
    containers = mount(
      <Router>
        <Containers shipment={shipment} />
      </Router>
    );
    const prev_props = { containers: ref.current };
    const component = containers.find('ContainersTable').instance();
    component.componentDidUpdate(prev_props, {});
    containers.update();

    const notificationActionsSpy = sandbox.stub(NotificationActions, 'handleError');
    containerApiSpy.returns({
      fail: (cb) => cb({ reponseText: 'Validation failed: Barcode 8979 has already been assigned' }),
    });
    containers.find('TextInput').props().onChange(event);
    containers.find('TextInput').props().onBlur();

    expect(containerApiSpy.calledOnce).to.be.true;
    expect(notificationActionsSpy.calledOnce).to.be.true;
    expect(notificationActionsSpy.args[0][0]).to.deep.equal({ reponseText: 'Validation failed: Barcode 8979 has already been assigned' });
    expect(containers.find('Button').at(4).props().disabled).to.be.true;
  });

  it('should display error message when invalid barcode is entered for containers having barcodes', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(Immutable.List([c2]));
    containers = mount(
      <Router>
        <Containers shipment={shipment} />
      </Router>
    );
    const prev_props = { containers: ref.current };
    const component = containers.find('ContainersTable').instance();
    component.componentDidUpdate(prev_props, {});
    containers.update();

    const notificationActionsSpy = sandbox.stub(NotificationActions, 'handleError');
    containerApiSpy.returns({
      fail: (cb) => cb({ reponseText: 'Validation failed: Barcode 8979 has already been assigned' }),
    });
    containers.find('TextInput').props().onChange(event);
    containers.find('TextInput').props().onBlur();

    expect(containers.find('TextInput').props().value).to.eql('1456');
    expect(containerApiSpy.calledOnce).to.be.true;
    expect(notificationActionsSpy.calledOnce).to.be.true;
    expect(notificationActionsSpy.args[0][0]).to.deep.equal({ reponseText: 'Validation failed: Barcode 8979 has already been assigned' });
    expect(containers.find('Button').at(4).props().disabled).to.be.false;
  });

  it('should not display error message when valid barcode is entered', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(Immutable.List([c1]));
    containers = mount(
      <Router>
        <Containers shipment={shipment} />
      </Router>
    );
    const prev_props = { containers: ref.current };
    const component = containers.find('ContainersTable').instance();
    component.componentDidUpdate(prev_props, {});
    containers.update();
    const notificationActionsSpy = sandbox.stub(NotificationActions, 'handleError');
    containerApiSpy.returns({
      fail: () => ({})
    });
    containers.find('TextInput').props().onChange(event);
    containers.find('TextInput').props().onBlur();

    expect(containerApiSpy.calledOnce).to.be.true;
    expect(notificationActionsSpy.notCalled).to.be.true;
  });

  it('should disable checkin button when barcode and suggested barcode is empty', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(Immutable.List([c3]));
    containers = mount(
      <Router>
        <Containers shipment={shipment} />
      </Router>
    );
    expect(containers.find('Button').at(4).props().disabled).to.be.true;
  });

  it('should not disable checkin button when either barcode or suggested barcode is not empty', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(Immutable.List([c1]));
    containers = mount(
      <Router>
        <Containers shipment={shipment} />
      </Router>
    );
    expect(containers.find('Button').at(4).props().disabled).to.be.false;
  });
});
