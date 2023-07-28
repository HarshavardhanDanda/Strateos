import React from 'react';
import { BrowserRouter as Router, Link } from 'react-router-dom';

import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import { Spinner, ZeroState } from '@transcriptic/amino';

import { SearchResultsSidebar } from 'main/components/PageWithSearchAndList';
import { TabLayoutSidebar } from 'main/components/TabLayout';
import PageWithSearchAndList from './PageWithSearchAndList';
import { TabLayout } from '../TabLayout/TabLayout';

export const simulateAPICallComplete = wrapper => {
  wrapper.setProps({ isSearching: true });
  wrapper.update();
  wrapper.setProps({ isSearching: false });
  wrapper.update();
};

describe('PageWithSearchAndList', () => {
  const sandbox = sinon.createSandbox();
  const props = {
    hasResults: true,
    isSearching: false,
    extendSidebar: false,
    renderFilters: sandbox.stub(),
    renderSearchResults: sandbox.stub()
  };
  const searchOptions = Immutable.Map();
  let pageWithSearchAndList;

  afterEach(() => {
    pageWithSearchAndList.unmount();
    sandbox.restore();
    sinon.restore();
  });

  it('should have a zero state if there are no records in the database', () => {
    const search = Immutable.fromJS({ results: [] });
    const selected = [];
    pageWithSearchAndList = mount(
      <PageWithSearchAndList
        hasResults={false}
        isSearching={false}
        search={search}
        selected={selected}
        zeroStateProps={{
          title: 'Title',
          subTitle: 'Subtitle'
        }}
      />
    );

    expect(pageWithSearchAndList.find(Spinner)).to.have.lengthOf(1);
    simulateAPICallComplete(pageWithSearchAndList);
    pageWithSearchAndList.update();
    expect(pageWithSearchAndList.find(Spinner)).to.have.lengthOf(0);
    expect(pageWithSearchAndList.find(ZeroState)).to.have.lengthOf(1);
    expect(pageWithSearchAndList.find(ZeroState).prop('title')).to.equal('Title');
    expect(pageWithSearchAndList.find(ZeroState).prop('subTitle')).to.equal('Subtitle');
  });

  it('should show spinner when results are still being retrieved', () => {
    pageWithSearchAndList = mount(<PageWithSearchAndList  {...props} hasResults={false} isSearching />);
    expect(pageWithSearchAndList.find(Spinner)).to.have.lengthOf(1);
  });

  it('should have extendSidebar as false by default', () => {
    const search = Immutable.fromJS({
      results: []
    });
    pageWithSearchAndList = mount(
      <PageWithSearchAndList
        renderFilters={() => {}}
        renderSearchResults={() => {}}
        hasResults
        isSearching={false}
        search={search}
      />
    );
    simulateAPICallComplete(pageWithSearchAndList);
    expect(pageWithSearchAndList.find('TabLayout').props().wideSidebar).to.be.false;
  });

  it('should have a sidebar and other specific components', () => {
    const search = Immutable.fromJS({
      results: []
    });
    pageWithSearchAndList = mount(
      <PageWithSearchAndList
        {...props}
        hasResults
        isSearching={false}
        search={search}
      />
    );
    simulateAPICallComplete(pageWithSearchAndList);

    expect(pageWithSearchAndList.find(Spinner)).to.have.lengthOf(0);
    expect(pageWithSearchAndList.find(ZeroState)).to.have.lengthOf(0);
    expect(pageWithSearchAndList.find(TabLayoutSidebar)).to.have.lengthOf(1);
    expect(pageWithSearchAndList.find(TabLayoutSidebar).find(SearchResultsSidebar)).to.have.lengthOf(1);
    expect(pageWithSearchAndList.find('.samples')).to.have.lengthOf(1);
  });

  it('should call "renderFilters" function in parent if sent in props', () => {
    pageWithSearchAndList = mount(<PageWithSearchAndList {...props} hasResults isSearching={false} />);
    simulateAPICallComplete(pageWithSearchAndList);
    expect(props.renderFilters.called).to.be.true;
  });

  it('should call "renderSearchResults" function in parent if sent in props', () => {
    pageWithSearchAndList = mount(<PageWithSearchAndList {...props} hasResults isSearching={false} />);
    simulateAPICallComplete(pageWithSearchAndList);
    expect(props.renderSearchResults.called).to.be.true;
  });

  it('should display a title', () => {
    pageWithSearchAndList = mount(
      <Router>
        <PageWithSearchAndList
          {...props}
          title="Inventory"
          listUrl="/foobar"
          hasPageLayout
        />
      </Router>
    );
    simulateAPICallComplete(pageWithSearchAndList);

    const link = pageWithSearchAndList.find(Link).find('a');
    const title = link.find('span').text();
    expect(title).to.equal('Inventory');
    expect(link.prop('href')).to.equal('/foobar');
  });

  it('should display BETA if beta prop is true', () => {
    pageWithSearchAndList = mount(
      <Router>
        <PageWithSearchAndList
          {...props}
          title="TITLE"
          listUrl="/foobar"
          hasPageLayout
          beta
        />
      </Router>
    );
    simulateAPICallComplete(pageWithSearchAndList);
    expect(pageWithSearchAndList.find('Page').prop('title')).to.equal('TITLE (BETA)');
  });

  it('should have a search/filter sidebar', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    const selected = [];
    pageWithSearchAndList = mount(
      <PageWithSearchAndList
        {...props}
        hasResults
        search={search}
        selected={selected}
        searchOptions={searchOptions}
      />
    );
    simulateAPICallComplete(pageWithSearchAndList);
    expect(pageWithSearchAndList.find(SearchResultsSidebar)).to.have.lengthOf(1);
  });

  it('should have "modals" from prop if sent in props', () => {
    const modals = [<div key="modal-1" />, <div key="modal-2" />];
    pageWithSearchAndList = mount(
      <Router>
        <PageWithSearchAndList
          {...props}
          title="TITLE"
          listUrl="/foobar"
          hasPageLayout
          beta
          modals={modals}
        />
      </Router>
    );
    simulateAPICallComplete(pageWithSearchAndList);
    expect(pageWithSearchAndList.find('PageLayout').props().Modals).to.equal(modals);
  });

  it('should set TabLayout props', () => {
    const search = Immutable.fromJS({
      results: []
    });
    pageWithSearchAndList = mount(
      <PageWithSearchAndList
        {...props}
        search={search}
        className="custom-class-name"
        theme="gray"
        extendSidebar
      />
    );

    expect(pageWithSearchAndList.find(TabLayout).props()).to.include({
      className: 'custom-class-name',
      theme: 'gray',
      wideSidebar: true
    });
  });
});
