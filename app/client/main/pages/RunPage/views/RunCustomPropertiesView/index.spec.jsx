import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import RunStore from 'main/stores/RunStore';
import RunCustomPropertiesView from './index';

describe('RunCustomPropertiesView', () => {
  let wrapper;
  const matchPropTypes = { params: { subdomain: 'transcriptic', projectId: 'p1f8arbsrp92f3', runId: 'r123456' } };

  beforeEach(() => {
    sinon.stub(RunStore, 'getById');
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    sinon.restore();
  });

  it('should render page', () => {
    wrapper = shallow(
      <RunCustomPropertiesView
        match={matchPropTypes}
      />
    );
    expect(wrapper).to.be.ok;
  });

  it('should render PageLoading', () => {
    wrapper = shallow(
      <RunCustomPropertiesView
        match={matchPropTypes}
      />
    ).dive();
    expect(wrapper.find('PageLoading').exists()).to.be.true;
  });
});
