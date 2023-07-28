import React from 'react';
import { expect } from 'chai';
import { Button, Breadcrumbs, Link, ActionMenu } from '@transcriptic/amino';
import { shallow } from 'enzyme';

import PageHeader from './PageHeader';

const props = {
  titleArea: (
    <Breadcrumbs>
      <Link to={''}>title area</Link>
    </Breadcrumbs>),
  primaryInfoArea: <Button type="info">Primary info</Button>,
  actions: [
    {
      text: 'action 1',
      onClick: () => {}
    }],
  actionMenu: (<ActionMenu
    invert
    title={'Action menu'}
    options={
      [{
        text: 'option 1',
        onClick: () => {}
      }]}
  />)
};

describe('PageHeader', () => {

  let pageHeader;

  afterEach(() => {
    pageHeader.unmount();
  });

  it('should render without error', () => {
    pageHeader = shallow(<PageHeader {...props} />);
  });

  it('should have title area', () => {
    pageHeader = shallow(<PageHeader {...props} />);
    expect(pageHeader.find('Breadcrumbs')).to.have.length(1);
    expect(pageHeader.find('Breadcrumbs').dive().text()).to.equal('title area');
  });

  it('should have primary info area', () => {
    pageHeader = shallow(<PageHeader {...props} />);
    expect(pageHeader.find('Button')).to.have.length(1);
    expect(pageHeader.find('Button').dive().text()).to.equal('Primary info');
  });

  it('should have action menu', () => {
    pageHeader = shallow(<PageHeader {...props} />);
    expect(pageHeader.find('ActionMenu')).to.have.length(1);
    expect(pageHeader.find('ActionMenu').props().options[0].text).to.equal('option 1');
  });

  it('should have actions', () => {
    const updatedProps = { ...props, actionMenu: undefined };
    pageHeader = shallow(<PageHeader {...updatedProps} />);
    expect(pageHeader.find('ActionMenu')).to.have.length(1);
    expect(pageHeader.find('ActionMenu').props().options[0].text).to.equal('action 1');
  });

  it('should give priority to action menu when both actions and actionMenu are present', () => {
    pageHeader = shallow(<PageHeader {...props} />);
    expect(pageHeader.find('ActionMenu')).to.have.length(1);
    expect(pageHeader.find('ActionMenu').props().options[0].text).to.equal('option 1');
  });

  it('should set class name for primary type', () => {
    pageHeader = shallow(<PageHeader {...props} />);
    expect(pageHeader.hasClass('page-header--primary')).to.be.true;
  });

  it('should set class name for brand type', () => {
    pageHeader = shallow(<PageHeader {...props} type="brand" />);
    expect(pageHeader.hasClass('page-header--brand')).to.be.true;
  });
});
