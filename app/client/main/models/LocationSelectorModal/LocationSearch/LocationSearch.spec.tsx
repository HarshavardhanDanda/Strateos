import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import LocationsAPI from 'main/api/LocationsAPI';

import LocationSearch from './LocationSearch';

const results = [
  {
    id: 'id-1',
    name: 'Freezer -196C',
    ancestors: [
      {
        id: 'id-ancestor-1',
        name: 'San Diego',
        parent_id: null
      },
      {
        id: 'id-ancestor-2',
        name: 'Big room',
        parent_id: 'id-ancestor-1'
      }
    ]
  },
  {
    id: 'id-2',
    name: 'Freezer 4C',
    ancestors: [
      {
        id: 'id-ancestor-3',
        name: 'Menlo Park',
        parent_id: null
      }
    ]
  }
];

const props = {
  onSelect: () => {}
};

describe('LocationSearch', () => {
  let wrapper;
  let searchStub;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    searchStub = sandbox.stub(LocationsAPI, 'searchLocationsByName').returns({
      done: (cb) => {
        cb(results);
        return { fail: () => ({}) };
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  const simulateSearch = (query = 'query') => {
    const clock = sandbox.useFakeTimers();
    wrapper.find('TypeAheadInput').simulate('change', { target: { value: query } });
    clock.tick(200);
  };

  it('should display search input', () => {
    wrapper = shallow(
      <LocationSearch {...props} />
    );
    expect(wrapper.find('TypeAheadInput').length).to.equal(1);
  });

  it('should build suggestions from search results', () => {
    wrapper = shallow(
      <LocationSearch {...props} />
    );
    simulateSearch();
    expect(wrapper.find('TypeAheadInput').props().suggestions).to.deep.equal([
      {
        ...results[0],
        value: 'id-1',
        path: '(San Diego --> Big room)'
      },
      {
        ...results[1],
        value: 'id-2',
        path: '(Menlo Park)'
      }
    ]);
  });

  it('should set suggestions as empty if results are empty', () => {
    wrapper = shallow(
      <LocationSearch {...props} />
    );
    sandbox.restore();
    searchStub = sandbox.stub(LocationsAPI, 'searchLocationsByName').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    });
    simulateSearch();
    expect(wrapper.find('TypeAheadInput').props().suggestions).to.deep.equal([]);
  });

  it('should render search suggestion name and ancestor path', () => {
    wrapper = shallow(
      <LocationSearch {...props} />
    );
    const suggestion = wrapper.find('TypeAheadInput').props().renderSuggestion({
      ...results[0],
      path: '(San Diego -> Big room)'
    });
    const suggestionWrapper = shallow(suggestion);
    expect(suggestionWrapper.find('TextBody').at(0).props().children).to.equal('Freezer -196C');
    expect(suggestionWrapper.find('TextBody').at(1).props().children).to.equal('(San Diego -> Big room)');
    suggestionWrapper.unmount();
  });

  it('should seach for locations on user input', () => {
    wrapper = shallow(
      <LocationSearch {...props} />
    );
    simulateSearch('freezer');
    expect(wrapper.find('TypeAheadInput').props().value).to.equal('freezer');
    expect(wrapper.find('TypeAheadInput').props().isSearching).to.be.true;
    expect(searchStub.calledOnce).to.be.true;
    expect(searchStub.args[0][0]).to.equal('freezer');
  });

  it('should search by lab id if specified', () => {
    wrapper = shallow(
      <LocationSearch {...props} labId="lab-id" />
    );
    simulateSearch();
    expect(searchStub.args[0][2]).to.equal('lab-id');
  });

  it('should call onSelect on user selection', () => {
    const onSelectSpy = sandbox.spy();
    wrapper = shallow(
      <LocationSearch {...props} onSelect={onSelectSpy} />
    );
    simulateSearch();
    wrapper.find('TypeAheadInput').props().onSuggestedSelect(results[0]);
    expect(wrapper.find('TypeAheadInput').props().value).to.equal('Freezer -196C');
    expect(onSelectSpy.calledOnce).to.be.true;
    expect(onSelectSpy.args[0][0].get('id')).to.equal('id-1');
  });
});
