import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import sinon from 'sinon';
import SessionStore from 'main/stores/SessionStore';
import { CompoundSelectorPublicModalState, CompoundSelectorPublicOnlyDefaults } from 'main/pages/CompoundsPage/CompoundsState';
import { CompoundSelectorPublicModalActions } from 'main/pages/CompoundsPage/CompoundsActions';
import CompoundSelectorDrawer from './CompoundSelectorDrawer';

describe('CompoundSelectorDrawer', () => {

  let wrapper;
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
  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should have 2 modal drawer components', () => {
    wrapper = shallow(<CompoundSelectorDrawer />);
    expect(wrapper.find('ModalDrawer').length).to.be.equal(2);
  });

  it('should have title Link compound as first modalDrawer', () => {
    wrapper = shallow(<CompoundSelectorDrawer open />);
    expect(wrapper.find('ModalDrawer').at(0).prop('title')).to.be.equal('Link compound');
  });

  it('should have compound details as drawer title when onRowClick is triggered', () => {
    wrapper = shallow(<CompoundSelectorDrawer />);
    wrapper.instance().onRowClick(compound, '', () => { });
    expect(wrapper.find('ModalDrawer').at(1).prop('title')).to.be.equal('Compound Details');
  });

  it('should have Search by Chemical Structure as drawer title when onStructureSearchClick is triggered', () => {
    wrapper = shallow(<CompoundSelectorDrawer />);
    wrapper.instance().onStructureSearchClick(compound.get('smiles'), () => { });
    expect(wrapper.find('ModalDrawer').at(1).prop('title')).to.be.equal('Search by Chemical Structure');
  });

  it('should not have drawerFooterChildren when isSingleSelect prop is true', () => {
    wrapper = shallow(<CompoundSelectorDrawer open isSingleSelect />);
    wrapper.instance().onRowClick(compound, '', () => { });
    const compoundDrawer = wrapper.find('ModalDrawer').at(0).dive();
    expect(compoundDrawer.find('.modal-drawer__footer').length).to.be.equal(0);
    const compoundDetail = wrapper.find('ModalDrawer').at(1).dive();
    expect(compoundDetail.find('.modal-drawer__footer').length).to.be.equal(0);
    expect(wrapper.find('ModalDrawer').at(0).prop('drawerFooterChildren')).to.be.equal(undefined);
    expect(wrapper.find('ModalDrawer').at(1).prop('drawerFooterChildren')).to.be.equal(undefined);
  });

  it('should have drawerFooterChildren when isSingleSelect prop is false', () => {
    wrapper = shallow(<CompoundSelectorDrawer open isSingleSelect={false} />);
    wrapper.instance().onRowClick(compound, '', () => { });
    const compoundDrawer = wrapper.find('ModalDrawer').at(0).dive();
    expect(compoundDrawer.find('.modal-drawer__footer').length).to.be.equal(1);
    const compoundDetail = wrapper.find('ModalDrawer').at(1).dive();
    expect(compoundDetail.find('.modal-drawer__footer').length).to.be.equal(1);
    expect(wrapper.find('ModalDrawer').at(0).prop('drawerFooterChildren')).to.be.not.equal(undefined);
    expect(wrapper.find('ModalDrawer').at(1).prop('drawerFooterChildren')).to.be.not.equal(undefined);
  });

  it('should not have showSource filter', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(null);
    wrapper = shallow(<CompoundSelectorDrawer open isSingleSelect={false} />);
    const compoundDrawer = wrapper.find('ModalDrawer').at(0).dive().find('ConnectedCompoundSelector');
    expect(compoundDrawer.prop('showSource')).to.be.false;
  });

  it('should have searchByPublicCompounds prop', () => {
    sandbox.stub(SessionStore, 'getOrg').returns({ id: 'org113' });
    wrapper = shallow(<CompoundSelectorDrawer open isSingleSelect={false} />);
    const compoundDrawer = wrapper.find('ModalDrawer').at(0).dive().find('ConnectedCompoundSelector');
    expect(compoundDrawer.prop('searchByPublicCompounds')).to.be.true;
  });

  it('should have associated inventory in compound details if not admin', () => {
    sandbox.stub(SessionStore, 'getOrg').returns({ id: 'org113' });
    wrapper = shallow(<CompoundSelectorDrawer isSingleSelect={false} />);
    wrapper.instance().onRowClick(compound, '', () => { });
    const compoundDetail = wrapper.find('ModalDrawer').at(1).dive().find('CompoundDetail');
    expect(compoundDetail.prop('showInventory')).to.be.true;
    expect(compoundDetail.dive().find('h3').text()).to.be.equal('Associated Inventory');
    expect(compoundDetail.dive().find('CompoundInventory').length).to.be.equal(1);
  });

  it('should not have associated inventory in compound details if admin', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(null);
    wrapper = shallow(<CompoundSelectorDrawer isSingleSelect={false} />);
    wrapper.instance().onRowClick(compound, '', () => { });
    const compoundDetail = wrapper.find('ModalDrawer').at(1).dive().find('CompoundDetail');
    expect(compoundDetail.prop('showInventory')).to.be.false;
    expect(compoundDetail.dive().find('CompoundInventory').length).to.be.equal(0);
  });

  it('should call get from appropriate state when onCompoundsSelected function is called', () => {
    const publicState = sandbox.spy(CompoundSelectorPublicModalState, 'get');

    wrapper = mount(<CompoundSelectorDrawer
      isSingleSelect={false}
      onCompoundSelected={() => {}}
      closeDrawer={() => {}}
    />);
    wrapper.instance().onCompoundsSelected();
    expect(publicState.called).to.be.true;
  });

  it('should call appropriate action when clearState function is called', () => {
    const publicAction = sandbox.spy(CompoundSelectorPublicModalActions, 'updateState');

    wrapper = mount(<CompoundSelectorDrawer
      isSingleSelect={false}
      onCompoundSelected={() => {}}
      closeDrawer={() => {}}
    />);
    const clock = sinon.useFakeTimers();
    wrapper.instance().clearState();
    clock.tick(500);
    expect(publicAction.calledWith({ ...CompoundSelectorPublicOnlyDefaults, selected: [] })).to.be.true;
    clock.restore();
  });

});
