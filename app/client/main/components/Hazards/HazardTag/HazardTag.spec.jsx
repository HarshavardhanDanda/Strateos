import React from 'react';
import { expect } from 'chai';

import HazardTag from 'main/components/Hazards/HazardTag';

describe('HazardTag', () => {
  it('should render without error', () => {
    return enzyme.shallow(
      <HazardTag hazard="flammable" />
    );
  });

  it('should display hazard name', () => {
    const component = enzyme.shallow(
      <HazardTag hazard="flammable" />
    );
    expect(component.find('Tag')).to.have.lengthOf(1);
    expect(component.find('Tag').prop('text')).to.equal('Flammable');
  });

  it('should set background color in Tag props', () => {
    const component = enzyme.shallow(
      <HazardTag hazard="flammable" color="red" />
    );
    expect(component.find('Tag').prop('backgroundColor')).to.equal('red');
  });
});
