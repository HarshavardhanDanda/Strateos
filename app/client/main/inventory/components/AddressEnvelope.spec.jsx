import React             from 'react';
import { expect }        from 'chai';
import { shallow }       from 'enzyme';
import Immutable         from 'immutable';
import AddressEnvelope   from './AddressEnvelope';

describe('AddressEnvelope test', () => {

  let wrapper;

  afterEach(() => {
    wrapper.unmount();
  });

  it('should display address', () => {
    const address = Immutable.fromJS({
      attention:  'Strateos Inc',
      street: '10290 Campus Point Dr',
      city: 'San Diego',
      state: 'CA',
      zipcode: 92121
    });
    wrapper = shallow(<AddressEnvelope address={address} intakeCode="ABCD" />);

    expect(wrapper.text()).to.equal('ATTN: Strateos Inc Accessioning ABCD10290 Campus Point DrSan Diego, CA, 92121');
    expect(wrapper.find('.intake-code').text()).to.eql('ABCD');
  });

  it('should ignore missing fields', () => {
    const address = Immutable.fromJS({
      attention:  'Strateos Inc',
      street: undefined,
      street_2: null,
      city: undefined,
      state: undefined,
      zipcode: undefined
    });
    wrapper = shallow(<AddressEnvelope address={address} intakeCode="ABCD" />);

    expect(wrapper.text()).to.equal('ATTN: Strateos Inc Accessioning ABCD');
  });
});
