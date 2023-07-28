import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';
import LabConsumersFilter from 'main/pages/RunsPage/views/LabConsumersFilter';
import LabConsumerAPI from 'main/api/LabConsumerAPI';
import { thennable } from 'main/util/TestUtil';
import { TypeAheadInput } from '@transcriptic/amino';
import labConsumerData from 'main/test/labconsumer/testData.json';
import LabConsumerStore from 'main/stores/LabConsumerStore';

describe('LabConsumersFilter', () => {
  const sandbox = sinon.createSandbox();
  const today = new Date();
  let labConsumerSpy;

  const mockLabConsumersResponse = {
    data: [
      {
        id: 'lbc1fknzm4mcwqr7',
        type: 'lab_consumers',
      }
    ] };

  const mockLabConsumer = Immutable.fromJS(labConsumerData[0]);

  function updateFilterOptions(options) {
    props.searchOptions = Immutable.Map(options);
  }

  const defaultSearchOptions = Immutable.Map({
    lab_id: '',
    run_date: today,
    organization_id: 'all',
    org_name: ''
  });

  const props = {
    orgName: '',
    onSearchFilterChange: sandbox.stub(),
    searchOptions: defaultSearchOptions,
    actions: {
      updateState: updateFilterOptions,
      loadLabConsumers: sandbox.stub()
    }
  };

  let wrapper;

  beforeEach(() => {
    labConsumerSpy = sandbox.stub(LabConsumerAPI, 'index').returns(thennable(mockLabConsumersResponse));
    sandbox.stub(LabConsumerStore, 'getById').withArgs('lbc1fknzm4mcwqr7').returns(mockLabConsumer);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  it('should have typeahead input field for org search', () => {
    wrapper = shallow(<LabConsumersFilter {...props} />);
    const typeAhead = wrapper.find('TypeAheadInput');
    expect(typeAhead).to.have.lengthOf(1);
    expect(typeAhead.prop('placeholder')).to.equal('All organizations');
    expect(typeAhead.prop('value')).to.equal('');
  });

  it('should call loadLabConsumers to load the suggestions, when onChange value', () => {
    const clock = sinon.useFakeTimers();
    wrapper = shallow(<LabConsumersFilter {...props} />);
    const typeAhead = wrapper.find('TypeAheadInput');
    const inputText = 'org';
    typeAhead.simulate('change', { target: { value: inputText } });
    clock.tick(250);
    expect(labConsumerSpy.calledOnce).to.be.true;
    expect(labConsumerSpy.getCall(0).args[0]).to.deep.include({ filters: { org_name: inputText } });
    clock.restore();
  });

  it('should call onOrganizationSelected when an org is selected', () => {
    const selectedSpy = sandbox.spy();
    wrapper = shallow(<LabConsumersFilter {...props} onOrganizationSelected={selectedSpy} />).setState({ suggestions: [{ name: 'test_org', value: 'org_id' }] });
    const typeAhead = wrapper.find('TypeAheadInput');

    typeAhead.props().onSuggestedSelect('test_org');
    expect(selectedSpy.calledOnce).to.be.true;
  });

  it('should set suggestions on giving organization text input ', () => {
    const clock = sinon.useFakeTimers();
    wrapper = shallow(<LabConsumersFilter {...props} labId="lab123" />);
    wrapper.find(TypeAheadInput).prop('onChange')({ target: { value: 'strateos' } });
    clock.tick(250);
    expect(wrapper.state().suggestions).to.deep.equal([{ name: 'Strateos', value: 'org123' }]);
    clock.restore();
  });

  it('should not set a suggestion if it is not present in store', () => {
    sandbox.restore();
    sandbox.stub(LabConsumerAPI, 'index').returns(thennable(mockLabConsumersResponse));
    sandbox.stub(LabConsumerStore, 'getById').withArgs('lbc1fknzm4mcwqr7').returns(null);

    const clock = sinon.useFakeTimers();
    wrapper = shallow(<LabConsumersFilter {...props} labId="lab123" />);
    wrapper.find(TypeAheadInput).prop('onChange')({ target: { value: 'strateos' } });
    clock.tick(250);
    expect(wrapper.state().suggestions).to.deep.equal([]);
    clock.restore();
  });
});
