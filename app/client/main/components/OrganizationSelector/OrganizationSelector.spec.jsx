import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import Sinon from 'sinon';
import SessionStore from 'main/stores/SessionStore';
import { Dismissable } from '@transcriptic/amino';
import UserProfile from 'main/components/UserProfile';

import OrganizationSelector, { OrgRow } from './OrganizationSelector';

describe('OrganizationSelector', () => {
  let organizationSelector;

  const userOrganizations = [
    {
      id: 'org13',
      name: 'Strateos'
    },
    {
      id: 'org12',
      name: 'Test Org'
    }
  ];

  const sandbox = Sinon.createSandbox();
  const user = Immutable.fromJS({ id: 'user-id', name: 'Test User', organizations: userOrganizations });

  const props = {
    subdomain: 'transcriptic',
    user: user,
    organizations: Immutable.fromJS(userOrganizations)
  };

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getUser').returns(user);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org113', name: 'Strateos' }));
  });

  afterEach(() => {
    if (organizationSelector) {
      organizationSelector.unmount();
    }
    sandbox.restore();
  });

  it('should render dismissable without errors', () => {
    organizationSelector = shallow(
      <OrganizationSelector {...props}  />
    ).dive();

    organizationSelector.setState({ shouldShowDismissable: true });
    organizationSelector.update();

    const dismissable = organizationSelector.find(Dismissable);
    expect(dismissable.length).to.equal(1);
    expect(dismissable.props().isOpen).to.be.true;
  });

  it('should hide Dismissable when shouldShowDismissable is false', () => {
    organizationSelector = shallow(
      <OrganizationSelector {...props}  />
    ).dive();

    organizationSelector.setState({ shouldShowDismissable: false });
    const dismissable = organizationSelector.find(Dismissable);
    expect(dismissable.props().isOpen).to.be.false;
  });

  it('should render UserProfile without errors', () => {
    organizationSelector = shallow(
      <OrganizationSelector {...props}  />
    ).dive();

    organizationSelector.setState({ shouldShowDismissable: true });
    const userProfile = organizationSelector.find(UserProfile);
    expect(userProfile.length).to.equal(1);
  });

  it('should render OrgRow without errors', () => {
    organizationSelector = shallow(
      <OrganizationSelector {...props}  />
    ).dive();

    organizationSelector.setState({ shouldShowDismissable: true });
    const orgRow = organizationSelector.find(OrgRow);
    expect(orgRow.length).to.equal(3);
  });
});
