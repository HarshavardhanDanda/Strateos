import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';

import AccountManagerEdit from './AccountManagerEdit';

describe('AccountManagerEdit', () => {
  let wrapper;

  const props = {
    admins: Immutable.List(),
    initialAccountManager: 'admin',
    saveOrganization: () => {}
  };

  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  it('should render', () => {
    wrapper = shallow(<AccountManagerEdit {...props} />);
  });

  it('should update state accountManager on select change', () => {
    wrapper = shallow(<AccountManagerEdit {...props} />);
    expect(wrapper.find('Select').props().value).equals('admin');
    wrapper.find('Select').props().onChange({ target: { value: 'admin1' } });
    expect(wrapper.find('Select').props().value).equals('admin1');
  });
});
