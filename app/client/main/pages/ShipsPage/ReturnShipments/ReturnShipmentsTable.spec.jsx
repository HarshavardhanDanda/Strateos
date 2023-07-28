import React        from 'react';
import { expect }   from 'chai';
import Immutable from 'immutable';
import { mount, shallow }    from 'enzyme';
import { Button, Column, Table } from '@transcriptic/amino';
import ReturnShipmentsTable from './ReturnShipmentsTable';

describe('ReturnShipmentsTable tests', () => {

  const returnShipments = Immutable.fromJS([
    {
      is_courier_pickup: false,
      address_id: 'addr1fknzm4kfhsgd',
      speed: '2nd Day',
      organization_id: 'org13',
      created_at: '2021-09-16T02:39:23.805-07:00',
      ep_label_url: null,
      tracking_number: null,
      containers: [
        {
          id: 'ct1g6s6pc2cmupc',
          container_type_id: 'conical-50',
          barcode: '1609202103',
          label: 'Tube 1',
          location: {
            id: 'loc1egnewnm5t8bs',
            name: '🌎 strateos-menlo-park',
            row: null,
            col: null,
            ancestors: []
          }
        }
      ],
      status: 'authorized',
      organization: {
        id: 'org13',
        name: 'Strateos'
      },
      temp: 'Ambient',
      address: {
        id: 'addr1fknzm4kfhsgd',
        attention: 'First Address',
        street: '10290 Campus Point Dr',
        street_2: null,
        city: 'San Diego',
        state: 'CA',
        zipcode: '92121',
        country: 'US'
      },
      weight: 7,
      carrier: null,
      id: 'rets1g6s6rr7qm2hg',
      quote: 43.55
    }
  ]);

  it('Check if Table is Present', () => {
    const returnShipmentsTable = shallow(<ReturnShipmentsTable returnShipments={returnShipments} />);
    expect(returnShipmentsTable.find(Table).length).to.eql(1);
  });

  it('ReturnShipmentsTable should render table with nine columns', () => {
    const returnShipmentsTable = shallow(<ReturnShipmentsTable  returnShipments={returnShipments} />);
    expect(returnShipmentsTable.find(Column).length).to.equal(9);
    expect(returnShipmentsTable.find(Column).at(0).props().header).to.equal('ID');
    expect(returnShipmentsTable.find(Column).at(1).props().header).to.equal('Organization');
    expect(returnShipmentsTable.find(Column).at(2).props().header).to.equal('Created');
    expect(returnShipmentsTable.find(Column).at(3).props().header).to.equal('Shipping Temp');
    expect(returnShipmentsTable.find(Column).at(4).props().header).to.equal('Shipping Speed');
    expect(returnShipmentsTable.find(Column).at(5).props().header).to.equal('Address');
    expect(returnShipmentsTable.find(Column).at(6).props().header).to.equal('Containers');
    expect(returnShipmentsTable.find(Column).at(7).props().header).to.equal('Label');
    expect(returnShipmentsTable.find(Column).at(8).props().header).to.equal('Next Action');
  });

  it('Should have three buttons in next action', () => {
    const returnShipmentsTable = mount(<ReturnShipmentsTable returnShipments={returnShipments} />);
    const nextAction = returnShipmentsTable.find('BodyCell').at(9);
    expect(nextAction.find(Button).length).to.be.equal(3);
    expect(nextAction.find(Button).at(0).props().label).to.be.equal('Purchase label');
    expect(nextAction.find(Button).at(1).props().label).to.be.equal('Cancel shipment');
    expect(nextAction.find(Button).at(2).props().label).to.be.equal('Download contents');
  });

});
