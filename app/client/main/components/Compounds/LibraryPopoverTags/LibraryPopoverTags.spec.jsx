import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Popover, Tag } from '@transcriptic/amino';
import LibraryPopoverTags from './LibraryPopoverTags';

describe('LibraryPopoverTags', () => {
  let wrapper;
  const libraries = [{
    id: 'lib-id1',
    name: 'lib1',
    organization_id: 'org13'
  },
  {
    id: 'lib-id2',
    name: 'lib2',
    organization_id: 'org13'
  }
  ];

  afterEach(() => {
    wrapper.unmount();
  });

  it('should render without error', () => {
    wrapper = shallow(
      <LibraryPopoverTags libraries={libraries} />
    );
  });

  it('should have popover and tag icon when more than one library', () => {
    wrapper = shallow(<LibraryPopoverTags libraries={libraries} />);

    expect(wrapper.find(Popover)).to.have.length(1);
    expect(wrapper.find(Popover).prop('content')).to.have.length(libraries.length);
    expect(wrapper.find(Popover).find('p').text()).to.equal(libraries.length.toString());
    expect(wrapper.find(Popover).find('.fa-tags')).to.have.length(1);
  });

  it('should have tag if one library', () => {
    wrapper = shallow(<LibraryPopoverTags libraries={[libraries[0]]} />);
    expect(wrapper.find(Popover).prop('content')).to.have.length(1);
    expect(wrapper.find(Tag)).to.have.length(1);
    expect(wrapper.find(Tag).prop('text')).to.equal(libraries[0].name);
  });

  it('should return - when libraries are empty ', () => {
    wrapper = shallow(<LibraryPopoverTags libraries={[]} />);
    expect(wrapper.text()).to.equal('-');
  });
});
