import React from 'react';

import { expect } from 'chai';
import { shallow } from 'enzyme';

import Sidebar from './Sidebar';
import TabComponent from './TabComponent';

describe('Tab Component Test Suit', () => {

  it('Check if Sidebar is present ', () => {
    const ref = shallow(<TabComponent />);
    const Sidebar1 = ref.find(Sidebar);
    expect(Sidebar1.length).to.be.eql(1);
    ref.unmount();
  });

});
