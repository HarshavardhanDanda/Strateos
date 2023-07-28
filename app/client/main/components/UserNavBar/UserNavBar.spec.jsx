import React from 'react';
import { NavLink } from 'react-router-dom';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Urls from 'main/util/urls';

import { Subtabs, SubMenu } from '@transcriptic/amino';

import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import UserNavBar from 'main/components/UserNavBar';

function UserNavBarTest(props) {
  const navItems = [
    {
      key: 'runspage',
      name: 'Runs',
      url: Urls.runspage()
    },
    {
      key: 'projects',
      name: 'Projects',
      url: Urls.projects()
    },
    AcsControls.isFeatureEnabled(FeatureConstants.INVENTORY_MGMT) && {
      key: 'inventory',
      name: 'Inventory',
      url: Urls.inventory()
    },
    AcsControls.isFeatureEnabled(FeatureConstants.COMPOUND_MGMT) && {
      key: 'compounds',
      name: 'Compounds',
      url: Urls.compounds()
    },
    {
      key: 'cirrus',
      name: 'Workflow Builder',
      url: Urls.cirrus()
    },
    {
      key: 'devices',
      name: 'Devices',
      url: Urls.devices()
    }
  ].filter(item => item);

  return (
    <UserNavBar {...props}>
      <Subtabs inverted>
        {navItems.slice(0, 4).map((item) => {
          return (
            <NavLink key={item.key} to={item.url}>
              {item.name}
            </NavLink>
          );
        })}
        {navItems.length > 4 && (
        <SubMenu>
          {navItems.slice(4).map((item) => {
            return (
              <NavLink key={item.key} to={item.url}>
                {item.name}
              </NavLink>
            );
          })}
        </SubMenu>
        )}
      </Subtabs>
      <div>
        <a>Sign out</a>
      </div>
    </UserNavBar>
  );
}

describe('UserNavBar', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should not show Compounds item', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.COMPOUND_MGMT).returns(false);

    const navUserBar = shallow(<UserNavBarTest />);
    expect(navUserBar.find('Subtabs').dive().find(`NavLink[to="${Urls.compounds()}"]`).length).to.equal(0);
  });

  it('should show Compounds item', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.COMPOUND_MGMT).returns(true);

    const navUserBar = shallow(<UserNavBarTest />);
    expect(navUserBar.find('Subtabs').dive().find(`NavLink[to="${Urls.compounds()}"]`).length).to.equal(1);
  });

  it('subtabs should be left aligned', () => {
    const navUserBar = shallow(<UserNavBarTest landingPage={() => {}} />);
    expect(navUserBar.dive().find('.user-nav-bar__content-left').find('Subtabs').length).to.equal(1);
  });

  it('except subtab items should be right aligned', () => {
    const navUserBar = shallow(<UserNavBarTest landingPage={() => {}} />);
    const signOutDiv = navUserBar.dive().find('.user-nav-bar__content-right');
    expect(signOutDiv.text().includes('Sign Out'));
  });

  it('should show Menu when items more than 4', () => {
    const callback = sandbox.stub(AcsControls, 'isFeatureEnabled');
    callback.withArgs(FeatureConstants.COMPOUND_MGMT).returns(true);
    callback.withArgs(FeatureConstants.INVENTORY_MGMT).returns(true);

    const navUserBar = shallow(<UserNavBarTest />);

    expect(navUserBar.find('Subtabs').dive().find('.subtabs__tab').last()
      .find('.subtabs__tab-link')
      .props().defaultSubMenuText)
      .to.equal('Menu');
  });

  it('should not show Menu when items less than or equal to 4', () => {
    const callback = sandbox.stub(AcsControls, 'isFeatureEnabled');
    callback.withArgs(FeatureConstants.COMPOUND_MGMT).returns(false);
    callback.withArgs(FeatureConstants.INVENTORY_MGMT).returns(false);

    const navUserBar = shallow(<UserNavBarTest />);

    expect(navUserBar.find('Subtabs').dive().find('.subtabs__tab').last()
      .find('.subtabs__tab-link')
      .props().defaultSubMenuText)
      .to.be.undefined;
  });

  it('should show devices tab in submenu', () => {
    const callback = sandbox.stub(AcsControls, 'isFeatureEnabled');
    callback.withArgs(FeatureConstants.COMPOUND_MGMT).returns(true);
    callback.withArgs(FeatureConstants.INVENTORY_MGMT).returns(true);

    const navUserBar = shallow(<UserNavBarTest />);
    expect(navUserBar.find('Subtabs').dive().find('.subtabs__tab').last()
      .find(`NavLink[to="${Urls.devices()}"]`).length).to.equal(1);
  });
});
