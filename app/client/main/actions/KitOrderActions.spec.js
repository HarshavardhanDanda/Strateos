import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import Dispatcher from 'main/dispatcher';
import NotificationActions from 'main/actions/NotificationActions';
import Urls from 'main/util/urls';
import KitOrderActions from './KitOrderActions';

describe('KitOrderActions', () => {
  const sandbox = sinon.createSandbox();
  const baseUrl = '/api/kit_orders';
  const mockPayload = [
    {
      id: 'ko1fwpc55rruvd8',
      data: [
        {
          container: {
            barcode: '50',
            container_type_id: 'vendor-tube',
            lot_no: '23674',
            storage_condition: 'ambient',
            location_id: 'loc1egneyc9dd5yu',
            orderable_material_component_id: 'omatc1h3hqrv4dj64c',
            kit_order_id: 'ko1fwpc55rruvd8',
            lab_id: 'lb1fknzm4k8qkq7',
            organization_id: null,
            status: 'available'
          },
          aliquots: [
            {
              well_idx: 0,
              mass_mg: 100,
              volume_ul: 100,
              lot_no: '12312',
              resource_id: 'rs1c9taujhn6z4'
            }
          ]
        },
        {
          container: {
            barcode: '51',
            container_type_id: 'vendor-tube',
            storage_condition: 'ambient',
            orderable_material_component_id: 'omatc1h3hqrv4dj64c',
            kit_order_id: 'ko1fwpc55rruvd8',
            lab_id: 'lb1fknzm4k8qkq7',
            organization_id: null,
            status: 'available'
          },
          aliquots: [
            {
              well_idx: 0,
              mass_mg: 100,
              volume_ul: 100,
              lot_no: '12312',
              resource_id: 'rs1c9taujhn6z4'
            }
          ]
        }
      ]
    },
    {
      id: 'ko1fukwpmvpym74',
      data: [
        {
          container: {
            barcode: '52',
            container_type_id: 'vendor-tube',
            resource_id: 'rs1c9taujhn6z4',
            lot_no: '12312',
            storage_condition: 'ambient',
            location_id: 'loc1egneyc9dd5yu',
            orderable_material_component_id: 'omatc1h3hqrv4dj64c',
            kit_order_id: 'ko1fukwpmvpym74',
            lab_id: 'lb1fknzm4k8qkq7',
            organization_id: null,
            status: 'available'
          },
          aliquots: [
            {
              well_idx: 0,
              mass_mg: 10.2,
              volume_ul: 100.47,
              lot_no: '12312',
              resource_id: 'rs1c9taujhn6z4'
            }
          ]
        },
        {
          container: {
            barcode: '53',
            container_type_id: 'vendor-tube',
            resource_id: 'rs1c9taujhn6z4',
            lot_no: '12312',
            storage_condition: 'ambient',
            volume: '100.0:microliter',
            mass: '100.0:milligram',
            location_id: 'loc1egneyc9dd5yu',
            orderable_material_component_id: 'omatc1h3hqrv4dj64c',
            kit_order_id: 'ko1fukwpmvpym74',
            lab_id: 'lb1fknzm4k8qkq7',
            organization_id: null,
            status: 'available'
          },
          aliquots: [
            {
              well_idx: 0,
              mass_mg: 100,
              volume_ul: 100,
              lot_no: '12312',
              resource_id: 'rs1c9taujhn6z4'
            }
          ]
        }
      ]
    }
  ];

  const materialCheckinPayload = {
    id: 'order-missing-id-0',
    data: [
      {
        container: {
          barcode: '50',
          container_type_id: 'vendor-tube',
          lot_no: '23674',
          storage_condition: 'ambient',
          location_id: 'loc1egneyc9dd5yu',
          orderable_material_component_id: 'omatc1h3hqrv4dj64c',
          lab_id: 'lb1fknzm4k8qkq7',
          organization_id: null,
          status: 'available'
        },
        aliquots: [
          {
            well_idx: 0,
            mass_mg: 100,
            volume_ul: 100,
            lot_no: '12312',
            resource_id: 'rs1c9taujhn6z4'
          }
        ]
      },
      {
        container: {
          barcode: '51',
          container_type_id: 'vendor-tube',
          storage_condition: 'ambient',
          orderable_material_component_id: 'omatc1h3hqrv4dj64c',
          lab_id: 'lb1fknzm4k8qkq7',
          organization_id: null,
          status: 'available'
        },
        aliquots: [
          {
            well_idx: 0,
            mass_mg: 100,
            volume_ul: 100,
            lot_no: '12312',
            resource_id: 'rs1c9taujhn6z4'
          }
        ]
      }
    ]
  };

  afterEach(() => {
    sandbox.restore();
  });

  it('should call bulkCheckin', () => {
    const post = sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb(mockPayload);
        return { fail: () => ({}) };
      }
    });
    const mockDispatch = sandbox.spy(Dispatcher, 'dispatch');

    KitOrderActions.bulkCheckin(mockPayload);

    expect(post.calledOnce).to.be.true;
    expect(post.calledWith(`${baseUrl}/bulk_checkin`, { kit_orders: mockPayload })).to.be.true;
    expect(mockDispatch.calledOnce);
  });

  it('should display notification on bulk checkin failure', () => {
    sandbox.stub(ajax, 'post').returns({
      done: () => ({
        fail: (cb) => cb({})
      })
    });
    const createNotification = sandbox.stub(NotificationActions, 'createNotification');

    KitOrderActions.bulkCheckin([]);
    expect(createNotification.called).to.be.true;
  });

  it('should call materialCheckin', () => {
    const post = sandbox.stub(ajax, 'post').returns({
      fail: () => {}
    });

    KitOrderActions.materialCheckin(materialCheckinPayload);

    expect(post.calledOnce).to.be.true;
    expect(post.calledWith(Urls.material_checkin(), { kit_order: materialCheckinPayload })).to.be.true;
  });

  it('should display notification on material checkin failure', () => {
    sandbox.stub(ajax, 'post').returns({
      fail: (cb) => cb({})
    });
    const createNotification = sandbox.stub(NotificationActions, 'createNotification');

    KitOrderActions.materialCheckin({});
    expect(createNotification.called).to.be.true;
  });
});
