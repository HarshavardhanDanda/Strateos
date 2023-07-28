import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import { TabLayout, TabLayoutSidebar, TabLayoutTopbar } from './TabLayout';

describe('TabLayout', () => {
  let component;

  afterEach(() => {
    if (component) {
      component.unmount();
    }
  });

  it('should display content', () => {
    component = shallow(
      <TabLayout>
        <div>Some content</div>
      </TabLayout>
    );
    expect(component.find('.tx-view'));
    expect(component.find('.tab-layout'));
    expect(component.find('.tab-layout__body').text()).to.contain('Some content');
    expect(component.find('.tab-layout__topbar').length).to.equal(0);
    expect(component.find('.tab-layout__sidebar').length).to.equal(0);
  });

  it('should display sidebar', () => {
    component = shallow(
      <TabLayout>
        <TabLayoutSidebar>
          <div>Some sidebar</div>
        </TabLayoutSidebar>
        <div>Some content</div>
      </TabLayout>
    );
    expect(component.find('.tab-layout'));
    expect(component.find('.tab-layout__body').text()).to.contain('Some content');
    expect(component.find('.tab-layout__sidebar').find('TabLayoutSidebar').childAt(0).text()).to.contain('Some sidebar');
  });

  it('should display topbar', () => {
    component = shallow(
      <TabLayout>
        <TabLayoutTopbar>
          <div>Some topbar</div>
        </TabLayoutTopbar>
        <div>Some content</div>
      </TabLayout>
    );
    expect(component.find('.tab-layout'));
    expect(component.find('.tab-layout__body').text()).to.contain('Some content');
    expect(component.find('.tab-layout__topbar').find('TabLayoutTopbar').childAt(0).text()).to.contain('Some topbar');
  });

  it('should set layout classes for full width content', () => {
    component = shallow(
      <TabLayout>
        <div>Some content</div>
      </TabLayout>
    );
    const body = component.find('.tab-layout__body-column');
    expect(body.hasClass('col-sm-12'));
    expect(body.hasClass('col-md-12'));
  });

  it('should set layout classes for content with sidebar', () => {
    component = shallow(
      <TabLayout wideSidebar>
        <TabLayoutSidebar>
          <div>Some sidebar</div>
        </TabLayoutSidebar>
        <div>Some content</div>
      </TabLayout>
    );
    const body = component.find('.tab-layout__body-column');
    expect(body.hasClass('col-xs-12'));
    expect(body.hasClass('col-sm-9'));

    const sidebar = component.find('.tab-layout__sidebar-column');
    expect(sidebar.hasClass('col-xs-12'));
    expect(sidebar.hasClass('col-sm-3'));
  });

  it('should set layout classes for if sidebar width is set', () => {
    component = shallow(
      <TabLayout sidebarWidth={7}>
        <TabLayoutSidebar>
          <div>Some sidebar</div>
        </TabLayoutSidebar>
        <div>Some content</div>
      </TabLayout>
    );
    expect(component.find('.tab-layout__sidebar-column').hasClass('col-sm-7'));
    expect(component.find('.tab-layout__body-column').hasClass('col-sm-5'));
  });

  it('should adjust layout classes when inside modal', () => {
    component = shallow(
      <TabLayout contextType="modal">
        <TabLayoutSidebar>
          <div>Some sidebar</div>
        </TabLayoutSidebar>
        <div>Some content</div>
      </TabLayout>
    );
    expect(component.find('.tx-view').length).to.equal(0);
    expect(component.find('.tab-layout--inside-modal'));
  });

  it('should disable scroll on body when desired', () => {
    component = shallow(
      <TabLayout noScroll>
        <TabLayoutSidebar>
          <div>Some sidebar</div>
        </TabLayoutSidebar>
        <div>Some content</div>
      </TabLayout>
    );
    expect(component.find('.tab-layout__body-column--no-scroll'));
    expect(component.find('.tab-layout__sidebar-column--no-scroll').length).to.equal(0);
  });

  it('should disable scroll on sidebar when desired', () => {
    component = shallow(
      <TabLayout>
        <TabLayoutSidebar noScroll>
          <div>Some sidebar</div>
        </TabLayoutSidebar>
        <div>Some content</div>
      </TabLayout>
    );
    expect(component.find('.tab-layout__body-column--no-scroll').length).to.equal(0);
    expect(component.find('.tab-layout__sidebar-column--no-scroll'));
  });

  it('should disable border on sidebar when noBorder prop is set', () => {
    component = shallow(
      <TabLayout>
        <TabLayoutSidebar noBorder>
          <div>Some sidebar</div>
        </TabLayoutSidebar>
      </TabLayout>
    );
    expect(component.find('.tab-layout__sidebar-column--no-border').length).to.equal(1);
  });

  it('should have gray as background color', () => {
    component = shallow(<TabLayout theme={'gray'} />);
    expect(component.find('.tab-layout__gray').length).to.equal(1);
  });
});
