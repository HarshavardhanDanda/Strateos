import React from 'react';
import Immutable from 'immutable';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { TypeAheadInput, TextInput } from '@transcriptic/amino';
import LabConsumerAPI from 'main/api/LabConsumerAPI';
import FeatureStore from 'main/stores/FeatureStore';
import OrganizationStore from 'main/stores/OrganizationStore';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import labConsumerData from 'main/test/labconsumer/testData.json';
import OrganizationTypeAhead from './OrganizationFilter';

describe('OrganizationFilter', () => {
  const sandbox = sinon.createSandbox();

  let organizationFilter;

  const mockLabConsumersResponse = {
    data: [
      {
        id: 'lbc1fknzm4mcwqr7',
        type: 'lab_consumers',
      }
    ] };

  const mockLabConsumer = Immutable.fromJS(labConsumerData[0]);

  beforeEach(() => {
    sandbox.stub(LabConsumerAPI, 'index').returns({ then: (cb) => cb(mockLabConsumersResponse) });
    sandbox.stub(LabConsumerStore, 'getById').withArgs('lbc1fknzm4mcwqr7').returns(mockLabConsumer);
    sandbox.stub(FeatureStore, 'getLabIds').returns(Immutable.fromJS(['lab1', 'lab2']));
  });

  afterEach(() => {
    if (sandbox) sandbox.restore();
    organizationFilter.unmount();
  });

  it('should call onOrganizationChange callback on clicking organization dropdown option', () => {
    const clock = sandbox.useFakeTimers();

    const actions = {
      onOrganizationChange: sinon.stub()
    };

    organizationFilter = mount(
      <OrganizationTypeAhead
        onOrganizationChange={actions.onOrganizationChange}
      />
    );

    organizationFilter.find(TextInput).find('input').simulate('input', { target: { value: 'mock123' } });
    clock.tick(250);
    organizationFilter.setState({ suggestions: [{ name: 'Strateos', value: 'mock123' }] });
    organizationFilter.find(TypeAheadInput).prop('onSuggestedSelect')('mock123');
    expect(actions.onOrganizationChange.calledOnce).to.be.true;
  });

  it('should call OrganizationStore to fetch org name', () => {
    const clock = sandbox.useFakeTimers();

    const actions = {
      onOrganizationChange: sinon.stub()
    };

    sandbox.stub(OrganizationStore, 'getById').returns(Immutable.Map({ name: 'Strateos', id: 'mock123' }));
    organizationFilter = mount(
      <OrganizationTypeAhead
        onOrganizationChange={actions.onOrganizationChange}
      />
    );

    organizationFilter.find(TextInput).find('input').simulate('input', { target: { value: 'strateos' } });
    clock.tick(250);
    organizationFilter.setState({ suggestions: [{ name: 'Strateos', value: 'mock123' }], organizationSelected: 'mock123' });
    organizationFilter.find(TypeAheadInput).prop('onSuggestedSelect')('mock123');
    expect(actions.onOrganizationChange.calledOnce).to.be.true;

    const organizationFilter1 = mount(
      <OrganizationTypeAhead
        onOrganizationChange={actions.onOrganizationChange}
        organizationSelected="mock123"
      />
    );
    expect(organizationFilter1.find(TypeAheadInput).props().value).to.be.equal('Strateos');
    organizationFilter1.unmount();
  });

  it('should set suggestions on giving organization text input ', () => {
    const clock = sandbox.useFakeTimers();
    organizationFilter = shallow(<OrganizationTypeAhead />);

    organizationFilter.find(TypeAheadInput).prop('onChange')({ target: { value: 'strateos' } });
    clock.tick(250);

    expect(organizationFilter.state().suggestions).to.deep.equal([{ name: 'Strateos', value: 'org123' }]);
  });

  it('should not set a suggestion if it is not present in store', () => {
    sandbox.restore();
    const clock = sandbox.useFakeTimers();
    sandbox.stub(FeatureStore, 'getLabIds').returns(Immutable.fromJS(['lab1', 'lab2']));
    sandbox.stub(LabConsumerAPI, 'index').returns({ then: (cb) => cb(mockLabConsumersResponse) });
    sandbox.stub(LabConsumerStore, 'getById').withArgs('lbc1fknzm4mcwqr7').returns(null);

    organizationFilter = shallow(<OrganizationTypeAhead />);
    organizationFilter.find(TypeAheadInput).prop('onChange')({ target: { value: 'strateos' } });
    clock.tick(250);

    expect(organizationFilter.state().suggestions).to.deep.equal([]);
  });

  it('should have custom search icon if searchIcon is passed in props', () => {
    organizationFilter = mount(<OrganizationTypeAhead searchIcon="fa-thin fa-building" />);
    expect(organizationFilter.find('Icon').props().icon).to.equals('fa-fw fa-thin fa-building');
  });
});
