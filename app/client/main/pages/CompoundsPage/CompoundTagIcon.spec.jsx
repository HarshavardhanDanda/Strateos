import React from 'react';
import { expect } from 'chai';

import CompoundTagIcon from './CompoundTagIcon';

describe('CompoundTagIcon', () => {
  it('should render like... at all', () => {
    return enzyme.shallow(
      <CompoundTagIcon
        privateIcon="foo"
        publicIcon="bar"
        organizationId="org13"
      />
    );
  });

  it('should render public icon when no org_id', () => {
    const icon = enzyme.shallow(
      <CompoundTagIcon
        privateIcon="foo"
        publicIcon="bar"
      />
    );

    expect(icon.find('img')).to.have.length(1);
    expect(icon.find('img').prop('src')).to.eql('bar');
  });

  it('should render private icon when org_id exists', () => {
    const icon = enzyme.shallow(
      <CompoundTagIcon
        privateIcon="foo"
        publicIcon="bar"
        organizationId="org13"
      />
    );

    expect(icon.find('i')).to.have.length(1);
    expect(icon.find('i').prop('className')).to.eql('foo');
  });
});
