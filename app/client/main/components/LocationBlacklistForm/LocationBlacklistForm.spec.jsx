import React from 'react';
import _ from 'lodash';
import sinon from 'sinon';
import { expect } from 'chai';

import LocationBlacklistForm from './LocationBlacklistForm';

describe('LocationBlacklistForm', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  const blacklist = ['flammable'];
  const ancestorBlacklist = ['oxidizer'];

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should display checkboxes hazardous flags', () => {
    wrapper = enzyme.shallow(
      <LocationBlacklistForm
        blacklist={blacklist}
        ancestorBlacklist={ancestorBlacklist}
      />
    );

    expect(wrapper.find('Checkbox').length).to.equal(9);
  });

  it('should check blacklisted hazards', () => {
    wrapper = enzyme.shallow(
      <LocationBlacklistForm
        blacklist={blacklist}
        ancestorBlacklist={ancestorBlacklist}
      />
    );

    expect(wrapper.find('Checkbox').at(0).props()).to.deep.include({
      label: 'Unknown',
      checked: 'unchecked',
      disabled: false
    });
    expect(wrapper.find('Checkbox').at(1).props()).to.deep.include({
      label: 'Flammable',
      checked: 'checked',
      disabled: false
    });
  });

  it('should check and disable ancestor blacklisted hazards', () => {
    wrapper = enzyme.shallow(
      <LocationBlacklistForm
        blacklist={blacklist}
        ancestorBlacklist={ancestorBlacklist}
      />
    );

    expect(wrapper.find('Checkbox').at(2).props()).to.deep.include({
      label: 'Oxidizer',
      checked: 'checked',
      disabled: true
    });
  });
});
