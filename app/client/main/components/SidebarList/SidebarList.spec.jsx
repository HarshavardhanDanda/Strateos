import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import SidebarList from './SidebarList';

describe('SidebarList', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const onChangeSortOrderSpy = sandbox.spy();

  const props = {
    header: 'Sample Header',
    links: [],
    actions: [{
      to: 'www.test.com',
      onClick: () => {},
      newTab: false,
      icon: 'fa fa-eye',
      title: 'Test Title'
    }],
    sortOptions: [{
      display: 'All',
      sortOrder: 'all',
      sortFunction: () => [{
        name: 'Test Name',
        url: 'www.test.com',
        isPending: false,
        download_url: 'www.testdownload.com',
        date: {
          raw: '2023-03-15T09:16:16.522-07:00',
          format: '2023-03-15'
        },
        id: '123'
      },
      {
        name: 'Test Name 2',
        url: 'www.test1.com',
        isPending: false,
        download_url: 'www.testdownload1.com',
        date: {
          raw: '2023-03-15T09:16:16.522-07:00',
          format: '2023-03-16'
        },
        id: '123'
      }]
    }],
    sortOrder: 'all',
    onChangeSortOrder: onChangeSortOrderSpy
  };

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should render SiderbarList', () => {
    shallow(<SidebarList {...props} />);
  });

  it('should have currentSelection same as sortOrder prop', () => {
    wrapper = shallow(<SidebarList {...props} />);
    expect(wrapper.find('SearchFilter').props().currentSelection).equal('all');
  });

  it('should call onChangeSortOrder and have args when the onSelectionOption is selected', () => {
    wrapper = shallow(<SidebarList {...props} />);
    wrapper.find('SearchFilter').props().onSelectOption('asc');
    expect(onChangeSortOrderSpy.args[0][0]).to.equal('asc');
  });
});
