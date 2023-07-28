import React from 'react';

import { expect }  from 'chai';
import { shallow } from 'enzyme';

import Sidebar from './Sidebar';

const routeProps = {
  match: {
    params: {
      subdomain: 'Billing'
    },
    path: ''
  }
};

describe('SideBar Test Suit', () => {

  it('Image is present', () => {
    const ref = shallow(<Sidebar {...routeProps} />);
    const image = ref.find('.btn-file');
    expect(image.length).to.be.eql(1);
    ref.unmount();
  });

});
