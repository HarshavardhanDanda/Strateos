import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import { Button, KeyValueList } from '@transcriptic/amino';
import ShipmentCard from './ShipmentCard';

describe('ShipmentCard', () => {
  const sandbox = sinon.createSandbox();
  let shipmentCard;

  const intakeKit = Immutable.fromJS({
    created_at: '2020-02-19T16:43:04.496-08:00',
    est_delivery_date: '2020-04-10',
    name: 'Intake Kit 7',
    organization_id: 'org1amxh23ednpz',
    received_at: null,
    status: 'pre_transit',
    status_message: 'Shipment information sent to FedEx',
    status_update_time: '2020-04-06T17:41:22.000-07:00',
    tracking_number: '391680980330',
    user_id: 'u1bfbgrzwe8fb',
    lab_id: 'lb1fgjqybducu2k',
    admin_processed_at: null,
    intake_kit_items: [
      {
        id: 325,
        intake_kit_id: 'ik1e5a2yhpwfewp',
        container_type_id: '96-pcr',
        quantity: 5
      },
      {
        id: 326,
        intake_kit_id: 'ik1e5a2yhpwfewp',
        container_type_id: 'micro-1.5',
        quantity: 1
      }
    ],
    items_count: 6
  });

  const props = {
    key: intakeKit.get('id'),
    className: 'outbound-shipment',
    createdAt: intakeKit.get('created_at'),
    title: intakeKit.get('name') || 'Unnamed',
    statusMessage: intakeKit.get('status_message'),
    trackingNumber: intakeKit.get('tracking_number'),
    carrier: intakeKit.get('carrier'),
    intakeKitItems: intakeKit.get('intake_kit_items').toJS()
  };

  afterEach(() => {
    if (shipmentCard) shipmentCard.unmount();
    sandbox.restore();
  });

  it('should render ShipmentCard component', () => {
    shipmentCard = shallow(<ShipmentCard {...props} />);
    expect(shipmentCard).to.be.not.undefined;
  });

  it('should render box and plate information in ShipmentCard', () => {
    shipmentCard = shallow(<ShipmentCard {...props} />);
    expect(shipmentCard.find('h3').text()).to.be.equal(intakeKit.get('name'));
    expect(shipmentCard.find('p').findWhere(node => node.props().className === 'shipment-card__shipping-status')
      .text()).to.be.equal(intakeKit.get('status_message'));
    expect(shipmentCard.find('p').findWhere(node => node.props().className === 'tx-type--heavy')
      .text()).to.be.equal('5 plates of Transcriptic 96-pcr, 1 box of Transcriptic 1.5mL tubes');
    expect(shipmentCard.find(KeyValueList).length).to.equals(2);
  });

  it('should render box information in ShipmentCard', () => {
    const intakeKit = Immutable.fromJS({
      name: 'Intake Kit 7',
      organization_id: 'org1amxh23ednpz',
      intake_kit_items: [
        {
          id: 326,
          intake_kit_id: 'ik1e5a2yhpwfewp',
          container_type_id: 'micro-1.5',
          quantity: 1
        }
      ]
    });

    const newProps = {
      ...props,
      intakeKitItems: intakeKit.get('intake_kit_items').toJS(),
    };
    shipmentCard = shallow(<ShipmentCard {...newProps} />);
    expect(shipmentCard.find('p').findWhere(node => node.props().className === 'tx-type--heavy')
      .text()).to.be.equal('1 box of Transcriptic 1.5mL tubes');
  });

  it('should render A1,D1,D2 vials information in ShipmentCard', () => {
    const newprops = { ...props,
      intakeKitItems: [
        {
          id: 325,
          intake_kit_id: 'ik1e5a2yhpwfewp',
          container_type_id: 'a1-vial',
          quantity: 5
        },
        {
          id: 326,
          intake_kit_id: 'ik1e5a2yhpwfewp',
          container_type_id: 'd1-vial',
          quantity: 1
        }
      ] };
    const onActionSpy = sandbox.spy();
    shipmentCard = shallow(<ShipmentCard
      {...newprops}
      onAction={onActionSpy}
      actionText={'View Shipment'}
      detailEntries={[
        {
          key: 'Shipment ID:',
          value: <p className="monospace shipment-card__shipment-id">{'ABCD'}</p>
        }
      ]}
    />);
    const keyValueList = shipmentCard.find(KeyValueList);
    expect(keyValueList.at(0).prop('alignLeft')).to.be.true;
    expect(keyValueList.at(0).prop('entries').length).to.be.equal(2);
    const leftKeys = keyValueList.at(0).prop('entries').map(ele => ele.key);
    expect(leftKeys).to.deep.equal(['Shipment ID:', 'Created:']);

    expect(keyValueList.at(1).prop('alignRight')).to.be.true;
    expect(keyValueList.at(1).prop('entries').length).to.be.equal(1);
    const rightKeys = keyValueList.at(1).prop('entries').map(ele => ele.key);
    expect(rightKeys).to.deep.equal(['Tracking No.:']);

    expect(shipmentCard.find('p').findWhere(node => node.props().className === 'tx-type--heavy')
      .text()).to.be.equal('5 Racks of 24 A1 vials, 1 Rack of 12 D1 vials');
    expect(shipmentCard.find(Button).length).to.be.equal(1);
    expect(shipmentCard.find(Button).at(0).dive().text()).to.be.equal('View Shipment');
    shipmentCard.find(Button).at(0).simulate('click');
    expect(onActionSpy.calledOnce).to.be.true;
  });

  it('should render A1 vial information in ShipmentCard', () => {
    const newprops = { ...props,
      intakeKitItems: [
        {
          id: 325,
          intake_kit_id: 'ik1e5a2yhpwfewp',
          container_type_id: 'a1-vial',
          quantity: 5
        }
      ] };
    shipmentCard = shallow(<ShipmentCard
      {...newprops}
      actionText={'View Shipment'}
      detailEntries={[
        {
          key: 'Shipment ID:',
          value: <p className="monospace shipment-card__shipment-id">{'ABCD'}</p>
        }
      ]}
    />);
    expect(shipmentCard.find('p').findWhere(node => node.props().className === 'tx-type--heavy')
      .text()).to.be.equal('5 Racks of 24 A1 vials');
  });

  it('should render A1, D1 and D2 vials, box and plate information in ShipmentCard', () => {
    const newprops = { ...props,
      intakeKitItems: [...props.intakeKitItems,
        {
          id: 325,
          intake_kit_id: 'ik1e5a2yhpwfewp',
          container_type_id: 'a1-vial',
          quantity: 5
        },
        {
          id: 326,
          intake_kit_id: 'ik1e5a2yhpwfewp',
          container_type_id: 'd1-vial',
          quantity: 1
        },
        {
          id: 327,
          intake_kit_id: 'ik1e5a2yhpwfewp',
          container_type_id: 'd2-vial',
          quantity: 1
        }
      ] };
    shipmentCard = shallow(<ShipmentCard
      {...newprops}
      actionText={'View Shipment'}
      detailEntries={[
        {
          key: 'Shipment ID:',
          value: <p className="monospace shipment-card__shipment-id">{'ABCD'}</p>
        }
      ]}
    />);
    expect(shipmentCard.find('p').findWhere(node => node.props().className === 'tx-type--heavy')
      .text()).to.be.equal('5 plates of Transcriptic 96-pcr, 1 box of Transcriptic 1.5mL tubes, 5 Racks of 24 A1 vials, 1 Rack of 12 D1 vials, 1 Rack of 8 HRD2 vials');
  });
});
