import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Popover } from '@transcriptic/amino';
import HazardTag from 'main/components/Hazards/HazardTag';
import HazardPopoverTags from './HazardPopoverTags';

describe('HazardPopoverTags', () => {
  let wrapper;
  let hazards = ['flammable'];

  afterEach(() => {
    wrapper.unmount();
  });

  it('should render without error', () => {
    wrapper = shallow(
      <HazardPopoverTags hazards={hazards} />
    );
  });

  it('should have popover for hazard flags', () => {
    wrapper = shallow(<HazardPopoverTags hazards={hazards} />);

    expect(wrapper.find(Popover)).to.have.length(1);
    expect(wrapper.find(Popover).find(HazardTag).props().hazard).to.equal('flammable');
  });

  it('should have popover and tag icon if hazard flags greater than 1', () => {
    hazards = ['flammable', 'oxidizer', 'strong_acid'];
    wrapper = shallow(<HazardPopoverTags hazards={hazards} />);

    expect(wrapper.find(Popover)).to.have.length(1);
    expect(wrapper.find(Popover).find('p').text()).to.equal(hazards.length.toString());
    expect(wrapper.find(Popover).find('.fa-tags')).to.have.length(1);
  });

  it('should return - when hazards are empty ', () => {
    wrapper = shallow(<HazardPopoverTags hazards={[]} />);
    expect(wrapper.text()).to.equal('-');
  });
});
