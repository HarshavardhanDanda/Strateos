import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import Immutable from 'immutable';
import { expect } from 'chai';
import labConsumerData from 'main/test/labconsumer/testData.json';
import CourierPickupsTable from './CourierPickupsTable';

describe('CourierPickups Table', () => {
  let wrapper;

  const mockLabConsumers = Immutable.fromJS([labConsumerData[0]]);

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

  beforeEach(() => {
    sandbox.stub(LabConsumerActions, 'loadLabsForCurrentOrg').returns({ done: (cb) => cb() });
    sandbox.stub(LabConsumerStore, 'getAllForCurrentOrg').returns(mockLabConsumers);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  const sandbox = sinon.createSandbox();

  it('should render without error', () => {
    wrapper = shallow(
      <CourierPickupsTable returnShipments={returnShipments} />
    );
  });

  it('should have labOperatorName in state on initial mount', () => {
    wrapper = shallow(
      <CourierPickupsTable returnShipments={returnShipments} />
    );
    expect(wrapper.state().labOperatorName).to.equal('Strateos');
  });
});
