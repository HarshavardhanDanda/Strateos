import React from 'react';
import _ from 'lodash';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Imm from 'immutable';
import FeatureConstants from '@strateos/features';
import AcsControls      from  'main/util/AcsControls';
import ProtocolDetails from './ProtocolDetails';

describe('ProtocolDetails', () => {

  let component;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
    if (component) component.unmount();
  });

  const protocol = Imm.Map({
    id: 'id1',
    release_id: 'r_id',
    display_name: 'protocol A',
    name: 'ProtocolA',
    version: '0.0.19',
    published: true,
    description: 'abc'
  });
  const props = {
    hasMore: false,
    loadingRuns: false,
    ownerId: 'abc',
    packageId: 'abc'
  };

  it('should render', () => {
    const newProps = _.assign(props, { protocol: protocol });
    component = shallow(<ProtocolDetails {...newProps} />);
    expect(component.length).to.be.eql(1);
  });

  it('should be able to retract if user has permission', () => {
    const publishedProtocol = protocol.set('published', true);
    const newProps = _.assign(props, { protocol: publishedProtocol });
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.PUBLISH_RELEASE_PACKAGE_PROTOCOL).returns(true);
    component = shallow(<ProtocolDetails {...newProps} />);
    const button = component.find('Button');
    expect(button.length).to.be.eql(1);
    expect(button.children().text()).to.be.equal('Retract this Protocol');
  });

  it('should not be able to retract if user does not have permission', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.PUBLISH_RELEASE_PACKAGE_PROTOCOL).returns(false);
    component = shallow(<ProtocolDetails {...props} />);
    const button = component.find('Button');
    expect(button.length).to.be.eql(0);
  });

  it('should be able to publish if user has permission', () => {
    const unPublishedProtocol = protocol.set('published', false);
    const newProps = _.assign(props, { protocol: unPublishedProtocol });
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.PUBLISH_RELEASE_PACKAGE_PROTOCOL).returns(true);
    component = shallow(<ProtocolDetails {...newProps} />);
    const button = component.find('Button');
    expect(button.length).to.be.eql(1);
    expect(button.children().text()).to.be.equal('Publish this Protocol');
  });

  it('should not be able to publish if user does not have permission', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.PUBLISH_RELEASE_PACKAGE_PROTOCOL).returns(false);
    component = shallow(<ProtocolDetails {...props} />);
    const button = component.find('Button');
    expect(button.length).to.be.eql(0);
  });
});
