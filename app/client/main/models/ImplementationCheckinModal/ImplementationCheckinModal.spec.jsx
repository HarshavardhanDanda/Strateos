import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';

import ShipmentModel from 'main/models/Shipment';
import ImplementationItemAPI from 'main/api/ImplementationItemAPI.js';
import ImplementationCheckinModal from './ImplementationCheckinModal';

describe('ImplementationCheckinModal', () => {
  const sandbox = sinon.createSandbox();
  let implementationItemAPIStub;
  const shipment = Immutable.fromJS({
    id: 'ship',
    type: 'shipments',
    name: 'name',
    note: 'note',
    receiving_note: 'receiving note',
    packing_url: 'url',
    lab_id: 'labId',
  });
  let wrapper;

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  beforeEach(() => {
    implementationItemAPIStub = sandbox.stub(ImplementationItemAPI, 'selectShipment').returns({
      always: (cb) => { cb(); },
    });
  });

  it('should re-fetch implementation items when shipment is changed', () => {
    wrapper = shallow(<ImplementationCheckinModal shipment={new ShipmentModel(shipment)} />);
    const implementationCheckinModal = wrapper.find('ImplementationCheckinModal').dive();
    expect(implementationItemAPIStub.calledOnce).to.be.true;
    implementationCheckinModal.setProps({ shipment: new ShipmentModel(shipment.set('id', 'ship1')) });
    expect(implementationItemAPIStub.calledTwice).to.be.true;
  });

  it('should not re-fetch implementation items when shipment is not changed', () => {
    wrapper = shallow(<ImplementationCheckinModal shipment={new ShipmentModel(shipment)} />);
    const implementationCheckinModal = wrapper.find('ImplementationCheckinModal').dive();
    expect(implementationItemAPIStub.calledOnce).to.be.true;
    implementationCheckinModal.setProps({ shipment: new ShipmentModel(shipment) });
    expect(implementationItemAPIStub.calledOnce).to.be.true;
  });

  it('should update package prop when the modal is open', () => {
    const shipmentPackage = {
      title: 'name',
      note: 'note',
      receiving_note: 'receiving note',
      ps_attachment_url: 'url',
      psFile: undefined,
      force_validate: false,
      lab_id: 'labId'
    };
    wrapper = shallow(<ImplementationCheckinModal shipment={new ShipmentModel(shipment)} />);
    const implementationCheckinModal = wrapper.find('ImplementationCheckinModal').dive();
    expect(implementationCheckinModal.find('ImplementationShipmentCreator').props().package).deep.equals({});
    implementationCheckinModal.props().onOpen();
    implementationCheckinModal.update();
    expect(implementationCheckinModal.find('ImplementationShipmentCreator').props().package).deep.equals(shipmentPackage);
  });

  it('should update package prop when updatePackage is called', () => {
    wrapper = shallow(<ImplementationCheckinModal shipment={new ShipmentModel(shipment)} />);
    const implementationCheckinModal = wrapper.find('ImplementationCheckinModal').dive();
    implementationCheckinModal.find('ImplementationShipmentCreator').props().updatePackage('title', 'shipment name');
    implementationCheckinModal.update();
    expect(implementationCheckinModal.find('ImplementationShipmentCreator').props().package.title).to.equals('shipment name');
  });
});
