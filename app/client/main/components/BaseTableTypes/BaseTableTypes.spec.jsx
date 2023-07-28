import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable  from 'immutable';
import Urls from 'main/util/urls';
import BaseTableTypes from './BaseTableTypes';

describe('BaseTableTypes components test', () => {
  it('Recent run id should be displayed as a url', () => {
    const RecentRunId = BaseTableTypes.RecentRunId;
    const recentRunId = shallow(<RecentRunId data="id" />);
    expect(recentRunId.find('Url')).to.have.length(1);
    recentRunId.unmount();
  });

  it('Container id should be displayed as a url', () => {
    const ContainerDetailsUrl = BaseTableTypes.ContainerDetailsUrl;
    const data = { id: 'id', text: 'Label' };
    const containerIdUrl = shallow(<ContainerDetailsUrl data={data} />);
    expect(containerIdUrl.find('Url')).to.have.length(1);
    containerIdUrl.unmount();
  });

  it('Url should not have target prop in hyperlink if openInNewTab props is not given', () => {
    const data = {  id: 'id', text: 'Label', url: 'dummy-url' };
    const Url = BaseTableTypes.Url;
    const url = shallow(<Url data={data} />);
    expect(url.find('a').props().target).to.be.undefined;
  });

  it('Url should open in new tab if openInNewTab props is given', () => {
    const data = {  id: 'id', text: 'Label', url: 'dummy-url' };
    const Url = BaseTableTypes.Url;
    const url = shallow(<Url data={data} openInNewTab />);
    expect(url.find('a').props().target).to.equal('_blank');
  });

  it('should render customer organization url without error', () => {
    const organization = Immutable.fromJS({ id: 'org123', subdomain: 'testorg' });
    const CustomerOrganizationUrl = BaseTableTypes.CustomerOrganizationUrl;
    const customerOrgUrl = shallow(<CustomerOrganizationUrl org={organization} />);
    expect(customerOrgUrl.find('Url')).to.have.length(1);
    expect(customerOrgUrl.props().data.url).to.equal(Urls.customer_organization(organization.get('id')));
  });

});
