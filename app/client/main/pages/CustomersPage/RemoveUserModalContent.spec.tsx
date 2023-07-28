import React from 'react';
import { expect } from 'chai';
import { shallow, mount } from 'enzyme';
import Immutable from 'immutable';
import { Table, TextTitle } from '@transcriptic/amino';
import sinon from 'sinon';

import UserAPI from 'main/api/UserAPI';
import LabAPI from 'main/api/LabAPI';
import UserStore from 'main/stores/UserStore';
import Urls from 'main/util/urls';
import ajax from 'main/util/ajax';
import RemoveUserModalContent from './RemoveUserModalContent';

describe('RemoveUserModalContent', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  let permissionSummaryStub;
  const user = {
    organizations: [
      {
        test_account: false,
        default_payment_method_id: null,
        subdomain: 'test',
        signals_api_key: null,
        owner_id: 'user456',
        two_factor_auth_enabled: false,
        created_at: '2023-04-04T03:00:16.263-07:00',
        run_stats: {
          total: 0,
          open: 0
        },
        name: 'test org',
        validated: false,
        num_collaborators: 2,
        org_type: 'CL',
        updated_at: '2023-04-06T05:38:28.052-07:00',
        netsuite_customer_id: null,
        api_key: 'a207bbe1ce23c4c92aeb20dc070787ae',
        type: 'organizations',
        id: 'org123',
        signals_tenant: null,
        account_manager_id: null,
        group: 'com.test'
      }
    ],
    invitation_accepted_at: null,
    'locked_out?': null,
    two_factor_auth_enabled: false,
    last_sign_in_ip: null,
    created_at: '2022-07-27T01:34:09.235-07:00',
    name: 'name123',
    last_sign_in_at: null,
    last_name: null,
    invitation_sent_at: '2022-07-27T01:34:09.316-07:00',
    is_developer: false,
    updated_at: '2022-07-27T01:34:09.317-07:00',
    first_name: 'name123',
    type: 'users',
    id: 'user123',
    email: 'name.test@mail.com',
    profile_img_url: null,
    feature_groups: []
  };

  const acsData = {
    userIds: ['user123'],
    contextIds: ['org123'],
    orgId: 'org123'
  };

  const acsDataWithFeatureCode = {
    contextIds: ['org123'],
    orgId: 'org123',
    featureCode: 'ADMINISTRATION'
  };

  const userPermissions = [
    {
      id: '54163765-d2d7-42ed-ab2c-78470ec57fb6',
      userId: 'user123',
      featureGroup: {
        id: 'edef0974-90c9-46ec-a8c7-72c81ba19f9d',
        label: 'User',
        description: 'Features applicable to scientist',
        context: 'ORGANIZATION'
      },
      contextId: 'org123'
    }
  ];

  const data = Immutable.fromJS({
    id: 'user123',
    name: 'name123',
    email: 'name.test@mail.com',
    org_ids: [
      'org123',
    ],
    profile_img_url: 'profileimg'
  });

  beforeEach(() => {
    sandbox.stub(UserAPI, 'get').returns({ done: (cb) => {
      cb({});
      return { fail: () => ({}) };
    } });
    sandbox.stub(UserStore, 'getById').returns(Immutable.fromJS(user));
    sandbox.stub(LabAPI, 'indexAll').returns({ done: (cb) => {
      cb({});
      return { fail: () => ({}) };
    } });
    permissionSummaryStub = sandbox.stub(ajax, 'post');
  });

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should contain the profile of user', () => {
    wrapper = shallow(<RemoveUserModalContent data={data} />);
    const profile = wrapper.find('Profile');
    expect(profile.length).to.equal(1);
    expect(profile.props().name).to.equal('name123');
  });

  it('should contain text title', () => {
    wrapper = shallow(<RemoveUserModalContent data={data} />);
    const text = wrapper.find(TextTitle).dive().find('Text');
    expect(text.dive().find('h3').text()).to.equal('Organization(s)');
  });

  it('should contain user organizations table', () => {
    wrapper = shallow(<RemoveUserModalContent data={data} />);
    const table = wrapper.find(Table);
    expect(table.find('Column').at(0).props().header).to.equal('NAME');
    expect(table.find('Column').at(1).props().header).to.equal('ROLE');
  });

  it('should not show user as a sole admin when he is only a scientist user in that org ', async () => {
    const userPermissionsWithAdminFlag = [
      {
        id: 'b2ad3a60-4914-4b3a-a1bc-bafd8d0aa79e',
        userId: 'user456',
        featureGroup: {
          id: '37a4299e-56f0-45eb-b47e-d07802de8ff6',
          label: 'Admin',
          description: 'admin permissions',
          context: 'ORGANIZATION'
        },
        contextId: 'org123'
      }
    ];

    permissionSummaryStub
      .withArgs(Urls.permission_summary(), acsData)
      .returns(userPermissions);

    permissionSummaryStub
      .withArgs(Urls.permission_summary(), acsDataWithFeatureCode)
      .returns(userPermissionsWithAdminFlag);

    const waitForPromises = () => new Promise(setImmediate);
    wrapper = mount(<RemoveUserModalContent data={data} selected={() => {}} />);
    await waitForPromises();
    wrapper.update();

    const orgName = wrapper.find('Table').find('Body').find('Row').at(0)
      .find('BodyCell')
      .at(1)
      .find('.remove-user-modal__displayfile')
      .at(0)
      .text();

    const roleName = wrapper.find('Table').find('Body').find('Row').at(0)
      .find('BodyCell')
      .at(2)
      .find('.amino-table__cell-content--scrollable')
      .at(0)
      .text();

    const checkbox = wrapper.find('Table').find('Body').find('Row').at(0)
      .find('BodyCell')
      .at(0)
      .find('Checkbox')
      .at(0);

    expect(orgName).to.be.equal('test org');
    expect(roleName).to.be.equal('User');

    // For removable users checkbox is always checked
    expect(checkbox.props().checked).to.be.equal('checked');
  });

  it('should show user as a sole admin and disable remove when he is the only admin in that org', async () => {
    const userPermissionsWithAdminFlag = [
      {
        id: 'b2ad3a60-4914-4b3a-a1bc-bafd8d0aa79e',
        userId: 'user123',
        featureGroup: {
          id: '37a4299e-56f0-45eb-b47e-d07802de8ff6',
          label: 'Admin',
          description: 'admin permissions',
          context: 'ORGANIZATION'
        },
        contextId: 'org123'
      }
    ];

    permissionSummaryStub
      .withArgs(Urls.permission_summary(), acsData)
      .returns(userPermissions);

    permissionSummaryStub
      .withArgs(Urls.permission_summary(), acsDataWithFeatureCode)
      .returns(userPermissionsWithAdminFlag);

    const waitForPromises = () => new Promise(setImmediate);
    wrapper = mount(<RemoveUserModalContent data={data} selected={() => {}} />);
    await waitForPromises();
    wrapper.update();

    const orgName = wrapper.find('Table').find('Body').find('Row').at(0)
      .find('BodyCell')
      .at(1)
      .find('.remove-user-modal__displayfile')
      .at(0)
      .text();

    const roleName = wrapper.find('Table').find('Body').find('Row').at(0)
      .find('BodyCell')
      .at(2)
      .find('.amino-table__cell-content--scrollable')
      .at(0)
      .text();

    const checkbox = wrapper.find('Table').find('Body').find('Row').at(0)
      .find('BodyCell')
      .at(0)
      .find('Checkbox')
      .at(0);

    const banner = wrapper.find('Banner').text();

    expect(orgName).to.be.equal('test org');
    expect(roleName).to.be.equal('User, Sole Admin');

    // For non removable users checkbox is always unchecked
    expect(checkbox.props().checked).to.be.equal('unchecked');

    // eslint-disable-next-line no-multi-str
    expect(banner).to.be.equal("You cannot remove this user from \"test org\" as they are the\
 sole admin or owner of this organization. Please add a new admin or transfer the organization\'s ownership.");
  });
});
