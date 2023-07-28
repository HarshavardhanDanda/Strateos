import React from 'react';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';
import { List, Banner, Table, Button, ExpandableCard, Column } from '@transcriptic/amino';
import { expect } from 'chai';
import IntakeKitActions from 'main/actions/IntakeKitActions';

import { BrowserRouter as Router } from 'react-router-dom';
import ContainerActions from 'main/actions/ContainerActions';
import NotificationActions from 'main/actions/NotificationActions';
import IntakeKitDetailsPage from './IntakeKitDetailsPage';

describe('IntakeKitDetailsPage', () => {

  let wrapper;
  let kitUpdate;
  let containerUpdate;
  const sandbox = sinon.createSandbox();
  const containerData = { id: 'ct1-343', status: 'outbound_consumable' };

  const kitData = {
    id: 'ik132',
    intake_kit_items: [
      {
        id: 1,
        intake_kit_id: 'ik1123',
        intake_kit_item_containers: [
          {
            container_id: 'ct1-343'
          }
        ]
      }
    ]
  };
  const props = { params: {
    loading: false,
    intakeKit: { id: 'ik1e5a2yhpwfewp' }
  } };
  const intakeKitWithContainers = {
    intake_kit_items: [
      {
        intake_kit_id: 'ik1e5a2yhpwfewp',
        container_type_id: 'd2-vial',
        quantity: 1,
        intake_kit_item_containers: [{
          intake_kit_item_id: 115,
          container_id: 'c1',
          barcode: 'bar1'
        }] }
    ]
  };

  beforeEach(() => {
    sandbox.stub(IntakeKitActions, 'load')
      .returns({
        then: (result) => {
          result({
            intake_kit_items: [
              { id: 6, intake_kit_id: 'ik1e5a2yhpwfewp', container_type_id: 'a1-vial', quantity: 1, created_at: '2021-07-08T03:20:00.000-07:00', updated_at: '2021-07-08T03:20:00.000-07:00', intake_kit_item_containers: [] },
              { id: 7, intake_kit_id: 'ik1e5a2yhpwfewp', container_type_id: 'd1-vial', quantity: 2, created_at: '2021-07-08T03:20:00.000-07:00', updated_at: '2021-07-08T03:20:00.000-07:00', intake_kit_item_containers: [] },
              { id: 8, intake_kit_id: 'ik1e5a2yhpwfewp', container_type_id: 'd2-vial', quantity: 1, created_at: '2021-07-08T03:20:00.000-07:00', updated_at: '2021-07-08T03:20:00.000-07:00', intake_kit_item_containers: [] }
            ],
            id: 'ik1e5a2yhpwfewp',
            name: 'Intake Kit 7',
            status: 'pending',
            lab_id: 'lab1'
          });
        }
      });

    kitUpdate = sandbox.stub(IntakeKitActions, 'update').returns({
      done: (cb) => {
        cb(kitData);
        return { fail: () => ({}) };

      }
    });
    containerUpdate = sandbox.stub(ContainerActions, 'updateMany').returns({
      done: (cb) => {
        cb(containerData);
        return { fail: () => ({}) };
      }
    });
  });

  afterEach(() => {
    sandbox.restore();
    if (wrapper) wrapper.unmount();
  });

  it('basic rendering', () => {
    expect(shallow(<IntakeKitDetailsPage match={props} />).length).equal(1);
  });

  it('should have 3 columns', () => {
    wrapper = shallow(<IntakeKitDetailsPage match={props} />);
    const list = wrapper.find(List);
    expect(list.length).to.be.equal(1);
    const columnList = list.find(Column).filterWhere(col => col.props().header);
    expect(columnList.find(Column).length).to.be.equal(3);
  });

  it('should display the banner message', () => {
    wrapper = shallow(<IntakeKitDetailsPage match={props} />);
    const banner = wrapper.find(Banner);
    expect(banner.props().bannerType).to.be.equal('info');
    expect(banner.props().bannerMessage).to.be.equal('Please screw caps before shipping');
  });

  it('should display the right names for title header bar', () => {
    wrapper = shallow(<IntakeKitDetailsPage match={props} />);
    const list = wrapper.find(List);
    const columnList = list.find(Column).filterWhere(col => col.props().header);
    expect(columnList.find(Column).at(0).prop('header')).to.be.equal('TYPE');
    expect(columnList.find(Column).at(1).prop('header')).to.be.equal('FORMAT');
    expect(columnList.find(Column).at(2).prop('header')).to.be.equal('BARCODE');
  });

  it('should display kit request expandable card', () => {
    wrapper = shallow(<IntakeKitDetailsPage match={props} />);
    const expandableCard = wrapper.find(ExpandableCard);
    expect(expandableCard.length).to.equal(1);
  });

  it('should display bulk upload button', () => {
    wrapper = shallow(<IntakeKitDetailsPage match={props} />);
    const expandableCard = wrapper.find(ExpandableCard).props().cardHead.props.children;
    expect(expandableCard.props.children).to.equal('Bulk upload barcodes');
  });

  it('Show Correct No of rows according to the quantity', () => {
    wrapper = mount(
      <Router>
        <IntakeKitDetailsPage match={props} />
      </Router>
    );
    const table = wrapper.find(Table);
    expect(table.find('Row').length).to.be.equal(57);
  });

  it('Show Correct data in rows according to intake_kit_items', () => {
    wrapper = mount(
      <Router>
        <IntakeKitDetailsPage match={props} />
      </Router>
    );
    const table = wrapper.find(Table);
    const rows = table.find('Row');
    expect(rows.at(1).find('i').at(0).hasClass('baby-icon')).to.be.true;
    expect(rows.at(1).find('i').at(0).hasClass('aminol-tube')).to.be.true;
    expect(rows.at(1).find('Text').text()).to.be.equal('A1');
    expect(rows.at(2).find('i').at(0).hasClass('baby-icon')).to.be.true;
    expect(rows.at(2).find('i').at(0).hasClass('aminol-tube')).to.be.true;
    expect(rows.at(25).find('Text').text()).to.be.equal('D1');
    expect(rows.at(3).find('i').at(0).hasClass('baby-icon')).to.be.true;
    expect(rows.at(3).find('i').at(0).hasClass('aminol-tube')).to.be.true;
    expect(rows.at(56).find('Text').text()).to.be.equal('D2');
  });

  it('barcode validation', () => {
    sandbox.stub(ContainerActions, 'validateConsumableBarcodes').returns({ done: (result) => {
      result([{ container_type_id: 'a1-vial',
        barcode: '123456',
        is_valid: true,
        container_id: 'ct1' }]);
    } });
    wrapper = shallow(<IntakeKitDetailsPage match={props} />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    expect(wrapper.instance().state.items[0].isValid).to.be.undefined;
    body.find('BodyCell').at(2).find('TextInput')
      .simulate('change', { target: { value: '123456' } });
    body.find('BodyCell').at(2).find('TextInput')
      .simulate('keydown', { target: { value: '123456' }, key: 'Enter' });
    wrapper.update();
    expect(wrapper.instance().state.items[0].isValid).to.be.true;
  });

  it('should validateConsumableBarcodes called with lab id', () => {
    const validateConsumableBarcodesStub = sandbox.stub(ContainerActions, 'validateConsumableBarcodes').returns({ done: (result) => {
      result([{ container_type_id: 'a1-vial',
        barcode: '123456',
        is_valid: true,
        container_id: 'ct1' }]);
    } });
    wrapper = shallow(<IntakeKitDetailsPage match={props} />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    expect(wrapper.instance().state.items[0].isValid).to.be.undefined;
    body.find('BodyCell').at(2).find('TextInput')
      .simulate('change', { target: { value: '123456' } });
    body.find('BodyCell').at(2).find('TextInput')
      .simulate('keydown', { target: { value: '123456' }, key: 'Enter' });
    wrapper.update();

    expect(validateConsumableBarcodesStub.lastCall.args[0][0].lab_id).to.equal('lab1');
  });

  it('should not validate if barcode is empty', () => {
    const validateConsumableBarcodesStub = sandbox.stub(ContainerActions, 'validateConsumableBarcodes');
    wrapper = shallow(<IntakeKitDetailsPage match={props} />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);

    expect(wrapper.instance().state.items[0].isValid).to.be.undefined;

    body.find('BodyCell').at(2).find('TextInput')
      .simulate('change', { target: { value: '' } });
    body.find('BodyCell').at(2).find('TextInput')
      .simulate('keydown', { target: { value: '' }, key: 'Enter' });
    wrapper.update();

    expect(validateConsumableBarcodesStub.called).to.be.false;
  });

  it('should not call containerActions, but should be invalid if barcode has unacceptable characters', () => {
    const validateConsumableBarcodesStub = sandbox.stub(ContainerActions, 'validateConsumableBarcodes');
    wrapper = shallow(<IntakeKitDetailsPage match={props} />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);

    expect(wrapper.instance().state.items[0].isValid).to.be.undefined;
    body.find('BodyCell').at(2).find('TextInput')
      .simulate('change', { target: { value: '1234!' } });
    body.find('BodyCell').at(2).find('TextInput')
      .simulate('keydown', { target: { value: '1234!' }, key: 'Enter' });
    wrapper.update();

    expect(validateConsumableBarcodesStub.called).to.be.false;
    expect(wrapper.instance().state.items[0].isValid).to.be.false;
  });

  it('should not validate if all barcode fields are empty in csv file', () => {
    const validateConsumableBarcodesStub = sandbox.stub(ContainerActions, 'validateConsumableBarcodes');
    wrapper = shallow(<IntakeKitDetailsPage match={props} />);
    wrapper.setState({ showExpandableCardBody: true });
    wrapper.find('ExpandableCard').dive().find('CsvUploadPane').props()
      .handleBarcodeUpdate([]);

    expect(validateConsumableBarcodesStub.called).to.be.false;
  });

  it('should disable SaveForLater button and Next button when there is no valid barcode', () => {
    wrapper = mount(
      <Router>
        <IntakeKitDetailsPage match={props} />
      </Router>
    );
    const saveForLaterButton = wrapper.find(Button).filterWhere(button => button.text() === 'Save for later');
    const nextButton = wrapper.find(Button).filterWhere(button => button.text() === 'Next');
    expect(saveForLaterButton.prop('disabled')).to.be.true;
    expect(nextButton.prop('disabled')).to.be.true;
  });

  it('should enable SaveForLater and Next button when there is atleast one valid barcode', () => {
    wrapper = shallow(<IntakeKitDetailsPage match={props} />);

    sandbox.stub(ContainerActions, 'validateConsumableBarcodes').returns({ done: (result) => {
      result([{ container_type_id: 'a1-vial',
        barcode: '123456',
        is_valid: true,
        container_id: 'ct1' }]);
    } });
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    expect(wrapper.instance().state.items[0].isValid).to.be.undefined;
    body.find('BodyCell').at(2).find('TextInput')
      .simulate('change', { target: { value: '123456' } });
    body.find('BodyCell').at(2).find('TextInput')
      .simulate('keydown', { target: { value: '123456' }, key: 'Enter' });
    const saveForLaterButton = wrapper.find(Button).at(1);
    const nextButton = wrapper.find(Button).at(2);

    expect(wrapper.instance().state.items[0].isValid).to.be.true;
    expect(saveForLaterButton.prop('disabled')).to.be.false;
    expect(nextButton.prop('disabled')).to.be.false;
  });

  it('should update intake kit', () => {
    const createNotification = sandbox.stub(NotificationActions, 'createNotification');

    wrapper = shallow(<IntakeKitDetailsPage match={props} />);

    sandbox.stub(ContainerActions, 'validateConsumableBarcodes').returns({ done: (result) => {
      result([{ container_type_id: 'a1-vial',
        barcode: '123456',
        is_valid: true,
        container_id: 'ct1' }]);
    } });
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    expect(wrapper.instance().state.items[0].isValid).to.be.undefined;
    body.find('BodyCell').at(2).find('TextInput')
      .simulate('change', { target: { value: '123456' } });
    body.find('BodyCell').at(2).find('TextInput')
      .simulate('keydown', { target: { value: '123456' }, key: 'Enter' });
    const saveForLaterButton = wrapper.find(Button).at(1);
    const nextButton = wrapper.find(Button).at(2);
    expect(saveForLaterButton.prop('disabled')).to.be.false;
    expect(nextButton.prop('disabled')).to.be.false;
    nextButton.simulate('click');
    expect(kitUpdate.calledOnce).to.be.false;
    expect(containerUpdate.calledTwice).to.be.false;
    expect(wrapper.instance().state.validIntakeKitItems.length).to.be.equal(1);
    expect(createNotification.calledOnce).to.be.true;

    saveForLaterButton.simulate('click');
    expect(kitUpdate.calledOnce).to.be.true;
    expect(containerUpdate.calledOnce).to.be.true;
    expect(wrapper.instance().state.validIntakeKitItems.length).to.be.equal(0);
  });

  it('should call containerUpdate twice when outboundConsumableContainerIds has container ids', () => {
    sandbox.restore();
    sandbox.stub(IntakeKitActions, 'load')
      .returns({
        then: (result) => {
          result(intakeKitWithContainers);
        }
      });
    const kitUpdate = sandbox.stub(IntakeKitActions, 'update').returns({
      done: (cb) => {
        cb(kitData);
        return { fail: () => ({}) };

      }
    });
    const containerUpdate = sandbox.stub(ContainerActions, 'updateMany').returns({
      done: (cb) => {
        cb(containerData);
        return { fail: () => ({}) };
      }
    });

    wrapper = shallow(<IntakeKitDetailsPage match={props} />);

    sandbox.stub(ContainerActions, 'validateConsumableBarcodes').returns({ done: (result) => {
      result([{ container_type_id: 'a1-vial',
        barcode: '123456',
        is_valid: true,
        container_id: 'ct1' }]);
    } });
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    body.find('BodyCell').at(2).find('TextInput')
      .simulate('change', { target: { value: '123456' } });
    body.find('BodyCell').at(2).find('TextInput')
      .simulate('keydown', { target: { value: '123456' }, key: 'Enter' });
    const saveForLaterButton = wrapper.find(Button).at(1);

    saveForLaterButton.simulate('click');
    expect(kitUpdate.calledOnce).to.be.true;
    expect(containerUpdate.calledTwice).to.be.true;
  });

  it('should call containerUpdate once when outboundConsumableContainerIds has no container ids', () => {
    wrapper = shallow(<IntakeKitDetailsPage match={props} />);

    sandbox.stub(ContainerActions, 'validateConsumableBarcodes').returns({ done: (result) => {
      result([{ container_type_id: 'a1-vial',
        barcode: '123456',
        is_valid: true,
        container_id: 'ct1' }]);
    } });
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    body.find('BodyCell').at(2).find('TextInput')
      .simulate('change', { target: { value: '123456' } });
    body.find('BodyCell').at(2).find('TextInput')
      .simulate('keydown', { target: { value: '123456' }, key: 'Enter' });
    const saveForLaterButton = wrapper.find(Button).at(1);

    saveForLaterButton.simulate('click');
    expect(kitUpdate.calledOnce).to.be.true;
    expect(containerUpdate.calledOnce).to.be.true;
  });

  it('should not make any api call when consumableContainerIds length is zero', () => {
    sandbox.restore();
    const IntakeKitContainer = (containerId, barcode) => {
      return {
        intake_kit_item_id: 115,
        container_id: containerId,
        barcode: barcode
      };
    };
    sandbox.stub(IntakeKitActions, 'load')
      .returns({
        then: (result) => {
          result({
            intake_kit_items: [
              {
                intake_kit_id: 'ik1e5a2yhpwfewp',
                container_type_id: 'd2-vial',
                quantity: 1,
                intake_kit_item_containers: [
                  IntakeKitContainer('c1', 'bar1'),
                  IntakeKitContainer('c2', 'bar2'),
                  IntakeKitContainer('c3', 'bar3'),
                  IntakeKitContainer('c4', 'bar4'),
                  IntakeKitContainer('c5', 'bar5'),
                  IntakeKitContainer('c6', 'bar6'),
                  IntakeKitContainer('c7', 'bar7'),
                  IntakeKitContainer('c8', 'bar8')
                ]
              }
            ]
          });
        }
      });

    const kitUpdateSpy = sandbox.spy(IntakeKitActions, 'update');
    const containerUpdateSpy = sandbox.spy(ContainerActions, 'updateMany');
    wrapper = shallow(<IntakeKitDetailsPage match={props} />);
    const nextButton = wrapper.find(Button).at(2);

    nextButton.simulate('click');
    expect(kitUpdateSpy.calledOnce).to.be.false;
    expect(containerUpdateSpy.called).to.be.false;
  });

  it('should update containerId with intake kit containerIds', () => {
    sandbox.restore();
    const IntakeKitContainer = (containerId, barcode) => {
      return {
        intake_kit_item_id: 115,
        container_id: containerId,
        barcode: barcode
      };
    };
    sandbox.stub(IntakeKitActions, 'load')
      .returns({
        then: (result) => {
          result({
            intake_kit_items: [
              {
                intake_kit_id: 'ik1e5a2yhpwfewp',
                container_type_id: 'd2-vial',
                quantity: 1,
                intake_kit_item_containers: [
                  IntakeKitContainer('c1', 'bar1'),
                  IntakeKitContainer('c2', 'bar2'),
                  IntakeKitContainer('c3', 'bar3'),
                  IntakeKitContainer('c4', 'bar4'),
                  IntakeKitContainer('c5', 'bar5'),
                  IntakeKitContainer('c6', 'bar6'),
                  IntakeKitContainer('c7', 'bar7'),
                  IntakeKitContainer('c8', 'bar8')
                ]
              }
            ]
          });
        }
      });

    wrapper = shallow(<IntakeKitDetailsPage match={props} />);
    const nextButton = wrapper.find(Button).at(2);
    nextButton.simulate('click');

    expect(wrapper.find('ShipmentConfirmationPage').props().containerIds).to.deep.equals(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8']);
  });

});
