import { expect } from 'chai';
import { mount } from 'enzyme';
import sinon from 'sinon';
import React from 'react';
import SessionStore from 'main/stores/SessionStore';
import Immutable from 'immutable';
import { RadioGroup, Radio, SearchField } from '@transcriptic/amino';
import RunSelectionFilter from './RunSelectionFilter';

describe('RunSelectionFilter', () => {

  const sandbox = sinon.createSandbox();
  const user = {
    id: 'u18dcbwhctbnj',
    name: 'john doe',
    email: 'jdoe@transcriptic.com',
    lastSignInIp: '0.0.0.0',
    createdAt: '2020-05-27T09:16:16.522-07:00'
  };

  const setup = () => {
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.fromJS(user));
  };

  beforeEach(setup);

  afterEach(() => {
    sandbox.restore();
  });

  it('should have a search filter with placeholder to search runs', () => {
    const wrapper = mount(
      <RunSelectionFilter userId={user.id} />
    );

    expect(wrapper.find(SearchField).length).to.eql(1);
    expect(wrapper.find(SearchField).prop('placeholder')).to.eql('Search by title, ID etc');
  });

  it('should have submitter filter', () => {
    const wrapper = mount(
      <RunSelectionFilter userId={user.id} />
    );

    expect(wrapper.find('h3').at(2).text()).to.equal('Submitter');
    const submitterFilter = wrapper.find(RadioGroup).at(0);
    expect(submitterFilter.find(Radio).at(0).text().trim()).to.equal('All');
    expect(submitterFilter.find(Radio).at(1).text().trim()).to.equal('By me');
  });

  it('should have status filter', () => {
    const wrapper = mount(
      <RunSelectionFilter userId={user.id} />
    );

    expect(wrapper.find('h3').at(3).text()).to.equal('Status');
    const statusFilter = wrapper.find(RadioGroup).at(1);
    expect(statusFilter.find(Radio).at(0).text().trim()).to.equal('All');
    expect(statusFilter.find(Radio).at(1).text().trim()).to.equal('Accepted');
    expect(statusFilter.find(Radio).at(2).text().trim()).to.equal('In Progress');
    expect(statusFilter.find(Radio).at(3).text().trim()).to.equal('Completed');
    expect(statusFilter.find(Radio).at(4).text().trim()).to.equal('Aborted');
    expect(statusFilter.find(Radio).at(5).text().trim()).to.equal('Rejected');
    expect(statusFilter.find(Radio).at(6).text().trim()).to.equal('Cancelled');
  });
});
