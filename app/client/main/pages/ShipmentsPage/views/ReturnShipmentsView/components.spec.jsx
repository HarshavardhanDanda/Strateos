import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import ReturnShipmentCard from './components';

describe('ReturnShipmentCard', () => {
  let wrapper;
  const shipment = {
    id: 'rets19urwgytmxz4',
    created_at: '2022-11-14 22:59:52.121',
    temp: 'Ambient',
    status: 'shipped',
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
    tracking_number: '785369736503',
    carrier: 'FedEx',
    containers:      [{
      barcode: '025896',
      label: 'loactionTest',
      is_tube: false,
      type: 'containers',
      id: 'ct1fmvx6tezpe83'
    }],
    delivery_date: '2022-11-18',
    is_courier_pickup: false
  };

  it('should render without any errors', () => {
    mount(<ReturnShipmentCard key={shipment.id} returnShipment={shipment} />);
  });

  it('should display delivery date, status and info if it is not a courier pickup', () => {
    wrapper = mount(<ReturnShipmentCard key={shipment.id} returnShipment={shipment} />);
    expect(wrapper.find('div').at(6).find('h3').text()).equal('delivered Nov 18, 2022');
    expect(wrapper.find('div').at(6).find('p').at(0)
      .text()).equal('Your return shipment has been delivered.');
  });

  it('should display picked up status and info if it is a courier pickup', () => {
    wrapper = mount(<ReturnShipmentCard key={shipment.id} returnShipment={{ ...shipment, is_courier_pickup: true }} />);
    expect(wrapper.find('div').at(6).find('h3').text()).equal('Picked Up ');
    expect(wrapper.find('div').at(6).find('p').at(0)
      .text()).equal('Your return shipment has been picked up by FedEx.');
  });

  it('should display default status and info', () => {
    wrapper = mount(<ReturnShipmentCard key={shipment.id} returnShipment={{ ...shipment, delivery_date: null }} />);
    expect(wrapper.find('div').at(6).find('h3').text()).equal('shipped ');
    expect(wrapper.find('div').at(6).find('p').at(0)
      .text()).equal('Your return shipment has been shipped.');
  });
});
