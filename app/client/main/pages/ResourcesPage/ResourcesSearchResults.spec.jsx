import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { Card } from '@transcriptic/amino';
import Immutable from 'immutable';
import sinon from 'sinon';

import ResourcesSearchresults from './ResourcesSearchResults';

describe('ResourcesSearchResults', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const data = Immutable.List([
    Immutable.Map({
      id: 'rs1',
      name: 'test-resource',
      kind: 'Cell',
      storage_condition: 'cold_4',
      sensitivities: []
    })
  ]);
  const onSearchPageChange = sandbox.stub();
  const props = {
    data: data,
    page: 1,
    numPages: 5,
    onSearchPageChange
  };

  it('should display results correctly', () => {
    wrapper = shallow(<ResourcesSearchresults {...props} />);
    const resources = wrapper.find('ResourceCard');
    expect(resources.length).to.equal(1);
  });

  it('should have pagination', () => {
    wrapper = shallow(<ResourcesSearchresults {...props} />);
    const pagination = wrapper.find('Pagination');

    expect(pagination.exists()).to.be.true;
    expect(pagination.props().page).to.equal(1);
    expect(pagination.props().pageWidth).to.equal(10);
    expect(pagination.props().numPages).to.equal(5);
    pagination.props().onPageChange();
    expect(onSearchPageChange.called).to.be.true;
  });

  it('should display No records if there are no records to display', () => {
    wrapper = shallow(<ResourcesSearchresults {...props} data={Immutable.List()} />);
    const card = wrapper.find(Card).dive();
    expect(card.text()).to.equal('No records');
  });
});
