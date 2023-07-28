import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { Card, TextTitle } from '@transcriptic/amino';
import { SecurityPane } from './SecurityPane';

describe('Security Pane', () => {

  let securityPane;

  const props = Immutable.Map({
    id: 647,
    admin: true,
    collaborating: {
      id: 'u1786qx96dfsg',
      email: 'vanessa@transcriptic.com',
      name: 'Vanessa Biggers',
      two_factor_auth_enabled: false,
      locked_out: undefined
    }
  });

  const auth_enabled = Immutable.Map({
    id: 647,
    admin: true,
    two_factor_auth_enabled: true,
    collaborating: {
      id: 'u1786qx96dfsg',
      email: 'vanessa@transcriptic.com',
      name: 'Vanessa Biggers',
      locked_out: undefined
    }
  });

  afterEach(() => {
    securityPane.unmount();
  });

  it('security pane enable should render on load', () => {
    securityPane = shallow(<SecurityPane  org={props} />);
    const text = securityPane.find(Card).find('div')
      .find(TextTitle)
      .dive()
      .find('Text')
      .dive()
      .find('h4');
    expect(text.children().text()).to.includes('Two-factor authentication is not yet enabled for this organization.');
  });

  it('security pane disable should render on load', () => {
    securityPane = shallow(<SecurityPane  org={auth_enabled} />);
    const text = securityPane.find(Card).find('div')
      .find(TextTitle)
      .dive()
      .find('Text')
      .dive()
      .find('h4');
    expect(text.children().text()).to.includes('Two-factor authentication is enabled for this organization.');
  });

  it('security pane should have card component', () => {
    securityPane = shallow(<SecurityPane org={props} />);
    expect(securityPane.find(Card).length).to.equal(1);
  });
});
