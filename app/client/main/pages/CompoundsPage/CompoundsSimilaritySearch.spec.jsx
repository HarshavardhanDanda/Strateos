import React from 'react';
import {  mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import SimilaritySearch from './CompoundsSimilaritySearch';

describe('Similarity Search', () => {
  const sandbox = sinon.createSandbox();
  let similaritySearch;

  afterEach(() => {
    similaritySearch.unmount();
    sandbox.restore();
  });

  it('Should have Search Field', () => {
    similaritySearch = mount(<SimilaritySearch drawStructure={() => {}} onSearchSimilarityChange={() => {}} />);
    expect(similaritySearch.find('SearchField').length).to.eql(1);
    expect(similaritySearch.find('SearchField').prop('placeholder')).to.eql('SMILES String...');

  });

  it('Should show an error message when Invalid SMILES string is passed', () => {
    const onSearch = sinon.spy();
    const clock = sinon.useFakeTimers();
    similaritySearch = mount(<SimilaritySearch drawStructure={() => {}} onSearchSimilarityChange={onSearch} />);
    similaritySearch.find('input.search-field__input').simulate('change', {
      target: {
        value: 'abc'
      }
    });
    clock.tick(2000);
    similaritySearch.update();
    expect(onSearch.called).to.be.false;
    expect(similaritySearch.find('Text.validated-input__message--error').text()).to.eql('Invalid SMILES string');
    clock.restore();
  });

  it('Should search only when valid SMILES string is passed', () => {
    const onSearch = sinon.spy();
    const clock = sinon.useFakeTimers();
    similaritySearch = mount(<SimilaritySearch drawStructure={() => {}} onSearchSimilarityChange={onSearch} />);
    similaritySearch.find('input.search-field__input').simulate('change', {
      target: {
        value: 'ClC1CCCCC1'
      }
    });
    clock.tick(2000);
    expect(onSearch.called).to.be.true;
    clock.restore();
  });

  it('Should open Modal to Draw Structure', () => {
    const openDrawModal = sandbox.stub();
    similaritySearch = mount(<SimilaritySearch drawStructure={openDrawModal} onSearchSimilarityChange={() => {}} />);
    similaritySearch.find('.fa-pencil').simulate('click');
    expect(openDrawModal.called).to.be.true;
  });
});
