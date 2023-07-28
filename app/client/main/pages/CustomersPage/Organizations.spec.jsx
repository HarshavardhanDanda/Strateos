import React from 'react';
import { expect } from 'chai';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { List, Card, Table, ButtonGroup, Button } from '@transcriptic/amino';
import AjaxButton from 'main/components/AjaxButton';
import sinon from 'sinon';
import SessionStore from 'main/stores/SessionStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import OrganizationActions from 'main/actions/OrganizationActions';
import BaseTableTypes from 'main/components/BaseTableTypes/BaseTableTypes';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
import Organizations from './Organizations';

describe('Organizations Table test', () => {

  let orgTable;
  let wrapper;
  const sandbox = sinon.createSandbox();

  const response = {
    data: [
      {
        id: 'org193uvvjd62w7',
        attributes: {
          name: 'AbbVie',
          subdomain: 'abbvie',
          created_at: '2016-06-08T10:23:12.648-07:00',
          run_stats: {
            total: 303,
            open: 0
          },
          num_collaborators: 2,
          org_type: 'CCS'
        }
      }
    ],
    meta: {
      record_count: 1
    }
  };

  beforeEach(() => {
    sandbox.stub(OrganizationActions, 'loadCustomers').returns({
      then: (cb) => {
        cb(response);
        return { fail: () => ({}) };
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('Organizations table should render on load', () => {
    wrapper = shallow(<Organizations />);
    expect(wrapper.find(List)).to.have.length(1);
  });

  it('Organizations Table should have card component', () => {
    wrapper = shallow(<Organizations />);
    expect(wrapper.find(List).dive().find(Card).length).to.equal(1);
  });

  it('Organizations Table should have list component', () => {
    wrapper = shallow(<Organizations />);
    expect(wrapper.find(List).length).to.equal(1);
  });

  it('Organizations table should have seven columns', () => {
    wrapper = shallow(<Organizations />);
    orgTable = wrapper.find(List).dive();
    expect(orgTable.find('.list__topBar--right').render().text()).to.contains('Columns 7');
  });

  it('should have corresponding persistence key info to enable user preference', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));

    wrapper = shallow(<Organizations />);
    const list = wrapper.find(List);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.CUSTOMERS_ORGANIZATIONS_TABLE
    });
  });

  it('Organizations table should display correct data', () => {
    const featureStoreStub = sandbox.stub(FeatureStore, 'hasPlatformFeature');
    featureStoreStub.withArgs(FeatureConstants.CREATE_DELETE_ORGANIZATION).returns(true);
    wrapper = shallow(<Organizations />);
    const table = wrapper.find(List).dive().find(Table).dive();
    const bodyCell1 = table.find('BodyCell').at(1);
    expect(bodyCell1.find(BaseTableTypes.CustomerOrganizationUrl).props().org.get('name')).to.equal('AbbVie');
    const bodyCell2 = table.find('BodyCell').at(2);
    expect(bodyCell2.dive().find('Text').props().data).to.equal('org193uvvjd62w7');
    const bodyCell3 = table.find('BodyCell').at(3);
    expect(bodyCell3.dive().find('Text').props().data).to.equal('CCS');
    const bodyCell4 = table.find('BodyCell').at(4);
    expect(bodyCell4.dive().find('Text').props().data).to.equal(2);
    const bodyCell5 = table.find('BodyCell').at(5);
    expect(bodyCell5.dive().find('Text').props().data).to.equal(0);
    const bodyCell6 = table.find('BodyCell').at(6);
    expect(bodyCell6.dive().find('Text').props().data).to.equal(303);
    const bodyCell7 = table.find('BodyCell').at(7);
    expect(bodyCell7.dive().find('Time').props().data).to.equal('2016-06-08T10:23:12.648-07:00');
  });

  it('Should show button group only if user has create delete organization permission', () => {
    const featureStoreStub = sandbox.stub(FeatureStore, 'hasPlatformFeature');
    featureStoreStub.withArgs(FeatureConstants.CREATE_DELETE_ORGANIZATION).returns(true);
    wrapper = shallow(<Organizations />);
    expect(wrapper.find(ButtonGroup).dive().find(Button).dive()
      .text()).to.equal('New Organization');
    expect(wrapper.find(ButtonGroup).dive().find(AjaxButton).dive()
      .find('span')
      .text())
      .to.equal('Delete');
    expect(wrapper.find(List).prop('disabledSelection')).to.be.false;
  });

  it('Should not show button group if user does not have create delete organization permission', () => {
    const featureStoreStub = sandbox.stub(FeatureStore, 'hasPlatformFeature');
    featureStoreStub.withArgs(FeatureConstants.CREATE_DELETE_ORGANIZATION).returns(false);
    wrapper = shallow(<Organizations />);
    expect(wrapper.find(ButtonGroup).length).to.equal(0);
    expect(wrapper.find(List).prop('disabledSelection')).to.be.true;
  });
});
