import React from 'react';
import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';
import Immutable from 'immutable';
import _ from 'lodash';
import { DateTime } from '@transcriptic/amino';

import LabAPI from 'main/api/LabAPI';
import ajax from 'main/util/ajax';
import LabStore from 'main/stores/LabStore';
import UserProfileView from './UserProfileView';

describe('UserProfileView - Users Profile View', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  let permissionApiSpy;

  const user = {
    id: 'u18dcbwhctbnj',
    name: 'john doe',
    email: 'jdoe@transcriptic.com',
    featureGroups: ['pricing_breakdown', 'can_view_notebooks'],
    last_sign_in_ip: '0.0.0.0',
    created_at: '2020-05-27T09:16:16.522-07:00',
    organizations: [
      { name: 'Culver Industries', featureGroups: ['compound_management'] },
      { name: 'Transcriptic', profilePhotoAttachmentUrl: 'uploads/20cc5eb4-e085ad844837/user-image.png' }
    ]
  };

  const labs = {
    data: [{
      name: 'Menlo Park',
      operated_by_id: 'org13',
      operated_by_name: 'Strateos',
      id: 'lb1fj4qj5g99pm5'
    }]
  };

  const permission_summary = [{
    contextId: 'org13',
    featureGroup: {
      context: 'ORGANIZATION',
      description: 'Features applicable to users who manages organizations administrative tasks like adding their own users, granting permissions',
      id: '287bf028-7cd5-4cb9-9ac1-b199ecfa25db',
      label: 'Admin'
    },
    userId: 'u18dcbwhctbnj'
  },
  {
    contextId: 'lb1fj4qj5g99pm5',
    featureGroup: {
      context: 'LAB',
      description: 'Features applicable to users who are responsible for RUN execution',
      id: 'd95be709-22d5-41a0-9cf5-2f19591e91f9',
      label: 'Operator'
    },
    userId: 'u18dcbwhctbnj'
  }
  ];

  const collaborations = [
    {
      organization: { name: 'Culver Industries', featureGroups: ['compound_management'] }
    },
    {
      organization: { name: 'Transcriptic', profilePhotoAttachmentUrl: 'uploads/20cc5eb4-e085ad844837/user-image.png' }
    }
  ];

  function getTestComponent(u) {
    return mount(
      <UserProfileView
        user={Immutable.fromJS(u)}
      />
    );
  }

  beforeEach(() => {
    sandbox.stub(LabAPI, 'indexAll').returns(labs);

    permissionApiSpy = sandbox.stub(ajax, 'post').returns(permission_summary);
    sandbox.stub(LabStore, 'getById').returns(Immutable.fromJS({ name: 'Menlo Park' }));

  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  it('should have Profile Pic Layout in Users Detail when user prop is passed', () => {
    wrapper = getTestComponent(user);
    expect(wrapper.find('ProfilePicSection').length).to.equal(1);
  });

  it('should show correct name in Profile Pic Layout', () => {
    wrapper = getTestComponent(user);
    expect(wrapper.find('.user-profile__profile-pic-section').children().at(1).text()).to.equal(user.name);
  });

  it('should show initials when no profile pic url not present in Profile Pic Layout', () => {
    wrapper = getTestComponent(user);
    expect(wrapper.find('.user-profile__profile-pic-placeholder').children().text()).to.equal('JD');
  });

  it('should show profile pic if url is present in Profile Pic Layout', () => {
    wrapper = getTestComponent(_.assign({ profile_img_url: 'sample' }, user));
    expect(wrapper.find('.user-profile__profile-pic').length).to.equal(1);
    expect(wrapper.find('.user-profile__profile-pic').prop('src')).to.equal('sample');
  });

  it('should show Locked tag', () => {
    wrapper = getTestComponent(_.assign({ 'locked_out?': true }, user));
    expect(wrapper.find('.user-profile__tags').find('StatusPill').length).to.equal(1);
  });

  it('should show Developer tag', () => {
    wrapper = getTestComponent(_.assign({ is_developer: true }, user));
    expect(wrapper.find('.user-profile__tags').find('StatusPill').length).to.equal(1);
  });

  it('should show 2FA Enabled tag', () => {
    wrapper = getTestComponent(_.assign({ two_factor_auth_enabled: true }, user));
    expect(wrapper.find('.user-profile__tags').find('StatusPill').length).to.equal(1);
  });

  it('should show all tags', () => {
    wrapper = getTestComponent(_.assign({ 'locked_out?': true, is_developer: true, two_factor_auth_enabled: true }, user));
    expect(wrapper.find('.user-profile__tags').find('StatusPill').length).to.equal(3);
  });

  it('should contain the key value list', () => {
    wrapper = getTestComponent(user);
    expect(wrapper.find('KeyValueList').length).to.equal(1);
    const entries = wrapper.find('KeyValueList').prop('entries');
    expect(entries[0].key).to.equal('NAME');
    expect(shallow(entries[0].value).text()).to.equal(user.name);
    expect(entries[1].key).to.equal('EMAIL ADDRESS');
    expect(shallow(entries[1].value).text()).to.equal(user.email);
    expect(entries[2].key).to.equal('USER ID');
    expect(shallow(entries[2].value).text()).to.equal(user.id);
    expect(entries[3].key).to.equal('JOINED');
    const dateTime = wrapper.find(DateTime);
    expect(dateTime.prop('timestamp')).to.equal(user.created_at);
    expect(entries[4].key).to.equal('LAST LOGIN AT');
    expect(entries[5].key).to.equal('LAST LOGIN IP');
    expect(shallow(entries[5].value).text()).to.equal(user.last_sign_in_ip);
    expect(entries[6].key).to.equal('ORGANIZATIONS');
    expect(shallow(entries[6].value).text()).to.equal('N/A');
  });

  it('should contain correct collaborations',  () => {

    const orgsWithRoles = user.organizations.map(org => Object.assign(org, { roles: [{ roleName: 'Admin', contextName: undefined }, { roleName: 'Lab Manager', contextName: 'Menlo Park' }] }));
    wrapper =  getTestComponent(_.assign({ collaborations: collaborations }, user));
    wrapper.setState({ orgsWithRoles });
    const collabTable = wrapper.find('#user-organizations-table');
    expect(collabTable.length).to.equal(1);
    expect(collabTable.prop('data').size).to.equal(2, 'data props is correct');
    expect(collabTable.find('td').length).to.equal(4, 'cell count is correct');

    const cells = collabTable.find('td').map(column => column.text());
    expect(cells[0]).to.eql('Culver Industries');
    expect(cells[1]).to.eql('Admin , Lab Manager(Menlo Park)');

    expect(collabTable.find('Profile').at(0).prop('imgSrc')).to.eql('/images/gravatar.jpg');
    expect(collabTable.find('Profile').at(1).prop('imgSrc')).to.eql('/upload/url_for?key=uploads%2F20cc5eb4-e085ad844837%2Fuser-image.png');
  });

  it('should show correct last login time', () => {
    const last_sign_in_at = '2020-05-31T22:16:50.066-07:00';
    wrapper = getTestComponent(_.assign({ last_sign_in_at }, user));
    const dateTime = wrapper.find(DateTime);
    expect(dateTime.length).to.equal(2);
    expect(dateTime.at(1).text()).to.equal('Mon Jun 1, 2020');
  });

  it('should show correct Joined date', () => {
    wrapper = getTestComponent(user);
    const dateTime = wrapper.find(DateTime);
    expect(dateTime.length).to.equal(1);
    expect(dateTime.at(0).text()).to.equal('Wed May 27, 2020');
  });

  it('should pass org parameter to permissions api', () => {
    wrapper = getTestComponent(user);
    const orgs = [
      {
        id: 'test-org'
      }
    ];
    wrapper.instance().getOrganizationsRoles(orgs);
    expect(permissionApiSpy.args[0][1].orgId).to.be.equal(orgs[0].id);
  });
});
