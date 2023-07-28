import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import ShipmentModel from 'main/models/Shipment';
import SessionStore from 'main/stores/SessionStore';
import ShipmentActions from 'main/actions/ShipmentActions';
import ModalActions from 'main/actions/ModalActions';
import ShipmentAPI from 'main/api/ShipmentAPI';
import RowEntityCreator from 'main/components/RowEntityCreator';
import ImplementationShipmentConfirmModal from 'main/pages/ShipsPage/ImplementationShipmentConfirmModal';
import ImplementationShipmentInfo from './ImplementationShipmentInfo';
import ImplementationShipmentCreator from './ImplementationShipmentCreator';

describe('ImplementationShipmentCreator', () => {
  let wrapper;
  let updatePackage;
  let shipmentApi;
  const sandbox = sinon.createSandbox();

  const shipmentPackage = {
    title: 'test',
    note: 'note',
    ps_attachment_url: 'url',
    receiving_note: '',
    force_validate: false,
    lab_id: 'labId'
  };

  const item = Immutable.fromJS({
    id: 'id1',
    storage_condition: 'cold_4',
    name: 'test',
    quantity: '23',
    container_type: 'astestingdf',
    note: ''
  });

  const shipment = Immutable.fromJS({
    id: 'ship',
    name: 'name',
    label: 'label',
    type: 'shipments',
    organization: 'org123',
    links: {}
  });

  const shipmentCheckInProps = {
    items: Immutable.List([item]),
    shipment: new ShipmentModel(shipment),
    package: shipmentPackage
  };

  beforeEach(() => {
    updatePackage = sandbox.spy();
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'orgid' }));
    shipmentApi = sandbox.spy(ShipmentAPI, 'update');
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  describe('ShipmentCheckIn', () => {

    const item = Immutable.fromJS({
      id: 'id1',
      storage_condition: 'cold_4',
      name: 'test',
      quantity: '23',
      container_type: 'astestingdf',
      note: ''
    });

    const shipment = Immutable.fromJS({
      id: 'ship',
      name: 'name',
      label: 'label'
    });

    const labs = [
      {
        name: '',
        value: ''
      }
    ];

    const shipmentCheckInProps = {
      items: Immutable.List([item]),
      shipment: new ShipmentModel(shipment),
      package: shipmentPackage,
      labs: labs
    };

    it('should not set shipment prop details to createdShipment state', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCheckInProps} updatePackage={updatePackage} />);
      const implementationShipmentConfirmModalProps = wrapper.find('ImplementationShipmentConfirmModal').props();
      expect(implementationShipmentConfirmModalProps.shipmentName).to.equals('');
      expect(implementationShipmentConfirmModalProps.shipmentAccession).to.equals('');
    });

    it('should update the package prop with lab_id and should call the callback function if it is shipment check-in', () => {
      const cb = sandbox.spy();
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCheckInProps} updatePackage={updatePackage} />);
      wrapper.find(ImplementationShipmentInfo).props().onLabInput('lab_id', 'labId', cb);
      expect(updatePackage.calledOnceWithExactly('lab_id', 'labId')).to.be.true;
      expect(cb.calledOnce).to.be.true;
    });

    it('should update shipments and package props when file is uploaded in shipment check-in', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCheckInProps} updatePackage={updatePackage} />);
      wrapper.find(ImplementationShipmentInfo).props().onPSUploaded('file', 'key');
      expect(shipmentApi.calledOnce).to.be.true;
      expect(updatePackage.calledTwice).to.be.true;
      expect(updatePackage.args[0]).deep.equals(['uploading', false]);
      expect(updatePackage.args[1]).deep.equals(['ps_attachment_url', 'key']);
    });

    it('should not render QuickListCreatorItemsList if items prop is empty in shipment check-in', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCheckInProps} items={Immutable.List()} updatePackage={updatePackage} />);
      expect(wrapper.find('QuickListCreatorItemsList').length).to.equals(0);
    });

    it('should render QuickListCreatorItemsList if items prop is not empty in shipment check-in', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCheckInProps} updatePackage={updatePackage} />);
      expect(wrapper.find('QuickListCreatorItemsList').length).to.equals(1);
    });

    it('should not call updateShipment on blur when shipment title and notes fields are not editable', () => {
      const updateShipmentSpy = sandbox.spy(ImplementationShipmentCreator.prototype, 'updateShipment');
      const updatedProps = {
        ...shipmentCheckInProps,
        checkingIn: true
      };
      wrapper = shallow(<ImplementationShipmentCreator {...updatedProps} updatePackage={updatePackage} />);
      const implementationShipmentInfo =  wrapper.find(ImplementationShipmentInfo).dive().find('LabeledInput').at(1)
        .find('TextArea');

      wrapper.find('Validated').find('input').props().onBlur();
      expect(wrapper.find('Validated').find('input').props().readOnly).to.be.true;
      expect(updateShipmentSpy.calledOnce).to.be.false;

      implementationShipmentInfo.props().onBlur();
      expect(implementationShipmentInfo.props().readOnly).to.be.true;
      expect(updateShipmentSpy.calledOnce).to.be.false;
    });

    it('should not call updateShipment on blur when checkin notes field is not editable', () => {
      const updateShipmentSpy = sandbox.spy(ImplementationShipmentCreator.prototype, 'updateShipment');
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCheckInProps} updatePackage={updatePackage} />);
      const implementationShipmentInfo =  wrapper.find(ImplementationShipmentInfo).dive().find('LabeledInput').at(3)
        .find('TextArea');

      implementationShipmentInfo.props().onBlur();
      expect(implementationShipmentInfo.props().readOnly).to.be.true;
      expect(updateShipmentSpy.calledOnce).to.be.false;
    });

    it('should call updateShipment on blur when shipment title field is editable', () => {
      const updateShipmentSpy = sandbox.spy(ImplementationShipmentCreator.prototype, 'updateShipment');
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCheckInProps} updatePackage={updatePackage} />);
      const event = { target: { value: 'test_value' } };

      wrapper.find('Validated').find('input').props().onBlur(event);
      expect(wrapper.find('Validated').find('input').props().readOnly).to.be.false;
      expect(updateShipmentSpy.calledOnce).to.be.true;
    });

    it('should call updateShipment on blur when checkin notes field is editable', () => {
      const updateShipmentSpy = sandbox.spy(ImplementationShipmentCreator.prototype, 'updateShipment');
      const updatedProps = {
        ...shipmentCheckInProps,
        checkingIn: true
      };
      wrapper = shallow(<ImplementationShipmentCreator {...updatedProps} updatePackage={updatePackage} />);
      const implementationShipmentInfo =  wrapper.find(ImplementationShipmentInfo).dive().find('LabeledInput').at(3)
        .find('TextArea');
      const event = { target: { value: 'test_value' } };

      implementationShipmentInfo.props().onBlur(event);
      expect(implementationShipmentInfo.props().readOnly).to.be.false;
      expect(updateShipmentSpy.calledOnce).to.be.true;
    });
  });

  describe('ShipmentUpdate', () => {

    it('should call shipmentUpdate when shipment update function is called', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCheckInProps} updatePackage={updatePackage} />);
      wrapper.find(ImplementationShipmentInfo).props().updateShipment('note', 'container1');
      expect(shipmentApi.calledOnce).to.be.true;
      expect(shipmentApi.args[0][0]).to.equal('ship');
      expect(shipmentApi.args[0][1]).deep.equal({
        label: 'label',
        name: 'name',
        note: 'container1'
      });
    });

    it('should not call shipmentUpdate when shipment is null', () => {
      const shipmentCheckInProps = {
        items: Immutable.List([item]),
        package: shipmentPackage
      };
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCheckInProps} updatePackage={updatePackage} />);
      wrapper.find(ImplementationShipmentInfo).props().updateShipment('note', 'container1');
      expect(shipmentApi.notCalled).to.be.true;
    });

    it('should call shipmentUpdate when shipment PS file upload function is called', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCheckInProps} updatePackage={updatePackage} />);
      wrapper.find(ImplementationShipmentInfo).props().onPSUploaded('file', 'file-123');
      expect(shipmentApi.calledOnce).to.be.true;
      expect(shipmentApi.args[0][0]).to.equal('ship');
      expect(shipmentApi.args[0][1]).deep.equal({
        label: 'label',
        name: 'name',
        packing_url: 'file-123'
      });
    });

    it('should not call shipmentUpdate for shipment PS file upload when shipment is null', () => {
      const shipmentCheckInProps = {
        items: Immutable.List([item]),
        package: shipmentPackage
      };
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCheckInProps} updatePackage={updatePackage} />);
      wrapper.find(ImplementationShipmentInfo).props().onPSUploaded('file', 'file-123');
      expect(shipmentApi.notCalled).to.be.true;
    });
  });

  describe('ShipmentCreate', () => {

    const labs = [
      {
        name: 'Menlo Park',
        value: 'lb1'
      },
      {
        name: 'San Diego',
        value: 'lb2'
      }
    ];

    const shipmentData = {
      data: {
        id: 'sr1ax5vu6g4cn4kzjs',
        type: 'shipments',
        attributes: {
          label: 'TEST',
          name: 'test-shipment'
        },
      }
    };

    const newItem = {
      name: 'shipment name',
      quantity: 'shipment label',
      container_type: 'tube',
      storage_condition: 'cold_4',
      note: 'test note'
    };

    const shipmentCreateProps = {
      package: { ...shipmentPackage, lab_id: undefined },
      labs: labs
    };

    it('should raise an error when labId is not mentioned in creation of implementation shipment', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCreateProps} updatePackage={updatePackage} />);

      const rowEntityCreatorProps = wrapper.find(RowEntityCreator).props();
      rowEntityCreatorProps.onEntityInput(Immutable.fromJS(newItem));
      expect(wrapper.find(RowEntityCreator).props().entity.toJS()).deep.equals(newItem);
      rowEntityCreatorProps.onAdd({ preventDefault: () => {} }, true);

      const implementationShipmentInfo = wrapper.find(ImplementationShipmentInfo).dive();
      implementationShipmentInfo.find('AjaxedAjaxButton').dive().find('AjaxButton').dive()
        .find('Button')
        .simulate('click', {
          preventDefault: () => {},
        });

      const validated = implementationShipmentInfo.find('Validated');
      expect(validated).to.have.length(1);
      expect(validated.dive().find('Text').at(0).dive()
        .find('span')
        .text()).to.be.equal('Must be specified');
    });

    it('should update shipment name, accession in the state after creating shipment', () => {
      const createShipmentSpy = sandbox.stub(ShipmentActions, 'createShipmentWithImplementationItems').returns({
        then: (cb) => {
          cb(shipmentData);
          return { fail: () => ({}) };
        }
      });

      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCreateProps} updatePackage={updatePackage} onSave={() => {}} />);

      wrapper.find(ImplementationShipmentInfo).props().saveShipment();
      expect(createShipmentSpy.calledOnce).to.be.true;

      const confirmModal = wrapper.find(ImplementationShipmentConfirmModal);
      expect(confirmModal).to.have.length(1);
      expect(confirmModal.prop('shipmentName')).to.equal('test-shipment');
      expect(confirmModal.prop('shipmentAccession')).to.equal('TEST');
    });

    it('should update entity with default newItem if added newItem is valid', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCreateProps} updatePackage={updatePackage} />);

      const rowEntityCreatorProps = wrapper.find(RowEntityCreator).props();
      rowEntityCreatorProps.onEntityInput(Immutable.fromJS(newItem));
      expect(wrapper.find(RowEntityCreator).props().entity.toJS()).deep.equals(newItem);
      rowEntityCreatorProps.onAdd({ preventDefault: () => {} }, true);
      expect(wrapper.find(RowEntityCreator).props().entity.toJS()).deep.equals({ storage_condition: 'cold_4' });
    });

    it('should set force_validate as true if added newItem is not valid', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCreateProps} updatePackage={updatePackage} />);

      const rowEntityCreatorProps = wrapper.find(RowEntityCreator).props();
      rowEntityCreatorProps.onEntityInput(Immutable.fromJS(newItem));
      expect(wrapper.find(RowEntityCreator).props().entity.toJS()).deep.equals(newItem);
      rowEntityCreatorProps.onAdd({ preventDefault: () => {} }, false);
      expect(wrapper.find(RowEntityCreator).props().entity.get('force_validate')).to.be.true;
    });

    it('should update addedItems state if an item is deleted in shipment create', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCreateProps} updatePackage={updatePackage} />);

      const rowEntityCreatorProps = wrapper.find(RowEntityCreator).props();
      rowEntityCreatorProps.onEntityInput(Immutable.fromJS(newItem));
      expect(wrapper.find(RowEntityCreator).props().entity.toJS()).deep.equals(newItem);
      rowEntityCreatorProps.onAdd({ preventDefault: () => {} }, true);

      expect(wrapper.find('QuickListCreatorItemsList').props().items.size).to.equals(1);
      wrapper.find('QuickListCreatorItemsList').dive().find('QuickListCreatorListItem').props()
        .removeItem();
      expect(wrapper.find('QuickListCreatorItemsList').length).to.equals(0);
    });

    it('should update the package prop with lab_id and should not call the callback function if it is shipment create', () => {
      const cb = sandbox.spy();
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCreateProps} updatePackage={updatePackage} />);
      wrapper.find(ImplementationShipmentInfo).props().onLabInput('lab_id', 'labId', cb);
      expect(updatePackage.calledOnceWithExactly('lab_id', 'labId')).to.be.true;
      expect(cb.calledOnce).to.be.false;
    });

    it('should update the package props with file details when file is attached', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCreateProps} updatePackage={updatePackage} />);
      wrapper.find(ImplementationShipmentInfo).props().onPSAttached([{ file: 'file' }]);
      expect(updatePackage.calledTwice).to.be.true;
      expect(updatePackage.args[0]).deep.equals(['uploading', true]);
      expect(updatePackage.args[1]).deep.equals(['psFile', 'file']);
    });

    it('should update package prop when file is uploaded in shipment create', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCreateProps} updatePackage={updatePackage} />);
      wrapper.find(ImplementationShipmentInfo).props().onPSUploaded('file', 'key');
      expect(updatePackage.calledTwice).to.be.true;
      expect(updatePackage.args[0]).deep.equals(['uploading', false]);
      expect(updatePackage.args[1]).deep.equals(['ps_attachment_url', 'key']);
    });

    it('should update the package props with file details when file is aborted', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCreateProps} updatePackage={updatePackage} />);
      wrapper.find(ImplementationShipmentInfo).props().onPSUploadAborted('file', 'key');
      expect(updatePackage.calledTwice).to.be.true;
      expect(updatePackage.args[0]).deep.equals(['psFile', undefined]);
      expect(updatePackage.args[1]).deep.equals(['uploading', false]);
    });

    it('should pop ShipmentCreateConfirmModal when shipment is created', () => {
      sandbox.stub(ShipmentActions, 'createShipmentWithImplementationItems').returns({ then: (cb) => { cb(shipmentData); } });
      const modalActionStub = sandbox.stub(ModalActions, 'open');
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCreateProps} updatePackage={updatePackage} onSave={() => {}} />);
      wrapper.find('ImplementationShipmentInfo').props().saveShipment();
      expect(modalActionStub.calledOnceWithExactly('ShipmentCreateConfirmModal')).to.be.true;
    });

    it('should not render QuickListCreatorItemsList if addedItems is empty in shipment create', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCreateProps} updatePackage={updatePackage} />);
      expect(wrapper.find('QuickListCreatorItemsList').length).to.equals(0);
    });

    it('should render QuickListCreatorItemsList if addedItems is not empty in shipment create', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCreateProps} updatePackage={updatePackage} />);
      expect(wrapper.find('QuickListCreatorItemsList').length).to.equals(0);
      const rowEntityCreatorProps = wrapper.find(RowEntityCreator).props();
      rowEntityCreatorProps.onEntityInput(Immutable.fromJS(newItem));
      expect(wrapper.find(RowEntityCreator).props().entity.toJS()).deep.equals(newItem);
      rowEntityCreatorProps.onAdd({ preventDefault: () => {} }, true);
      expect(wrapper.find('QuickListCreatorItemsList').length).to.equals(1);
    });

    it('should call onSave prop when a shipment is created', () => {
      sandbox.stub(ShipmentActions, 'createShipmentWithImplementationItems').returns({ then: (cb) => { cb(shipmentData); } });
      const onSave = sandbox.spy();
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCreateProps} updatePackage={updatePackage} onSave={onSave} />);
      wrapper.find('ImplementationShipmentInfo').props().saveShipment();
      expect(onSave.calledOnce).to.be.true;
    });

    it('should disable save option if addedItems state is empty in shipment create', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCreateProps} updatePackage={updatePackage} />);
      expect(wrapper.find('ImplementationShipmentInfo').props().disableSave).to.be.true;
    });

    it('should enable save option if addedItems state is not empty in shipment create', () => {
      wrapper = shallow(<ImplementationShipmentCreator {...shipmentCreateProps} updatePackage={updatePackage} />);
      const rowEntityCreatorProps = wrapper.find(RowEntityCreator).props();
      rowEntityCreatorProps.onEntityInput(Immutable.fromJS(newItem));
      expect(wrapper.find(RowEntityCreator).props().entity.toJS()).deep.equals(newItem);
      rowEntityCreatorProps.onAdd({ preventDefault: () => {} }, true);
      expect(wrapper.find('ImplementationShipmentInfo').props().disableSave).to.be.false;
    });
  });
});
