import React       from 'react';
import { expect }  from 'chai';
import { shallow } from 'enzyme';
import Immutable   from 'immutable';
import sinon       from 'sinon';
import CompoundStore               from 'main/stores/CompoundStore';
import { Spinner, MoleculeViewer } from '@transcriptic/amino';
import ContainerComposition        from './ContainerComposition';

describe('Container Composition', () => {

  let wrapper;
  const sandbox = sinon.createSandbox();

  const compounds = Immutable.fromJS([
    {
      clogp: 2.3997,
      formula: 'C14H13N2+',
      molecular_weight: 209.27,
      exact_molecular_weight: 209.212345,
      smiles: 'C[n+]1c2ccccc2c(N)c2ccccc21',
      tpsa: 29.9,
      name: 'benzene anhydride',
      id: 'cmpl1d8yn2kvfwzv4'
    }
  ]);

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('When data is not loaded spinner should be shown', () => {
    wrapper = shallow(<ContainerComposition id="ct1ed3t9m4u78kt" />, { disableLifecycleMethods: true });
    expect(wrapper.find(Spinner)).to.have.lengthOf(1);
    expect(wrapper.find(MoleculeViewer)).to.have.lengthOf(0);
  });

  it('When data is loaded CompoundListView should be shown', () => {
    sandbox.stub(CompoundStore, 'getByIds').returns(compounds);
    wrapper = shallow(<ContainerComposition id="ct1ed3t9m4u78kt" />, { disableLifecycleMethods: true });
    wrapper.setState({ loading: false, compound_ids: ['abc'] });
    expect(wrapper.find('CompoundListView')).to.have.lengthOf(1);
  });
});
