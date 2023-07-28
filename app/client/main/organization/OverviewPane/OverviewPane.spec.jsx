import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Card } from '@transcriptic/amino';

import { OverviewPane } from './index';

describe('Overview Pane', () => {
  const org = Immutable.Map({ 'validated?': true });
  const orgFalse = Immutable.Map({ 'validated?': false });

  let ref;
  afterEach(() => {
    ref.unmount();
  });

  it('Card is Present', () => {
    ref = shallow(<OverviewPane subdomain="" org={org} isOrgAdmin />);
    const Card1 = ref.find(Card);
    expect(Card1.length).to.be.eql(2);
  });

  it('Account Overview', () => {
    ref = shallow(<OverviewPane subdomain="" org={org} isOrgAdmin />);
    const IsApproved = ref.find('.tx-type--heavy');
    expect(IsApproved.first().text()).to.be.eql('Account Overview');
  });

  it('Account not verified Alert Message', () => {
    ref = shallow(<OverviewPane subdomain="" org={orgFalse} isOrgAdmin />);
    const IsApproved = ref.find('Banner');
    expect(IsApproved.props().bannerTitle).contains(
      'Account Pending'
    );
  });

});
