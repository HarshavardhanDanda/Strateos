import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import { Spinner, ZeroState } from '@transcriptic/amino';

import { SearchResultsSidebar } from 'main/components/PageWithSearchAndList';
import { TabLayoutSidebar } from 'main/components/TabLayout';
import SelectorContent from './SelectorContentNew';

export const simulateAPICallComplete = wrapper => {
  wrapper.setProps({ isSearching: true });
  wrapper.update();
  wrapper.setProps({ isSearching: false });
  wrapper.update();
};

describe('SelectorContentNew', () => {
  const sandbox = sinon.createSandbox();
  const props = {
    hasResults: true,
    isSearching: false,
    extendSidebar: false,
    renderFilters: sandbox.stub(),
    renderSearchResults: sandbox.stub()
  };
  let selectorContent;

  afterEach(() => {
    selectorContent.unmount();
    sandbox.restore();
    sinon.restore();
  });

  it('should have a zero state when there are no records in database and testMode is true', () => {
    const search = Immutable.fromJS({ results: [] });
    const selected = [];
    selectorContent = mount(
      <SelectorContent
        {...props}
        hasResults={false}
        search={search}
        selected={selected}
        testMode
      />
    );
    expect(selectorContent.find(Spinner)).to.have.lengthOf(1);
    simulateAPICallComplete(selectorContent);
    selectorContent.update();
    expect(selectorContent.find(Spinner)).to.have.lengthOf(0);
    expect(selectorContent.find(ZeroState)).to.have.lengthOf(1);
    expect(selectorContent.find(ZeroState).prop('title')).to.equal('No containers were found...');
  });

  it('should have a zero state with zeroStateProps when there are no records in database and testMode is false', () => {
    selectorContent = mount(
      <SelectorContent
        {...props}
        hasResults={false}
        testMode={false}
        zeroStateProps={{
          title: 'Title',
          subTitle: 'Subtitle'
        }}
      />
    );

    expect(selectorContent.find(Spinner)).to.have.lengthOf(1);
    simulateAPICallComplete(selectorContent);
    selectorContent.update();
    expect(selectorContent.find(Spinner)).to.have.lengthOf(0);
    expect(selectorContent.find(ZeroState)).to.have.lengthOf(1);
    expect(selectorContent.find(ZeroState).prop('title')).to.equal('Title');
    expect(selectorContent.find(ZeroState).prop('subTitle')).to.equal('Subtitle');
  });

  it('should render component returned in renderZeroState prop callback', () => {
    const renderZeroState = () => {
      return <p>Zero State Component</p>;
    };

    selectorContent = mount(
      <SelectorContent
        {...props}
        hasResults={false}
        testMode={false}
        renderZeroState={renderZeroState}
      />
    );
    simulateAPICallComplete(selectorContent);
    expect(selectorContent.find('p').text()).to.equal('Zero State Component');
  });

  it('should show spinner when results are still being retrieved', () => {
    selectorContent = mount(<SelectorContent {...props} hasResults={false} isSearching />);
    expect(selectorContent.find(Spinner)).to.have.lengthOf(1);
  });

  it('should have extendSidebar as false by default', () => {
    const search = Immutable.fromJS({
      results: []
    });
    selectorContent = mount(
      <SelectorContent
        renderFilters={() => {}}
        renderSearchResults={() => {}}
        hasResults
        isSearching={false}
        search={search}
      />
    );
    simulateAPICallComplete(selectorContent);
    expect(selectorContent.find('TabLayout').props().wideSidebar).to.be.false;
  });

  it('should have isDrawer as false by default', () => {
    const search = Immutable.fromJS({
      results: []
    });
    selectorContent = mount(
      <SelectorContent
        renderFilters={() => {}}
        renderSearchResults={() => {}}
        hasResults
        isSearching={false}
        search={search}
      />
    );
    simulateAPICallComplete(selectorContent);
    expect(selectorContent.find('TabLayout').props().wideSidebar).to.be.false;
  });

  it('should have a sidebar and other specific components', () => {
    selectorContent = mount(
      <SelectorContent
        {...props}
        hasResults
      />
    );
    simulateAPICallComplete(selectorContent);

    expect(selectorContent.find(Spinner)).to.have.lengthOf(0);
    expect(selectorContent.find(ZeroState)).to.have.lengthOf(0);
    expect(selectorContent.find(TabLayoutSidebar)).to.have.lengthOf(1);
    expect(selectorContent.find(TabLayoutSidebar).find(SearchResultsSidebar)).to.have.lengthOf(1);
  });

  it('should call "renderFilters" function in parent if sent in props', () => {
    selectorContent = mount(<SelectorContent {...props} hasResults />);
    simulateAPICallComplete(selectorContent);
    expect(props.renderFilters.called).to.be.true;
  });

  it('should call "renderSearchResults" function in parent if sent in props', () => {
    selectorContent = mount(<SelectorContent {...props} hasResults />);
    simulateAPICallComplete(selectorContent);
    expect(props.renderSearchResults.called).to.be.true;
  });
});
