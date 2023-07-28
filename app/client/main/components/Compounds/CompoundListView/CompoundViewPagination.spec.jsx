import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import CompoundListWithPagination from './CompoundViewPagination';

const compounds = Immutable.List([
  {
    name: 'cust1',
    id: 'cmpl1d9e6adftu9fy',
    clogp: '1.2543',
    molecular_weight: 350.4,
    formula: 'C16H18N2O5S',
    smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
    tpsa: '108.05'
  },
  {
    name: 'cust2',
    id: 'cmpl1d9e6adftu9as',
    clogp: '1.256',
    molecular_weight: 351.4,
    formula: 'C16H18N2O5S',
    smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
    tpsa: '108.05'
  }
]);

describe('Aliquot Composition', () => {
  let wrapper;

  afterEach(() => {
    if (wrapper)wrapper.unmount();
  });

  it('should have CompoundListView component', () => {
    wrapper = shallow(
      <CompoundListWithPagination
        compounds={compounds}
        numPages={2}
        page={1}
        pageWidth={5}
        removeAction={false}
        onPageChange={() => {}}
      />
    );
    expect(wrapper.find('CompoundListView').length).to.be.eql(1);
  });

  it('should have pagination if numPages is greater than 1', () => {
    wrapper = shallow(
      <CompoundListWithPagination
        compounds={compounds}
        numPages={2}
        page={1}
        pageWidth={5}
        removeAction={false}
        onPageChange={() => {}}
      />
    );
    expect(wrapper.find('Pagination').length).to.eql(1);
  });

  it('should not have pagination if numPages is equal or less than 1', () => {
    wrapper = shallow(
      <CompoundListWithPagination
        compounds={compounds}
        numPages={1}
        page={1}
        pageWidth={5}
        removeAction={false}
        onPageChange={() => {}}
      />
    );
    expect(wrapper.find('Pagination').length).to.eql(0);
  });
});
