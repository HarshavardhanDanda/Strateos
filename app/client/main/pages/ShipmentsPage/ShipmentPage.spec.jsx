import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable  from 'immutable';
import { BrowserRouter as Router } from 'react-router-dom';
import Urls from 'main/util/urls';
import { Button } from '@transcriptic/amino';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants  from '@strateos/features';
import SessionStore      from 'main/stores/SessionStore';
import ModalActions from 'main/actions/ModalActions';

import ShipmentsPage from './ShipmentsPage';

describe('ShipmentsPage', () => {
  const sandbox = sinon.createSandbox();
  let shipmentsPage;

  const props = {
    match: {
      params: {
        subdomain: 'transcriptic',
        viewId: 'intake_kits'
      }
    }
  };

  beforeEach(() => {
    Urls.use(props.match.params.subdomain);
  });

  afterEach(() => {
    sandbox.restore();
    if (shipmentsPage) shipmentsPage.unmount();
  });

  it('should have tab router', () => {
    shipmentsPage = shallow(<ShipmentsPage {...props} />);
    const TabRouter = shipmentsPage.find('TabRouter');
    expect(TabRouter.length).to.equal(1);
    expect(TabRouter.prop('defaultTabId')).to.be.eql('intake_kits');
  });

  it('should have Request intake kit button if user has permission', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org1' }));
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.REQUEST_SAMPLE_CONTAINERS).returns(true);

    shipmentsPage = mount(
      <Router><ShipmentsPage {...props} /></Router>
    );

    const PageHeader = shipmentsPage.find('PageLayout').at(0).prop('PageHeader');
    const button = PageHeader.props.primaryInfoArea;
    expect(button).to.not.be.null;
    expect(button.props.children).equals('Request intake kit');
  });

  it('should not show Request intake kit button if user does not have permission', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org2' }));
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.REQUEST_SAMPLE_CONTAINERS).returns(false);

    shipmentsPage = mount(
      <Router><ShipmentsPage {...props} /></Router>
    );

    expect(shipmentsPage.find(Button).filterWhere(button => button.text() === 'Request Intake Kit').length).to.equal(0);
  });

  it('on click Request intake kit button should open RequestIntakeKitModal', () => {
    const modalAction = sandbox.stub(ModalActions, 'open');
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org3' }));
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.REQUEST_SAMPLE_CONTAINERS).returns(true);

    shipmentsPage = mount(
      <Router><ShipmentsPage {...props} /></Router>
    );

    const button = shipmentsPage.find(Button);
    button.simulate('click');
    expect(modalAction.calledOnce).to.be.true;
    expect(modalAction.calledWith('RequestIntakeKitModal')).to.be.true;
  });
});
