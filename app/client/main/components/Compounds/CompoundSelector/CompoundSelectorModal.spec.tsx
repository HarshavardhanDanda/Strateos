import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import FeatureStore from 'main/stores/FeatureStore';
import { CompoundSelectorModalState, CompoundSelectorPublicModalState, CompoundSelectorModalDefaults, CompoundSelectorPublicOnlyDefaults } from 'main/pages/CompoundsPage/CompoundsState';
import { CompoundSelectorModalActions, CompoundSelectorPublicModalActions } from 'main/pages/CompoundsPage/CompoundsActions';
import CompoundSelectorModal from './CompoundSelectorModal';

describe('CompoundSelectorModal', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => { sandbox.restore(); });

  const createWrapper = (isPublic = false) => {
    wrapper = shallow(<CompoundSelectorModal title="Link Compounds" onCompoundsSelected={() => {}} searchByPublicCompounds={isPublic} />);
  };

  it('should render', () => {
    wrapper = shallow(<CompoundSelectorModal onCompoundsSelected={() => {}} title="Link Compounds" />);
    expect(wrapper.dive().find('SinglePaneModal').length).equals(1);
  });

  it('should use MODAL_ID from the props when it is passed', () => {
    wrapper = shallow(<CompoundSelectorModal title="Link Compounds" modalId="COMPOUND_TEST_MODAL_ID" />);
    const singlePaneModal = wrapper.dive().find('SinglePaneModal');

    expect(wrapper.prop('modalId')).equals('COMPOUND_TEST_MODAL_ID');
    expect(singlePaneModal.prop('modalId')).equals('COMPOUND_TEST_MODAL_ID');
  });

  it('should be able to register only public compound if user is operator/manager', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs('REGISTER_PUBLIC_COMPOUND').returns(true);
    wrapper = shallow(<CompoundSelectorModal title="Link Compounds" modalId="COMPOUND_TEST_MODAL_ID" />);
    const compoundSelector = wrapper.dive().find('SinglePaneModal').dive().find('ConnectedCompoundSelector');
    compoundSelector.props().onRegisterClick();
    const drawerChildren = wrapper.state().drawerChildren;
    expect(drawerChildren[0].props.isPublicCompound).to.be.true;
    expect(drawerChildren[0].props.disableToggle).to.be.true;
    expect(drawerChildren[1].props.isPublicCompound).to.be.true;
  });

  it('should be able to register private compounds only if user has permission', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs('REGISTER_COMPOUND').returns(true);
    wrapper = shallow(<CompoundSelectorModal title="Link Compounds" modalId="COMPOUND_TEST_MODAL_ID" />);
    const compoundSelector = wrapper.dive().find('SinglePaneModal').dive().find('ConnectedCompoundSelector');
    compoundSelector.props().onRegisterClick();
    const drawerChildren = wrapper.state().drawerChildren;
    expect(drawerChildren[0].props.isPublicCompound).to.be.false;
    expect(drawerChildren[1].props.isPublicCompound).to.be.false;
  });

  it('should be able to register any type of compounds if user has permission to register any type of compound', () => {
    sandbox.stub(FeatureStore, 'hasFeature').returns(true);
    wrapper = shallow(<CompoundSelectorModal title="Link Compounds" modalId="COMPOUND_TEST_MODAL_ID" />);
    const compoundSelector = wrapper.dive().find('SinglePaneModal').dive().find('ConnectedCompoundSelector');
    compoundSelector.props().onRegisterClick();
    let drawerChildren = wrapper.state().drawerChildren;
    expect(drawerChildren[0].props.isPublicCompound).to.be.false;
    expect(drawerChildren[1].props.isPublicCompound).to.be.false;
    drawerChildren[0].props.onTogglePublicCompound();
    drawerChildren = wrapper.state().drawerChildren;
    expect(drawerChildren[0].props.isPublicCompound).to.be.true;
    expect(drawerChildren[1].props.isPublicCompound).to.be.true;
  });

  it('should call get from appropriate state when onAccept function is called and when searchByPublicCompounds is present', () => {
    const publicState = sandbox.spy(CompoundSelectorPublicModalState, 'get');
    const normalState = sandbox.spy(CompoundSelectorModalState, 'get');

    createWrapper(true);
    const modal = wrapper.dive().find('SinglePaneModal');
    modal.props().onAccept();
    expect(publicState.called).to.be.true;
    expect(normalState.called).to.be.false;
  });

  it('should call get from appropriate state when onAccept function is called', () => {
    const publicState = sandbox.spy(CompoundSelectorPublicModalState, 'get');
    const normalState = sandbox.spy(CompoundSelectorModalState, 'get');

    createWrapper();
    const modal = wrapper.dive().find('SinglePaneModal');
    modal.props().onAccept();
    expect(publicState.called).to.be.false;
    expect(normalState.called).to.be.true;
  });

  it('should call public compound actions and not call normal action when beforeDismiss is called and searchByPublicCompounds is present', () => {
    const publicAction = sandbox.spy(CompoundSelectorPublicModalActions, 'updateState');
    const normalAction = sandbox.spy(CompoundSelectorModalActions, 'updateState');

    createWrapper(true);
    const modal = wrapper.dive().find('SinglePaneModal');
    modal.props().beforeDismiss();
    expect(publicAction.calledWith({ ...CompoundSelectorPublicOnlyDefaults, selected: [] })).to.be.true;
    expect(normalAction.called).to.be.false;
  });

  it('should call both normal actions and public compound actions when  searchByPublicCompounds is present', () => {
    const publicAction = sandbox.spy(CompoundSelectorPublicModalActions, 'updateState');
    const normalAction = sandbox.spy(CompoundSelectorModalActions, 'updateState');

    createWrapper();
    const modal = wrapper.dive().find('SinglePaneModal');
    modal.props().beforeDismiss();
    expect(normalAction.calledWith({ ...CompoundSelectorModalDefaults, selected: [] })).to.be.true;
    expect(publicAction.called).to.be.false;
  });

  it('should call get from appropriate state when onUseCompound function is called and when searchByPublicCompounds is present', () => {
    const publicState = sandbox.spy(CompoundSelectorPublicModalState, 'get');
    const normalState = sandbox.spy(CompoundSelectorModalState, 'get');

    createWrapper(true);
    const selector = wrapper.dive().find('SinglePaneModal').dive().find('ConnectedCompoundSelector');
    selector.props().onUseCompound();
    expect(publicState.called).to.be.true;
    expect(normalState.called).to.be.false;
  });

  it('should call get from appropriate state when onUseCompound function is called', () => {
    const publicState = sandbox.spy(CompoundSelectorPublicModalState, 'get');
    const normalState = sandbox.spy(CompoundSelectorModalState, 'get');

    createWrapper();
    const selector = wrapper.dive().find('SinglePaneModal').dive().find('ConnectedCompoundSelector');
    selector.props().onUseCompound();
    expect(publicState.called).to.be.false;
    expect(normalState.called).to.be.true;
  });
});
