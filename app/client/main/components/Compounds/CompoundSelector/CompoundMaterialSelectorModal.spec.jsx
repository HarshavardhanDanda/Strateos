import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import sinon from 'sinon';
import CompoundStore from 'main/stores/CompoundStore';
import { CompoundSelectorPublicModalState } from 'main/pages/CompoundsPage/CompoundsState';
import { CompoundSelectorPublicModalActions } from 'main/pages/CompoundsPage/CompoundsActions';
import CompoundMaterialSelectorModal from './CompoundMaterialSelectorModal';

describe('CompoundMaterialSelectorModal', () => {
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

  const findSelectors = (selectorName) => {
    const connectedSelectors = wrapper.find('ConnectedSelectorContentHOC');
    for (let i = 0; i < connectedSelectors.length; i++) {
      const selectorHOC = connectedSelectors.at(i).dive().find('SelectorContentHOC');
      const foundSelector = selectorHOC.dive().find(selectorName);
      if (foundSelector) {
        return foundSelector;
      }
    }
    return [];
  };

  afterEach(() => {
    sandbox.restore();
  });

  it('should have 2 multi step modal components', () => {
    wrapper = shallow(<CompoundMaterialSelectorModal />);
    expect(wrapper.find('Pane').length).to.be.equal(2);
  });

  it('should have title Order Creation for Multi Step Modal', () => {
    wrapper = shallow(<CompoundMaterialSelectorModal />);
    expect(wrapper.find('ConnectedMultiPaneModal').prop('title')).to.be.equal('Order Creation');
  });

  it('should open compound registration drawer with draw pane when onRegisterClick is triggered', () => {
    wrapper = shallow(<CompoundMaterialSelectorModal />);
    wrapper.instance().onRegisterClick();
    const multiPaneModal = wrapper.find('ConnectedMultiPaneModal');
    expect(multiPaneModal.prop('drawerTitle')).to.be.equal('Register Compound');
    expect(multiPaneModal.prop('drawerPaneTitles').toJS()).to.be.deep.equal(['Draw', 'Specify']);
    const multiPaneModalDrawerWrapper = wrapper.find('ConnectedMultiPaneModal')
      .dive()
      .find('MultiPaneModal')
      .dive()
      .find('MultiPaneModalDrawer');
    expect(multiPaneModalDrawerWrapper).to.have.length(1);
    const drawPane = multiPaneModalDrawerWrapper.dive().find('DrawPane');
    expect(drawPane).to.have.length(1);
  });

  it('should not mount SpecifyPane when compoundId is undefined', () => {
    wrapper = shallow(<CompoundMaterialSelectorModal />);
    wrapper.instance().onRegisterClick();
    expect(wrapper.find('ConnectedSpecifyPane').length).to.equal(0);
  });

  it('should render SpecifyPane when compoundId is not undefined', () => {
    const compoundId = 'test_id';
    wrapper = shallow(<CompoundMaterialSelectorModal />);
    const panes = wrapper.instance().renderPublicCompoundRegistration(compoundId);
    expect(panes.length).to.equal(2);
    expect(panes[1].key).to.equal('specify-pane');
    expect(panes[1].props.compoundId).to.equal(compoundId);
  });

  it('should have compound details as drawer title when onRowClick is triggered', () => {
    wrapper = shallow(<CompoundMaterialSelectorModal />);
    wrapper.instance().onRowClick(compound, '', () => { });
    expect(wrapper.find('ConnectedMultiPaneModal').prop('drawerTitle')).to.be.equal('Compound Details');
  });

  it('should have Search by Chemical Structure as drawer title when onStructureSearchClick is triggered', () => {
    wrapper = shallow(<CompoundMaterialSelectorModal />);
    wrapper.instance().onStructureSearchClick(compound.get('smiles'), () => { });
    expect(wrapper.find('ConnectedMultiPaneModal').prop('drawerTitle')).to.be.equal('Search by Chemical Structure');
  });

  it('should disable continue button for compound selector if no rows are selected', () => {
    wrapper = shallow(<CompoundMaterialSelectorModal isSingleSelect />);
    expect(wrapper.find('Pane').at(0).prop('nextBtnName')).to.be.equal('Continue');
    expect(wrapper.find('Pane').at(0).prop('nextBtnDisabled')).to.be.true;
  });

  it('should have connected CompoundSelector and MaterialSelector components', () => {
    wrapper = shallow(<CompoundMaterialSelectorModal isSingleSelect />);
    expect(wrapper.find('ConnectedCompoundSelector').length).to.be.equal(1);
    expect(findSelectors('MaterialsSelector').length).to.be.equal(1);
  });

  it('should have connected CompoundSelector and VendorCatalogSelector components', () => {
    wrapper = shallow(<CompoundMaterialSelectorModal />);
    wrapper.setState({ source: 'emolecules' });
    expect(wrapper.find('ConnectedCompoundSelector').length).to.be.equal(1);
    expect(findSelectors('VendorCatalogSelector').length).to.be.equal(1);
  });

  it('should be able to switch between MaterialSelector and VendorCatalogSelector', () => {
    wrapper = shallow(<CompoundMaterialSelectorModal />);
    expect(findSelectors('VendorCatalogSelector').length).to.be.equal(0);
    expect(findSelectors('MaterialsSelector').length).to.be.equal(1);
    wrapper.instance().onSelectSource('emolecules');
    expect(findSelectors('VendorCatalogSelector').length).to.be.equal(1);
    expect(findSelectors('MaterialsSelector').length).to.be.equal(0);
    wrapper.instance().onSelectSource('strateos');
    expect(findSelectors('VendorCatalogSelector').length).to.be.equal(0);
    expect(findSelectors('MaterialsSelector').length).to.be.equal(1);
  });

  it('should call onMaterialSelected prop when strateos material is selected', () => {
    const onMaterialSelected = sandbox.stub();
    wrapper = shallow(<CompoundMaterialSelectorModal onMaterialSelected={onMaterialSelected} isSingleSelect />);
    wrapper.find('Pane').at(1).prop('beforeNavigateNext')();
    expect(onMaterialSelected.calledOnce).to.be.true;
  });

  it('should call onMaterialSelected prop when a emolecules vendor is selected', () => {
    const onMaterialSelected = sandbox.stub();
    wrapper = shallow(<CompoundMaterialSelectorModal onMaterialSelected={onMaterialSelected} />);
    wrapper.setState({ source: 'emolecules' });
    wrapper.find('Pane').at(1).prop('beforeNavigateNext')();
    expect(onMaterialSelected.calledOnce).to.be.true;
  });

  it('should fetch and store selected compound in state on compound select', () => {
    const compound = { id: 'cid', smiles: 'ccc' };
    sandbox.stub(CompoundStore, 'getById')
      .returns(Immutable.fromJS(compound));
    wrapper = shallow(<CompoundMaterialSelectorModal />);
    wrapper.instance().onCompoundSelectRow({ cid: true });
    expect(wrapper.state().selectedCompound.toJS()).to.deep.equal(compound);
  });

  it('should have searchByPublicCompounds prop', () => {
    wrapper = shallow(<CompoundMaterialSelectorModal />);
    const compoundDrawer = wrapper.find('ConnectedCompoundSelector');
    expect(compoundDrawer.prop('searchByPublicCompounds')).to.be.true;
  });

  it('should call appropriate action when beforeDismiss function is called', () => {
    const publicAction = sandbox.spy(CompoundSelectorPublicModalActions, 'updateState');
    wrapper = mount(<CompoundMaterialSelectorModal />);
    wrapper.instance().beforeDismiss();
    expect(publicAction.calledWith({ selected: [] })).to.be.true;
  });

  it('should call appropriate get function from state when selectedCompound function is called', () => {
    const publicState = sandbox.spy(CompoundSelectorPublicModalState, 'get');
    wrapper = mount(<CompoundMaterialSelectorModal />);
    wrapper.instance().selectedCompound();
    // It will be called twice since during initial render it fetches the
    // state in searchOptions
    expect(publicState.calledTwice).to.be.true;
  });

  it('should call appropriate action when onUseCompound function is called', () => {
    const publicAction = sandbox.spy(CompoundSelectorPublicModalActions, 'updateState');
    const compoundId = 'test_id';
    wrapper = mount(<CompoundMaterialSelectorModal />);
    wrapper.instance().onUseCompound(compoundId);
    expect(publicAction.calledWith({ selected: [compoundId] })).to.be.true;
  });

  it('should call appropriate action when onRegisterClick function is called', () => {
    const publicUpdateAction = sandbox.spy(CompoundSelectorPublicModalActions, 'updateState');
    const publicSearchOptions = sandbox.spy(CompoundSelectorPublicModalActions, 'searchOptions');
    wrapper = mount(<CompoundMaterialSelectorModal />);
    wrapper.instance().onRegisterClick();
    expect(publicUpdateAction.calledWith({ selected: [] })).to.be.true;
    expect(publicSearchOptions.calledOnce).to.be.true;
  });
});
