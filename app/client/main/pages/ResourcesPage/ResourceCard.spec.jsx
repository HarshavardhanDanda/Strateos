import React from 'react';
import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import { Button, Card } from '@transcriptic/amino';
import Immutable from 'immutable';
import sinon from 'sinon';

import ModalActions from 'main/actions/ModalActions';
import { ResourcesPage } from 'main/pages/ResourcesPage';
import { simulateAPICallComplete } from 'main/components/PageWithSearchAndList/PageWithSearchAndList.spec';
import ResourceCard from './ResourceCard';

describe('ResourceCard', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const props = {
    zeroStateSearchOptions: { title: 'Zero State' },
    isSearching: false,
    onSearchPageChange: sandbox.stub(),
    onSearchFilterChange: sandbox.stub(),
    onSearchInputChange: sandbox.stub(),
    resource: Immutable.fromJS({
      purity: 0,
      readOnly: true,
      organization_id: null,
      compound: null,
      name: '1 mM Aminoluciferin',
      compound_id: null,
      metadata: {},
      properties: {},
      kind: 'Reagent',
      storage_condition: 'cold_80',
      material_components: [
        {
          id: 'mat1c36eqp9krra'
        },
        {
          id: 'mat1c36eqp9krra'
        }
      ],
      id: 'rs1c36epx8p5ra',
      description: null,
      sensitivities: ['Temperature'],
      design: {}
    }),
    key: 'rs1c36epx8p5ra',
    searchOptions: Immutable.fromJS({
      searchInput: '',
      searchQuery: '*',
      searchPage: 1,
      searchKind: 'all',
      searchStorageCondition: 'all',
      searchPerPage: '6',
      isSearching: false
    }),
    onSearchFailed: sandbox.stub(),
    actions: {
      doSearch: () => {}
    },
    page: sandbox.stub().returns(1),
    numPages: sandbox.stub().returns(100)
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  it('should render all resource cards without error', () => {
    return shallow(<ResourceCard {...props} />);
  });

  it('should have card', () => {
    wrapper = shallow(<ResourceCard {...props} />);
    expect(wrapper.find(Card).length).to.equal(1);
  });

  it('should contain icon for resource name', () => {
    wrapper = shallow(<ResourceCard {...props} />);
    expect(
      wrapper
        .find('ResourceInfo')
        .dive()
        .find('.resource-card__resource-name-icon')
    ).to.have.length(1);
  });

  it('should display resource metadata', () => {
    wrapper = mount(<ResourceCard {...props} />);
    const keyValues = wrapper.find('ResourceInfo').find('KeyValueList');

    expect(keyValues.at(0).find('h4').at(0).text()).to.equal('ID');
    expect(keyValues.at(0).find('p').at(0).text()).to.equal('rs1c36epx8p5ra');
    expect(keyValues.at(0).find('h4').at(1).text()).to.equal('STORAGE');
    expect(keyValues.at(0).find('p').at(1).text()).to.equal('cold_80');
    expect(keyValues.at(1).find('h4').at(0).text()).to.equal('KIND');
    expect(keyValues.at(1).find('p').at(0).text()).to.equal('Reagent');
    expect(keyValues.at(1).find('h4').at(1).text()).to.equal('SENSITIVITIES');
    expect(keyValues.at(1).find('i').length).to.equal(1);
    expect(keyValues.at(2).find('h4').text()).to.equal('FOUND IN');
    expect(keyValues.at(2).find('p').text()).to.equal('2 Kit');
  });

  it('should open uneditable card for viewing resource', () => {
    const spy = sandbox.stub(ModalActions, 'openWithData');
    const search = Immutable.fromJS({ results: Immutable.List([props.resource]) });
    wrapper = mount(
      <ResourcesPage
        hasResults
        search={search}
        zeroStateProps={{
          title: 'Title'
        }}
        {...props}
      />
    );
    simulateAPICallComplete(wrapper);
    wrapper.find('PageWithSearchAndList').find('ResourcesSearchResults')
      .find('ResourceCard').find(Card)
      .simulate('click');
    expect(spy.calledOnce).to.be.true;
  });

  it('should open new card for adding new resource', () => {
    const search = Immutable.fromJS({ results: Immutable.List([props.resource]) });
    wrapper = mount(
      <ResourcesPage
        hasResults
        search={search}
        zeroStateProps={{
          title: 'Title'
        }}
        {...props}
      />
    );
    simulateAPICallComplete(wrapper);
    wrapper.find('PageWithSearchAndList').find(Button).simulate('click');
    const modal = wrapper.find('PageWithSearchAndList').find('AddResourceModal').find('ConnectedSinglePaneModal');
    expect(modal.prop('title')).to.equal('New resource');
  });
});
