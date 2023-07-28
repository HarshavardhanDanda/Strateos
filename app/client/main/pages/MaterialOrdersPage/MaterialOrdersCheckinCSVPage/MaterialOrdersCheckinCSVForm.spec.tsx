import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { BrowserRouter as Router } from 'react-router-dom';
import Immutable from 'immutable';
import { threadBounce } from 'main/util/TestUtil';
import NotificationActions from 'main/actions/NotificationActions';
import MaterialOrderActions from 'main/actions/MaterialOrderActions';
import MaterialOrderStore from 'main/stores/MaterialOrderStore';
import MaterialOrdersCheckinCSVForm from './MaterialOrdersCheckinCSVForm';
import MaterialOrdersCheckinForm from '../MaterialOrdersCheckinPage/MaterialOrdersCheckinForm';
import { keys } from './CsvCheckinFields';

const individualTransformedDataMock = [
  {
    [keys.vendorOrderId]: 'vendor-order-1',
    [keys.sku]: 'sku-1',
    [keys.containerType]: 'a1-vial',
    [keys.lotNumber]: 'lot-1',
    [keys.locationId]: 'loc-1',
    [keys.storageCondition]: 'cold_80',
    [keys.barcode]: 'barcode-1',
    [keys.label]: 'label-1',
    [keys.expirationDate]: '11/06/2028',
    [keys.volume]: '99',
    [keys.mass]: '11',
    [keys.groupItemName]: ''
  },
  {
    [keys.vendorOrderId]: 'vendor-order-2',
    [keys.sku]: 'sku-2',
    [keys.label]: 'label-2',
    [keys.groupItemName]: ''
  }
];

const groupTransformedDataMock = [
  {
    [keys.vendorOrderId]: 'vendor-order-3',
    [keys.sku]: 'sku-3',
    [keys.containerType]: 'a1-vial',
    [keys.lotNumber]: 'lot-3',
    [keys.locationId]: 'loc-3',
    [keys.storageCondition]: 'cold_80',
    [keys.barcode]: 'barcode-3',
    [keys.label]: 'label-3',
    [keys.expirationDate]: '11/06/2028',
    [keys.volume]: '99',
    [keys.mass]: '11',
    [keys.groupItemName]: 'omc 1'
  },
  {
    [keys.vendorOrderId]: 'vendor-order-4',
    [keys.sku]: 'sku-4',
    [keys.label]: 'label-4',
    [keys.groupItemName]: 'omc 2'
  },
  {
    [keys.vendorOrderId]: 'vendor-order-4',
    [keys.sku]: 'sku-4',
    [keys.label]: 'label-4',
    [keys.groupItemName]: 'omc_3'
  },
];

const individualItemProps = {
  transformedData: individualTransformedDataMock
};

const groupItemProps = {
  transformedData: groupTransformedDataMock
};

const individualOrders = [
  { id: 'order-1', name: 'Order 1', vendor_order_id: 'vendor-order-1', orderable_material: { id: 'om-1', sku: 'sku-1' }, state: 'ARRIVED' },
  { id: 'order-2', name: 'Order 2', vendor_order_id: 'vendor-order-2', orderable_material: { id: 'om-2', sku: 'sku-2' }, state: 'PENDING' },
];

const groupOrders = [
  { id: 'order-3', name: 'Order 3', vendor_order_id: 'vendor-order-3', orderable_material: { id: 'om-3', sku: 'sku-3', orderable_material_components: [{ id: 'omc_1', name: 'omc 1' }] }, state: 'ARRIVED' },
  { id: 'order-4', name: 'Order 4', vendor_order_id: 'vendor-order-4', orderable_material: { id: 'om-4', sku: 'sku-4', orderable_material_components: [{ id: 'omc_2', name: 'omc 2' }, { id: 'omc_3', name: 'omc 3' }] }, state: 'PENDING' }

];

const createWrapperAndAwaitReady = async (props) => {
  const wrapper = mount(<Router><MaterialOrdersCheckinCSVForm {...props} /></Router>);
  await threadBounce(10);
  wrapper.setProps({}); // force re-render to trigger hooks
  return wrapper;
};

describe('MaterialOrdersCheckinCSVForm Individual Material Orders', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;
  let materialOrderSearchStub;
  let materialOrderStoreStub;

  beforeEach(async () => {
    materialOrderSearchStub = sandbox.stub(MaterialOrderActions, 'search')
      .onFirstCall()
      .returns({
        results: [individualOrders[0]]
      })
      .onSecondCall()
      .returns({
        results: [individualOrders[1]]
      })
      .onThirdCall()
      .returns({
        results: []
      });
    materialOrderStoreStub = sandbox.stub(MaterialOrderStore, 'getById')
      .withArgs('order-1')
      .returns(Immutable.fromJS(individualOrders[0]))
      .withArgs('order-2')
      .returns(Immutable.fromJS(individualOrders[1]));
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should search for orders corresponding to the vendor order id', async () => {
    wrapper = await createWrapperAndAwaitReady(individualItemProps);
    expect(materialOrderSearchStub.calledTwice).to.equal(true);
    expect(materialOrderSearchStub.getCall(0).args[0].q).to.equal('vendor-order-1');
    expect(materialOrderSearchStub.getCall(1).args[0].q).to.equal('vendor-order-2');
  });

  it('should show notification if search call fails ', async () => {
    const notificationSpy = sandbox.spy(NotificationActions, 'handleError');
    materialOrderSearchStub.onFirstCall().throws();
    wrapper = await createWrapperAndAwaitReady(individualItemProps);
    expect(notificationSpy.calledOnce).to.be.true;
  });

  it('should display checkin form with correct props', async () => {
    wrapper = await createWrapperAndAwaitReady(individualItemProps);
    expect(wrapper.find(MaterialOrdersCheckinForm).props().data.length).to.equal(2);
    expect(wrapper.find(MaterialOrdersCheckinForm).props().validateAllOnInit).to.be.true;
  });

  it('should transform data to the right format for checkin form', async () => {
    wrapper = await createWrapperAndAwaitReady(individualItemProps);
    const formattedData = wrapper.find(MaterialOrdersCheckinForm).props().data.map(item => item.toJS());
    expect(formattedData).to.deep.equal([
      {
        order: {
          id: 'order-1',
          name: 'Order 1',
          vendor_order_id: 'vendor-order-1',
          orderable_material: { id: 'om-1', sku: 'sku-1' },
          state: 'ARRIVED'
        },
        orderableMaterialId: 'om-1',
        initialForm: {
          container_type: 'a1-vial',
          lot_no: 'lot-1',
          location: 'loc-1',
          storage_condition: 'cold_80',
          barcode: 'barcode-1',
          label: 'label-1',
          expiration_date: '11/06/2028',
          volume_per_container: '99',
          mass_per_container: '11'
        }
      },
      {
        order: {
          id: 'order-2',
          name: 'Order 2',
          vendor_order_id: 'vendor-order-2',
          orderable_material: { id: 'om-2', sku: 'sku-2' },
          state: 'PENDING'
        },
        orderableMaterialId: 'om-2',
        initialForm: {
          container_type: undefined,
          lot_no: undefined,
          location: undefined,
          storage_condition: undefined,
          barcode: undefined,
          label: 'label-2',
          expiration_date: undefined,
          volume_per_container: undefined,
          mass_per_container: undefined
        }
      }
    ]);
  });

  it('should display error notification if data includes incorrect vendor order id', async () => {
    const notificationSpy = sandbox.spy(NotificationActions, 'createNotification');
    const individualItemProps = {
      transformedData: [
        ...individualTransformedDataMock,
        {
          [keys.vendorOrderId]: 'non-existing-id',
          [keys.sku]: 'sku-1',
          [keys.groupItemName]: ''
        }
      ]
    };
    wrapper = await createWrapperAndAwaitReady(individualItemProps);
    const notification: { text?: string } = notificationSpy.getCall(0).args[0];
    expect(notification.text).to.equal('Order with id non-existing-id and sku sku-1 cannot be found.');
    expect(notificationSpy.calledOnce).to.be.true;
    expect(wrapper.find(MaterialOrdersCheckinForm).props().data.length).to.equal(2);
  });

  it('should display error notification if order with exact vendor order id match cannot be found in results', async () => {
    const notificationSpy = sandbox.spy(NotificationActions, 'createNotification');
    materialOrderSearchStub.onFirstCall().returns({
      results: [
        {
          ...individualOrders[0],
          vendor_order_id: 'vendor-order-1-not-exact-match',
        }
      ]
    });
    wrapper = await createWrapperAndAwaitReady(individualItemProps);
    const notification: { text?: string } = notificationSpy.getCall(0).args[0];
    expect(notification.text).to.equal('Order with id vendor-order-1 and sku sku-1 cannot be found.');
    expect(notificationSpy.calledOnce).to.be.true;
    expect(wrapper.find(MaterialOrdersCheckinForm).props().data.length).to.equal(1);
  });

  it('should display error notification if data includes incorrect sku', async () => {
    const notificationSpy = sandbox.spy(NotificationActions, 'createNotification');
    const individualItemProps = {
      transformedData: [
        {
          [keys.vendorOrderId]: 'vendor-order-1',
          [keys.sku]: 'non-matching-sku',
          [keys.groupItemName]: ''
        },
        individualTransformedDataMock[1]
      ]
    };
    wrapper = await createWrapperAndAwaitReady(individualItemProps);
    const notification: { text?: string } = notificationSpy.getCall(0).args[0];
    expect(notification.text).to.equal('Order with id vendor-order-1 and sku non-matching-sku cannot be found.');
    expect(notificationSpy.calledOnce).to.be.true;
    expect(wrapper.find(MaterialOrdersCheckinForm).props().data.length).to.equal(1);
  });

  it('should display error notification if data includes order that is already checked in', async () => {
    const notificationSpy = sandbox.spy(NotificationActions, 'createNotification');
    const checkedInOrder = { ...individualOrders[0], state: 'CHECKEDIN' };
    materialOrderStoreStub.withArgs('order-1').returns(Immutable.fromJS(checkedInOrder));
    wrapper = await createWrapperAndAwaitReady(individualItemProps);
    const notification: { text?: string } = notificationSpy.getCall(0).args[0];
    expect(notification.text).to.equal('Order with id vendor-order-1 and sku sku-1 has already been checked in.');
    expect(notificationSpy.calledOnce).to.be.true;
    expect(wrapper.find(MaterialOrdersCheckinForm).props().data.length).to.equal(1);
  });

  it('should filter out data items with duplicate order id - sku combination', async () => {
    const individualItemProps = {
      transformedData: [...individualTransformedDataMock, ...individualTransformedDataMock]
    };
    wrapper = await createWrapperAndAwaitReady(individualItemProps);
    expect(wrapper.find(MaterialOrdersCheckinForm).props().data.length).to.equal(2);
  });
});

describe('MaterialOrdersCheckinCSVForm Group Material Orders', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;
  let materialOrderSearchStub;
  let materialOrderStoreStub;

  beforeEach(async () => {
    materialOrderSearchStub = sandbox.stub(MaterialOrderActions, 'search')
      .onFirstCall()
      .returns({
        results: [groupOrders[0]]
      })
      .onSecondCall()
      .returns({
        results: [groupOrders[1]]
      })
      .onThirdCall()
      .returns({
        results: [groupOrders[1]]
      });
    materialOrderStoreStub = sandbox.stub(MaterialOrderStore, 'getById')
      .withArgs('order-3')
      .returns(Immutable.fromJS(groupOrders[0]))
      .withArgs('order-4')
      .returns(Immutable.fromJS(groupOrders[1]));
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should search for orders corresponding to the group item name or id', async () => {
    wrapper = await createWrapperAndAwaitReady(groupItemProps);
    expect(materialOrderSearchStub.calledThrice).to.equal(true);
    expect(materialOrderSearchStub.getCall(0).args[0].q).to.equal('omc 1');
    expect(materialOrderSearchStub.getCall(1).args[0].q).to.equal('omc 2');
  });

  it('should show notification if search call fails ', async () => {
    const notificationSpy = sandbox.spy(NotificationActions, 'handleError');
    materialOrderSearchStub.onFirstCall().throws();
    wrapper = await createWrapperAndAwaitReady(groupItemProps);
    expect(notificationSpy.calledOnce).to.be.true;
  });

  it('should display checkin form with correct props', async () => {
    wrapper = await createWrapperAndAwaitReady(groupItemProps);
    expect(wrapper.find(MaterialOrdersCheckinForm).props().data.length).to.equal(2);
    expect(wrapper.find(MaterialOrdersCheckinForm).props().validateAllOnInit).to.be.true;
  });

  it('should transform data to the right format for checkin form', async () => {
    wrapper = await createWrapperAndAwaitReady(groupItemProps);
    const formattedData = wrapper.find(MaterialOrdersCheckinForm).props().data.map(item => item.toJS());
    expect(formattedData).to.deep.equal([
      {
        order: {
          id: 'order-3',
          name: 'Order 3',
          vendor_order_id: 'vendor-order-3',
          orderable_material: { id: 'om-3',
            sku: 'sku-3',
            orderable_material_components: [
              {
                id: 'omc_1',
                name: 'omc 1',
                initialForm: {
                  container_type: 'a1-vial',
                  lot_no: 'lot-3',
                  location: 'loc-3',
                  storage_condition: 'cold_80',
                  barcode: 'barcode-3',
                  label: 'label-3',
                  expiration_date: '11/06/2028',
                  volume_per_container: '99',
                  mass_per_container: '11'
                }
              }
            ]
          },
          state: 'ARRIVED'
        },
        orderableMaterialId: 'om-3',
      },
      {
        order: {
          id: 'order-4',
          name: 'Order 4',
          vendor_order_id: 'vendor-order-4',
          orderable_material: { id: 'om-4',
            sku: 'sku-4',
            orderable_material_components: [
              {
                id: 'omc_2',
                name: 'omc 2',
                initialForm: {
                  container_type: undefined,
                  lot_no: undefined,
                  location: undefined,
                  storage_condition: undefined,
                  barcode: undefined,
                  label: 'label-4',
                  expiration_date: undefined,
                  volume_per_container: undefined,
                  mass_per_container: undefined
                }
              },
              {
                id: 'omc_3',
                name: 'omc 3',
                initialForm: {
                  container_type: undefined,
                  lot_no: undefined,
                  location: undefined,
                  storage_condition: undefined,
                  barcode: undefined,
                  label: 'label-4',
                  expiration_date: undefined,
                  volume_per_container: undefined,
                  mass_per_container: undefined
                }
              }
            ] },
          state: 'PENDING'
        },
        orderableMaterialId: 'om-4',
      }
    ]);
  });

  it('should display error notification if data includes incorrect vendor order id', async () => {
    const notificationSpy = sandbox.spy(NotificationActions, 'createNotification');
    const groupItemProps = {
      transformedData: [
        groupTransformedDataMock[0],
        groupTransformedDataMock[1],
        {
          [keys.vendorOrderId]: 'non-existing-id',
          [keys.sku]: 'sku-4',
          [keys.groupItemName]: 'omc_3'
        },
      ]
    };
    wrapper = await createWrapperAndAwaitReady(groupItemProps);
    const notification: { text?: string } = notificationSpy.getCall(0).args[0];
    expect(notification.text).to.equal('Order with id non-existing-id and sku sku-4 and group item name omc_3 cannot be found.');
    expect(notificationSpy.calledOnce).to.be.true;
    expect(wrapper.find(MaterialOrdersCheckinForm).props().data.length).to.equal(2);
  });

  it('should display error notification if data includes incorrect group item name', async () => {
    const notificationSpy = sandbox.spy(NotificationActions, 'createNotification');
    const groupItemProps = {
      transformedData: [
        groupTransformedDataMock[0],
        groupTransformedDataMock[1],
        {
          [keys.vendorOrderId]: 'vendor-order-3',
          [keys.sku]: 'sku-3',
          [keys.groupItemName]: 'non-existing-name'
        },
      ]
    };
    wrapper = await createWrapperAndAwaitReady(groupItemProps);
    const notification: { text?: string } = notificationSpy.getCall(0).args[0];
    expect(notification.text).to.equal('Order with id vendor-order-3 and sku sku-3 and group item name non-existing-name cannot be found.');
    expect(notificationSpy.calledOnce).to.be.true;
    expect(wrapper.find(MaterialOrdersCheckinForm).props().data.length).to.equal(2);
  });

  it('should display error notification if order with exact omc name, omc id match, sku and vendor order id cannot be found in results', async () => {
    const notificationSpy = sandbox.spy(NotificationActions, 'createNotification');
    materialOrderSearchStub.onFirstCall().returns({
      results: [
        {
          ...groupOrders[0],
          orderable_material: { id: 'some omc', sku: 'not exact sku', orderable_material_components: [{ id: 'not exact id', name: 'not exact name' }] }
        }
      ]
    });
    wrapper = await createWrapperAndAwaitReady(groupItemProps);
    const notification: { text?: string } = notificationSpy.getCall(0).args[0];
    expect(notification.text).to.equal('Order with id vendor-order-3 and sku sku-3 and group item name omc 1 cannot be found.');
    expect(notificationSpy.calledOnce).to.be.true;
    expect(wrapper.find(MaterialOrdersCheckinForm).props().data.length).to.equal(1);
  });

  it('should display error notification if data includes incorrect sku', async () => {
    const notificationSpy = sandbox.spy(NotificationActions, 'createNotification');
    const groupItemProps = {
      transformedData: [
        groupTransformedDataMock[0],
        groupTransformedDataMock[1],
        {
          [keys.vendorOrderId]: 'vendor-order-4',
          [keys.sku]: 'non-matching-sku',
          [keys.groupItemName]: 'omc_3'
        },
      ]
    };
    wrapper = await createWrapperAndAwaitReady(groupItemProps);
    const notification: { text?: string } = notificationSpy.getCall(0).args[0];
    expect(notification.text).to.equal('Order with id vendor-order-4 and sku non-matching-sku and group item name omc_3 cannot be found.');
    expect(notificationSpy.calledOnce).to.be.true;
    expect(wrapper.find(MaterialOrdersCheckinForm).props().data.length).to.equal(2);
  });

  it('should display error notification if data includes order that is already checked in', async () => {
    const notificationSpy = sandbox.spy(NotificationActions, 'createNotification');
    const checkedInOrder = { ...groupOrders[0], state: 'CHECKEDIN' };
    materialOrderStoreStub.withArgs('order-3').returns(Immutable.fromJS(checkedInOrder));
    wrapper = await createWrapperAndAwaitReady(groupItemProps);
    const notification: { text?: string } = notificationSpy.getCall(0).args[0];
    expect(notification.text).to.equal('Order with id vendor-order-3 and sku sku-3 and group item name omc 1 has already been checked in.');
    expect(notificationSpy.calledOnce).to.be.true;
    expect(wrapper.find(MaterialOrdersCheckinForm).props().data.length).to.equal(1);
  });

  it('should filter out data items with duplicate order id - sku - group item name combination', async () => {
    const groupItemProps = {
      transformedData: [...groupTransformedDataMock, ...groupTransformedDataMock]
    };
    wrapper = await createWrapperAndAwaitReady(groupItemProps);
    expect(wrapper.find(MaterialOrdersCheckinForm).props().data.length).to.equal(2);
  });
});
