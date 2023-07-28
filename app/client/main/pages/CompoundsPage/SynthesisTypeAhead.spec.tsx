import React from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import { TypeAheadInput } from '@transcriptic/amino';
import { shallow } from 'enzyme';

import SynthesisRequestAPI from 'main/api/SynthesisRequestAPI';
import SynthesisProgramAPI from 'main/api/SynthesisProgramAPI';
import SynthesisTypeAhead from 'main/pages/CompoundsPage/SynthesisTypeAhead';

const synthesisRequestResults = {
  data: [
    {
      id: 'srq129',
      type: 'synthesis_requests',
      attributes: {
        name: 'synth request1'
      }
    },
    {
      id: 'srq130',
      type: 'synthesis_requests',
      attributes: {
        name: 'synth request2'
      }
    }
  ] };

const synthesisProgramResults = {
  data: [
    {
      id: 'id123',
      type: 'synthesis_programs',
      attributes: {
        name: 'program1'
      }
    },
    {
      id: 'id456',
      type: 'synthesis_programs',
      attributes: {
        name: 'program2'
      }
    }
  ] };

describe('SynthesisTypeAhead', () => {
  let synthesisRequestAPIStub, synthesisProgramAPIStub;
  let synthesisRequestFilter, onSynthesisRequestChange, synthesisProgramFilter, onSynthesisProgramChange;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    synthesisRequestAPIStub = sandbox.stub(SynthesisRequestAPI, 'index').returns({ then: (cb) => cb(synthesisRequestResults) });
    synthesisProgramAPIStub = sandbox.stub(SynthesisProgramAPI, 'index').returns({ then: (cb) => cb(synthesisProgramResults) });
    onSynthesisRequestChange = sandbox.stub();
    onSynthesisProgramChange = sandbox.stub();
    synthesisRequestFilter = shallow(
      <SynthesisTypeAhead
        onChange={onSynthesisRequestChange}
        synthesisIdSelected={''}
        entityType={'synthesis-request'}
      />
    );
    synthesisProgramFilter = shallow(
      <SynthesisTypeAhead
        onChange={onSynthesisProgramChange}
        synthesisIdSelected={''}
        entityType={'synthesis-program'}
      />
    );
  });

  afterEach(() => {
    sandbox.restore();
    synthesisRequestFilter.unmount();
    synthesisProgramFilter.unmount();
  });

  const simulateSynthesisRequestSearch = (query = 'query') => {
    const clock = sandbox.useFakeTimers();
    synthesisRequestFilter.find(TypeAheadInput).simulate('change', { target: { value: query } });
    clock.tick(250);
  };

  const simulateSynthesisProgramSearch = (query = 'query') => {
    const clock = sandbox.useFakeTimers();
    synthesisProgramFilter.find(TypeAheadInput).simulate('change', { target: { value: query } });
    clock.tick(250);
  };

  it('should display search input', () => {
    expect(synthesisRequestFilter.find('TypeAheadInput').props().name).to.equal('text-input');
    expect(synthesisRequestFilter.find('TypeAheadInput').props().placeholder).to.equal('Search by request name');
    expect(synthesisRequestFilter.find('TypeAheadInput').length).to.equal(1);
    simulateSynthesisRequestSearch('synth request1');
    expect(synthesisRequestFilter.find('TypeAheadInput').props().value).to.equal('synth request1');
  });

  it('should call onClear function on clearing search input', () => {
    simulateSynthesisRequestSearch('synth request1');
    expect(synthesisRequestFilter.find('TypeAheadInput').props().value).to.equal('synth request1');
    synthesisRequestFilter.find('TypeAheadInput').props().onClear();
    expect(synthesisRequestFilter.find('TypeAheadInput').props().value).to.equal('');
  });

  it('should call synthesisRequestChange callback on selecting synthesis request name', () => {
    simulateSynthesisRequestSearch('synth request1');
    synthesisRequestFilter.find(TypeAheadInput).prop('onSuggestedSelect')('synth request1');
    expect(onSynthesisRequestChange.calledOnce).to.be.true;
  });

  it('should render suggestions from search results', () => {
    simulateSynthesisRequestSearch();
    expect(synthesisRequestAPIStub.calledOnce).to.be.true;
    expect(synthesisRequestFilter.find(TypeAheadInput).props().suggestions).to.deep.equal(['synth request1', 'synth request2']);
  });

  it('should display search input for synthesis program', () => {
    expect(synthesisProgramFilter.find('TypeAheadInput').props().name).to.equal('text-input');
    expect(synthesisProgramFilter.find('TypeAheadInput').props().placeholder).to.equal('Search by program name');
    expect(synthesisProgramFilter.find('TypeAheadInput').length).to.equal(1);
    simulateSynthesisProgramSearch('mock123');
    expect(synthesisProgramFilter.find('TypeAheadInput').props().value).to.equal('mock123');
  });

  it('should call onClear function on clearing search input for synthesis program', () => {
    simulateSynthesisProgramSearch('mock123');
    expect(synthesisProgramFilter.find('TypeAheadInput').props().value).to.equal('mock123');
    synthesisProgramFilter.find('TypeAheadInput').props().onClear();
    expect(synthesisProgramFilter.find('TypeAheadInput').props().value).to.equal('');
  });

  it('should call synthesisProgramChange callback on selecting synthesis program name', () => {
    simulateSynthesisProgramSearch('mock123');
    synthesisProgramFilter.find(TypeAheadInput).prop('onSuggestedSelect')('mock123');
    expect(onSynthesisProgramChange.calledOnce).to.be.true;
  });

  it('should render suggestions from search results for synthesis program', () => {
    simulateSynthesisProgramSearch();
    expect(synthesisProgramAPIStub.calledOnce).to.be.true;
    expect(synthesisProgramFilter.find(TypeAheadInput).props().suggestions).to.deep.equal(['program1', 'program2']);
  });
});
