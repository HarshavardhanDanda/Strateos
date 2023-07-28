import React from 'react';
import { expect } from 'chai';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { List, ButtonGroup, Card } from '@transcriptic/amino';
import SessionStore from 'main/stores/SessionStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import Organizations from './Organizations';

describe('Admin Organizations Table test', () => {

  let orgTable;
  let wrapper;
  const sandbox = sinon.createSandbox();

  const data = [{
    id: 'org193uvvjd62w7',
    name: {
      name: 'AbbVie',
      subdomain: 'abbvie'
    },
    subdomain: 'abbvie',
    createdAt: '2016-06-08T10:23:12.648-07:00',
    runStats: {
      total: 303,
      open: 0
    },
    numCollaborators: 2
  }];

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('Organizations table should render on load', () => {
    wrapper = shallow(<Organizations />).find('Organizations').dive();
    expect(wrapper.find(List)).to.have.length(1);
  });

  it('Organizations Table should have card component', () => {
    wrapper = shallow(<Organizations />).find('Organizations').dive();
    expect(wrapper.find(List).dive().find(Card).length).to.equal(1);
  });

  it('Organizations Table should have list component', () => {
    wrapper = shallow(<Organizations />).find('Organizations').dive();
    expect(wrapper.find(List).length).to.equal(1);
  });

  it('Organizations table should have five columns', () => {
    wrapper = shallow(<Organizations />).find('Organizations').dive();
    wrapper.setState({ data: data });
    orgTable = wrapper.find(List).dive();
    expect(orgTable.find('.list__topBar--right').render().text()).to.contains('Columns 6');
  });

  it('should have corresponding persistence key info to enable user preference', () => {
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));

    wrapper = shallow(<Organizations />).find('Organizations').dive();
    const list = wrapper.find(List);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: '_',
      userId: 'user3202',
      key: KeyRegistry.ADMIN_CUSTOMERS_ORGANIZATIONS_TABLE
    });
  });

  it('Organizations table should have organization actions button group', () => {
    wrapper = shallow(<Organizations />).find('Organizations').dive();
    expect(wrapper.find(ButtonGroup)).to.have.length(1);
  });
});
