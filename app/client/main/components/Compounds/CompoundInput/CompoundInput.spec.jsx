import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import FeatureStore from 'main/stores/FeatureStore';
import CompoundAPI from 'main/api/CompoundAPI';
import SessionStore from 'main/stores/SessionStore';
import CompoundSelectorModal from 'main/components/Compounds/CompoundSelector/CompoundSelectorModal';
import CompoundInput from './CompoundInput';

describe('CompoundInput', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (wrapper)wrapper.unmount();
    sandbox.restore();
  });

  const compound = Immutable.fromJS({
    formula: 'C33H35FN2O5',
    molecular_weight: '558.65',
    exact_molecular_weight: '558.612345',
    tpsa: '111.79',
    smiles: 'C[C@@H]1CCN(S(=O)(=O)c2ccc(C#N)cc2)C[C@@H]1N(C)c1ncnc2[nH]ccc12',
    clogp: '6.31360000000001',
    id: 'cmpl1d9e6adftu9fy',
    inchi_key: 'XUKUURHRXDUEBC-UHFFFAOYSA-N'
  });

  const props = {
    onCompoundsSelected: () => {},
    message: 'Please select a compound'
  };

  const compoundInput = {
    format: 'Daylight Canonical SMILES',
    value: 'CC(C)c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CCC(O)CC(O)CC(=O)O'
  };

  it('should render CompoundInput and Button when value is empty', () => {
    wrapper = shallow(<CompoundInput {...props} />).find('h3');
    expect(wrapper.text()).to.equal(props.message);
  });

  it('should only add a single final product by default', () => {
    wrapper = shallow(<CompoundInput {...props} compounds={compoundInput} isSingleCompound />);
    sandbox.stub(CompoundAPI, 'index').returns({
      done: () => { wrapper.setState({ compounds: Immutable.List(compound) }); }
    });

    wrapper.instance().componentDidMount();
    expect(wrapper.find('.fa-plus')).to.have.length(0);
  });

  it('should add multiple final products when isSingleCompound prop is false', () => {
    wrapper = shallow(<CompoundInput {...props} compounds={compoundInput} isSingleCompound={false} />);

    sandbox.stub(CompoundAPI, 'index').returns({
      done: () => { wrapper.setState({ compounds: Immutable.List(compound) }); }
    });

    wrapper.instance().componentDidMount();
    expect(wrapper.find('.fa-plus')).to.have.length(1);
    expect(wrapper.find('p').text()).to.equal('Click to add a final product');
  });

  it('should not remove final product when readOnly is true', () => {
    wrapper = shallow(<CompoundInput {...props} compounds={compoundInput} readOnly />);
    sandbox.stub(CompoundAPI, 'index').returns({
      done: () => { wrapper.setState({ compounds: Immutable.List(compound) }); }
    });

    wrapper.instance().componentDidMount();
    expect(wrapper.find('CompoundListView').props().onRemove).to.be.undefined;
  });

  it('should remove final product when readOnly is false', () => {
    wrapper = shallow(<CompoundInput {...props} compounds={compoundInput} readOnly={false} />);
    sandbox.stub(CompoundAPI, 'index').returns({
      done: () => { wrapper.setState({ compounds: Immutable.List(compound) }); }
    });

    wrapper.instance().componentDidMount();
    expect(wrapper.find('CompoundListView').props().onRemove).to.not.be.undefined;
  });

  it('should send escaped Smiles string to Compound API', () => {
    const compoundAPISpy = sandbox.spy(CompoundAPI, 'index');
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 12345 }));

    wrapper = shallow(<CompoundInput {...props} compounds={compoundInput} readOnly={false} />);
    wrapper.instance().componentDidMount();
    expect(compoundAPISpy.calledWith({
      filters: {
        smiles: 'CC(C)c1c(C(%3DO)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CCC(O)CC(O)CC(%3DO)O',
        organization_id: 12345
      }
    })).to.equal(true);
  });

  it('should fetch compound using org id from props', () => {
    const updatedProps = { ...props, organizationId: '54321' };
    const compoundAPISpy = sandbox.spy(CompoundAPI, 'index');
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 12345 }));

    wrapper = shallow(<CompoundInput {...updatedProps} compounds={compoundInput} readOnly={false} />);
    wrapper.instance().componentDidMount();
    expect(compoundAPISpy.calledWith({
      filters: {
        smiles: 'CC(C)c1c(C(%3DO)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CCC(O)CC(O)CC(%3DO)O',
        organization_id: '54321'
      }
    })).to.equal(true);
  });

  it('should be able to register compound if user has REGISTER_PUBLIC_COMPOUND permission', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs('REGISTER_PUBLIC_COMPOUND').returns(true);
    wrapper = shallow(<CompoundInput {...props} />);
    const selectorModal = wrapper.find(CompoundSelectorModal);
    expect(selectorModal.prop('allowCompoundRegistration')).to.be.true;
  });

  it('should be able to register compound if user has REGISTER_COMPOUND permission', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs('REGISTER_COMPOUND').returns(true);
    wrapper = shallow(<CompoundInput {...props} />);
    const selectorModal = wrapper.find(CompoundSelectorModal);
    expect(selectorModal.prop('allowCompoundRegistration')).to.be.true;
  });

  it('should not be able to register compound if user does not have permission', () => {
    wrapper = shallow(<CompoundInput {...props} />);
    expect(wrapper.find(CompoundSelectorModal).prop('allowCompoundRegistration')).to.be.false;
  });
});
