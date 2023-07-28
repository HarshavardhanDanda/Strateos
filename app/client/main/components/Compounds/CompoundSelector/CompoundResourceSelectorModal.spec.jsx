import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import sinon from 'sinon';
import FeatureStore        from 'main/stores/FeatureStore';
import FeatureConstants    from '@strateos/features';
import { CompoundSelectorPublicModalState, CompoundSelectorPublicOnlyDefaults } from 'main/pages/CompoundsPage/CompoundsState';
import { CompoundSelectorPublicModalActions } from 'main/pages/CompoundsPage/CompoundsActions';
import CompoundResourceSelectorModal from './CompoundResourceSelectorModal';

describe('CompoundResourceSelectorModal', () => {
  const sandbox = sinon.createSandbox();
  const compound = Immutable.Map({
    name: 'cust1',
    clogp: '1.2543',
    molecular_weight: 350.4,
    formula: 'C16H18N2O5S',
    smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
    tpsa: '108.05',
    created_by: 'cc'
  });
  let wrapper;

  afterEach(() => {
    sandbox.restore();
  });

  it('should have 2 multi step modal components', () => {
    wrapper = shallow(<CompoundResourceSelectorModal />);
    expect(wrapper.find('Pane').length).to.be.equal(2);
  });

  it('should have title Material Creation for Multi Step Modal', () => {
    wrapper = shallow(<CompoundResourceSelectorModal />);
    expect(wrapper.find('ConnectedMultiPaneModal').prop('title')).to.be.equal('Material Creation');
  });

  it('should have compound details as drawer title when onRowClick is triggered', () => {
    wrapper = shallow(<CompoundResourceSelectorModal />);
    wrapper.instance().onRowClick(compound, '', () => { });
    expect(wrapper.find('ConnectedMultiPaneModal').prop('drawerTitle')).to.be.equal('Compound Details');
  });

  it('should have Search by Chemical Structure as drawer title when onStructureSearchClick is triggered', () => {
    wrapper = shallow(<CompoundResourceSelectorModal />);
    wrapper.instance().onStructureSearchClick(compound.get('smiles'), () => { });
    expect(wrapper.find('ConnectedMultiPaneModal').prop('drawerTitle')).to.be.equal('Search by Chemical Structure');
  });

  it('should disable continue button for compound selector if no rows are selected', () => {
    wrapper = shallow(<CompoundResourceSelectorModal isSingleSelect />);
    expect(wrapper.find('Pane').at(0).prop('nextBtnName')).to.be.equal('Continue');
    expect(wrapper.find('Pane').at(0).prop('nextBtnDisabled')).to.be.true;
  });

  it('should have conected CompoundSelector and ResourceSelector components', () => {
    wrapper = shallow(<CompoundResourceSelectorModal isSingleSelect />);
    expect(wrapper.find('ConnectedCompoundSelector').length).to.be.equal(1);
    expect(wrapper.find('ConnectedSelectorContentHOC').dive().dive().find('ResourceSelector').length).to.be.equal(1);
  });

  it('should have allowCompoundRegistration prop', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.REGISTER_PUBLIC_COMPOUND).returns(true);
    wrapper = shallow(<CompoundResourceSelectorModal isSingleSelect />);
    const compoundDrawer = wrapper.find('ConnectedCompoundSelector');
    expect(compoundDrawer.prop('allowCompoundRegistration')).to.be.true;
  });

  it('should have allowCompoundRegistration prop as false if user does not have permission', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.REGISTER_PUBLIC_COMPOUND).returns(false);
    wrapper = shallow(<CompoundResourceSelectorModal isSingleSelect />);
    const compoundDrawer = wrapper.find('ConnectedCompoundSelector');
    expect(compoundDrawer.prop('allowCompoundRegistration')).to.be.false;
  });

  it('should have searchByPublicCompounds prop', () => {
    wrapper = shallow(<CompoundResourceSelectorModal />);
    const compoundDrawer = wrapper.find('ConnectedCompoundSelector');
    expect(compoundDrawer.prop('searchByPublicCompounds')).to.be.true;
  });

  it('should have hasResources prop', () => {
    wrapper = shallow(<CompoundResourceSelectorModal />);
    const compoundDrawer = wrapper.find('ConnectedCompoundSelector');
    expect(compoundDrawer.prop('hasResources')).to.be.true;
  });

  it('should call appropriate action when beforeDismiss function is called', () => {
    const publicAction = sandbox.spy(CompoundSelectorPublicModalActions, 'updateState');
    wrapper = mount(<CompoundResourceSelectorModal />);
    wrapper.instance().beforeDismiss();
    expect(publicAction.calledWith({ ...CompoundSelectorPublicOnlyDefaults, selected: [] })).to.be.true;
  });

  it('should call appropriate get function from state when selectedCompound function is called', () => {
    const publicState = sandbox.spy(CompoundSelectorPublicModalState, 'get');
    wrapper = mount(<CompoundResourceSelectorModal />);
    wrapper.instance().selectedCompound();
    expect(publicState.called).to.be.true;
  });

  it('should call appropriate action when onUseCompound function is called', () => {
    const publicAction = sandbox.spy(CompoundSelectorPublicModalActions, 'updateState');
    const compoundId = 'test_id';
    wrapper = mount(<CompoundResourceSelectorModal />);
    wrapper.instance().onUseCompound(compoundId);
    expect(publicAction.calledWith({ selected: [compoundId] })).to.be.true;
  });

  it('should call appropriate action when onRegisterClick function is called', () => {
    const publicUpdateAction = sandbox.spy(CompoundSelectorPublicModalActions, 'updateState');
    const publicSearchOptions = sandbox.spy(CompoundSelectorPublicModalActions, 'searchOptions');
    wrapper = mount(<CompoundResourceSelectorModal />);
    wrapper.instance().onRegisterClick();
    expect(publicUpdateAction.calledWith({ selected: [] })).to.be.true;
    expect(publicSearchOptions.called).to.be.true;
  });
});
