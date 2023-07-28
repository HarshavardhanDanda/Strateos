import React             from 'react';
import { expect }        from 'chai';
import { shallow }       from 'enzyme';
import Immutable from 'immutable';

import ShippingInstructions   from './ShippingInstructions';

describe('ShippingInstructions tests', () => {
  let wrapper;

  const props = {
    shipment: Immutable.fromJS({ label: 'label' }),
    labOperatorName: 'operator-name'
  };

  afterEach(() => {
    wrapper.unmount();
  });

  it('should render AddressEnvelope', () => {
    wrapper = shallow(<ShippingInstructions {...props} />);
    expect(wrapper.find('AddressEnvelope')).to.have.lengthOf(1);
  });

  it('should display text with lab operator name', () => {
    wrapper = shallow(<ShippingInstructions {...props} />);
    expect(wrapper.find('li').at(0).text()).to.equal('1. Aliquot to operator-name Containers');
    expect(wrapper.find('li').at(1).text()).to.equal('2. Ship Containers to operator-name');
  });
});
